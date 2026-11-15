import { usePathname } from 'next/navigation'
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

// Pages whose Backdrop shows the colour photo.
export const isColourPath = (pathname: string) =>
  pathname.startsWith('/work')

// The scene's colour as the Backdrop shows it: a click's request
// leads, the pathname follows once the route lands.
export function useSceneColour() {
  const pathname = usePathname()
  const requested = useRequestedColour()
  return requested ?? isColourPath(pathname)
}

// True while a request takes the scene away from `pathname`'s page.
export const leavesPage = (
  requested: boolean | null,
  pathname: string
) =>
  requested !== null && requested !== isColourPath(pathname)
