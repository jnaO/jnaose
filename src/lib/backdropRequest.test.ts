import { describe, expect, it } from 'vitest'

import { isColourPath, leavesPage } from './backdropRequest'

describe('isColourPath', () => {
  it('is true for /work and below', () => {
    expect(isColourPath('/work')).toBe(true)
    expect(isColourPath('/work/x')).toBe(true)
  })

  it('is false for home', () => {
    expect(isColourPath('/')).toBe(false)
  })
})

describe('leavesPage', () => {
  it('is false with no request', () => {
    expect(leavesPage(null, '/')).toBe(false)
    expect(leavesPage(null, '/work')).toBe(false)
  })

  it('is true when the request is the other page', () => {
    expect(leavesPage(true, '/')).toBe(true)
    expect(leavesPage(false, '/work')).toBe(true)
  })

  it('is false when the request is this page', () => {
    expect(leavesPage(false, '/')).toBe(false)
    expect(leavesPage(true, '/work')).toBe(false)
  })
})
