import { usePathname, useRouter } from 'next/navigation'
import type React from 'react'
import { useCallback } from 'react'

import { RULER } from '@/components/Ruler/timing'
import { SCROLLER_ID } from '@/constants'
import {
  isColourPath,
  requestColour
} from '@/lib/backdropRequest'

const SCROLL_FALLBACK_MS = 1000

// Every page shares the layout's scroller, padder and sticky logo, so
// changing page is: start the backdrop (the ruler's OUT starts with
// it), scroll back to the top, then swap the page below the logo once
// both the scroll and the ruler's OUT have finished.
export function startScene(href: string, swap: () => void) {
  requestColour(isColourPath(href))
  const main = document.getElementById(SCROLLER_ID)
  let scrolled = !main || main.scrollTop < 1
  let held = false
  let done = false
  const maybeSwap = () => {
    if (done || !scrolled || !held) return
    done = true
    swap()
  }
  window.setTimeout(() => {
    held = true
    maybeSwap()
  }, RULER.outMs)
  if (!main || scrolled) return

  const onScrolled = () => {
    scrolled = true
    maybeSwap()
  }
  main.addEventListener('scrollend', onScrolled, {
    once: true
  })
  window.setTimeout(onScrolled, SCROLL_FALLBACK_MS)
  main.scrollTo({ top: 0, behavior: 'smooth' })
}

export function useSceneLink(href: string) {
  const router = useRouter()
  const pathname = usePathname()

  return useCallback(
    (event: React.MouseEvent) => {
      if (pathname === href) return
      event.preventDefault()
      startScene(href, () =>
        router.push(href, { scroll: false })
      )
    },
    [href, pathname, router]
  )
}
