'use client'

import { useEffect } from 'react'

import { SCROLLER_ID } from '@/constants'
import { sceneStartedAtTop } from '@/lib/sceneStart'

// Scrolls down to the page's first segment, lifting the sticky logo on
// the way, but only when the page change started at the top; otherwise
// the page stays at the top, avoiding an up-then-down scroll.
function ScrollIn() {
  useEffect(() => {
    const main = document.getElementById(SCROLLER_ID)
    const first = main?.querySelector('section')
    if (!main || !first || !sceneStartedAtTop()) return
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    first.scrollIntoView({
      block: 'end',
      behavior: reduce ? 'instant' : 'smooth'
    })
  }, [])

  return null
}

export default ScrollIn
