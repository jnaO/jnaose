import { describe, expect, it } from 'vitest'

import {
  type Affine,
  apply,
  matrixAttr,
  multiply,
  parseMatrix
} from './affine'

const translate: Affine = [1, 0, 0, 1, 10, 20]
const scale: Affine = [2, 0, 0, 3, 0, 0]

describe('apply', () => {
  it('maps a point through a matrix', () => {
    expect(apply([1, 2, 3, 4, 5, 6], [1, 1])).toEqual([
      9, 12
    ])
  })
})

describe('multiply', () => {
  it('applies the right matrix first', () => {
    // translate · scale: scale, then translate.
    expect(
      apply(multiply(translate, scale), [1, 1])
    ).toEqual([12, 23])
    // scale · translate: translate, then scale.
    expect(
      apply(multiply(scale, translate), [1, 1])
    ).toEqual([22, 63])
  })
})

describe('parseMatrix', () => {
  it('reads an exported matrix() transform', () => {
    expect(
      parseMatrix(
        'matrix(0.895219,0,0,1,-456.628,-114.745)'
      )
    ).toEqual([0.895219, 0, 0, 1, -456.628, -114.745])
  })

  it('accepts space separators', () => {
    expect(parseMatrix('matrix(1 0 0 1 2 3)')).toEqual([
      1, 0, 0, 1, 2, 3
    ])
  })

  it('rejects anything else', () => {
    expect(() => parseMatrix('translate(1,2)')).toThrow()
  })
})

describe('matrixAttr', () => {
  it('round-trips through parseMatrix', () => {
    const m: Affine = [0, -1, 1, 0, 0, 722]
    expect(parseMatrix(matrixAttr(m))).toEqual(m)
  })
})
