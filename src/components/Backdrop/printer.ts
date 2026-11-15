import {
  coverRect,
  hexToRgb,
  lodBias,
  PRINT
} from './print'
import {
  FRAGMENT_SHADER,
  VERTEX_SHADER
} from './printShader'

// Where the canvas sits: the live viewport (CSS px), the canvas's
// top-left in it and the device pixel ratio. The caller sizes the
// canvas backing store.
export interface PrintView {
  W: number
  H: number
  origin: [number, number]
  dpr: number
}

export interface PrintState {
  // The reveal clock, 0 → TOTAL_MS.
  time: number
  // 0 printed → 1 clean photo.
  fade: number
  // 0 blank paper → 1 printed; 1 when left out.
  press?: number
}

export interface Printer {
  setMono(img: HTMLImageElement): void
  // A W×H-viewport canvas from paintArt.
  setPhoto(canvas: HTMLCanvasElement): void
  // False when the context is lost or a texture is missing. A draw
  // matching the last one, with no upload since, leaves the canvas as
  // it is.
  draw(view: PrintView, state: PrintState): boolean
  dispose(): void
}

export interface PrinterOptions {
  preserveDrawingBuffer?: boolean
  onLost?: () => void
  // Fires once the restored context has its textures back.
  onRestore?: () => void
}

const MONO_UNIT = 0
const PHOTO_UNIT = 1

function compile(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    return shader
  console.error(gl.getShaderInfoLog(shader))
  gl.deleteShader(shader)
  return null
}

function link(gl: WebGL2RenderingContext) {
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fs = compile(
    gl,
    gl.FRAGMENT_SHADER,
    FRAGMENT_SHADER
  )
  const program = gl.createProgram()
  if (!vs || !fs || !program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (gl.getProgramParameter(program, gl.LINK_STATUS))
    return program
  console.error(gl.getProgramInfoLog(program))
  gl.deleteProgram(program)
  return null
}

function uniformsOf(
  gl: WebGL2RenderingContext,
  program: WebGLProgram
) {
  const uniforms: Record<
    string,
    WebGLUniformLocation | null
  > = {}
  const count = gl.getProgramParameter(
    program,
    gl.ACTIVE_UNIFORMS
  )
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i)
    if (info)
      uniforms[info.name] = gl.getUniformLocation(
        program,
        info.name
      )
  }
  return uniforms
}

// Program, full-screen quad and the PRINT uniforms, which never change.
function build(gl: WebGL2RenderingContext) {
  const program = link(gl)
  if (!program) return null
  // biome-ignore lint/correctness/useHookAtTopLevel: WebGL's useProgram, not a React hook
  gl.useProgram(program)
  const quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  )
  const a = gl.getAttribLocation(program, 'a')
  gl.enableVertexAttribArray(a)
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0)

  const u = uniformsOf(gl, program)
  gl.uniform1i(u.uMono, MONO_UNIT)
  gl.uniform1i(u.uPhoto, PHOTO_UNIT)
  gl.uniform3fv(u.uInk, hexToRgb(PRINT.ink))
  gl.uniform3fv(u.uPaper, hexToRgb(PRINT.paper))
  const set = (name: string, value: number) =>
    gl.uniform1f(u[name], value)
  set('uPaperOpacity', PRINT.paperOpacity)
  set('uCell', PRINT.cell)
  set('uAngle', PRINT.angle)
  set('uLo', PRINT.lo)
  set('uHi', PRINT.hi)
  set('uGamma', PRINT.gamma)
  set('uGain', PRINT.gain)
  set('uRough', PRINT.rough)
  set('uRoughScale', PRINT.roughScale)
  set('uGrain', PRINT.grain)
  set('uMottle', PRINT.mottle)
  set('uMisreg', PRINT.misreg)
  set('uSweep', PRINT.sweepMs)
  set('uPrint', PRINT.printMs)
  return { program, quad, u }
}

function upload(
  gl: WebGL2RenderingContext,
  unit: number,
  source: TexImageSource,
  previous: WebGLTexture | null
) {
  if (previous) gl.deleteTexture(previous)
  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    source
  )
  gl.generateMipmap(gl.TEXTURE_2D)
  const param = (name: number, value: number) =>
    gl.texParameteri(gl.TEXTURE_2D, name, value)
  param(gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  param(gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  param(gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  param(gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return texture
}

// The WebGL2 print plate on `canvas`, or null without WebGL2 or when
// the shader fails to build.
export function createPrinter(
  canvas: HTMLCanvasElement,
  options: PrinterOptions = {}
): Printer | null {
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer:
      options.preserveDrawingBuffer ?? false
  })
  if (!gl) return null
  let built = build(gl)
  if (!built) return null

  let mono: HTMLImageElement | null = null
  let photo: HTMLCanvasElement | null = null
  let monoTexture: WebGLTexture | null = null
  let photoTexture: WebGLTexture | null = null
  let lost = false
  let last = ''

  const uploadMono = () => {
    last = ''
    if (mono)
      monoTexture = upload(gl, MONO_UNIT, mono, monoTexture)
  }
  const uploadPhoto = () => {
    last = ''
    if (photo)
      photoTexture = upload(
        gl,
        PHOTO_UNIT,
        photo,
        photoTexture
      )
  }

  const onLost = (event: Event) => {
    event.preventDefault()
    lost = true
    last = ''
    monoTexture = null
    photoTexture = null
    options.onLost?.()
  }
  const onRestored = () => {
    built = build(gl)
    if (!built) return
    lost = false
    uploadMono()
    uploadPhoto()
    options.onRestore?.()
  }
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener(
    'webglcontextrestored',
    onRestored
  )

  return {
    setMono(img) {
      mono = img
      if (!lost) uploadMono()
    },
    setPhoto(source) {
      photo = source
      if (!lost) uploadPhoto()
    },
    draw({ W, H, origin, dpr }, { time, fade, press = 1 }) {
      if (lost || !built || !mono || !photo) return false
      if (!monoTexture || !photoTexture) return false
      const { u } = built
      const key = [
        W,
        H,
        origin,
        dpr,
        time,
        fade,
        press,
        canvas.width,
        canvas.height
      ].join()
      if (key === last) return true
      last = key
      const cover = coverRect(
        mono.naturalWidth,
        mono.naturalHeight,
        W,
        H
      )
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(u.uOrigin, origin[0], origin[1])
      gl.uniform2f(u.uCanvas, canvas.width, canvas.height)
      gl.uniform2f(u.uView, W, H)
      gl.uniform1f(u.uDpr, dpr)
      gl.uniform4f(
        u.uMonoX,
        cover.x,
        cover.y,
        cover.width,
        cover.height
      )
      gl.uniform4f(u.uPhotoX, 0, 0, W, H)
      gl.uniform1f(
        u.uMonoLod,
        lodBias(mono.naturalWidth / cover.width)
      )
      gl.uniform1f(u.uPhotoLod, lodBias(photo.width / W))
      gl.uniform1f(u.uTime, time)
      gl.uniform1f(u.uFade, fade)
      gl.uniform1f(u.uPress, press)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      return true
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener(
        'webglcontextrestored',
        onRestored
      )
      gl.deleteTexture(monoTexture)
      gl.deleteTexture(photoTexture)
      if (built) {
        gl.deleteBuffer(built.quad)
        gl.deleteProgram(built.program)
      }
      built = null
      mono = null
      photo = null
    }
  }
}
