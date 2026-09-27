import { createTimer, utils } from 'animejs'

import { FINALE, POSE_KEYS, type Pose } from './finale'
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
  // Max |translateZ| as a share of `.box`'s perspective, which widens
  // from FINALE.perspective while orbiting to keep this.
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

const DEG = 180 / Math.PI

// The rotation by `theta` about `axis` as the CSS angles (deg) of
// `rotateX(a) rotateY(b) rotateZ(c)`, anime's fixed rotation order:
// R = Rx(a)·Ry(b)·Rz(c).
function eulerXYZ(axis: Vec, theta: number) {
  const [x, y, z] = [0, 1, 2].map((j) => {
    const unit: Vec = [0, 0, 0]
    unit[j] = 1
    return rotate(unit, axis, theta)
  })
  // Column vectors: R[i][j] = [x, y, z][j][i].
  const sinB = Math.max(-1, Math.min(1, z[0]))
  const locked = Math.abs(sinB) > 1 - 1e-9
  return {
    rotateX: locked
      ? Math.atan2(y[2], y[1]) * DEG
      : Math.atan2(-z[1], z[2]) * DEG,
    rotateY: Math.asin(sinB) * DEG,
    rotateZ: locked ? 0 : Math.atan2(-y[0], x[0]) * DEG
  }
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

  // Upper bound of a shard centre's |z| over a whole cycle, in viewBox
  // units.
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
  let poses: Pose[] = []

  // Each shard moves rigidly with its orbit: about its own centre it
  // turns by the same rotation that carries its centre round the axis.
  const pose = (): Pose[] => {
    const scale = width / VIEWBOX.width
    const phase = s / cycle
    const lift = Math.sin(Math.PI * phase) ** 2
    return bodies.map(({ centre, turns, height }, i) => {
      const theta = 2 * Math.PI * turns * phase
      const q = rotate(centre, axis, theta)
      const at = (j: number) =>
        (q[j] + height * lift * axis[j] - centre[j]) * scale
      return {
        translateX: at(0),
        translateY: at(1),
        translateZ: at(2) + i * ORBIT.layerGap,
        ...eulerXYZ(axis, theta)
      }
    })
  }

  const render = () => {
    poses = pose()
    const params: Record<
      string,
      (_: unknown, i: number) => number
    > = {}
    POSE_KEYS.forEach((key) => {
      params[key] = (_, i) => poses[i][key]
    })
    utils.set(shardEls, params)
  }

  // Wide enough that the deepest shard centre stays within zBudget.
  const perspective = (on: boolean) => {
    const reach = (zReach * width) / VIEWBOX.width
    box.style.perspective = `${
      on
        ? Math.max(FINALE.perspective, reach / ORBIT.zBudget)
        : FINALE.perspective
    }px`
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

  // Engaged: `.box[data-orbit]` (preserve-3d) and the widened
  // perspective. Stays engaged while paused.
  const engage = (on: boolean) => {
    box.toggleAttribute('data-orbit', on)
    if (on) width = box.clientWidth
    perspective(on)
  }

  const run = () => {
    engage(true)
    render()
    rampTime = 0
    lastTime = timer.currentTime
    timer.resume()
  }

  return {
    // Current per-shard transform values written by the orbit.
    get poses() {
      return poses
    },
    // From the flat logo.
    start() {
      s = 0
      run()
    },
    // From the kept orbit time, speed ramping in again.
    resume: run,
    // Holds the current pose, still engaged.
    pause() {
      timer.pause()
    },
    stop() {
      timer.pause()
      engage(false)
    },
    // Re-reads the `.box` width and rewrites the current pose.
    measure() {
      engage(true)
      render()
    },
    revert() {
      engage(false)
      timer.revert()
    }
  }
}

export type Orbit = ReturnType<typeof createOrbit>
