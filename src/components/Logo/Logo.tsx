'use client'
import {
  animate,
  createDraggable,
  createScope,
  Scope,
  spring
} from 'animejs'

import classNames from 'classnames'
import { useEffect, useRef } from 'react'
import SvgPathWrapper from '@/components/SvgPathWrapper/SvgPathWrapper'
import { useAnimatedLogo } from '@/hooks/useAnimatedLogo'
import { viewBoxOf } from '@/lib/svgArt'
import { LOGO_ART } from './art'
import styles from './logo.module.scss'

const C = {
  max: 1.01,
  bounce: 0.85,
  duration: 250
}

interface LogoProps {
  className?: string
  alt?: string
}
function Logo({
  alt = 'jnaO Alternative Logo',
  className
}: LogoProps) {
  const root = useRef<HTMLDivElement | null>(null)
  const scope = useRef<Scope | null>(null)
  const logo = useRef<SVGSVGElement | null>(null)

  const { strokeColorAlternative } = useAnimatedLogo(logo, {
    strokeWidthFull: 3,
    strokeWidthMobile: 4,
    extraStrokeWidths: [2, 2, 1],
    strokeColorBase: 'gold',
    strokeColorAlternative: 'gold'
  })

  useEffect(() => {
    scope.current = createScope({ root }).add((self) => {
      animate('.logo', {
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
        ]
        // loop: true,
        // loopDelay: C.duration
      })

      // Make the logo draggable around its center
      createDraggable('.logo', {
        container: [0, 0, 0, 0],
        releaseEase: spring({
          bounce: C.bounce,
          duration: C.duration
        })
      })
    })

    return () => scope.current?.revert()
  }, [])

  return (
    <div ref={root}>
      <svg
        ref={logo}
        name={alt}
        className={classNames(className, 'logo')}
        width="100%"
        height="100%"
        viewBox={viewBoxOf(LOGO_ART)}
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlSpace="preserve"
        style={{
          fillRule: 'evenodd',
          clipRule: 'evenodd',
          strokeLinejoin: 'round',
          strokeMiterlimit: 2
        }}
      >
        <title>{alt}</title>
        <SvgPathWrapper
          transform={LOGO_ART.transform}
          strokeColor={strokeColorAlternative}
        >
          {LOGO_ART.paths.map((d) => (
            <path
              key={d}
              className={styles.logo}
              fill="#fff"
              style={{ fillRule: 'nonzero' }}
              d={d}
            />
          ))}
        </SvgPathWrapper>
      </svg>
    </div>
  )
}

export default Logo
