'use client'

import classNames from 'classnames'
import type React from 'react'
import { useEffect, useState } from 'react'

import pageStyles from '@/app/page.module.scss'
import { SCROLLER_ID } from '@/constants'
import type { Project } from '@/data/projects'
import { useRequestedColour } from '@/lib/backdropRequest'

import styles from './projectNav.module.scss'

interface ProjectNavProps {
  projects: Pick<Project, 'slug' | 'name'>[]
}

const pad = (n: number) => String(n).padStart(2, '0')

function ProjectNav({ projects }: ProjectNavProps) {
  // The project filling most of the scroller, or none.
  const [current, setCurrent] = useState<number | null>(
    null
  )
  // A click away from /work has asked for the mono backdrop.
  const leaving = useRequestedColour() === false

  useEffect(() => {
    const main = document.getElementById(SCROLLER_ID)
    if (!main) return
    const onScroll = () => {
      const view = main.getBoundingClientRect()
      const index = projects.findIndex(({ slug }) => {
        const rect = document
          .getElementById(slug)
          ?.getBoundingClientRect()
        if (!rect) return false
        const visible =
          Math.min(rect.bottom, view.bottom) -
          Math.max(rect.top, view.top)
        return visible > view.height / 2
      })
      setCurrent(index === -1 ? null : index)
    }
    onScroll()
    main.addEventListener('scroll', onScroll, {
      passive: true
    })
    return () =>
      main.removeEventListener('scroll', onScroll)
  }, [projects])

  const scrollTo =
    (slug: string) => (event: React.MouseEvent) => {
      const section = document.getElementById(slug)
      if (!section) return
      event.preventDefault()
      section.scrollIntoView({
        block: 'end',
        behavior: 'smooth'
      })
    }

  return (
    <nav
      aria-label="Projects"
      className={classNames(styles.nav, {
        [styles.leaving]: leaving
      })}
    >
      {projects.map(({ slug, name }, i) => (
        <a
          key={slug}
          href={`#${slug}`}
          onClick={scrollTo(slug)}
          aria-label={name}
          aria-current={
            i === current ? 'location' : undefined
          }
          style={
            {
              '--in': i,
              '--out': projects.length - 1 - i
            } as React.CSSProperties
          }
          className={classNames(
            pageStyles.navItem,
            styles.item,
            {
              [pageStyles.navCurrent]: i === current
            }
          )}
        >
          {pad(i + 1)}
          <span className={styles.name}>{name}</span>
        </a>
      ))}
    </nav>
  )
}

export default ProjectNav
