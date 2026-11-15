import { describe, expect, it } from 'vitest'

import { apply } from '@/lib/affine'
import type { SvgArt } from '@/lib/svgArt'

import {
  rotatedViewBox,
  wordMatrix,
  wordRotation
} from './spine'

const art = (transform: string): SvgArt => ({
  viewBox: [400, 100],
  transform,
  paths: []
})
const plain = art('matrix(1,0,0,1,0,0)')
// The svg box: band 50 wide, so 200 long.
const rect = { left: 10, top: 20, width: 50 }

const close = ([x, y]: number[], [ex, ey]: number[]) => {
  expect(x).toBeCloseTo(ex)
  expect(y).toBeCloseTo(ey)
}

describe('wordRotation', () => {
  it('turns the word to read bottom to top', () => {
    // Start of the word's baseline → bottom-left of the H×W box.
    close(apply(wordRotation(plain), [0, 100]), [100, 400])
    // End of the word's top line → top-left of the box: the
    // word's top faces left.
    close(apply(wordRotation(plain), [400, 0]), [0, 0])
  })
})

describe('rotatedViewBox', () => {
  it('swaps the viewBox sides', () => {
    expect(rotatedViewBox(plain)).toBe('0 0 100 400')
  })
})

describe('wordMatrix', () => {
  it('maps the viewBox onto the svg box rect', () => {
    const m = wordMatrix(rect, plain)
    // Word top-left → box bottom-left.
    close(apply(m, [0, 0]), [10, 220])
    // Word bottom-right → box top-right.
    close(apply(m, [400, 100]), [60, 20])
  })

  it('applies the exported transform before the rotation', () => {
    const exported = art('matrix(2,0,0,0.5,5,7)')
    const p = [3, 4] as const
    const inViewBox = [2 * 3 + 5, 0.5 * 4 + 7] as const
    close(
      apply(wordMatrix(rect, exported), p),
      apply(wordMatrix(rect, plain), inViewBox)
    )
  })
})
