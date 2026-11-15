// A 2D affine matrix as [a, b, c, d, e, f], the order of SVG's
// matrix() and canvas setTransform: x' = a·x + c·y + e,
// y' = b·x + d·y + f.
export type Affine = [
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number
]

export const IDENTITY: Affine = [1, 0, 0, 1, 0, 0]

export const apply = (
  [a, b, c, d, e, f]: Affine,
  [x, y]: readonly [number, number]
): [number, number] => [
  a * x + c * y + e,
  b * x + d * y + f
]

// m · n: applies n, then m.
export function multiply(m: Affine, n: Affine): Affine {
  const [a, b, c, d, e, f] = m
  const [A, B, C, D, E, F] = n
  return [
    a * A + c * B,
    b * A + d * B,
    a * C + c * D,
    b * C + d * D,
    a * E + c * F + e,
    b * E + d * F + f
  ]
}

// An SVG `matrix(a,b,c,d,e,f)` transform attribute.
export function parseMatrix(transform: string): Affine {
  const match = /^\s*matrix\(([^)]*)\)\s*$/.exec(transform)
  const values = match?.[1]
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number)
  if (
    !values ||
    values.length !== 6 ||
    values.some(Number.isNaN)
  )
    throw new Error(
      `Not a matrix() transform: ${transform}`
    )
  return values as Affine
}

// The matrix as an SVG transform attribute.
export const matrixAttr = (m: Affine) =>
  `matrix(${m.join(',')})`
