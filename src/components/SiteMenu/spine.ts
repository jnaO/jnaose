import {
  type Affine,
  multiply,
  parseMatrix
} from '@/lib/affine'
import type { SvgArt } from '@/lib/svgArt'

// Turns a word's W×H viewBox (reading left → right) into the spine's
// H×W box reading bottom → top: (u, v) → (v, W − u).
export const wordRotation = ({
  viewBox: [w]
}: SvgArt): Affine => [0, -1, 1, 0, 0, w]

// The spine svg's viewBox: the word's, sides swapped.
export const rotatedViewBox = ({
  viewBox: [w, h]
}: SvgArt) => `0 0 ${h} ${w}`

// Viewport matrix for the word's paths, from the box rect of the svg
// that draws it (SiteMenu), so CSS transforms on ancestors never
// enter the maths.
export function wordMatrix(
  rect: Pick<DOMRect, 'left' | 'top' | 'width'>,
  art: SvgArt
): Affine {
  const s = rect.width / art.viewBox[1]
  return multiply(
    [s, 0, 0, s, rect.left, rect.top],
    multiply(wordRotation(art), parseMatrix(art.transform))
  )
}
