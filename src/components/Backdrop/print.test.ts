import { describe, expect, it } from 'vitest'

import {
  coverRect,
  hexToRgb,
  LANDSCAPE,
  LEAVE_SPEED,
  loadPress,
  lodBias,
  mirror,
  PORTRAIT,
  PRINT,
  PRINT_IN,
  pickArt,
  restScrollTop,
  revealTime,
  SETTLED_FADE,
  sceneFade,
  sceneInMs,
  scrollFade,
  TOTAL_MS
} from './print'

describe('TOTAL_MS', () => {
  it('is one sweep plus one print', () => {
    expect(TOTAL_MS).toBe(830)
  })
})

describe('mirror', () => {
  it('runs the clock from the other end', () => {
    expect(mirror(0)).toBe(TOTAL_MS)
    expect(mirror(TOTAL_MS)).toBe(0)
    expect(mirror(200)).toBe(TOTAL_MS - 200)
  })
})

describe('revealTime', () => {
  it('enters colour at one ms of clock per ms', () => {
    expect(revealTime(0, true, 100)).toBe(100)
    expect(revealTime(0, true, TOTAL_MS)).toBe(TOTAL_MS)
  })

  it('leaves colour at LEAVE_SPEED', () => {
    expect(revealTime(TOTAL_MS, false, 100)).toBeCloseTo(
      TOTAL_MS - 100 * LEAVE_SPEED
    )
    expect(
      revealTime(TOTAL_MS, false, TOTAL_MS / LEAVE_SPEED)
    ).toBe(0)
  })

  it('stops at either end', () => {
    expect(revealTime(0, true, TOTAL_MS * 2)).toBe(TOTAL_MS)
    expect(revealTime(TOTAL_MS, false, TOTAL_MS)).toBe(0)
  })

  it('turns around from where a reveal was', () => {
    expect(revealTime(300, false, 0)).toBe(300)
    expect(revealTime(300, false, 100)).toBeCloseTo(
      300 - 100 * LEAVE_SPEED
    )
    expect(revealTime(300, true, 100)).toBe(400)
  })

  it('holds before the first frame', () => {
    expect(revealTime(300, true, -5)).toBe(300)
  })
})

describe('lodBias', () => {
  it('is the tone blur at one texel per CSS px', () => {
    expect(lodBias(1)).toBe(PRINT.soft)
  })

  it('adds a mip level per doubling of texel density', () => {
    expect(lodBias(2)).toBeCloseTo(PRINT.soft + 1)
    expect(lodBias(4)).toBeCloseTo(PRINT.soft + 2)
    expect(lodBias(0.5)).toBeCloseTo(PRINT.soft - 1)
  })
})

describe('hexToRgb', () => {
  it('maps #rrggbb to 0–1 channels', () => {
    expect(hexToRgb('#ff0080')).toEqual([1, 0, 128 / 255])
    expect(hexToRgb('#efeadf')).toEqual([
      0xef / 255,
      0xea / 255,
      0xdf / 255
    ])
  })
})

describe('pickArt', () => {
  it('uses the portrait photo only when narrower than tall', () => {
    expect(pickArt(390, 844)).toBe(PORTRAIT)
    expect(pickArt(1280, 800)).toBe(LANDSCAPE)
    expect(pickArt(500, 500)).toBe(LANDSCAPE)
  })
})

describe('coverRect', () => {
  it('fills the height of a wide viewport, anchored left', () => {
    // 100×100 image, 200×100 viewport → scale 2, overflow height.
    expect(coverRect(100, 100, 200, 100)).toEqual({
      x: 0,
      y: -50,
      width: 200,
      height: 200
    })
  })

  it('fills the height of a tall viewport, cropping the right', () => {
    expect(coverRect(100, 100, 100, 300)).toEqual({
      x: 0,
      y: 0,
      width: 300,
      height: 300
    })
  })
})

describe('restScrollTop', () => {
  it('is the scrollTop where the section ends at the scroller bottom', () => {
    // Scrolled 100, section bottom 1500 in a scroller at top 0, 800 tall.
    expect(restScrollTop(100, 1500, 0, 800)).toBe(800)
    // The same section measured from scrollTop 0.
    expect(restScrollTop(0, 1600, 0, 800)).toBe(800)
  })

  it('measures from the scroller, not the viewport', () => {
    expect(restScrollTop(0, 1650, 50, 800)).toBe(800)
  })
})

describe('scrollFade', () => {
  it('is printed at the top', () => {
    expect(scrollFade(0, 1600)).toBe(0)
  })

  it('is the clean photo at and past the end', () => {
    expect(scrollFade(1600, 1600)).toBe(1)
    expect(scrollFade(5000, 1600)).toBe(1)
  })

  it('eases in and out between', () => {
    expect(scrollFade(800, 1600)).toBeCloseTo(0.5)
    expect(scrollFade(400, 1600)).toBeCloseTo(0.15625)
    expect(scrollFade(1200, 1600)).toBeCloseTo(0.84375)
  })

  it('is the clean photo when the end is at the top', () => {
    expect(scrollFade(0, 0)).toBe(1)
  })
})

describe('sceneInMs', () => {
  it('takes PRINT_IN.sceneMs from the clean photo', () => {
    expect(sceneInMs(1)).toBe(PRINT_IN.sceneMs)
  })

  it('takes a share of it from part-way', () => {
    expect(sceneInMs(0.5)).toBe(PRINT_IN.sceneMs / 2)
  })

  it('takes nothing from the print', () => {
    expect(sceneInMs(0)).toBe(0)
  })
})

describe('sceneFade', () => {
  const ms = PRINT_IN.sceneMs

  it('starts at the fade it set off from', () => {
    expect(sceneFade(1, 0, 1)).toBe(1)
  })

  it('runs the fade down to 0 over sceneInMs', () => {
    expect(sceneFade(1, ms / 4, 1)).toBeCloseTo(0.75)
    expect(sceneFade(0.5, ms / 4, 1)).toBeCloseTo(0.25)
    expect(sceneFade(1, ms, 1)).toBe(0)
  })

  it('shows the scroll fade when it is lower', () => {
    expect(sceneFade(1, ms / 4, 0.4)).toBe(0.4)
  })

  it('holds 0 while the scroll fade is still above it', () => {
    expect(sceneFade(1, ms * 3, 0.6)).toBe(0)
    expect(sceneFade(0, 0, 0.2)).toBe(0)
  })

  it('lets go once the scroll fade settles at the top', () => {
    expect(sceneFade(1, ms, 0)).toBeNull()
    expect(sceneFade(1, ms, SETTLED_FADE)).toBeNull()
    expect(sceneFade(0, 0, 0)).toBeNull()
  })

  it('holds a settled scroll fade until the run is over', () => {
    expect(sceneFade(1, ms / 2, 0)).toBe(0)
  })

  it('holds before the first frame', () => {
    expect(sceneFade(0.8, -5, 1)).toBe(0.8)
  })
})

describe('loadPress', () => {
  it('is blank paper at the first print', () => {
    expect(loadPress(0)).toBe(0)
    expect(loadPress(-5)).toBe(0)
  })

  it('prints in over PRINT_IN.loadMs', () => {
    expect(loadPress(PRINT_IN.loadMs / 2)).toBeCloseTo(0.5)
    expect(loadPress(PRINT_IN.loadMs)).toBe(1)
    expect(loadPress(PRINT_IN.loadMs * 2)).toBe(1)
  })
})
