import {
  type Region,
  TOTAL_MS
} from '@/components/Backdrop/halftone'

interface Box {
  left: number
  top: number
  width: number
  height: number
}

// Where an iw×ih image lands under CSS `background-size: cover` with
// `background-position: center left` in a W×H box (Backdrop's .mono).
export function coverRect(
  iw: number,
  ih: number,
  W: number,
  H: number
) {
  const scale = Math.max(W / iw, H / ih)
  const width = iw * scale
  const height = ih * scale
  return { x: 0, y: (H - height) / 2, width, height }
}

// A rect in the live W×H viewport, in the w×h snapshot the colour art
// was built at (the Backdrop canvas is CSS-stretched from one to the
// other).
export const toSnapshot = (
  { left, top, right, bottom }: Region,
  W: number,
  H: number,
  w: number,
  h: number
): Region => ({
  left: (left * w) / W,
  top: (top * h) / H,
  right: (right * w) / W,
  bottom: (bottom * h) / H
})

export type ColourLayer =
  | { kind: 'full' }
  | { kind: 'none' }
  | { kind: 'frame'; time: number }

// The window's colour layer for the page's reveal `time`: the same
// clock run in mirror, so the window shows the other page's photo.
export function colourLayer(time: number): ColourLayer {
  const mirrored = TOTAL_MS - time
  if (mirrored >= TOTAL_MS) return { kind: 'full' }
  if (mirrored <= 0) return { kind: 'none' }
  return { kind: 'frame', time: mirrored }
}
