// GLSL ES 3.00, reduced from the fragment shader in
// prototypes/print-raster/index.html to the CMYK print, the reveal
// without merge, the dissolve scroll fade and the dissolve from
// blank paper. Function names match the prototype's. Positions are
// viewport CSS px, y down.

export const VERTEX_SHADER = `#version 300 es
in vec2 a;
void main() { gl_Position = vec4(a, 0., 1.); }`

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;
out vec4 o;
// uOrigin: the canvas's top-left in the viewport (CSS px).
// uCanvas: the canvas backing store (device px). uView: the viewport.
uniform vec2 uOrigin, uCanvas, uView;
uniform float uDpr;
uniform sampler2D uPhoto, uMono;
// Placement in the viewport: offset.xy, size.zw (CSS px).
uniform vec4 uPhotoX, uMonoX;
uniform float uPhotoLod, uMonoLod;
uniform vec3 uInk, uPaper;
uniform float uPaperOpacity, uCell, uAngle;
uniform float uLo, uHi, uGamma, uGain;
uniform float uRough, uRoughScale, uGrain, uMottle, uMisreg;
uniform float uTime, uSweep, uPrint;
// 0 printed .. 1 clean photo.
uniform float uFade;
// 0 blank paper (uPaper) .. 1 printed.
uniform float uPress;

const float PI = 3.14159265;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(
    mix(hash(i), hash(i + vec2(1, 0)), u.x),
    mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x),
    u.y
  );
}
float e3(float t) { t = 1. - clamp(t, 0., 1.); return 1. - t * t * t; }

vec3 photoAt(vec2 p, float lod) {
  return textureLod(uPhoto, (p - uPhotoX.xy) / uPhotoX.zw, lod).rgb;
}
vec3 monoAt(vec2 p) {
  return texture(uMono, (p - uMonoX.xy) / uMonoX.zw).rgb;
}

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

// Round-dot spot function: 0 at the cell centre, 1 at the corners.
float spot(vec2 p, float angle) {
  vec2 q = rot(angle) * p / uCell;
  return .5 - .25 * (cos(2. * PI * q.x) + cos(2. * PI * q.y));
}

// Ink edge noise, in CSS px.
float roughAt(vec2 p) {
  vec2 s = p / uRoughScale;
  return (vnoise(s / .7) - .5) * .6 + (vnoise(s / 2.2) - .5) * .4;
}

// 0..1 ink coverage of a plate whose tone needs 'dark' ink.
float plate(vec2 p, float angle, float dark) {
  float sp = spot(p, angle) + roughAt(p) * uRough * .5;
  float w = max(fwidth(sp), 1e-4);
  return clamp((dark - sp) / w + .5, 0., 1.) * step(.002, dark);
}

// Ink per plate: x, y, z = C, M, Y; w = K.
vec4 inkOf(vec3 c) {
  vec3 c3 = pow(clamp((c - uLo) / max(uHi - uLo, 1e-3), 0., 1.), vec3(uGamma));
  float k = 1. - max(max(c3.r, c3.g), c3.b);
  vec3 cmy = (1. - c3 - k) / max(1. - k, 1e-3);
  vec4 v = vec4(cmy, k);
  return clamp(v + uGain * 4. * v * (1. - v), 0., 1.);
}

void main() {
  vec2 p = uOrigin + vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y) / uDpr;
  float t = uTime - length(p) / length(uView) * uSweep;

  // 0 = home's mono photo, 1 = the colour photo.
  float r = t <= 0. ? 0. : e3(t / uPrint);
  vec3 monoClean = monoAt(p);
  vec3 photoClean = photoAt(p, 0.);
  vec2 mt = (p - uMonoX.xy) / uMonoX.zw;
  vec4 ink = mix(
    inkOf(textureLod(uMono, mt, uMonoLod).rgb),
    inkOf(photoAt(p, uPhotoLod)),
    r
  );
  float mottle = 1. - uMottle * .55 * (vnoise(p / 38.) * .7 + vnoise(p / 9.) * .3);

  float grain = (vnoise(p / .8) * .55 + vnoise(p / 5.) * .3 + vnoise(p / 40.) * .15 - .5) * uGrain * .35;
  vec3 paper = clamp(uPaper * (1. + grain), 0., 1.);
  vec3 clean = mix(monoClean, photoClean, r);
  vec3 col = mix(clean, paper, uPaperOpacity);

  vec2 m = vec2(uMisreg);
  float cc = plate(p + m * vec2(.7, -.3), radians(15.), ink.x) * mottle;
  float mm = plate(p + m * vec2(-.4, .6), radians(75.), ink.y) * mottle;
  float yy = plate(p + m * vec2(.2, .5), radians(0.), ink.z) * mottle;
  float kk = plate(p, radians(45.), ink.w) * mottle;
  col *= mix(vec3(1.), vec3(0., .66, .93), cc);
  col *= mix(vec3(1.), vec3(.92, .08, .55), mm);
  col *= mix(vec3(1.), vec3(1., .93, .05), yy);
  col = mix(col, uInk, kk);

  col = mix(col, clean, max(plate(p, radians(uAngle) + .3, uFade * 1.05), step(1., uFade)));
  col = mix(uPaper, col, max(plate(p, radians(uAngle) + .3, uPress * 1.05), step(1., uPress)));
  o = vec4(col, 1.);
}`
