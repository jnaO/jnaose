import {
  createTimeline,
  type Timeline,
  utils
} from 'animejs'

import { type Shard, VIEWBOX } from './shards'

// Tuning constants for the footer finale. Times in ms, angles in deg,
// lengths in px unless noted.
export const FINALE = {
  seed: 1985,
  perspective: 1000,
  // Out: shards fly from the resting logo to off-screen.
  outDuration: 380,
  outEase: 'in(3)',
  // In: shards fly from off-screen into the fullscreen logo.
  inDuration: 520,
  inEase: 'out(4)',
  // Max per-shard start delay within each phase.
  stagger: 90,
  // Flight distance, as a multiple of the stage diagonal.
  distanceMin: 1.1,
  distanceMax: 1.5,
  // Max deviation (radians) from the centre-to-shard direction.
  jitter: 0.6,
  // Max |rotateX/Y/Z| at the off-screen pose.
  rotate: 540,
  // translateZ range at the off-screen pose; must stay < perspective.
  depthMin: 0,
  depthMax: 600,
  // `.box` opacity once re-formed fullscreen.
  fullOpacity: 0.5
}

const CENTRE = {
  x: VIEWBOX.width / 2,
  y: VIEWBOX.height / 2
}

type Random = (min: number, max: number) => number

// A seeded off-screen pose for one shard. `reach` is how far (px) the
// shard centre must travel to leave the stage.
function offscreenPose(
  random: Random,
  [x, y, w, h]: Shard['bbox'],
  reach: number
) {
  const angle =
    Math.atan2(y + h / 2 - CENTRE.y, x + w / 2 - CENTRE.x) +
    random(-FINALE.jitter, FINALE.jitter)
  const distance =
    reach * random(FINALE.distanceMin, FINALE.distanceMax)
  return {
    translateX: Math.cos(angle) * distance,
    translateY: Math.sin(angle) * distance,
    translateZ: random(FINALE.depthMin, FINALE.depthMax),
    rotateX: random(-FINALE.rotate, FINALE.rotate),
    rotateY: random(-FINALE.rotate, FINALE.rotate),
    rotateZ: random(-FINALE.rotate, FINALE.rotate)
  }
}

type Pose = ReturnType<typeof offscreenPose>
const POSE_KEYS: (keyof Pose)[] = [
  'translateX',
  'translateY',
  'translateZ',
  'rotateX',
  'rotateY',
  'rotateZ'
]

function tweens(pose: Pose, direction: 'out' | 'in') {
  const params: Record<string, [number, number]> = {}
  POSE_KEYS.forEach((key) => {
    params[key] =
      direction === 'out' ? [0, pose[key]] : [pose[key], 0]
  })
  return params
}

// Box rect (px, relative to the stage) that contain-fits the logo in
// the stage minus the resting gutter, centred.
function fullscreenRect(
  stage: HTMLElement,
  box: HTMLElement
) {
  const style = getComputedStyle(box)
  const gutterX = parseFloat(style.left)
  const gutterY = parseFloat(style.bottom)
  const stageW = stage.clientWidth
  const stageH = stage.clientHeight
  const ratio = VIEWBOX.width / VIEWBOX.height
  const width = Math.min(
    stageW - 2 * gutterX,
    (stageH - 2 * gutterY) * ratio
  )
  return {
    left: (stageW - width) / 2,
    bottom: (stageH - width / ratio) / 2,
    width
  }
}

interface FinaleOptions {
  stage: HTMLElement
  box: HTMLElement
  shardEls: Element[]
  shards: Shard[]
  // Called when playback reaches either end; `reversed` is true at rest.
  onSettle: (reversed: boolean) => void
}

// Paused timeline: rest logo → shards off-screen → fullscreen logo.
// Must be built with `.box` at its resting CSS placement.
export function createFinale({
  stage,
  box,
  shardEls,
  shards,
  onSettle
}: FinaleOptions): Timeline {
  const seeded = utils.createSeededRandom(FINALE.seed)
  const random: Random = (min, max) => seeded(min, max, 4)

  const diagonal = Math.hypot(
    stage.clientWidth,
    stage.clientHeight
  )
  const restWidth = box.clientWidth
  const full = fullscreenRect(stage, box)
  const shardRadius = (
    bbox: Shard['bbox'],
    boxWidth: number
  ) =>
    (Math.hypot(bbox[2], bbox[3]) / VIEWBOX.width / 2) *
    boxWidth

  const midpoint = FINALE.outDuration + FINALE.stagger
  const tl = createTimeline({
    autoplay: false,
    onComplete: (self) => onSettle(self.reversed)
  })

  shardEls.forEach((el, i) => {
    const { bbox } = shards[i]
    const pose = offscreenPose(
      random,
      bbox,
      diagonal + shardRadius(bbox, restWidth)
    )
    tl.add(
      el,
      {
        ...tweens(pose, 'out'),
        duration: FINALE.outDuration,
        ease: FINALE.outEase
      },
      random(0, FINALE.stagger)
    )
  })

  tl.label('mid', midpoint).set(
    box,
    {
      left: full.left,
      bottom: full.bottom,
      width: full.width,
      opacity: FINALE.fullOpacity
    },
    'mid'
  )

  shardEls.forEach((el, i) => {
    const { bbox } = shards[i]
    const pose = offscreenPose(
      random,
      bbox,
      diagonal + shardRadius(bbox, full.width)
    )
    tl.add(
      el,
      {
        ...tweens(pose, 'in'),
        duration: FINALE.inDuration,
        ease: FINALE.inEase
      },
      midpoint + random(0, FINALE.stagger)
    )
  })

  return tl
}
