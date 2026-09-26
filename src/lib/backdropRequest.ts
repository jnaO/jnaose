import { useSyncExternalStore } from 'react'

// Lets a click switch the Backdrop before the route changes. `null`
// means "follow the pathname".
let requested: boolean | null = null
const listeners = new Set<() => void>()

export function requestColour(colour: boolean | null) {
  if (requested === colour) return
  requested = colour
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const useRequestedColour = () =>
  useSyncExternalStore(
    subscribe,
    () => requested,
    () => null
  )
