import { describe, expect, it } from 'vitest'

import {
  needleDelays,
  RULER,
  rowDelays,
  share
} from './timing'

const counts = [1, 2, 4, 5, 12]

describe('share', () => {
  it('spreads indices over 0 → 1', () => {
    expect([0, 1, 2, 3].map((i) => share(i, 4))).toEqual([
      0,
      1 / 3,
      2 / 3,
      1
    ])
  })

  it('is 0 for a single item', () => {
    expect(share(0, 1)).toBe(0)
  })
})

describe('rowDelays', () => {
  it('extends ticks top-first', () => {
    const a = rowDelays(0, 5)
    const b = rowDelays(1, 5)
    expect(b.tickIn).toBeGreaterThan(a.tickIn)
  })

  it('grows each tick only after the ruler is uncovered at its row', () => {
    for (const count of counts) {
      for (let i = 0; i < count; i++) {
        const reached =
          ((i + 0.5) / count) * RULER.in.scaleMs
        expect(rowDelays(i, count).tickIn).toBe(
          reached + RULER.in.tickLagMs
        )
      }
    }
  })

  it('writes each label after its own tick starts', () => {
    const { tickIn, labelIn } = rowDelays(2, 5)
    expect(labelIn - tickIn).toBe(RULER.in.labelLagMs)
  })

  it('takes labels and ticks out bottom-first', () => {
    const top = rowDelays(0, 5)
    const bottom = rowDelays(4, 5)
    expect(bottom.labelOut).toBe(0)
    expect(top.labelOut).toBeGreaterThan(bottom.labelOut)
    expect(bottom.tickOut).toBe(RULER.out.tickDelayMs)
    expect(top.tickOut).toBeGreaterThan(bottom.tickOut)
  })

  it('finishes every row before the scale, for any count', () => {
    for (const count of counts) {
      for (let i = 0; i < count; i++) {
        const { labelOut, tickOut } = rowDelays(i, count)
        expect(
          labelOut + RULER.out.labelMs
        ).toBeLessThanOrEqual(RULER.outMs)
        expect(
          tickOut + RULER.out.tickMs
        ).toBeLessThanOrEqual(RULER.outMs)
      }
    }
  })
})

describe('needleDelays', () => {
  it('springs out once the current tick lands', () => {
    const { tickIn } = rowDelays(3, 5)
    expect(needleDelays(3, 5).in).toBe(
      tickIn + RULER.in.tickMs
    )
  })

  it('retracts with the current label', () => {
    expect(needleDelays(3, 5).out).toBe(
      rowDelays(3, 5).labelOut
    )
  })
})

describe('RULER.outMs', () => {
  it('is when the scale finishes sliding up', () => {
    expect(RULER.outMs).toBe(
      RULER.out.scaleDelayMs + RULER.out.scaleMs
    )
  })
})
