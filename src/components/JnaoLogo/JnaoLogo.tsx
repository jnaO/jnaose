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
import styles from './jnaoLogo.module.scss'
import { type Shard, shards, VIEWBOX } from './shards'

const C = {
  max: 1.02,
  bounce: 0.75,
  duration: 250,
  perspective: 1000
}

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

  return (
    <h2 ref={root} className={styles.title2}>
      <div
        role="img"
        aria-label={alt}
        className={classNames(styles.box, 'box')}
        style={{ perspective: C.perspective }}
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
  )
}

export default JnaoLogo
