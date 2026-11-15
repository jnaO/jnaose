// The needle's triangle, pointing left at the scale, in its box's
// 0–1 coordinates.
export const NEEDLE_POINTS: readonly (readonly [
  number,
  number
])[] = [
  [0, 0.5],
  [1, 0],
  [1, 1]
]

export const needlePointsAttr = NEEDLE_POINTS.map((p) =>
  p.join(',')
).join(' ')
