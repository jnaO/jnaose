'use client'

import classNames from 'classnames'
import { usePathname } from 'next/navigation'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { preload } from 'react-dom'

import bg from '@/assets/images/bg.jpg'

import { ROTATE_KEEP, SCROLLER_ID } from '@/constants'
import { useFinaleBlur } from '@/hooks/useFinaleBlur'
import {
  requestColour,
  useSceneColour
} from '@/lib/backdropRequest'

import styles from './backdrop.module.scss'
import {
  type BackdropPrint,
  createBackdropPrint
} from './backdropPrint'
import {
  type Art,
  FADE,
  LANDSCAPE,
  loadImage,
  PORTRAIT,
  PRINT,
  paintArt,
  pickArt,
  RESERVE_REM
} from './print'

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

// The images the first print waits for; `media` follows pickArt
// except at exactly square.
function preloadPrint() {
  preload(bg.src, { as: 'image', fetchPriority: 'high' })
  preload(LANDSCAPE.image.src, {
    as: 'image',
    fetchPriority: 'high',
    media: '(orientation: landscape)'
  })
  preload(PORTRAIT.image.src, {
    as: 'image',
    fetchPriority: 'high',
    media: '(orientation: portrait)'
  })
}

const PAPER_STYLE = { backgroundColor: PRINT.paper }

function Backdrop() {
  preloadPrint()
  const pathname = usePathname()
  const colour = useSceneColour()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const print = useRef<BackdropPrint | null>(null)
  const shown = useRef<boolean | null>(null)
  // False until the canvas holds a print; the clean photo layers show
  // until then, and for good without WebGL2.
  const [painted, setPainted] = useState(false)
  // True until the canvas first prints onto it (see BackdropPrintEvents).
  const [paper, setPaper] = useState(true)
  const w = useViewportWidth()
  const blurring = useFinaleBlur()

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger; a request is cleared when the route lands
  useEffect(() => requestColour(null), [pathname])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    const current = createBackdropPrint(canvas, {
      onPainted: setPainted,
      onUncover: () => setPaper(false)
    })
    print.current = current
    loadImage(bg.src).then((img) => {
      if (!cancelled) current.setMono(img)
    })
    const request = () => current.request()
    const scroller = document.getElementById(SCROLLER_ID)
    window.addEventListener('resize', request)
    scroller?.addEventListener('scroll', request, {
      passive: true
    })
    return () => {
      cancelled = true
      window.removeEventListener('resize', request)
      scroller?.removeEventListener('scroll', request)
      current.dispose()
      print.current = null
      setPainted(false)
    }
  }, [])

  useEffect(() => {
    if (w === null) return
    let cancelled = false
    const h = window.innerHeight
    const dpr = window.devicePixelRatio || 1
    const art = pickArt(w, h)
    loadImage(art.image.src).then((img) => {
      if (cancelled) return
      print.current?.setArt(
        paintArt(img, art, w, h, dpr),
        w,
        h
      )
    })
    return () => {
      cancelled = true
    }
  }, [w])

  useEffect(() => {
    const animate =
      shown.current !== null && shown.current !== colour
    shown.current = colour
    print.current?.reveal(colour, animate)
  }, [colour])

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
      {paper && (
        <div className={styles.paper} style={PAPER_STYLE} />
      )}
      <canvas ref={canvasRef} className={styles.print} />
      {blurring && <div className={styles.blur} />}
    </div>
  )
}

export default Backdrop
