import { useEffect, useState } from 'react'

// True while <html>'s --finale-blur (written by JnaoLogo's finale)
// is above 0.
export function useFinaleBlur() {
  const [blurring, setBlurring] = useState(false)
  useEffect(() => {
    const html = document.documentElement
    const sync = () =>
      setBlurring(
        Number.parseFloat(
          html.style.getPropertyValue('--finale-blur')
        ) > 0
      )
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(html, {
      attributes: true,
      attributeFilter: ['style']
    })
    return () => observer.disconnect()
  }, [])
  return blurring
}
