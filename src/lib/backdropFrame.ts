// The Backdrop's print state, published on every Backdrop draw.
// `time` is the page's reveal clock (0 = home's photo, TOTAL_MS = the
// colour photo); `fade` runs 0 (printed) → 1 (clean photo); `art` is
// the colour photo as uploaded, painted at the w×h viewport snapshot.
// A plain store: it changes every frame, so it never goes through
// React state.
export interface BackdropFrame {
  art: HTMLCanvasElement
  time: number
  fade: number
  w: number
  h: number
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
