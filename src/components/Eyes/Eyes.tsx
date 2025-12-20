'use client'
import { animate, createScope, Scope } from 'animejs'
import classNames from 'classnames'
import { useEffect, useRef } from 'react'
import styles from './eyes.module.scss'

interface EyesProps {
  className?: string
  alt?: string
}
function Eyes({ alt = 'Hi nerd!', className }: EyesProps) {
  const root = useRef(null)
  const scope = useRef<null | Scope>(null)

  const C = {
    max: 3,
    bounce: 0.85,
    duration: 1700
  }

  useEffect(() => {
    scope.current = createScope({ root }).add((self) => {
      animate('.blink', {
        opacity: [0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
        duration: 1700,
        loop: true,
        loopDelay: 5000
      })
    })

    return () => scope.current?.revert()
  }, [])

  return (
    <span ref={root}>
      <svg
        name={alt}
        className={styles.logo}
        width="100%"
        height="100%"
        viewBox="0 0 1796 608"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlSpace="preserve"
      >
        <title>{alt}</title>
        <g transform="matrix(1,0,0,1,-386.012,-1705.73)">
          <g transform="matrix(25.3757,0,0,25.3757,-27843.7,-50143.6)">
            <path
              className={styles.orange}
              d="M1136.39,2043.27L1136.39,2067.19L1112.47,2067.19L1112.47,2043.27L1136.39,2043.27ZM1124.43,2050.19C1121.65,2050.19 1119.39,2052.45 1119.39,2055.23C1119.39,2058.01 1121.65,2060.27 1124.43,2060.27C1127.21,2060.27 1129.47,2058.01 1129.47,2055.23C1129.47,2052.45 1127.21,2050.19 1124.43,2050.19Z"
            />
          </g>
          <g transform="matrix(25.3757,0,0,25.3757,-27843.7,-50143.6)">
            <circle
              className={classNames(styles.green, 'blink')}
              cx="1124.43"
              cy="2055.23"
              r="5.041"
            />
          </g>
          <g transform="matrix(25.3757,0,0,25.3757,-26655.7,-50143.6)">
            <path
              className={styles.orange}
              d="M1136.39,2043.27L1136.39,2067.19L1112.47,2067.19L1112.47,2043.27L1136.39,2043.27ZM1124.43,2050.19C1121.65,2050.19 1119.39,2052.45 1119.39,2055.23C1119.39,2058.01 1121.65,2060.27 1124.43,2060.27C1127.21,2060.27 1129.47,2058.01 1129.47,2055.23C1129.47,2052.45 1127.21,2050.19 1124.43,2050.19Z"
            />
          </g>
          <g transform="matrix(25.3757,0,0,25.3757,-26655.7,-50143.6)">
            <circle
              className={classNames(styles.green, 'blink')}
              cx="1124.43"
              cy="2055.23"
              r="5.041"
            />
          </g>
          <g transform="matrix(25.3757,0,0,25.3757,-27843.7,-50276.3)">
            <rect
              className={styles.orange}
              x="1141.1"
              y="2051.76"
              width="13.508"
              height="4.662"
            />
          </g>
        </g>
      </svg>
    </span>
  )
}

export default Eyes
