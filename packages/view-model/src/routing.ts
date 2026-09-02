import type { Offset, Point } from './geometry.ts'

// Moving what a route is anchored to. A route ends where a component's port is,
// so when the component moves the endpoint has to go with it - and the run it
// arrives on has to stay orthogonal, or the route stops being a route.

const shifted = (point: Point, delta: Offset): Point => ({ x: point.x + delta.dx, y: point.y + delta.dy })

/**
 * Move one end of a route, keeping every run orthogonal.
 *
 * The endpoint takes the whole move. Its neighbour takes only the coordinate
 * they shared, which is what keeps their run pointing the way it did - and
 * because a normalised route alternates orientation, the run beyond that
 * neighbour merely changes length. The cascade stops there.
 *
 * Where the neighbour is the far endpoint there is nothing to give, since that
 * end is anchored to its own component, so a bend is inserted between them
 * instead.
 */
export const moveRouteEnd = (points: readonly Point[], end: 'end' | 'start', delta: Offset): Point[] => {
  if (points.length === 0) return []
  if (delta.dx === 0 && delta.dy === 0) return [...points]

  const moving = end === 'start' ? 0 : points.length - 1
  const next = end === 'start' ? 1 : points.length - 2
  const result = points.map((point, index) => (index === moving ? shifted(point, delta) : { ...point }))
  if (points.length === 1) return result

  const wasVertical = points[moving].x === points[next].x
  const neighbourIsAnchored = next === 0 || next === points.length - 1

  if (!neighbourIsAnchored) {
    if (wasVertical) result[next].x = result[moving].x
    else result[next].y = result[moving].y
    return result
  }

  // Two points, both anchored: the run cannot simply lean, so it gains a corner.
  const bend = wasVertical ? { x: result[moving].x, y: result[next].y } : { x: result[next].x, y: result[moving].y }
  if (bend.x === result[moving].x && bend.y === result[moving].y) return result
  if (bend.x === result[next].x && bend.y === result[next].y) return result

  return end === 'start'
    ? [result[0], bend, ...result.slice(1)]
    : [...result.slice(0, -1), bend, result.at(-1) as Point]
}

/** How far a run leaves a port before it may turn, so it clears its card. */
const portClearance = 20

/** Which way a port's side faces, read from the letter its identifier starts with. */
const facing = (side: string): Offset =>
  side.startsWith('N')
    ? { dx: 0, dy: -1 }
    : side.startsWith('S')
      ? { dx: 0, dy: 1 }
      : side.startsWith('E')
        ? { dx: 1, dy: 0 }
        : { dx: -1, dy: 0 }

/**
 * A first route between two ports, for a line that has none yet.
 *
 * Every other route in the model was drawn by hand and is only ever adjusted;
 * a created line has to start somewhere, and the one thing it must get right is
 * leaving and arriving square to the sides it is attached to. So both ends step
 * off their port far enough to clear the card before anything turns, and the
 * two cleared points are joined with a single corner placed on the axis the
 * leaving run is already travelling. The result is a plain dog-leg, which is
 * what a reader would draw first and then move.
 */
export const routeBetweenPorts = (from: Point, fromSide: string, to: Point, toSide: string): Point[] => {
  const out = facing(fromSide)
  const back = facing(toSide)
  const left = shifted(from, { dx: out.dx * portClearance, dy: out.dy * portClearance })
  const arrive = shifted(to, { dx: back.dx * portClearance, dy: back.dy * portClearance })
  const corner = out.dx !== 0 ? { x: arrive.x, y: left.y } : { x: left.x, y: arrive.y }

  return normaliseRoute([from, left, corner, arrive, to])
}

/**
 * Merge runs that point the same way. Adding or removing a corner can leave two
 * collinear runs where there was one, and the move rule above assumes a route
 * whose runs alternate.
 */
export const normaliseRoute = (points: readonly Point[]): Point[] => {
  const kept: Point[] = []

  for (const point of points) {
    const last = kept.at(-1)
    if (last && last.x === point.x && last.y === point.y) continue

    const before = kept.at(-2)
    if (last && before) {
      const straightX = before.x === last.x && last.x === point.x
      const straightY = before.y === last.y && last.y === point.y
      if (straightX || straightY) kept.pop()
    }
    kept.push({ ...point })
  }

  return kept
}
