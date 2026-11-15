'use client'

import classNames from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type React from 'react'
import { useId } from 'react'

import { UI_CHROME } from '@/constants'
import { useSceneLink } from '@/hooks/useSceneLink'
import { matrixAttr } from '@/lib/affine'
import {
  isColourPath,
  useSceneColour
} from '@/lib/backdropRequest'
import type { SvgArt } from '@/lib/svgArt'
import styles from './siteMenu.module.scss'
import { rotatedViewBox, wordRotation } from './spine'
import { WORDS, type Word } from './words'

const HREF: Record<Word, string> = {
  home: '/',
  work: '/work'
}
const wordOf = (colour: boolean): Word =>
  colour ? 'work' : 'home'

// User-space area of the masks, past the viewBox so the
// outline's outer half is never clipped.
const MASK_AREA = {
  maskUnits: 'userSpaceOnUse',
  x: '-50%',
  y: '-50%',
  width: '200%',
  height: '200%'
} as const
// The viewBox's full height, for the rolling covers.
const COVER = {
  x: '-50%',
  y: '0',
  width: '200%',
  height: '100%'
} as const

// A word's paths, turned to read up the spine.
function WordPaths({ art }: { art: SvgArt }) {
  return (
    <g transform={matrixAttr(wordRotation(art))}>
      <g transform={art.transform}>
        {art.paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </g>
  )
}

// The ink layer of the spine: the outlined words.
// The photo inside the filled word is MenuWindow, reading
// the `data-window` carriers here.
function SiteMenu() {
  const pathname = usePathname()
  const maskId = `spine${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const page = wordOf(isColourPath(pathname))
  // Leads the route, with the Backdrop.
  const shown = wordOf(useSceneColour())
  const links: Record<
    Word,
    (event: React.MouseEvent) => void
  > = {
    home: useSceneLink(HREF.home),
    work: useSceneLink(HREF.work)
  }

  return (
    <nav
      aria-label="Site"
      className={classNames(styles.menu, UI_CHROME)}
    >
      {(Object.keys(WORDS) as Word[]).map((word) => {
        const art = WORDS[word]
        return (
          <Link
            key={word}
            href={HREF[word]}
            scroll={false}
            onClick={links[word]}
            aria-label={word}
            aria-current={
              word === page ? 'page' : undefined
            }
            className={classNames(styles.word, {
              [styles.current]: word === shown
            })}
            style={
              {
                '--ratio': `var(--ratio-${word})`
              } as React.CSSProperties
            }
          >
            <span className={styles.box}>
              <svg
                className={styles.art}
                viewBox={rotatedViewBox(art)}
                aria-hidden="true"
                focusable="false"
                data-window="word"
                data-word={word}
              >
                {/* Hides the outline's inner half where the photo
                    fill is, so a filled word keeps only its outer edge. */}
                <mask
                  id={`${maskId}-${word}`}
                  {...MASK_AREA}
                >
                  <rect {...MASK_AREA} fill="#fff" />
                  <g className={styles.hole}>
                    <WordPaths art={art} />
                  </g>
                  {/* Restores the outline beyond the wipe edge, so
                      the hole tracks MenuWindow's fill. */}
                  <rect
                    className={styles.blind}
                    {...COVER}
                    fill="#fff"
                  />
                </mask>
                <mask
                  id={`${maskId}-${word}-ink`}
                  {...MASK_AREA}
                >
                  <rect
                    className={styles.ink}
                    {...COVER}
                    fill="#fff"
                  />
                </mask>
                <g
                  className={styles.solid}
                  mask={`url(#${maskId}-${word}-ink)`}
                >
                  <WordPaths art={art} />
                </g>
                <g mask={`url(#${maskId}-${word})`}>
                  <WordPaths art={art} />
                </g>
              </svg>
              <span
                className={styles.wipe}
                data-window-wipe
              />
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export default SiteMenu
