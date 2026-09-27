import { usePathname, useRouter } from 'next/navigation'
import type React from 'react'
import { useCallback } from 'react'

import { isColourPath } from '@/components/Backdrop/Backdrop'
import { SCROLLER_ID } from '@/constants'
import { requestColour } from '@/lib/backdropRequest'

const SCROLL_FALLBACK_MS = 1000

// Every page shares the layout's scroller, padder and sticky logo, so
// changing page is: start the backdrop, scroll back to the top, then
// swap the page below the logo.
export function startScene(href: string, swap: () => void) {
  requestColour(isColourPath(href))
  const main = document.getElementById(SCROLLER_ID)
  if (!main || main.scrollTop < 1) {
    swap()
    return
  }

  let done = false
  const once = () => {
    if (done) return
    done = true
    swap()
  }
  main.addEventListener('scrollend', once, { once: true })
  window.setTimeout(once, SCROLL_FALLBACK_MS)
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
