import { SCROLLER_ID } from '@/constants'
import { publish } from '@/lib/backdropFrame'

import {
  FADE_END_SEGMENT,
  restScrollTop,
  revealTime,
  scrollFade,
  TOTAL_MS
} from './print'
import { createPrinter } from './printer'

export interface BackdropPrint {
  setMono(img: HTMLImageElement): void
  // `art` from paintArt at the w×h viewport snapshot.
  setArt(art: HTMLCanvasElement, w: number, h: number): void
  // Runs the clock to the colour's end; jumps there when `animate` is
  // false or there is no printer.
  reveal(colour: boolean, animate: boolean): void
  // A redraw on the next frame (resize, scroll); skipped when the
  // time, fade, viewport and dpr all match the last draw.
  request(): void
  dispose(): void
}

// The scroll fade now. Pages render their segments as the scroller's
// direct <section> children (page.tsx, work/page.tsx); the fade ends
// at the snap rest of the FADE_END_SEGMENT-th, else the last.
function readFade() {
  const scroller = document.getElementById(SCROLLER_ID)
  if (!scroller) return 0
  const sections = scroller.querySelectorAll(
    ':scope > section'
  )
  const section =
    sections[
      Math.min(FADE_END_SEGMENT, sections.length) - 1
    ]
  if (!section) return 0
  const end = restScrollTop(
    scroller.scrollTop,
    section.getBoundingClientRect().bottom,
    scroller.getBoundingClientRect().top,
    scroller.clientHeight
  )
  return scrollFade(scroller.scrollTop, end)
}

// Drives the Backdrop canvas's printer from one reveal clock and
// publishes every draw to backdropFrame. `onPainted` reports whether
// the canvas holds a print.
export function createBackdropPrint(
  canvas: HTMLCanvasElement,
  onPainted: (painted: boolean) => void
): BackdropPrint {
  let art: {
    canvas: HTMLCanvasElement
    w: number
    h: number
  } | null = null
  let time = 0
  let last = ''
  let tickFrame = 0
  let requestFrame = 0

  const draw = () => {
    if (!art) return
    const W = window.innerWidth
    const H = window.innerHeight
    const dpr = window.devicePixelRatio || 1
    const fade = readFade()
    const key = [time, fade, W, H, dpr].join()
    if (key === last) return
    last = key
    if (printer) {
      const cw = Math.round(W * dpr)
      const ch = Math.round(H * dpr)
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw
        canvas.height = ch
      }
      const drawn = printer.draw(
        { W, H, origin: [0, 0], dpr },
        { time, fade }
      )
      if (drawn) onPainted(true)
    }
    publish({
      art: art.canvas,
      time,
      fade,
      w: art.w,
      h: art.h
    })
  }
  const redraw = () => {
    last = ''
    draw()
  }

  const printer = createPrinter(canvas, {
    onLost: () => onPainted(false),
    onRestore: redraw
  })

  return {
    setMono(img) {
      printer?.setMono(img)
      redraw()
    },
    setArt(source, w, h) {
      art = { canvas: source, w, h }
      printer?.setPhoto(source)
      redraw()
    },
    reveal(colour, animate) {
      cancelAnimationFrame(tickFrame)
      const target = colour ? TOTAL_MS : 0
      if (!animate || !printer) {
        time = target
        draw()
        return
      }
      const from = time
      const t0 = performance.now()
      const tick = (now: number) => {
        time = revealTime(from, colour, now - t0)
        draw()
        if (time !== target)
          tickFrame = requestAnimationFrame(tick)
      }
      tickFrame = requestAnimationFrame(tick)
    },
    request() {
      cancelAnimationFrame(requestFrame)
      requestFrame = requestAnimationFrame(draw)
    },
    dispose() {
      cancelAnimationFrame(tickFrame)
      cancelAnimationFrame(requestFrame)
      printer?.dispose()
    }
  }
}
