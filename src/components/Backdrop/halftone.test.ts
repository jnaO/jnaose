import { describe, expect, it } from 'vitest'

import {
  dotInRegion,
  LANDSCAPE,
  PORTRAIT,
  pickArt
} from './halftone'

const region = { left: 100, top: 0, right: 200, bottom: 50 }

describe('dotInRegion', () => {
  it('keeps dots inside the region', () => {
    expect(dotInRegion({ x: 150, y: 20 }, 4, region)).toBe(
      true
    )
  })

  it('keeps dots within one spacing outside it', () => {
    expect(dotInRegion({ x: 97, y: 20 }, 4, region)).toBe(
      true
    )
    expect(dotInRegion({ x: 150, y: 53 }, 4, region)).toBe(
      true
    )
  })

  it('skips dots further out on any side', () => {
    expect(dotInRegion({ x: 95, y: 20 }, 4, region)).toBe(
      false
    )
    expect(dotInRegion({ x: 205, y: 20 }, 4, region)).toBe(
      false
    )
    expect(dotInRegion({ x: 150, y: -5 }, 4, region)).toBe(
      false
    )
    expect(dotInRegion({ x: 150, y: 55 }, 4, region)).toBe(
      false
    )
  })
})

describe('pickArt', () => {
  it('uses the portrait photo only when narrower than tall', () => {
    expect(pickArt(390, 844)).toBe(PORTRAIT)
    expect(pickArt(1280, 800)).toBe(LANDSCAPE)
    expect(pickArt(500, 500)).toBe(LANDSCAPE)
  })
})
