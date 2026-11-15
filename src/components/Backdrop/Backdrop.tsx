'use client'

import classNames from 'classnames'
import { usePathname } from 'next/navigation'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'

import bg from '@/assets/images/bg.jpg'

import { ROTATE_KEEP } from '@/constants'
import { useFinaleBlur } from '@/hooks/useFinaleBlur'
import { publish } from '@/lib/backdropFrame'
import {
  requestColour,
  useSceneColour
} from '@/lib/backdropRequest'

import styles from './backdrop.module.scss'
import {
  type Art,
  buildDots,
  clamp01,
  type Dot,
  drawFrame,
  FADE,
  LANDSCAPE,
  LEAVE_SPEED,
  loadImage,
  PORTRAIT,
  paintArt,
  pickArt,
  RESERVE_REM,
  TOTAL_MS
} from './halftone'

// CSS variables for `.still`, which draws the settled colour photo
// the way paintArt does, before the canvas can.
const artVars = (
  name: string,
  { image, offset, dark }: Art
) => ({
  [`--${name}`]: `url(${image.src})`,
  [`--${name}-ratio`]: image.height / image.width,
  [`--${name}-offset`]: offset,
  [`--${name}-dark`]: dark
})
const STILL_VARS = {
  ...artVars('landscape', LANDSCAPE),
  ...artVars('portrait', PORTRAIT),
  '--fade': FADE,
  '--reserve': `${RESERVE_REM}rem`
} as React.CSSProperties

// Viewport width, updated once per frame while the window resizes.
// Device rotation changes it; Safari's toolbar collapsing (height
// only) does not.
function useViewportWidth() {
  const [width, setWidth] = useState<number | null>(null)
  useEffect(() => {
    let frame = 0
    const read = () => setWidth(window.innerWidth)
    const onResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [])
  return width
}

function Backdrop() {
  const pathname = usePathname()
  const colour = useSceneColour()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shown = useRef<boolean | null>(null)
  // False until the canvas has drawn once; a page that loads in colour
  // shows `.still` until then.
  const [painted, setPainted] = useState(false)
  const w = useViewportWidth()
  const blurring = useFinaleBlur()

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger; a request is cleared when the route lands
  useEffect(() => requestColour(null), [pathname])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || w === null) return

    let frame = 0
    let cancelled = false
    const h = window.innerHeight
    const dpr = window.devicePixelRatio || 1
    const art = pickArt(w, h)
    const animate = shown.current !== null
    const wasShown = shown.current
    shown.current = colour

    loadImage(art.image.src).then((img) => {
      if (cancelled) return
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const artCanvas = paintArt(img, art, w, h, dpr)

      const frameOf = (
        dots: Dot[],
        spacing: number,
        time: number
      ) => ({ art: artCanvas, dots, spacing, w, h, time })

      const settle = () => {
        ctx.clearRect(0, 0, w, h)
        if (colour) ctx.drawImage(artCanvas, 0, 0, w, h)
        publish(frameOf([], 0, colour ? TOTAL_MS : 0))
        setPainted(true)
      }
      if (!animate || wasShown === colour) {
        settle()
        return
      }

      const { dots, spacing } = buildDots(artCanvas, w, h)
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
        drawFrame(ctx, artCanvas, dots, spacing, w, h, time)
        publish(frameOf(dots, spacing, time))
        frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [colour, w])

  return (
    <div
      className={classNames(styles.backdrop, ROTATE_KEEP)}
      aria-hidden="true"
    >
      <div
        className={styles.mono}
        style={{ backgroundImage: `url(${bg.src})` }}
      />
      {colour && !painted && (
        <div className={styles.still} style={STILL_VARS} />
      )}
      <canvas ref={canvasRef} className={styles.colour} />
      {blurring && <div className={styles.blur} />}
    </div>
  )
}

export default Backdrop
