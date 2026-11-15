'use client'

import classNames from 'classnames'
import { useEffect, useRef } from 'react'

import bg from '@/assets/images/bg.jpg'
import {
  drawFrame,
  loadImage
} from '@/components/Backdrop/halftone'
import { wordMatrix } from '@/components/SiteMenu/spine'
import {
  WORDS,
  type Word
} from '@/components/SiteMenu/words'
import { UI_CHROME } from '@/constants'
import { type Affine, multiply } from '@/lib/affine'
import { get, subscribe } from '@/lib/backdropFrame'
import type { SvgArt } from '@/lib/svgArt'

import {
  colourLayer,
  coverRect,
  toSnapshot
} from './geometry'
import styles from './menuWindow.module.scss'

// Events after which a carrier may have moved.
const WAKE_EVENTS = [
  'transitionrun',
  'transitionend',
  'transitioncancel',
  'animationstart',
  'animationend',
  'animationcancel'
]

const paths = new Map<SvgArt, Path2D>()
function wordPath(art: SvgArt) {
  let path = paths.get(art)
  if (!path) {
    path = new Path2D()
    for (const d of art.paths) path.addPath(new Path2D(d))
    paths.set(art, path)
  }
  return path
}

// Adds every `[data-window]` carrier's shape to the mask, in the
// viewport coordinates `base` maps to the canvas.
function fillMask(
  ctx: CanvasRenderingContext2D,
  base: Affine
) {
  ctx.fillStyle = '#fff'
  document
    .querySelectorAll<HTMLElement | SVGElement>(
      '[data-window]'
    )
    .forEach((el) => {
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const kind = el.dataset.window
      if (kind === 'word') {
        const art = WORDS[el.dataset.word as Word]
        const wipe = el.parentElement
          ?.querySelector('[data-window-wipe]')
          ?.getBoundingClientRect()
        if (!art || !wipe || wipe.height === 0) return
        ctx.save()
        ctx.setTransform(
          ...multiply(base, wordMatrix(rect, art))
        )
        ctx.clip(wordPath(art), 'evenodd')
        ctx.setTransform(...base)
        ctx.fillRect(
          wipe.left,
          wipe.top,
          wipe.width,
          wipe.height
        )
        ctx.restore()
      }
    })
}

// True while a CSS animation or transition runs under a carrier's nav.
function carriersMoving() {
  const navs = new Set<Element>()
  document
    .querySelectorAll('[data-window]')
    .forEach((el) => {
      const nav = el.closest('nav')
      if (nav) navs.add(nav)
    })
  let moving = false
  navs.forEach((nav) => {
    if (moving) return
    moving = nav
      .getAnimations({ subtree: true })
      .some(({ playState }) => playState === 'running')
  })
  return moving
}

// The window layer of the menus: the other page's photo through every
// active mark (spine word fill), at its full-viewport
// size and position, with the Backdrop's halftone run in mirror.
function MenuWindow() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const offscreen = document.createElement('canvas')
    const octx = offscreen.getContext('2d')
    if (!octx) return

    let mono: HTMLImageElement | null = null
    let cancelled = false
    let raf = 0

    const paint = () => {
      const rail = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const cw = Math.round(rail.width * dpr)
      const ch = Math.round(rail.height * dpr)
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw
        canvas.height = ch
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, cw, ch)
      const frame = get()
      if (!mono || !frame) return

      const W = window.innerWidth
      const H = window.innerHeight
      const base: Affine = [
        dpr,
        0,
        0,
        dpr,
        -rail.left * dpr,
        -rail.top * dpr
      ]
      ctx.setTransform(...base)
      fillMask(ctx, base)

      ctx.globalCompositeOperation = 'source-in'
      const cover = coverRect(
        mono.naturalWidth,
        mono.naturalHeight,
        W,
        H
      )
      ctx.drawImage(
        mono,
        cover.x,
        cover.y,
        cover.width,
        cover.height
      )

      const layer = colourLayer(frame.time)
      ctx.globalCompositeOperation = 'source-atop'
      if (layer.kind === 'full') {
        ctx.drawImage(frame.art, 0, 0, W, H)
      } else if (layer.kind === 'frame') {
        if (
          offscreen.width !== cw ||
          offscreen.height !== ch
        ) {
          offscreen.width = cw
          offscreen.height = ch
        }
        const { art, dots, spacing, w, h } = frame
        octx.setTransform(
          ...multiply(base, [W / w, 0, 0, H / h, 0, 0])
        )
        drawFrame(
          octx,
          art,
          dots,
          spacing,
          w,
          h,
          layer.time,
          toSnapshot(rail, W, H, w, h)
        )
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.drawImage(offscreen, 0, 0)
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    const tick = () => {
      raf = 0
      paint()
      if (carriersMoving()) request()
    }
    const request = () => {
      if (!raf && !cancelled)
        raf = requestAnimationFrame(tick)
    }

    loadImage(bg.src).then((img) => {
      mono = img
      request()
    })
    // Inside the Backdrop's own frame, so both settle together.
    const unsubscribe = subscribe(paint)
    for (const type of WAKE_EVENTS)
      document.addEventListener(type, request)
    window.addEventListener('resize', request)
    // Capture: scroll does not bubble; the needle moves with it.
    document.addEventListener('scroll', request, {
      capture: true,
      passive: true
    })
    request()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      unsubscribe()
      for (const type of WAKE_EVENTS)
        document.removeEventListener(type, request)
      window.removeEventListener('resize', request)
      document.removeEventListener('scroll', request, {
        capture: true
      })
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={classNames(styles.window, UI_CHROME)}
      aria-hidden="true"
    />
  )
}

export default MenuWindow
