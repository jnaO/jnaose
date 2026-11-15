import { describe, expect, it } from 'vitest'

import { aspect, type SvgArt, viewBoxOf } from './svgArt'

const art: SvgArt = {
  viewBox: [400, 100],
  transform: 'matrix(1,0,0,1,0,0)',
  paths: ['M0,0L1,1Z']
}

describe('aspect', () => {
  it('is height over width of the viewBox', () => {
    expect(aspect(art)).toBe(0.25)
  })
})

describe('viewBoxOf', () => {
  it('spans the art from the origin', () => {
    expect(viewBoxOf(art)).toBe('0 0 400 100')
  })
})
