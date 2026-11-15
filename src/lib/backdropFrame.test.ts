import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import type { BackdropFrame } from './backdropFrame'

type Store = typeof import('./backdropFrame')
let store: Store

beforeEach(async () => {
  vi.resetModules()
  store = await import('./backdropFrame')
})

const frame = (time: number): BackdropFrame => ({
  art: {} as HTMLCanvasElement,
  dots: [],
  spacing: 4,
  w: 100,
  h: 50,
  time
})

describe('backdropFrame', () => {
  it('has no frame before the first publish', () => {
    expect(store.get()).toBeNull()
  })

  it('returns the latest published frame', () => {
    store.publish(frame(1))
    const latest = frame(2)
    store.publish(latest)
    expect(store.get()).toBe(latest)
  })

  it('calls every listener with each frame', () => {
    const a = vi.fn()
    const b = vi.fn()
    store.subscribe(a)
    store.subscribe(b)
    const f = frame(3)
    store.publish(f)
    expect(a).toHaveBeenCalledWith(f)
    expect(b).toHaveBeenCalledWith(f)
  })

  it('stops calling a listener once unsubscribed', () => {
    const a = vi.fn()
    const off = store.subscribe(a)
    off()
    store.publish(frame(4))
    expect(a).not.toHaveBeenCalled()
  })
})
