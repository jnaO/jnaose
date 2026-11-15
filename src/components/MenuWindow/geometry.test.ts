import { describe, expect, it } from 'vitest'

import { TOTAL_MS } from '@/components/Backdrop/halftone'

import {
  colourLayer,
  coverRect,
  toSnapshot
} from './geometry'

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

describe('toSnapshot', () => {
  it('maps a viewport rect into the art snapshot', () => {
    // Snapshot 1000×500, live viewport 1000×800 (toolbar collapse).
    expect(
      toSnapshot(
        { left: 600, top: 0, right: 1000, bottom: 800 },
        1000,
        800,
        1000,
        500
      )
    ).toEqual({
      left: 600,
      top: 0,
      right: 1000,
      bottom: 500
    })
  })
})

describe('colourLayer', () => {
  it('shows the full colour photo when the page is mono', () => {
    expect(colourLayer(0)).toEqual({ kind: 'full' })
  })

  it('shows no colour when the page is in full colour', () => {
    expect(colourLayer(TOTAL_MS)).toEqual({ kind: 'none' })
  })

  it('mirrors the page time in between', () => {
    expect(colourLayer(100)).toEqual({
      kind: 'frame',
      time: TOTAL_MS - 100
    })
  })
})
