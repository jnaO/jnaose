'use client'

import {
  animate,
  createScope,
  type JSAnimation,
  type Scope,
  spring,
  type Timeline
} from 'animejs'
import classNames from 'classnames'
import type React from 'react'
import { useEffect, useRef } from 'react'

import { SCROLLER_ID } from '@/constants'

import { createFinale, FINALE } from './finale'
import styles from './jnaoLogo.module.scss'
import { createOrbit } from './orbit'
import { type Shard, shards, VIEWBOX } from './shards'

const C = {
  max: 1.02,
  bounce: 0.75,
  duration: 250
}

// Share of the runway marker visible in the scroller that counts as
// being on the runway.
const RUNWAY_THRESHOLD = 0.5

const markFinale = (on: boolean) =>
  document.documentElement.toggleAttribute(
    'data-finale',
    on
  )

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
    // rest: logo in the footer, heartbeat on. flying: `tl` playing
    // either way. orbit: fullscreen, orbiting. leaving: `leave`
    // playing either way between the orbit pose and off-screen.
    let state: 'rest' | 'flying' | 'orbit' | 'leaving' =
      'rest'
    let leave: null | Timeline = null
    const orbit = createOrbit({ box, shardEls, shards })

    // The heartbeat runs only while the logo is at rest in the footer.
    const pulse = (on: boolean) => {
      const beat = heartbeat.current
      if (!beat) return
      if (on) beat.resume()
      else beat.pause().seek(0)
    }
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
    // Seeks to the fullscreen end silently and keeps the orbit going.
    const settleOnRunway = () => {
      finale.tl.seek(finale.tl.duration, true)
      if (state === 'orbit') orbit.measure()
      else if (state === 'leaving') orbit.resume()
      else orbit.start()
      state = 'orbit'
    }
    // Returns everything to rest CSS and rebuilds; ends on the side the
    // scroller is on.
    const rebuild = () => {
      leave?.cancel()
      leave = null
      finale.tl.revert()
      finale = build()
      if (onRunway) settleOnRunway()
      else {
        orbit.stop()
        state = 'rest'
        pulse(true)
      }
    }
    function onSettle(reversed: boolean) {
      if (reversed) rebuild()
      else {
        orbit.start()
        state = 'orbit'
      }
    }
    const onLeaveSettle = (reversed: boolean) => {
      leave = null
      if (reversed) {
        orbit.resume()
        state = 'orbit'
      } else {
        orbit.stop()
        finale.reverseFromMid()
        state = 'flying'
      }
    }
    let finale = build()

    const observer = new IntersectionObserver(
      ([entry]) => {
        const next =
          entry.intersectionRatio >= RUNWAY_THRESHOLD
        if (initial) {
          initial = false
          onRunway = next
          markFinale(next)
          if (next) {
            pulse(false)
            settleOnRunway()
          }
          return
        }
        if (next === onRunway) return
        onRunway = next
        markFinale(next)
        pulse(false)
        if (leave) {
          if (next) leave.reverse()
          else leave.play()
        } else if (state === 'orbit') {
          orbit.pause()
          leave = finale.leave(orbit.poses, onLeaveSettle)
          leave.play()
          state = 'leaving'
        } else {
          if (next) finale.tl.play()
          else finale.tl.reverse()
          state = 'flying'
        }
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
    }
    window.addEventListener('resize', onResize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', onResize)
      leave?.cancel()
      orbit.revert()
      finale.tl.revert()
      markFinale(false)
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
