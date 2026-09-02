import type { Point } from './geometry.ts'
import { normaliseRoute } from './routing.ts'

// Editing the corners of a route, rather than where it starts and ends. Routing
// moves an endpoint and lets the run beside it absorb the change; this module
// edits the runs themselves - inserting a corner, dragging one, deleting one,
// or sliding a whole run sideways - and leans on normaliseRoute for the same
// reason routing.ts does: an edit can leave two runs pointing the same way,
// and the move rule everywhere else assumes that never happens.

/**
 * Which run a point lies on, given as the index of the run's first point, or
 * undefined where it lies on none. A route only ever runs horizontally or
 * vertically, so "lies on" means within tolerance of the run's line and
 * between its ends - not a general point-to-segment distance.
 */
export const segmentAt = (points: readonly Point[], at: Point, tolerance = 6): number | undefined => {
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]
    const end = points[index + 1]

    if (start.x === end.x) {
      if (Math.abs(at.x - start.x) > tolerance) continue
      const [min, max] = start.y <= end.y ? [start.y, end.y] : [end.y, start.y]
      if (at.y >= min - tolerance && at.y <= max + tolerance) return index
    } else if (start.y === end.y) {
      if (Math.abs(at.y - start.y) > tolerance) continue
      const [min, max] = start.x <= end.x ? [start.x, end.x] : [end.x, start.x]
      if (at.x >= min - tolerance && at.x <= max + tolerance) return index
    }
  }

  return undefined
}

/**
 * Insert a corner into whichever run it was clicked on. The point is pulled
 * onto the run's own line first - a click is never pixel-exact - so the two
 * runs either side of it start out orthogonal rather than needing a repair.
 *
 * Deliberately not finished with normaliseRoute, unlike the other three
 * operations below: a point placed anywhere along a straight run is, by
 * construction, exactly collinear with both of the run's own ends - that is
 * what "on the run" means for an orthogonal path. normaliseRoute cannot tidy
 * that up the way it can a move or a deletion; it would merge the new point
 * straight back out every time, since collinearity is precisely what it looks
 * for, which would make adding a waypoint a permanent no-op. The one case
 * worth guarding directly is a click that lands on an existing corner, so it
 * does not duplicate that point into a zero-length run.
 */
export const insertWaypoint = (points: readonly Point[], at: Point): Point[] => {
  const index = segmentAt(points, at)
  if (index === undefined) return [...points]

  const start = points[index]
  const end = points[index + 1]
  const onLine = start.x === end.x ? { x: start.x, y: at.y } : { x: at.x, y: start.y }
  const coincidesWithRunEnd =
    (onLine.x === start.x && onLine.y === start.y) || (onLine.x === end.x && onLine.y === end.y)
  if (coincidesWithRunEnd) return [...points]

  return [...points.slice(0, index + 1), onLine, ...points.slice(index + 1)]
}

/**
 * Move an interior corner. Each neighbouring run keeps pointing the way it did
 * by taking the coordinate it shares with the moved point - exactly the rule
 * moveRouteEnd applies to the run beside a dragged endpoint, applied here on
 * both sides at once, since an interior point has a neighbour on each.
 *
 * A terminal neighbour is the exception: it sits on a port and may not be
 * pulled off it. There the run gains a corner instead, leaving the port the way
 * it did before and turning once to reach the moved point - so a drag that
 * would otherwise have to be refused as a diagonal becomes a bend.
 */
export const moveWaypoint = (points: readonly Point[], index: number, to: Point): Point[] => {
  if (index <= 0 || index >= points.length - 1) return [...points]

  const moved = points[index]
  const result = points.map((point) => ({ ...point }))
  result[index] = { ...to }

  // A corner for the run before the moved point and one for the run after it,
  // each undefined where the neighbour could simply lean. Both are worked out
  // against the original points, then spliced in from the far end so the first
  // insertion cannot shift the index the second is measured by.
  const corners = ([-1, 1] as const).map((side) => {
    const at = index + side
    const neighbour = points[at]
    const vertical = neighbour.x === moved.x
    if (at !== 0 && at !== points.length - 1) {
      result[at] = vertical ? { ...neighbour, x: to.x } : { ...neighbour, y: to.y }
      return undefined
    }
    const bend = vertical ? { x: neighbour.x, y: to.y } : { x: to.x, y: neighbour.y }
    const onNeighbour = bend.x === neighbour.x && bend.y === neighbour.y
    const onMoved = bend.x === to.x && bend.y === to.y
    return onNeighbour || onMoved ? undefined : bend
  })

  if (corners[1]) result.splice(index + 1, 0, corners[1])
  if (corners[0]) result.splice(index, 0, corners[0])

  return normaliseRoute(result)
}

/**
 * Delete a corner and rejoin what is left of the route. Where the two
 * neighbours are already aligned this is a straight removal; where they are
 * not, an elbow goes in to keep the join orthogonal. The elbow carries on in
 * the direction the route was already leaving the deleted point, which is what
 * keeps this a local repair rather than a redraw.
 */
export const deleteWaypoint = (points: readonly Point[], index: number): Point[] => {
  if (index <= 0 || index >= points.length - 1) return [...points]

  const removed = points[index]
  const prev = points[index - 1]
  const next = points[index + 1]
  const rest = [...points.slice(0, index), ...points.slice(index + 1)]

  if (prev.x === next.x || prev.y === next.y) return normaliseRoute(rest)

  const leavingVertically = removed.x === next.x
  const bend = leavingVertically ? { x: prev.x, y: next.y } : { x: next.x, y: prev.y }

  return normaliseRoute([...points.slice(0, index), bend, ...points.slice(index + 1)])
}

/**
 * Drag the run between two interior points perpendicular to itself, carrying
 * both ends with it. Only the axis the run runs across changes, so the runs
 * beyond each end - which share the other axis - are left alone rather than
 * cascading, the way the runs beside a dragged endpoint have to.
 *
 * Legal only where both ends of the run are interior: a run touching either
 * terminal would have to pull a port off its card's edge, which is the one
 * thing a port may not do. Such a run is adjusted from its free end instead,
 * through the ordinary component or waypoint move.
 */
export const moveSegment = (points: readonly Point[], index: number, to: Point): Point[] => {
  if (index < 1 || index > points.length - 3) return [...points]

  const start = points[index]
  const end = points[index + 1]
  const vertical = start.x === end.x
  const horizontal = start.y === end.y
  if (!vertical && !horizontal) return [...points]

  const result = points.map((point, at) => {
    if (at !== index && at !== index + 1) return { ...point }
    return vertical ? { ...point, x: to.x } : { ...point, y: to.y }
  })

  return normaliseRoute(result)
}
