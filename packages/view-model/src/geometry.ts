import type { Box, Point } from '@infoschematics/domain-model/geometry'

export type { Box, Point } from '@infoschematics/domain-model/geometry'

// Geometry for orthogonal diagrams. Nothing here knows what the diagram is of:
// a route is a run of absolute horizontal and vertical commands, and a box is a
// box. This is the layer a second diagram would reuse unchanged.

export type Offset = { dx: number; dy: number }

export const routePoints = (d: string): Point[] => {
  const tokens = d.match(/[MHV]|-?\d+(?:\.\d+)?/g)
  if (tokens?.[0] !== 'M') throw new Error(`Routes must use absolute orthogonal commands: ${d}`)

  let x = Number(tokens[1])
  let y = Number(tokens[2])
  const points = [{ x, y }]

  for (let index = 3; index < tokens.length; index += 2) {
    const command = tokens[index]
    const value = Number(tokens[index + 1])
    if (command === 'H') x = value
    else if (command === 'V') y = value
    else throw new Error(`Unsupported route command in ${d}`)
    points.push({ x, y })
  }

  return points
}

/**
 * The inverse of `routePoints`: a run of points back into absolute orthogonal
 * commands. Consecutive points must share an axis, since a diagonal is not
 * expressible — and a point identical to the one before it emits nothing, so a
 * round trip through `routePoints` is stable.
 */
export const routePath = (points: readonly Point[]): string => {
  if (points.length === 0) throw new Error('A route needs at least one point')
  const [first, ...rest] = points
  let { x, y } = first
  let d = `M${x} ${y}`

  for (const point of rest) {
    if (point.x !== x && point.y !== y) {
      throw new Error(`A route may not run diagonally: ${x},${y} to ${point.x},${point.y}`)
    }
    if (point.x !== x) d += ` H${point.x}`
    else if (point.y !== y) d += ` V${point.y}`
    x = point.x
    y = point.y
  }

  return d
}

export const routeEndpoints = (d: string): { end: Point; start: Point } => {
  const points = routePoints(d)
  return { end: points.at(-1) ?? points[0], start: points[0] }
}

/** How far it is from one end of a route to the other, along the route. */
export const routeLength = (d: string): number => {
  const points = routePoints(d)
  return points.slice(1).reduce((total, point, index) => total + distance(points[index], point), 0)
}

const distance = (from: Point, to: Point) => Math.hypot(to.x - from.x, to.y - from.y)

/**
 * Where a given distance along a route falls. A label belongs to its line, so
 * this is what it is placed by: one number that means the same thing however the
 * route is later redrawn, rather than an offset from a midpoint that moves.
 */
export const pointAlongRoute = (d: string, along: number): Point => {
  const points = routePoints(d)
  const total = routeLength(d)
  let travelled = Math.min(Math.max(along, 0), total)

  for (const [index, from] of points.slice(0, -1).entries()) {
    const to = points[index + 1]
    const run = distance(from, to)
    if (travelled <= run || run === 0) {
      const ratio = run === 0 ? 0 : travelled / run
      return { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio }
    }
    travelled -= run
  }

  return points.at(-1) ?? points[0]
}

/** The inverse: how far along the route the nearest point to this one lies. */
export const alongRoute = (d: string, point: Point): number => {
  const points = routePoints(d)
  let travelled = 0
  let best = { along: 0, distance: Number.POSITIVE_INFINITY }

  for (const [index, from] of points.slice(0, -1).entries()) {
    const to = points[index + 1]
    const run = distance(from, to)
    const vertical = from.x === to.x
    const at = vertical
      ? { x: from.x, y: Math.min(Math.max(point.y, Math.min(from.y, to.y)), Math.max(from.y, to.y)) }
      : { x: Math.min(Math.max(point.x, Math.min(from.x, to.x)), Math.max(from.x, to.x)), y: from.y }
    const away = distance(at, point)
    if (away < best.distance) best = { along: travelled + distance(from, at), distance: away }
    travelled += run
  }

  return Math.round(best.along)
}

/**
 * The nearest point on a route to a given one, and the run it landed on. A
 * label belongs to its line, so a drop is pulled onto the line rather than left
 * beside it - and which run it lands on decides which way it may still slide.
 */
export const projectOntoRoute = (d: string, point: Point): { at: Point; vertical: boolean } => {
  const points = routePoints(d)
  let best = { at: points[0], distance: Number.POSITIVE_INFINITY, vertical: false }

  for (const [index, from] of points.slice(0, -1).entries()) {
    const to = points[index + 1]
    const vertical = from.x === to.x
    const at = vertical
      ? { x: from.x, y: Math.min(Math.max(point.y, Math.min(from.y, to.y)), Math.max(from.y, to.y)) }
      : { x: Math.min(Math.max(point.x, Math.min(from.x, to.x)), Math.max(from.x, to.x)), y: from.y }
    const distance = Math.hypot(at.x - point.x, at.y - point.y)
    if (distance < best.distance) best = { at, distance, vertical }
  }

  return { at: best.at, vertical: best.vertical }
}

/**
 * A closed outline through a run of corners, every one rounded by the same
 * radius. Turning either way is handled, so a shape can fold back into itself -
 * which is what lets one thing be drawn clasping another rather than sitting
 * behind it - and the curvature stays the same all the way round whichever way
 * the corner turns.
 *
 * Axis-aligned like everything else here: each run is trimmed by the radius at
 * both ends and the gap bridged by an arc.
 */
export const roundedOutline = (corners: readonly Point[], radius: number): string => {
  if (corners.length < 3) throw new Error('An outline needs at least three corners')

  const towards = (from: Point, to: Point) => {
    const run = Math.hypot(to.x - from.x, to.y - from.y)
    const reach = Math.min(radius, run / 2)
    return { x: from.x + ((to.x - from.x) / run) * reach, y: from.y + ((to.y - from.y) / run) * reach }
  }

  const segments: string[] = []
  for (const [index, corner] of corners.entries()) {
    const before = corners[(index - 1 + corners.length) % corners.length]
    const after = corners[(index + 1) % corners.length]
    const entry = towards(corner, before)
    const exit = towards(corner, after)
    // Which way the corner turns decides the sweep, so a notch curves into the
    // shape where an outer corner curves away from it.
    const cross = (corner.x - before.x) * (after.y - corner.y) - (corner.y - before.y) * (after.x - corner.x)
    segments.push(
      `${index === 0 ? 'M' : 'L'}${entry.x} ${entry.y}`,
      `A${radius} ${radius} 0 0 ${cross > 0 ? 1 : 0} ${exit.x} ${exit.y}`
    )
  }

  return `${segments.join(' ')} Z`
}
