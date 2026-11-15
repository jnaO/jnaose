import type { Dot } from '@/components/Backdrop/halftone'

// The Backdrop's halftone state, published every animation frame and
// at settle. `time` is the page's reveal time (0 = mono, TOTAL_MS =
// full colour); `w`/`h` are the viewport snapshot `art` was built at;
// `dots` may be empty when settled. A plain store: it changes every
// frame, so it never goes through React state.
export interface BackdropFrame {
  art: HTMLCanvasElement
  dots: Dot[]
  spacing: number
  w: number
  h: number
  time: number
}

type Listener = (frame: BackdropFrame) => void

let current: BackdropFrame | null = null
const listeners = new Set<Listener>()

export function publish(frame: BackdropFrame) {
  current = frame
  listeners.forEach((listener) => listener(frame))
}

export function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const get = () => current
