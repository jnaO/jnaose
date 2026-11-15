interface Span {
  top: number
  bottom: number
}

// Index of the item whose rect covers more than half of the scroller
// view, or null when none does.
export function currentIndex(
  view: Span & { height: number },
  rects: (Span | undefined)[]
) {
  const index = rects.findIndex((rect) => {
    if (!rect) return false
    const visible =
      Math.min(rect.bottom, view.bottom) -
      Math.max(rect.top, view.top)
    return visible > view.height / 2
  })
  return index === -1 ? null : index
}

// Fractional index of the scroll position: i when item i's bottom
// meets the view's bottom (its snap rest), blended between neighbours
// while scrolling; clamped to the first and last item. Null when no
// item is measured.
export function scrollPosition(
  viewBottom: number,
  bottoms: (number | undefined)[]
) {
  const known = bottoms
    .map((bottom, i) => ({ bottom, i }))
    .filter(
      (item): item is { bottom: number; i: number } =>
        item.bottom !== undefined
    )
  if (known.length === 0) return null
  const first = known[0]
  if (first.bottom >= viewBottom) return first.i
  for (let k = 1; k < known.length; k++) {
    const a = known[k - 1]
    const b = known[k]
    if (b.bottom >= viewBottom) {
      const t =
        (viewBottom - a.bottom) / (b.bottom - a.bottom)
      return a.i + t * (b.i - a.i)
    }
  }
  return known[known.length - 1].i
}

// The scroller's first screen of content, as a rect in the view's
// coordinates: it fills the view at scrollTop 0.
export function firstScreen(
  view: Span,
  scrollTop: number
): Span {
  return {
    top: view.top - scrollTop,
    bottom: view.bottom - scrollTop
  }
}
