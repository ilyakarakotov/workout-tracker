/** Tiny scale/path helpers for the hand-rolled SVG charts in this feature. */

export interface Point {
  x: number
  y: number
}

/** Linear scale mapping a numeric domain onto a pixel range. */
export function scaleLinear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0
  return (v: number): number => (span === 0 ? (r0 + r1) / 2 : r0 + ((v - d0) / span) * (r1 - r0))
}

/** SVG path `d` for a polyline through `points`. */
export function linePath(points: Point[]): string {
  if (points.length === 0) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
}

/** Closed SVG path for an area fill under `points` down to `baselineY`. */
export function areaPath(points: Point[], baselineY: number): string {
  if (points.length === 0) return ''
  const first = points[0]
  const last = points[points.length - 1]
  return `${linePath(points)} L ${last.x.toFixed(2)} ${baselineY.toFixed(2)} L ${first.x.toFixed(2)} ${baselineY.toFixed(2)} Z`
}

/** `count` evenly spaced values from min to max (inclusive). */
export function ticks(min: number, max: number, count: number): number[] {
  if (count <= 1 || max <= min) return [min]
  const step = (max - min) / (count - 1)
  return Array.from({ length: count }, (_, i) => min + step * i)
}

/** Round `v` up to a "nice" chart-friendly max (1/2/5/10 × power of ten). */
export function niceMax(v: number): number {
  if (v <= 0) return 1
  const mag = 10 ** Math.floor(Math.log10(v))
  const norm = v / mag
  const n = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  return n * mag
}
