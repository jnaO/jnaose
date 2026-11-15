'use client'

import classNames from 'classnames'
import { usePathname } from 'next/navigation'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  LOGO_REST_ID,
  SCROLLER_ID,
  SITE_NAME,
  UI_CHROME
} from '@/constants'
import { projectNumber } from '@/data/projects'
import {
  leavesPage,
  useRequestedColour
} from '@/lib/backdropRequest'

import {
  currentIndex,
  firstScreen,
  scrollPosition
} from './current'
import { needlePointsAttr } from './needle'
import styles from './ruler.module.scss'
import { needleVars, RULER_VARS, rowVars } from './timing'

export interface RulerItem {
  // Id of the page segment the row scrolls to.
  id: string
  // Shown beside the number from 48rem up, for current or hover.
  name?: string
}

interface RulerProps {
  label: string
  items: RulerItem[]
}

// Id of the start row ("00"): the scroller's first screen, no element.
const TOP_ID = 'top'

// The ink layer of a page's segment ruler: a "00" row for the top of
// the scroller, the page's items, and a last row for the footer's
// logo rest.
function Ruler({ label, items }: RulerProps) {
  const rows = useMemo<RulerItem[]>(
    () => [
      { id: TOP_ID },
      ...items,
      { id: LOGO_REST_ID, name: SITE_NAME }
    ],
    [items]
  )
  // The segment filling most of the scroller, or none.
  const [current, setCurrent] = useState<number | null>(
    null
  )
  const leaving = leavesPage(
    useRequestedColour(),
    usePathname()
  )
  // Read by the scroll listener: current freezes while leaving.
  const frozen = useRef(leaving)
  frozen.current = leaving
  const nav = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const main = document.getElementById(SCROLLER_ID)
    if (!main) return
    const onScroll = () => {
      if (frozen.current) return
      const view = main.getBoundingClientRect()
      const rects = rows.map(({ id }) =>
        id === TOP_ID
          ? firstScreen(view, main.scrollTop)
          : document
              .getElementById(id)
              ?.getBoundingClientRect()
      )
      setCurrent(currentIndex(view, rects))
      const position = scrollPosition(
        view.bottom,
        rects.map((rect) => rect?.bottom)
      )
      // Written straight to the nav so the needle follows every
      // scroll frame without a React render.
      if (position !== null)
        nav.current?.style.setProperty(
          '--needle-pos',
          String(position)
        )
    }
    onScroll()
    main.addEventListener('scroll', onScroll, {
      passive: true
    })
    return () =>
      main.removeEventListener('scroll', onScroll)
  }, [rows])

  const scrollTo =
    (id: string) => (event: React.MouseEvent) => {
      if (id === TOP_ID) {
        event.preventDefault()
        document
          .getElementById(SCROLLER_ID)
          ?.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      const segment = document.getElementById(id)
      if (!segment) return
      event.preventDefault()
      segment.scrollIntoView({
        block: 'end',
        behavior: 'smooth'
      })
    }

  return (
    <nav
      ref={nav}
      aria-label={label}
      className={classNames(styles.ruler, UI_CHROME, {
        [styles.leaving]: leaving
      })}
      style={
        {
          ...RULER_VARS,
          ...needleVars(current ?? 0, rows.length),
          '--count': rows.length,
          '--current': current ?? 0
        } as React.CSSProperties
      }
    >
      <div className={styles.scale} aria-hidden="true" />
      <div
        className={classNames(styles.needle, {
          [styles.needleOn]: current !== null
        })}
        aria-hidden="true"
      >
        <svg
          className={styles.needleArt}
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          focusable="false"
        >
          <polygon points={needlePointsAttr} />
        </svg>
      </div>
      {rows.map(({ id, name }, i) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={scrollTo(id)}
          aria-label={name}
          aria-current={
            i === current ? 'location' : undefined
          }
          className={classNames(styles.row, {
            [styles.current]: i === current
          })}
          style={
            {
              ...rowVars(i, rows.length),
              '--i': i
            } as React.CSSProperties
          }
        >
          {name && (
            <span
              className={classNames(
                styles.name,
                styles.label
              )}
            >
              {name}
            </span>
          )}
          <span
            className={classNames(
              styles.number,
              styles.label
            )}
          >
            {projectNumber(i)}
          </span>
          <span className={styles.tick} />
        </a>
      ))}
    </nav>
  )
}

export default Ruler
