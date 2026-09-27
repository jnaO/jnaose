'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import bg from '@/assets/images/bg.jpg'
import fireweed from '@/assets/images/fireweed.jpg'
import forest from '@/assets/images/forest.jpg'

import {
  requestColour,
  useRequestedColour
} from '@/lib/backdropRequest'

import styles from './backdrop.module.scss'

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
const TOTAL_MS = MERGE_DELAY_MS + SWEEP_MS + MERGE_MS
const LEAVE_SPEED = 1.4

// Share of the drawn photo, from its bottom edge, that fades to black.
const FADE = 0.22

interface Art {
  src: string
  // Share of the drawn photo's height pushed above the viewport.
  offset: number
}

interface Dot {
  x: number
  y: number
  start: number
  // Radius of the printed dot, from the photo's brightness there.
  ink: number
}

const LANDSCAPE: Art = { src: forest.src, offset: 0 }
const PORTRAIT: Art = { src: fireweed.src, offset: 0.375 }

export const isColourPath = (pathname: string) =>
  pathname.startsWith('/work')

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1)

function loadImage(src: string) {
  return new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    }
  )
}

// The colour photo scaled to the viewport width, then black below it.
function paintArt(
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
  const top = -art.offset * dh
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
function buildDots(
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

// Each dot prints at its ink size, then swells until the dots merge
// into the continuous photo. `time` runs 0 → TOTAL_MS.
function drawFrame(
  ctx: CanvasRenderingContext2D,
  art: HTMLCanvasElement,
  dots: Dot[],
  spacing: number,
  w: number,
  h: number,
  time: number
) {
  const full = spacing * DOT_FULL
  ctx.clearRect(0, 0, w, h)
  ctx.beginPath()
  for (const dot of dots) {
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

function Backdrop() {
  const pathname = usePathname()
  const requested = useRequestedColour()
  const colour = requested ?? isColourPath(pathname)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shown = useRef<boolean | null>(null)

  useEffect(() => requestColour(null), [pathname])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let frame = 0
    let cancelled = false
    const w = window.innerWidth
    const h = window.innerHeight
    const dpr = window.devicePixelRatio || 1
    const art = w < h ? PORTRAIT : LANDSCAPE
    const animate = shown.current !== null
    const wasShown = shown.current
    shown.current = colour

    loadImage(art.src).then((img) => {
      if (cancelled) return
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const painted = paintArt(img, art, w, h, dpr)

      const settle = () => {
        ctx.clearRect(0, 0, w, h)
        if (colour) ctx.drawImage(painted, 0, 0, w, h)
      }
      if (!animate || wasShown === colour) {
        settle()
        return
      }

      const { dots, spacing } = buildDots(painted, w, h)
      const duration = colour
        ? TOTAL_MS
        : TOTAL_MS / LEAVE_SPEED
      const t0 = performance.now()
      const tick = (now: number) => {
        const p = clamp01((now - t0) / duration)
        if (p >= 1) {
          settle()
          return
        }
        const time = (colour ? p : 1 - p) * TOTAL_MS
        drawFrame(ctx, painted, dots, spacing, w, h, time)
        frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [colour])

  return (
    <div className={styles.backdrop} aria-hidden="true">
      <div
        className={styles.mono}
        style={{ backgroundImage: `url(${bg.src})` }}
      />
      <canvas ref={canvasRef} className={styles.colour} />
      <div className={styles.blur} />
    </div>
  )
}

export default Backdrop
