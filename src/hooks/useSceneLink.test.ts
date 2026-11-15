import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { RULER } from '@/components/Ruler/timing'
import { requestColour } from '@/lib/backdropRequest'

import { startScene } from './useSceneLink'

vi.mock('next/navigation', () => ({}))

// A scroller stand-in: records listeners, scrollTo is a no-op.
function scroller(scrollTop: number) {
  const listeners: Record<string, () => void> = {}
  return {
    scrollTop,
    addEventListener: (type: string, fn: () => void) => {
      listeners[type] = fn
    },
    scrollTo: vi.fn(),
    end: () => listeners.scrollend?.()
  }
}

let main: ReturnType<typeof scroller> | null

beforeEach(() => {
  vi.useFakeTimers()
  main = null
  vi.stubGlobal('window', globalThis)
  vi.stubGlobal('document', {
    getElementById: () => main
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  requestColour(null)
})

describe('startScene', () => {
  it('holds the swap for the ruler OUT when already at the top', () => {
    main = scroller(0)
    const swap = vi.fn()
    startScene('/work', swap)
    vi.advanceTimersByTime(RULER.outMs - 1)
    expect(swap).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(swap).toHaveBeenCalledTimes(1)
  })

  it('holds the swap for the ruler OUT without a scroller', () => {
    const swap = vi.fn()
    startScene('/', swap)
    vi.advanceTimersByTime(RULER.outMs - 1)
    expect(swap).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(swap).toHaveBeenCalledTimes(1)
  })

  it('waits for the scroll when it ends after the OUT', () => {
    main = scroller(500)
    const swap = vi.fn()
    startScene('/work', swap)
    expect(main.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth'
    })
    vi.advanceTimersByTime(RULER.outMs + 10)
    expect(swap).not.toHaveBeenCalled()
    main.end()
    expect(swap).toHaveBeenCalledTimes(1)
  })

  it('waits for the OUT when the scroll ends first', () => {
    main = scroller(500)
    const swap = vi.fn()
    startScene('/work', swap)
    main.end()
    expect(swap).not.toHaveBeenCalled()
    vi.advanceTimersByTime(RULER.outMs)
    expect(swap).toHaveBeenCalledTimes(1)
  })

  it('swaps once, when the scroll fallback fires before scrollend', () => {
    main = scroller(500)
    const swap = vi.fn()
    startScene('/work', swap)
    vi.advanceTimersByTime(5000)
    main.end()
    expect(swap).toHaveBeenCalledTimes(1)
  })
})
