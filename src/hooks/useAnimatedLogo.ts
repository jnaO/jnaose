import { animate, createDrawable, utils } from 'animejs'
import Bowser from 'bowser'
import { useEffect, useState } from 'react'

export interface AnimatedLogoConfig {
  strokeColorBase: string
  strokeColorAlternative: string
  strokeWidth: number
  strokeWidthMobile: number
  strokeWidthFull: number
  duration: number
  ease: string
  loopDelayMin: number
  loopDelayMax: number
  loop: boolean
  extraStrokeWidths: number[]
}

const defaultConfig = (
  config: Partial<AnimatedLogoConfig>
): AnimatedLogoConfig => ({
  strokeColorBase: config?.strokeColorBase ?? 'orange',
  strokeColorAlternative:
    config?.strokeColorAlternative ?? '#f2f2f2ee',
  strokeWidth: config?.strokeWidth ?? 0,
  strokeWidthMobile: config?.strokeWidthMobile ?? 9,
  strokeWidthFull: config?.strokeWidthFull ?? 8,
  duration: config?.duration ?? 1500,
  ease: config?.ease ?? 'inOutSine',
  loopDelayMin: config?.loopDelayMin ?? 4000,
  loopDelayMax: config?.loopDelayMax ?? 7000,
  loop: config?.loop ?? true,
  extraStrokeWidths: config?.extraStrokeWidths ?? [10]
})
export function useAnimatedLogo(
  ref: React.RefObject<SVGSVGElement | null>,
  config?: Partial<AnimatedLogoConfig>
) {
  const [browser, setBrowser] = useState('')
  const [device, setDevice] = useState('')
  const mergedConfig: AnimatedLogoConfig = defaultConfig(
    config || {}
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const {
      browser: { name: b },
      platform: { type: d }
    } = Bowser.parse(window.navigator.userAgent || '')
    setBrowser(b || '')
    setDevice(d || '')
  }, [])

  const internetExplorer = browser === 'Internet Explorer'
  const mobile = device === 'mobile'
  // Adjust strokeWidthFull for mobile
  const strokeWidthFull = mobile
    ? mergedConfig.strokeWidthMobile
    : mergedConfig.strokeWidthFull

  useEffect(() => {
    if (!ref.current || internetExplorer) return
    animate(
      createDrawable(
        ref.current.getElementsByTagName('path')
      ),
      {
        draw: '0 1',
        duration: mergedConfig.duration,
        ease: mergedConfig.ease,
        loopDelay: utils.random(
          mergedConfig.loopDelayMin,
          mergedConfig.loopDelayMax
        ),
        loop: mergedConfig.loop,
        stroke: mergedConfig.strokeColorBase,
        strokeWidth: [
          mergedConfig.strokeWidth,
          strokeWidthFull,
          mergedConfig.strokeWidth,
          ...(mergedConfig.extraStrokeWidths || []),
          mergedConfig.strokeWidth
        ],
        delay: (el: any, i: number) => i * 100
      }
    )
  }, [ref, internetExplorer, strokeWidthFull, mergedConfig])

  // Return useful values for the component (e.g., alternative color)
  return {
    strokeColorAlternative:
      mergedConfig.strokeColorAlternative,
    browser,
    device
  }
}
