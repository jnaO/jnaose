// One piece of exported artwork, copied verbatim from its
// src/assets/images export: the viewBox size, the export's group
// transform and every path's `d`.
export interface SvgArt {
  viewBox: readonly [width: number, height: number]
  transform: string
  paths: readonly string[]
}

// Height over width of the art's viewBox.
export const aspect = ({ viewBox: [w, h] }: SvgArt) => h / w

// The art's `viewBox` attribute.
export const viewBoxOf = ({ viewBox: [w, h] }: SvgArt) =>
  `0 0 ${w} ${h}`
