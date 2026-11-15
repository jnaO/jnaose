import type { StaticImageData } from 'next/image'

import fireweed from '@/assets/images/fireweed.jpg'
import forest from '@/assets/images/forest.jpg'

// The owner's print settings, under the print-raster prototype's key
// names (prototypes/print-raster/index.html, "Copy settings").
export const PRINT = {
  ink: '#161616',
  paper: '#efeadf',
  paperOpacity: 1,
  cell: 3.1,
  angle: 45,
  lo: 0.02,
  hi: 0.72,
  gamma: 1.12,
  gain: 0.08,
  soft: 1.2,
  rough: 0.35,
  roughScale: 1.4,
  grain: 0.1,
  mottle: 0.04,
  misreg: 0.2,
  sweepMs: 370,
  printMs: 460
} as const

// The reveal runs `time` 0 (home's photo) → TOTAL_MS (the colour
// photo); leaving runs it back at LEAVE_SPEED.
export const TOTAL_MS = PRINT.sweepMs + PRINT.printMs
export const LEAVE_SPEED = 1.4

// The reveal clock `elapsed` ms after it set off from `from` towards
// colour (TOTAL_MS) or away from it (0).
export const revealTime = (
  from: number,
  colour: boolean,
  elapsed: number
) => {
  const run = Math.max(elapsed, 0)
  return colour
    ? Math.min(from + run, TOTAL_MS)
    : Math.max(from - run * LEAVE_SPEED, 0)
}

// The same clock seen from the other page.
export const mirror = (time: number) => TOTAL_MS - time

// Mip level that blurs the tone as PRINT.soft does at one texel per
// CSS px.
export const lodBias = (texelsPerCssPx: number) =>
  PRINT.soft + Math.log2(texelsPerCssPx)

// The scroll fade is complete at this segment's snap rest, numbered
// as the Ruler numbers segments (from 1).
export const FADE_END_SEGMENT = 1

// The scroller's scrollTop at which a section's bottom meets the
// scroller's bottom (its `end` snap rest), from its rect now.
export const restScrollTop = (
  scrollTop: number,
  rectBottom: number,
  scrollerTop: number,
  clientHeight: number
) => scrollTop + rectBottom - scrollerTop - clientHeight

// 0 (printed) at the top → 1 (clean photo) at `end`, smoothstepped.
export const scrollFade = (
  scrollTop: number,
  end: number
) => {
  if (end <= 0) return 1
  const t = clamp01(scrollTop / end)
  return t * t * (3 - 2 * t)
}

export const hexToRgb = (hex: string) =>
  [1, 3, 5].map(
    (i) => parseInt(hex.slice(i, i + 2), 16) / 255
  ) as [number, number, number]

// Share of the drawn photo, from its bottom edge, that fades to black.
export const FADE = 0.22
// Viewport height, from the bottom, kept below the photo's dark row:
// room for a /work project's text (work.module.scss .text).
export const RESERVE_REM = 20

export interface Art {
  image: StaticImageData
  // Share of the drawn photo's height pushed above the viewport.
  offset: number
  // Share of the photo's height from which its left half is solid black.
  dark: number
}

export const LANDSCAPE: Art = {
  image: forest,
  offset: 0,
  dark: 0.84
}
export const PORTRAIT: Art = {
  image: fireweed,
  offset: 0.375,
  dark: 0.94
}

export const pickArt = (w: number, h: number) =>
  w < h ? PORTRAIT : LANDSCAPE

export const clamp01 = (t: number) =>
  Math.min(Math.max(t, 0), 1)

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    }
  )
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

// The photo's top edge: shifted up by its offset, and further when the
// viewport is too short to keep RESERVE_REM below its dark row.
export function artTop(art: Art, dh: number, h: number) {
  const rem = parseFloat(
    getComputedStyle(document.documentElement).fontSize
  )
  return Math.min(
    -art.offset * dh,
    h - RESERVE_REM * rem - art.dark * dh
  )
}

// The colour photo scaled to the viewport width, then black below it.
export function paintArt(
  img: HTMLImageElement,
  art: Art,
  w: number,
  h: number,
  dpr: number
) {
  const canvas = document.createElement('canvas')
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.scale(dpr, dpr)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  const dh = (w * img.naturalHeight) / img.naturalWidth
  const top = artTop(art, dh, h)
  const bottom = top + dh
  ctx.drawImage(img, 0, top, w, dh)
  const fadeTop = bottom - dh * FADE
  const fade = ctx.createLinearGradient(
    0,
    fadeTop,
    0,
    bottom
  )
  fade.addColorStop(0, 'rgba(0,0,0,0)')
  fade.addColorStop(1, '#000')
  ctx.fillStyle = fade
  ctx.fillRect(0, fadeTop, w, bottom - fadeTop + 1)
  return canvas
}
