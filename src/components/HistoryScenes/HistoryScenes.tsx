'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { startScene } from '@/hooks/useSceneLink'

// Runs browser back/forward through the same scene as a menu click.
// This effect runs before the App Router's own (children first), so
// its popstate listener fires first and can hold Next's page swap
// back until the scroll to the top has finished.
function HistoryScenes() {
  const router = useRouter()
  const pathname = usePathname()
  const shown = useRef(pathname)
  shown.current = pathname

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const target = window.location.pathname
      if (target === shown.current) return
      event.stopImmediatePropagation()
      startScene(target, () =>
        router.replace(target, { scroll: false })
      )
    }
    window.addEventListener('popstate', onPopState)
    return () =>
      window.removeEventListener('popstate', onPopState)
  }, [router])

  return null
}

export default HistoryScenes
