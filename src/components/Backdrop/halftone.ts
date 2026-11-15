import type { StaticImageData } from 'next/image'

import fireweed from '@/assets/images/fireweed.jpg'
import forest from '@/assets/images/forest.jpg'

// Newspaper screen: dot spacing in CSS px and the screen angle.
const SCREEN_MIN = 3.5
const SCREEN_MAX = 5.5
const SCREEN_ANGLE = Math.PI / 4
// Largest halftone dot, as a share of the spacing.
const DOT_MAX = 0.62
// A spacing-relative radius that closes the gaps between dots.
const DOT_FULL = 0.72

// Two sweeps from the top-left corner: the first prints the dots,
// the second, starting halfway through the first, merges them into
// the continuous photo.
const SWEEP_MS = 450
const PRINT_MS = 160
const MERGE_MS = 240
const MERGE_DELAY_MS = SWEEP_MS / 2
export const TOTAL_MS = MERGE_DELAY_MS + SWEEP_MS + MERGE_MS
export const LEAVE_SPEED = 1.4

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

export interface Dot {
  x: number
  y: number
  start: number
  // Radius of the printed dot, from the photo's brightness there.
  ink: number
}

// A rect in drawFrame's coordinates; dots outside it are skipped.
export interface Region {
  left: number
  top: number
  right: number
  bottom: number
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

export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2
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

// Dot centres on a rotated lattice covering the viewport, each sized
// by the brightness of the photo under it.
export function buildDots(
  art: HTMLCanvasElement,
  w: number,
  h: number
) {
  const spacing = Math.min(
    Math.max(w / 280, SCREEN_MIN),
    SCREEN_MAX
  )
  const sw = Math.ceil(w / spacing)
  const sh = Math.ceil(h / spacing)
  const sample = document.createElement('canvas')
  sample.width = sw
  sample.height = sh
  const sctx = sample.getContext('2d', {
    willReadFrequently: true
  })
  if (!sctx) return { dots: [], spacing }
  sctx.drawImage(art, 0, 0, sw, sh)
  const pixels = sctx.getImageData(0, 0, sw, sh).data

  const cos = Math.cos(SCREEN_ANGLE)
  const sin = Math.sin(SCREEN_ANGLE)
  const cx = w / 2
  const cy = h / 2
  const reach = Math.hypot(cx, cy)
  const steps = Math.ceil(reach / spacing)
  const dots: Dot[] = []

  for (let j = -steps; j <= steps; j++) {
    for (let i = -steps; i <= steps; i++) {
      const u = i * spacing
      const v = j * spacing
      const x = cx + u * cos - v * sin
      const y = cy + u * sin + v * cos
      if (x < -spacing || y < -spacing) continue
      if (x > w + spacing || y > h + spacing) continue
      const px = Math.min(
        Math.max(Math.floor(x / spacing), 0),
        sw - 1
      )
      const py = Math.min(
        Math.max(Math.floor(y / spacing), 0),
        sh - 1
      )
      const o = (py * sw + px) * 4
      const lum =
        (0.2126 * pixels[o] +
          0.7152 * pixels[o + 1] +
          0.0722 * pixels[o + 2]) /
        255
      dots.push({
        x,
        y,
        start:
          (Math.hypot(x, y) / Math.hypot(w, h)) * SWEEP_MS,
        ink: Math.sqrt(lum) * DOT_MAX * spacing
      })
    }
  }
  return { dots, spacing }
}

// True when a dot of the lattice can reach into `region`.
export const dotInRegion = (
  dot: Pick<Dot, 'x' | 'y'>,
  spacing: number,
  { left, top, right, bottom }: Region
) =>
  dot.x >= left - spacing &&
  dot.x <= right + spacing &&
  dot.y >= top - spacing &&
  dot.y <= bottom + spacing

// Each dot prints at its ink size, then swells until the dots merge
// into the continuous photo. `time` runs 0 → TOTAL_MS.
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  art: HTMLCanvasElement,
  dots: Dot[],
  spacing: number,
  w: number,
  h: number,
  time: number,
  region?: Region
) {
  const full = spacing * DOT_FULL
  ctx.clearRect(0, 0, w, h)
  ctx.beginPath()
  for (const dot of dots) {
    if (region && !dotInRegion(dot, spacing, region))
      continue
    const t = time - dot.start
    if (t <= 0) continue
    const printed =
      easeOutCubic(clamp01(t / PRINT_MS)) * dot.ink
    const m = clamp01((t - MERGE_DELAY_MS) / MERGE_MS)
    const r = printed + (full - printed) * easeInOutCubic(m)
    if (r < 0.3) continue
    ctx.moveTo(dot.x + r, dot.y)
    ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2)
  }
  ctx.fillStyle = '#000'
  ctx.fill()
  ctx.globalCompositeOperation = 'source-in'
  ctx.drawImage(art, 0, 0, w, h)
  ctx.globalCompositeOperation = 'source-over'
}
