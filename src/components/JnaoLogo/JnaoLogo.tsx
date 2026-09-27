'use client'

import {
  animate,
  createScope,
  type JSAnimation,
  type Scope,
  spring
} from 'animejs'
import classNames from 'classnames'
import type React from 'react'
import { useEffect, useRef } from 'react'

import { SCROLLER_ID } from '@/constants'

import { createFinale, FINALE } from './finale'
import styles from './jnaoLogo.module.scss'
import { type Shard, shards, VIEWBOX } from './shards'

const C = {
  max: 1.02,
  bounce: 0.75,
  duration: 250
}

// Share of the runway marker visible in the scroller that counts as
// being on the runway.
const RUNWAY_THRESHOLD = 0.5

const percent = (value: number, of: number) =>
  `${(value / of) * 100}%`

const shardPlacement = ([
  x,
  y,
  w,
  h
]: Shard['bbox']): React.CSSProperties => ({
  left: percent(x, VIEWBOX.width),
  top: percent(y, VIEWBOX.height),
  width: percent(w, VIEWBOX.width),
  height: percent(h, VIEWBOX.height)
})

interface LogoProps {
  alt?: string
}
function JnaoLogo({ alt = 'jnaO Logo' }: LogoProps) {
  const root = useRef<HTMLHeadingElement>(null)
  const scope = useRef<null | Scope>(null)
  const heartbeat = useRef<null | JSAnimation>(null)
  const runway = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scope.current = createScope({ root }).add(() => {
      heartbeat.current = animate('.box', {
        scale: [
          {
            to: C.max,
            ease: 'inOut(3)',
            duration: C.duration
          },
          {
            to: 1,
            ease: spring({
              bounce: C.bounce,
              duration: C.duration
            })
          }
        ],
        loop: true,
        loopDelay: C.duration
      })
    })

    return () => scope.current?.revert()
  }, [])

  useEffect(() => {
    const stage = root.current
    const box = boxRef.current
    const marker = runway.current
    const scroller = document.getElementById(SCROLLER_ID)
    if (!stage || !box || !marker || !scroller) return

    const shardEls = Array.from(
      box.querySelectorAll('.shard')
    )
    let onRunway = false
    let initial = true
    let stageSize = ''

    const build = () => {
      stageSize = `${stage.clientWidth}x${stage.clientHeight}`
      return createFinale({
        stage,
        box,
        shardEls,
        shards,
        onSettle
      })
    }
    // Returns everything to rest CSS and rebuilds; ends on the side the
    // scroller is on.
    const rebuild = () => {
      tl.revert()
      tl = build()
      if (onRunway) tl.seek(tl.duration, true)
    }
    function onSettle(reversed: boolean) {
      if (reversed) rebuild()
      heartbeat.current?.resume()
    }
    let tl = build()

    const observer = new IntersectionObserver(
      ([entry]) => {
        const next =
          entry.intersectionRatio >= RUNWAY_THRESHOLD
        if (initial) {
          initial = false
          onRunway = next
          if (next) tl.seek(tl.duration, true)
          return
        }
        if (next === onRunway) return
        onRunway = next
        heartbeat.current?.pause()
        if (next) tl.play()
        else tl.reverse()
      },
      { root: scroller, threshold: RUNWAY_THRESHOLD }
    )
    observer.observe(marker)

    const onResize = () => {
      if (
        `${stage.clientWidth}x${stage.clientHeight}` ===
        stageSize
      )
        return
      rebuild()
      heartbeat.current?.resume()
    }
    window.addEventListener('resize', onResize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', onResize)
      tl.revert()
    }
  }, [])

  return (
    <>
      <div
        className={classNames(
          styles.snap,
          styles.footerSnap
        )}
      />
      <div
        ref={runway}
        className={classNames(
          styles.snap,
          styles.runwaySnap
        )}
      />
      <h2 ref={root} className={styles.stage}>
        <div
          ref={boxRef}
          role="img"
          aria-label={alt}
          className={classNames(styles.box, 'box')}
          style={{ perspective: FINALE.perspective }}
        >
          {shards.map(({ d, tone, bbox }) => (
            <svg
              key={d}
              aria-hidden="true"
              className={classNames(styles.shard, 'shard')}
              style={shardPlacement(bbox)}
              viewBox={bbox.join(' ')}
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d={d} className={styles[tone]} />
            </svg>
          ))}
        </div>
      </h2>
    </>
  )
}

export default JnaoLogo
