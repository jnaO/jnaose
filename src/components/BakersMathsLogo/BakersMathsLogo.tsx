'use client'

import { createTimeline, svg } from 'animejs'
import classNames from 'classnames'
import { useEffect, useRef } from 'react'

import styles from './logoanimated.module.scss'

interface LogoAnimatedProps {
  className?: string
}

const SVG_NS = 'http://www.w3.org/2000/svg'

function BakersMathsLogo({ className }: LogoAnimatedProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = svgRef.current
    if (!el || hasAnimated.current) return

    hasAnimated.current = true

    const defs = document.createElementNS(SVG_NS, 'defs')
    el.insertBefore(defs, el.firstChild)

    const stalks = Array.from(
      el.querySelectorAll<SVGGElement>('[data-stalk]')
    )

    const tl = createTimeline({
      onComplete: () => el.classList.remove(styles.drawing)
    })

    let clipCounter = 0

    const EASINGS = [
      'outCubic',
      'outQuad',
      'outQuart',
      'outQuint',
      'outSine',
      'outExpo'
    ]
    const rand = (min: number, max: number) =>
      min + Math.random() * (max - min)
    const pickEasing = () =>
      EASINGS[Math.floor(Math.random() * EASINGS.length)]

    const createFillClip = (path: SVGPathElement) => {
      const bbox = path.getBBox()
      const pad = 1
      const clipId = `logo-clip-${clipCounter++}`
      const clipPath = document.createElementNS(
        SVG_NS,
        'clipPath'
      )
      clipPath.setAttribute('id', clipId)
      clipPath.setAttribute(
        'clipPathUnits',
        'userSpaceOnUse'
      )
      const rect = document.createElementNS(SVG_NS, 'rect')
      rect.setAttribute('x', String(bbox.x - pad))
      rect.setAttribute(
        'y',
        String(bbox.y + bbox.height + pad)
      )
      rect.setAttribute(
        'width',
        String(bbox.width + pad * 2)
      )
      rect.setAttribute('height', '0')
      clipPath.appendChild(rect)
      defs.appendChild(clipPath)
      path.setAttribute('clip-path', `url(#${clipId})`)
      return { bbox, pad, rect }
    }

    const addClipWipe = (
      bbox: DOMRect,
      pad: number,
      rect: SVGRectElement,
      duration: number,
      offset: number,
      ease: string
    ) => {
      hasAnimated.current = false
      const progress = { t: 0 }
      tl.add(
        progress,
        {
          t: [0, 1],
          duration,
          ease,
          onUpdate: () => {
            const h = (bbox.height + pad * 2) * progress.t
            rect.setAttribute(
              'y',
              String(bbox.y + bbox.height + pad - h)
            )
            rect.setAttribute('height', String(h))
          }
        },
        offset
      )
    }

    // Whisks: clip wipe both stroke and fill together (bottom-to-top).
    const animateWipe = (
      elements: SVGPathElement[],
      duration: number,
      offset: number
    ) => {
      elements.forEach((path) => {
        const { bbox, pad, rect } = createFillClip(path)
        path.style.fillOpacity = '1'
        path.style.strokeOpacity = '1'
        const jitteredOffset =
          offset + rand(0, duration * 0.15)
        addClipWipe(
          bbox,
          pad,
          rect,
          duration * rand(0.85, 1.15),
          jitteredOffset,
          pickEasing()
        )
      })
    }

    // Stems/grains: draw outline along the path for the full slot, then wipe
    // fill bottom-to-top starting after a random delay and ending at the same
    // moment as the outline. Easings are picked per call for organic pacing.
    const animateDrawThenFill = (
      path: SVGPathElement,
      slot: number,
      offset: number
    ) => {
      const fillDelay = slot * rand(0.12, 0.28)
      const fillDuration = slot - fillDelay

      const strokeClone = path.cloneNode(
        true
      ) as SVGPathElement
      strokeClone.style.fill = 'none'
      strokeClone.style.strokeOpacity = '1'
      strokeClone.removeAttribute('data-type')
      strokeClone.removeAttribute('data-order')
      path.parentNode?.insertBefore(
        strokeClone,
        path.nextSibling
      )

      path.style.stroke = 'none'
      path.style.fillOpacity = '1'
      const { bbox, pad, rect } = createFillClip(path)

      tl.add(
        svg.createDrawable([strokeClone]),
        {
          draw: ['0 0', '0 1'],
          duration: slot,
          ease: pickEasing()
        },
        offset
      )

      addClipWipe(
        bbox,
        pad,
        rect,
        fillDuration,
        offset + fillDelay,
        pickEasing()
      )
    }

    const totalDuration = 6000
    const stalkOverlap = 0.05
    const stalkDuration =
      totalDuration /
      (1 + (stalks.length - 1) * stalkOverlap)

    let cursor = 0

    stalks.forEach((stalk) => {
      const stems = Array.from(
        stalk.querySelectorAll<SVGPathElement>(
          '[data-type="stem"]'
        )
      )
      const grains = Array.from(
        stalk.querySelectorAll<SVGPathElement>(
          '[data-type="grain"]'
        )
      ).sort(
        (a, b) =>
          parseInt(a.dataset.order || '0', 10) -
          parseInt(b.dataset.order || '0', 10)
      )
      const whisks = Array.from(
        stalk.querySelectorAll<SVGPathElement>(
          '[data-type="whisk"]'
        )
      )

      const units = 3 + grains.length + 2
      const unit =
        totalDuration /
        (units * (1 + stalkOverlap) - stalkOverlap)
      const stemDuration = unit * 5
      const grainDuration = unit
      const whiskDuration = unit * 8

      let stalkTime = 0

      stems.forEach((s) => {
        const slot = stemDuration * rand(0.9, 1.1)
        animateDrawThenFill(s, slot, cursor + stalkTime)
        stalkTime += slot * rand(0.85, 0.95)
      })

      grains.forEach((g) => {
        const slot = grainDuration * 2 * rand(0.85, 1.15)
        animateDrawThenFill(g, slot, cursor + stalkTime)
        stalkTime += slot * 0.3
      })

      if (whisks.length > 0) {
        animateWipe(
          whisks,
          whiskDuration,
          cursor + stalkTime
        )
        stalkTime += whiskDuration
      }

      cursor += stalkDuration * stalkOverlap
    })

    return () => {
      tl.pause()
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      className={classNames(
        styles.logo,
        styles.drawing,
        className
      )}
      width="100%"
      height="100%"
      viewBox="0 0 994 981"
      version="1.1"
      style={{
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        strokeLinejoin: 'round',
        strokeMiterlimit: '2'
      }}
    >
      <g data-stalk="1">
        <path
          d="M784.398,413.902c0,-0 -32.074,44.332 -41.665,20.144c-9.619,-24.252 23.154,-9.721 41.665,-20.144Z"
          className={styles.midGrain}
          data-order="1"
          data-type="grain"
        />
        <path
          d="M845.626,319.001c-0,-0 -35.641,41.519 -43.193,16.619c-7.574,-24.966 23.881,-7.767 43.193,-16.619Z"
          className={styles.midGrain}
          data-order="9"
          data-type="grain"
        />
        <path
          d="M802.397,394.079c0,0 -39.058,38.323 -44.455,12.868c-5.413,-25.522 24.457,-5.698 44.455,-12.868Z"
          className={styles.midGrain}
          data-order="3"
          data-type="grain"
        />
        <path
          d="M859.492,287.387c0,0 -25.47,48.43 -38.391,25.845c-12.958,-22.645 21.543,-12.904 38.391,-25.845Z"
          className={styles.midGrain}
          data-order="11"
          data-type="grain"
        />
        <path
          d="M818.344,368.912c0,-0 -35.33,41.784 -43.068,16.94c-7.759,-24.908 23.822,-7.944 43.068,-16.94Z"
          className={styles.midGrain}
          data-order="5"
          data-type="grain"
        />
        <path
          d="M870.142,261.469c-0,0 -25.369,48.483 -38.338,25.925c-13.005,-22.617 21.517,-12.948 38.338,-25.925Z"
          className={styles.midGrain}
          data-order="13"
          data-type="grain"
        />
        <path
          d="M830.426,343.195c0,-0 -34.021,42.857 -42.523,18.264c-8.526,-24.656 23.565,-8.677 42.523,-18.264Z"
          className={styles.midGrain}
          data-order="7"
          data-type="grain"
        />
        <path
          d="M878.704,236.509c0,0 -26.751,47.734 -39.066,24.813c-12.35,-22.982 21.879,-12.325 39.066,-24.813Z"
          className={styles.midGrain}
          data-order="15"
          data-type="grain"
        />
        <path
          d="M875.316,198.119c-0,-0 -4.532,54.531 -25.249,38.786c-20.772,-15.785 9.553,-23.639 25.249,-38.786Z"
          className={styles.midGrain}
          data-order="17"
          data-type="grain"
        />
        <path
          d="M737.301,364.39c0,0 -20.602,50.693 4.994,46.01c25.664,-4.693 -4.025,-24.787 -4.994,-46.01Z"
          className={styles.midGrain}
          data-order="2"
          data-type="grain"
        />
        <path
          d="M785.614,278.161c-0,-0 -1.593,54.695 20.753,41.365c22.407,-13.364 -12.431,-21.819 -20.753,-41.365Z"
          className={styles.midGrain}
          data-order="10"
          data-type="grain"
        />
        <path
          d="M747.825,344.298c0,0 -11.804,53.431 12.643,44.52c24.513,-8.933 -8.127,-23.761 -12.643,-44.52Z"
          className={styles.midGrain}
          data-order="4"
          data-type="grain"
        />
        <path
          d="M797.819,254.771c0,-0 -3.447,54.61 19.339,42.045c22.847,-12.596 -11.684,-22.228 -19.339,-42.045Z"
          className={styles.midGrain}
          data-order="12"
          data-type="grain"
        />
        <path
          d="M760.641,321.206c-0,-0 -10.754,53.651 13.513,44.262c24.333,-9.411 -8.591,-23.596 -13.513,-44.262Z"
          className={styles.midGrain}
          data-order="6"
          data-type="grain"
        />
        <path
          d="M806.91,229.917c-0,-0 -2.542,54.66 20.032,41.719c22.636,-12.973 -12.05,-22.031 -20.032,-41.719Z"
          className={styles.midGrain}
          data-order="14"
          data-type="grain"
        />
        <path
          d="M774.982,299.631c0,0 -9.428,53.901 14.601,43.917c24.094,-10.009 -9.17,-23.378 -14.601,-43.917Z"
          className={styles.midGrain}
          data-order="8"
          data-type="grain"
        />
        <path
          d="M821.119,204.91c-0,-0 -8.921,53.987 15.013,43.777c23.998,-10.234 -9.39,-23.29 -15.013,-43.777Z"
          className={styles.midGrain}
          data-order="16"
          data-type="grain"
        />
        <path
          d="M34.325,941.591c549.41,-260.007 676.765,-494.912 696.876,-530.032c0,0 6.862,4.571 16.619,1.004l1.7,3.746c-14.627,1.061 -13.181,14.451 -6.826,23.369c-4.707,7.901 -166.524,254.775 -706.392,502.606l-1.977,-0.693Z"
          className={styles.midGrain}
          data-type="stem"
        />
        <path
          d="M762.246,214.46c1.853,30.012 -8.994,74.694 -21.712,143.675l-1.987,1.587c13.446,-63.704 24.369,-115.794 23.699,-145.262Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="2"
        />
        <path
          d="M773.392,193.36c1.954,30.006 -8.745,74.724 -21.234,143.747l-1.981,1.593c13.233,-63.748 23.984,-115.874 23.215,-145.34Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="4"
        />
        <path
          d="M786.998,173.692c1.517,30.031 -9.829,74.589 -23.319,143.423l-2.005,1.565c14.158,-63.549 25.664,-115.514 25.324,-144.988Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="6"
        />
        <path
          d="M800.093,149.926c1.652,30.024 -9.493,74.633 -22.673,143.527l-1.998,1.574c13.872,-63.612 25.144,-115.628 24.671,-145.101Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="8"
        />
        <path
          d="M813.171,127.873c1.524,30.031 -9.812,74.591 -23.285,143.429l-2.004,1.564c14.142,-63.552 25.636,-115.519 25.289,-144.993Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="10"
        />
        <path
          d="M818.668,102.274c2.599,29.957 -7.135,74.895 -18.135,144.171l-1.947,1.635c11.858,-64.018 21.485,-116.363 20.082,-145.806Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="12"
        />
        <path
          d="M825.288,77.029c3.218,29.897 -5.583,75.027 -15.147,144.515l-1.913,1.676c10.531,-64.25 19.072,-116.783 17.06,-146.191Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="14"
        />
        <path
          d="M851.316,57.715c0.406,30.066 -12.579,74.175 -28.603,142.463l-2.062,1.49c16.497,-62.983 29.916,-114.486 30.665,-143.953Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="16"
        />
        <path
          d="M912.923,329.444c-28.228,10.362 -64.786,38.248 -122.843,77.611l-0.655,2.458c52.933,-37.909 96.243,-68.842 123.498,-80.069Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="1"
        />
        <path
          d="M924.811,299.822c-27.298,12.608 -61.484,43.357 -116.172,87.281l-0.454,2.502c49.697,-42.06 90.368,-76.391 116.626,-89.783Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="3"
        />
        <path
          d="M934.46,266.664c-26.385,14.423 -58.417,47.409 -110.014,94.925l-0.284,2.527c46.744,-45.32 85.004,-82.318 110.298,-97.452Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="5"
        />
        <path
          d="M943.988,240.969c-26.124,14.889 -57.564,48.441 -108.308,96.868l-0.239,2.531c45.93,-46.144 83.526,-83.817 108.547,-99.399Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="7"
        />
        <path
          d="M955.35,212.928c-25.752,15.524 -56.363,49.833 -105.909,99.486l-0.177,2.537c44.789,-47.253 81.453,-85.834 106.086,-102.023Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="9"
        />
        <path
          d="M965.466,175.984c-25.057,16.623 -54.156,52.224 -101.508,103.972l-0.067,2.542c42.703,-49.145 77.665,-89.275 101.575,-106.514Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="11"
        />
        <path
          d="M973.038,147.549c-24.581,17.319 -52.669,53.723 -98.55,106.78l0.004,2.543c41.308,-50.325 75.129,-91.42 98.546,-109.323Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="13"
        />
        <path
          d="M975.846,116.383c-23.706,18.499 -49.984,56.23 -93.22,111.463l0.128,2.54c38.802,-52.281 70.577,-94.978 93.092,-114.003Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="15"
        />
        <path
          d="M942.45,60.831c-18.749,23.507 -35.524,66.318 -64.719,130.098l0.716,2.44c25.569,-59.876 46.534,-108.796 64.003,-132.538Z"
          className={styles.midGrain}
          data-type="whisk"
          data-order="17"
        />
      </g>
      <g data-stalk="2">
        <path
          d="M375.477,505.026c-0,0 57.222,37.986 57.844,5.331c0.627,-32.741 -31.496,-1.23 -57.844,-5.331Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="1"
        />
        <path
          d="M261.718,420.44c0,0 60.176,33.109 58.088,0.515c-2.091,-32.68 -31.49,1.387 -58.088,-0.515Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="9"
        />
        <path
          d="M345.596,489.651c-0,0 62.784,27.846 57.919,-4.45c-4.876,-32.382 -31.256,4.072 -57.919,4.45Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="3"
        />
        <path
          d="M231.507,389.385c0,-0 51.263,45.709 56.506,13.472c5.259,-32.322 -31.004,-5.68 -56.506,-13.472Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="11"
        />
        <path
          d="M315.767,467.092c-0,-0 59.927,33.556 58.082,0.947c-1.848,-32.694 -31.499,1.152 -58.082,-0.947Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="5"
        />
        <path
          d="M207.568,363.613c-0,0 51.168,45.817 56.477,13.591c5.327,-32.311 -30.992,-5.745 -56.477,-13.591Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="13"
        />
        <path
          d="M290.242,442.184c-0,-0 58.86,35.394 58.025,2.744c-0.835,-32.737 -31.52,0.176 -58.025,-2.744Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="7"
        />
        <path
          d="M186.512,338.046c0,-0 52.463,44.327 56.845,11.962c4.396,-32.451 -31.144,-4.852 -56.845,-11.962Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="15"
        />
        <path
          d="M173.584,291.431c0,0 29.34,62.101 46.757,34.472c17.465,-27.701 -21.638,-23.58 -46.757,-34.472Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="17"
        />
        <path
          d="M409.036,426.09c-0,0 46.537,50.513 14.39,56.279c-32.232,5.785 -6.184,-30.907 -14.39,-56.279Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="2"
        />
        <path
          d="M314.28,346.008c0,0 25.957,63.589 -6.179,57.76c-32.222,-5.841 5.004,-31.12 6.179,-57.76Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="10"
        />
        <path
          d="M387.818,407.108c0,0 37.403,57.605 4.744,57.896c-32.746,0.294 -0.911,-31.507 -4.744,-57.896Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="4"
        />
        <path
          d="M289.636,323.89c-0,-0 28.099,62.672 -4.217,57.936c-32.402,-4.744 3.946,-31.272 4.217,-57.936Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="12"
        />
        <path
          d="M362.587,385.608c-0,-0 36.266,58.327 3.607,57.977c-32.745,-0.347 -0.292,-31.518 -3.607,-57.977Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="6"
        />
        <path
          d="M268.001,298.681c-0,0 27.056,63.129 -5.176,57.859c-32.319,-5.281 4.463,-31.202 5.176,-57.859Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="14"
        />
        <path
          d="M336.223,366.567c0,-0 34.817,59.204 2.176,58.049c-32.726,-1.155 0.485,-31.516 -2.176,-58.049Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="8"
        />
        <path
          d="M240.292,275.543c-0,0 34.259,59.528 1.631,58.067c-32.715,-1.462 0.781,-31.51 -1.631,-58.067Z"
          className={styles.darkGrain}
          data-type="grain"
          data-order="16"
        />
        <path
          d="M948.206,747.433c-397.086,-107.048 -472.129,-236.161 -511.233,-268.585c-0,0 -6.053,8.394 -19.092,8.498l-0.348,5.152c17.659,-5.194 21.855,11.182 18.313,24.462c9.012,7.215 114.11,121.398 510.342,232.158l2.018,-1.685Z"
          className={styles.darkGrain}
          data-type="stem"
        />
        <path
          d="M313.699,260.843c11.037,36.093 43.462,83.836 88.787,159.317l3.034,0.99c-43.855,-68.957 -79.633,-125.374 -91.821,-160.307Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="2"
        />
        <path
          d="M291.3,240.953c10.917,36.129 43.183,83.98 88.256,159.611l3.031,1c-43.626,-69.102 -79.215,-125.638 -91.287,-160.611Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="4"
        />
        <path
          d="M266.648,223.825c11.44,35.967 44.398,83.345 90.564,158.314l3.046,0.956c-44.625,-68.462 -81.032,-124.475 -93.61,-159.27Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="6"
        />
        <path
          d="M240.788,201.659c11.278,36.018 44.022,83.544 89.851,158.719l3.041,0.97c-44.316,-68.662 -80.47,-124.839 -92.892,-159.689Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="8"
        />
        <path
          d="M215.707,181.495c11.432,35.969 44.378,83.355 90.527,158.334l3.045,0.957c-44.608,-68.472 -81.001,-124.494 -93.572,-159.291Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="10"
        />
        <path
          d="M197.975,153.826c10.137,36.355 41.366,84.89 84.801,161.474l3.009,1.065c-42.129,-70.026 -76.493,-127.315 -87.81,-162.539Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="12"
        />
        <path
          d="M179.075,127.069c9.383,36.557 39.6,85.728 81.441,163.194l2.986,1.127c-40.67,-70.882 -73.841,-128.87 -84.427,-164.321Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="14"
        />
        <path
          d="M139.98,115.827c12.761,35.519 47.447,81.646 96.353,154.857l3.078,0.843c-47.124,-66.766 -85.575,-121.395 -99.431,-155.7Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="16"
        />
        <path
          d="M187.224,462.346c37.742,-0.25 92.993,16.429 178.567,37.132l1.851,2.6c-78.91,-21.25 -143.439,-38.537 -180.418,-39.732Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="1"
        />
        <path
          d="M160.201,432.766c37.639,2.799 91.361,23.887 174.984,51.435l1.635,2.741c-76.935,-27.555 -139.857,-49.998 -176.619,-54.176Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="3"
        />
        <path
          d="M134.257,398.041c37.363,5.334 89.54,30.001 171.112,63.131l1.446,2.846c-74.9,-32.686 -136.163,-59.327 -172.558,-65.977Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="5"
        />
        <path
          d="M111.747,372.032c37.263,5.998 88.993,31.59 169.962,66.167l1.396,2.87c-74.307,-34.013 -135.086,-61.74 -171.358,-69.037Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="7"
        />
        <path
          d="M86.043,344.077c37.105,6.907 88.194,33.755 168.294,70.3l1.325,2.904c-73.453,-35.819 -133.537,-65.023 -169.619,-73.204Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="9"
        />
        <path
          d="M57.88,305.109c36.772,8.504 86.652,37.536 165.097,77.511l1.198,2.958c-71.835,-38.962 -130.6,-70.735 -166.295,-80.469Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="11"
        />
        <path
          d="M36.459,275.02c36.518,9.533 85.563,39.954 162.856,82.114l1.114,2.991c-70.713,-40.963 -128.563,-74.373 -163.97,-85.105Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="13"
        />
        <path
          d="M19.443,239.62c36.009,11.305 83.511,44.084 158.653,89.967l0.967,3.042c-68.629,-44.366 -124.779,-80.561 -159.62,-93.009Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="15"
        />
        <path
          d="M34.231,159.619c32.39,19.375 70.959,62.309 133.359,124.42l0.233,3.184c-56.42,-59.12 -102.604,-107.389 -133.592,-127.604Z"
          className={styles.darkGrain}
          data-type="whisk"
          data-order="17"
        />
      </g>
      <g data-stalk="3">
        <path
          d="M502.659,450.014c0,0 19.439,60.589 38.778,37.318c19.392,-23.332 -22.082,-19.109 -38.778,-37.318Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="1"
        />
        <path
          d="M469.262,322.999c0,-0 24.397,58.768 41.739,33.972c17.391,-24.859 -23.59,-17.211 -41.739,-33.972Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="9"
        />
        <path
          d="M489.929,421.603c-0,0 29.328,56.469 44.489,30.282c15.203,-26.254 -24.975,-15.133 -44.489,-30.282Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="3"
        />
        <path
          d="M465.363,283.049c0,0 10.658,62.732 33.099,42.435c22.503,-20.348 -19.151,-22.044 -33.099,-42.435Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="11"
        />
        <path
          d="M481.391,388.023c0,0 23.958,58.948 41.485,34.283c17.575,-24.729 -23.461,-17.387 -41.485,-34.283Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="5"
        />
        <path
          d="M462.946,250.552c0,-0 10.527,62.754 33.011,42.504c22.544,-20.302 -19.106,-22.085 -33.011,-42.504Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="13"
        />
        <path
          d="M477.327,355.233c0,0 22.123,59.661 40.405,35.55c18.331,-24.174 -22.913,-18.104 -40.405,-35.55Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="7"
        />
        <path
          d="M462.498,219.87c-0,-0 12.326,62.425 34.218,41.537c21.952,-20.941 -19.732,-21.526 -34.218,-41.537Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="15"
        />
        <path
          d="M480.106,178.658c0,-0 -14.689,61.912 13.897,51.992c28.663,-9.944 -2.019,-29.58 -13.897,-51.992Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="17"
        />
        <path
          d="M572.605,412.302c0,-0 4.46,63.474 -22.14,49.052c-26.672,-14.459 13.403,-25.944 22.14,-49.052Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="2"
        />
        <path
          d="M550.355,299.538c0,0 -17.997,61.032 -37.882,38.225c-19.94,-22.865 21.622,-19.626 37.882,-38.225Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="10"
        />
        <path
          d="M568.23,386.292c0,0 -6.253,63.322 -30.056,44.641c-23.868,-18.728 17.566,-23.327 30.056,-44.641Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="4"
        />
        <path
          d="M545.315,269.276c-0,-0 -15.918,61.608 -36.565,39.488c-20.704,-22.176 20.945,-20.348 36.565,-39.488Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="12"
        />
        <path
          d="M562.408,356.138c-0,-0 -7.494,63.187 -30.926,44.043c-23.496,-19.193 18.02,-22.978 30.926,-44.043Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="6"
        />
        <path
          d="M544.239,238.519c0,-0 -16.935,61.335 -37.213,38.877c-20.334,-22.516 21.279,-19.999 37.213,-38.877Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="14"
        />
        <path
          d="M554.343,327.108c-0,0 -9.05,62.984 -32.003,43.268c-23.016,-19.766 18.581,-22.527 32.003,-43.268Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="8"
        />
        <path
          d="M537.571,205.746c-0,-0 -9.641,62.896 -32.408,42.965c-22.829,-19.981 18.792,-22.351 32.408,-42.965Z"
          className={styles.lightGrain}
          data-type="grain"
          data-order="16"
        />
        <path
          d="M721.511,965.65c-138.61,-329.887 -149.663,-452.925 -159.206,-499.008c-0,-0 -9.235,2.573 -18.731,-4.895l-3.233,3.527c15.785,6.457 9.349,20.735 -0.897,28.297c2.349,10.433 34.879,137.535 179.633,472.13l2.434,-0.051Z"
          className={styles.lightGrain}
          data-type="stem"
        />
        <path
          d="M599.197,237.569c-12.89,32.504 -17.041,85.811 -27.901,166.652l1.623,2.472c8.15,-75.27 14.892,-136.793 26.278,-169.124Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="2"
        />
        <path
          d="M594.492,210.219c-12.997,32.46 -17.326,85.753 -28.456,166.558l1.615,2.477c8.401,-75.243 15.348,-136.743 26.841,-169.035Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="4"
        />
        <path
          d="M586.56,183.564c-12.526,32.646 -16.08,85.997 -26.035,166.954l1.651,2.454c7.307,-75.357 13.36,-136.952 24.384,-169.408Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="6"
        />
        <path
          d="M580.667,152.564c-12.672,32.59 -16.467,85.923 -26.786,166.835l1.64,2.461c7.646,-75.323 13.977,-136.89 25.146,-169.296Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="8"
        />
        <path
          d="M574.181,123.465c-12.533,32.643 -16.101,85.992 -26.075,166.947l1.651,2.454c7.325,-75.355 13.393,-136.948 24.424,-169.401Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="10"
        />
        <path
          d="M577.353,93.184c-13.693,32.173 -19.168,85.361 -32.034,165.908l1.562,2.511c10.018,-75.045 18.287,-136.381 30.472,-168.419Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="12"
        />
        <path
          d="M579.153,62.888c-14.356,31.883 -20.931,84.946 -35.461,165.208l1.509,2.544c11.569,-74.822 21.106,-135.973 33.952,-167.752Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="14"
        />
        <path
          d="M557.363,32.138c-11.31,33.087 -12.89,86.532 -19.847,167.802l1.741,2.39c4.517,-75.575 8.29,-137.351 18.106,-170.192Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="16"
        />
        <path
          d="M391.113,310.235c27.458,21.65 57.793,65.68 107.746,130.162l-0.164,2.952c-44.814,-61.023 -81.512,-110.859 -107.582,-133.114Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="1"
        />
        <path
          d="M388.668,273.197c25.619,23.797 52.298,70.134 96.879,138.44l-0.402,2.929c-39.738,-64.443 -72.291,-117.081 -96.477,-141.369Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="3"
        />
        <path
          d="M389.978,233.06c23.954,25.473 47.445,73.505 87.312,144.665l-0.599,2.896c-35.296,-66.98 -64.221,-121.696 -86.713,-147.561Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="5"
        />
        <path
          d="M388.733,201.218c23.497,25.895 46.129,74.337 84.724,146.196l-0.65,2.884c-34.099,-67.596 -62.046,-122.819 -84.074,-149.08Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="7"
        />
        <path
          d="M386.302,166.119c22.857,26.461 44.298,75.442 81.126,148.222l-0.721,2.868c-32.437,-68.409 -59.026,-124.298 -80.405,-151.09Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="9"
        />
        <path
          d="M388.462,121.628c21.691,27.425 40.995,77.287 74.641,151.591l-0.844,2.834c-29.449,-69.748 -53.596,-126.734 -73.797,-154.425Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="11"
        />
        <path
          d="M390.364,87.462c20.913,28.023 38.81,78.407 70.357,153.627l-0.923,2.809c-27.479,-70.547 -50.018,-128.188 -69.434,-156.436Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="13"
        />
        <path
          d="M398.526,52.002c19.52,29.01 34.936,80.208 62.774,156.878l-1.059,2.76c-24.003,-71.804 -43.701,-130.477 -61.715,-159.638Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="15"
        />
        <path
          d="M455.504,2.661c12.233,32.757 15.31,86.137 24.54,167.18l-1.673,2.439c-6.632,-75.42 -12.134,-137.066 -22.867,-169.619Z"
          className={styles.lightGrain}
          data-type="whisk"
          data-order="17"
        />
      </g>
    </svg>
  )
}

export default BakersMathsLogo
