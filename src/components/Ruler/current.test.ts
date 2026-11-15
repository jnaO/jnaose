import { describe, expect, it } from 'vitest'

import {
  currentIndex,
  firstScreen,
  scrollPosition
} from './current'

const view = { top: 0, bottom: 100, height: 100 }
const rect = (top: number, height = 100) => ({
  top,
  bottom: top + height
})

describe('currentIndex', () => {
  it('is the item covering more than half the scroller', () => {
    expect(
      currentIndex(view, [rect(-60), rect(40), rect(140)])
    ).toBe(1)
  })

  it('is none when no item covers more than half', () => {
    expect(
      currentIndex(view, [rect(-50), rect(50)])
    ).toBeNull()
  })

  it('is none above the first item', () => {
    expect(
      currentIndex(view, [rect(80), rect(180)])
    ).toBeNull()
  })

  it('skips missing items', () => {
    expect(currentIndex(view, [undefined, rect(0)])).toBe(1)
  })

  it('counts only the visible part of a tall item', () => {
    expect(currentIndex(view, [rect(-500, 540)])).toBeNull()
    expect(currentIndex(view, [rect(-500, 560)])).toBe(0)
  })
})

describe('scrollPosition', () => {
  it('is the index of the item resting at the view bottom', () => {
    expect(scrollPosition(100, [100, 200, 300])).toBe(0)
    expect(scrollPosition(100, [0, 100, 200])).toBe(1)
  })

  it('blends between neighbours while scrolling', () => {
    expect(scrollPosition(100, [25, 125, 225])).toBe(0.75)
  })

  it('clamps above the first and below the last item', () => {
    expect(scrollPosition(100, [400, 500])).toBe(0)
    expect(scrollPosition(100, [-200, -100])).toBe(1)
  })

  it('skips missing items and is null when none is measured', () => {
    expect(scrollPosition(100, [50, undefined, 150])).toBe(
      1
    )
    expect(scrollPosition(100, [undefined])).toBeNull()
  })
})

describe('firstScreen', () => {
  it('fills the view at the top and scrolls with the content', () => {
    expect(firstScreen(view, 0)).toEqual(rect(0))
    expect(firstScreen(view, 30)).toEqual(rect(-30))
  })
})
