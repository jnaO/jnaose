import { createTimeline, utils } from 'animejs'

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
  // Leave: shards fly from the orbit to the in-phase off-screen pose,
  // for inDuration, before the out phase plays back.
  leaveEase: 'in(4)',
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
  // Fullscreen logo width as a fraction of the gutter-inset contain fit.
  fullScale: 0.75,
  // Per-shard opacity once re-formed fullscreen.
  fullOpacity: 0.5,
  // --ui-opacity 1 → 0 and --finale-blur 0 → 1 run from `mid` for
  // inDuration.
  uiEase: 'linear'
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

// A shard's transform values; rotations in deg, translations in px.
export type Pose = ReturnType<typeof offscreenPose>
export const POSE_KEYS: (keyof Pose)[] = [
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
// the stage minus the resting gutter, scaled by FINALE.fullScale,
// centred.
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
  const width =
    FINALE.fullScale *
    Math.min(
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

// `tl`: paused timeline, rest logo → shards off-screen → fullscreen
// logo. Must be built with `.box` at its resting CSS placement.
export function createFinale({
  stage,
  box,
  shardEls,
  shards,
  onSettle
}: FinaleOptions) {
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
      '--shard-opacity': FINALE.fullOpacity
    },
    'mid'
  )

  tl.add(
    document.documentElement,
    {
      '--ui-opacity': [1, 0],
      '--finale-blur': [0, 1],
      duration: FINALE.inDuration,
      ease: FINALE.uiEase
    },
    'mid'
  )

  const inPoses = shardEls.map((el, i) => {
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
    return pose
  })

  // Paused timeline: shards from the `from` poses to their in-phase
  // off-screen pose, <html>'s variables back to rest. Starts from the
  // end of `tl`. `onComplete` fires at both ends.
  const leave = (
    from: Pose[],
    onComplete: (reversed: boolean) => void
  ) => {
    const flight: Record<
      string,
      (_: unknown, i: number) => [number, number]
    > = {}
    POSE_KEYS.forEach((key) => {
      flight[key] = (_, i) => [
        from[i][key],
        inPoses[i][key]
      ]
    })
    return createTimeline({
      autoplay: false,
      defaults: {
        composition: 'none',
        duration: FINALE.inDuration
      },
      onComplete: (self) => onComplete(self.reversed)
    })
      .add(
        shardEls,
        { ...flight, ease: FINALE.leaveEase },
        0
      )
      .add(
        document.documentElement,
        {
          '--ui-opacity': [0, 1],
          '--finale-blur': [1, 0],
          ease: FINALE.uiEase
        },
        0
      )
  }

  return {
    tl,
    leave,
    // Plays the out phase back to rest from `mid`, where every shard
    // is off-screen and <html>'s variables are at rest.
    reverseFromMid: () => tl.seek(midpoint).reverse()
  }
}

export type Finale = ReturnType<typeof createFinale>
