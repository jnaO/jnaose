import { createTimer, utils } from 'animejs'

import { FINALE } from './finale'
import { type Shard, VIEWBOX } from './shards'

// Tuning constants for the idle orbit once the logo is fullscreen.
// Times in ms, angles in deg.
export const ORBIT = {
  seed: 2107,
  // Angle between the orbit axis and the view axis; the axis leans
  // towards the top of the screen.
  tilt: 60,
  // One base turn.
  turn: 8000,
  // Base turns per cycle; the logo lines up flat at every cycle end.
  cycleTurns: 8,
  // Whole turns per cycle; each shard gets one, seeded.
  shardTurns: [7, 8, 9],
  // Speed eases 0 → 1 over this long whenever the orbit (re)starts.
  ramp: 4000,
  // Max float height along the axis at mid-cycle, in `.box` widths.
  float: 0.2,
  // Max |translateZ| as a share of FINALE.perspective.
  zBudget: 0.5,
  // Extra translateZ (px) per DOM index while orbiting.
  layerGap: 0.01
}

type Vec = [number, number, number]

const dot = (a: Vec, b: Vec) =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
]

// Rodrigues: `v` rotated by `theta` (rad) about the unit vector `axis`.
function rotate(v: Vec, axis: Vec, theta: number): Vec {
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  const along = dot(axis, v) * (1 - cos)
  const perp = cross(axis, v)
  return [0, 1, 2].map(
    (j) => v[j] * cos + perp[j] * sin + axis[j] * along
  ) as Vec
}

export interface OrbitPose {
  translateX: number
  translateY: number
  translateZ: number
}

interface OrbitOptions {
  box: HTMLElement
  shardEls: Element[]
  shards: Shard[]
}

// Coordinates: x right, y down, z towards the viewer, origin at the
// logo centre, in viewBox units until scaled to the `.box` width.
export function createOrbit({
  box,
  shardEls,
  shards
}: OrbitOptions) {
  const random = utils.createSeededRandom(ORBIT.seed)
  const tilt = (ORBIT.tilt * Math.PI) / 180
  const axis: Vec = [0, -Math.sin(tilt), Math.cos(tilt)]
  const cycle = ORBIT.turn * ORBIT.cycleTurns

  const bodies = shards.map(({ bbox: [x, y, w, h] }) => {
    const centre: Vec = [
      x + w / 2 - VIEWBOX.width / 2,
      y + h / 2 - VIEWBOX.height / 2,
      0
    ]
    const turns =
      ORBIT.shardTurns[
        random(0, ORBIT.shardTurns.length - 1)
      ]
    const height =
      random(-1, 1, 4) * ORBIT.float * VIEWBOX.width
    return { centre, turns, height }
  })

  // Upper bound of |z| over a whole cycle, in viewBox units.
  const zReach = Math.max(
    ...bodies.map(({ centre, height }) => {
      const hub = dot(axis, centre) * axis[2]
      return (
        Math.abs(hub) +
        Math.hypot(centre[2] - hub, cross(axis, centre)[2]) +
        Math.abs(height * axis[2])
      )
    })
  )

  let width = 0
  // Orbit time (ms), wrapped to one cycle.
  let s = 0
  let rampTime = 0
  let lastTime = 0
  let poses: OrbitPose[] = []

  const pose = (): OrbitPose[] => {
    const scale = width / VIEWBOX.width
    const zScale = Math.min(
      1,
      (ORBIT.zBudget * FINALE.perspective) / (zReach * scale)
    )
    const phase = s / cycle
    const lift = Math.sin(Math.PI * phase) ** 2
    return bodies.map(({ centre, turns, height }, i) => {
      const q = rotate(centre, axis, 2 * Math.PI * turns * phase)
      const at = (j: number) =>
        q[j] + height * lift * axis[j] - centre[j]
      return {
        translateX: at(0) * scale,
        translateY: at(1) * scale,
        translateZ: at(2) * scale * zScale + i * ORBIT.layerGap
      }
    })
  }

  const render = () => {
    poses = pose()
    utils.set(shardEls, {
      translateX: (_: unknown, i: number) => poses[i].translateX,
      translateY: (_: unknown, i: number) => poses[i].translateY,
      translateZ: (_: unknown, i: number) => poses[i].translateZ
    })
  }

  const timer = createTimer({
    autoplay: false,
    onUpdate: (self) => {
      const dt = self.currentTime - lastTime
      lastTime = self.currentTime
      rampTime += dt
      const u = Math.min(1, rampTime / ORBIT.ramp)
      s = (s + dt * u * u * (3 - 2 * u)) % cycle
      render()
    }
  })

  const setRunning = (on: boolean) => {
    box.toggleAttribute('data-orbit', on)
    if (on) {
      width = box.clientWidth
      rampTime = 0
      lastTime = timer.currentTime
      timer.resume()
    } else timer.pause()
  }

  return {
    get running() {
      return !timer.paused
    },
    // Current per-shard translate values written by the orbit.
    get poses() {
      return poses
    },
    // From the flat logo.
    start() {
      s = 0
      setRunning(true)
    },
    // From the kept orbit time.
    resume() {
      setRunning(true)
    },
    stop() {
      setRunning(false)
    },
    // Re-reads the `.box` width and rewrites the current pose.
    measure() {
      width = box.clientWidth
      render()
    },
    revert() {
      setRunning(false)
      timer.revert()
    }
  }
}

export type Orbit = ReturnType<typeof createOrbit>
