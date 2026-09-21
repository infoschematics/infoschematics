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

/**
 * Reconnect the run that reaches a port, leaving every point its author placed where they placed it.
 *
 * A route with waypoints is read back from the document as the ports it joins with that shape between them, and a
 * Producer may move either component afterwards. The port goes with its card; the waypoints do not, because they are
 * the shape someone drew. So the one run that can stop being orthogonal is the run between a port and the point
 * beside it, and that is the only run this repairs.
 *
 * An interior neighbour leans onto the axis the port leaves by — horizontal for a port on an east or west edge —
 * which keeps that run pointing the way it did and leaves the run beyond it merely longer or shorter. Where leaning
 * would break that next run, or where the neighbour is the far port and so has nothing to give, the run gains a
 * corner instead. This is the repair `moveRouteEnd` already makes while the drag is still in hand; reading the
 * document back made the same route a second time and made it without it, which is how a committed move could leave
 * behind a route no renderer would draw.
 */
export const joinedToPort = (end: 'end' | 'start', port: string, points: readonly Point[]): Point[] => {
  if (points.length < 2) return [...points]

  const at = end === 'start' ? 0 : points.length - 1
  const next = end === 'start' ? 1 : points.length - 2
  const terminal = points[at]
  const neighbour = points[next]
  if (terminal.x === neighbour.x || terminal.y === neighbour.y) return [...points]

  const horizontal = port.startsWith('E') || port.startsWith('W')
  const leaned = horizontal ? { ...neighbour, y: terminal.y } : { ...neighbour, x: terminal.x }
  const beyond = points[end === 'start' ? next + 1 : next - 1]
  const leanable = next !== 0 && next !== points.length - 1 && (leaned.x === beyond.x || leaned.y === beyond.y)

  if (leanable) return points.map((point, index) => (index === next ? leaned : { ...point }))

  const result = points.map((point) => ({ ...point }))
  const bend = horizontal ? { x: neighbour.x, y: terminal.y } : { x: terminal.x, y: neighbour.y }
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
 * off their port far enough to clear the card before anything turns.
 *
 * Where the far stub is ahead of the leaving direction, the two cleared points
 * are joined with a single corner placed on the axis the leaving run is already
 * travelling: a plain dog-leg, which is what a reader would draw first and then
 * move. Where it is behind - dragging a Card past the one it feeds puts it
 * there - that one corner sends the run straight back along the axis it has
 * just left, across the Card it came from and over its own arrowhead. So a
 * route that has to double back turns twice instead, on a lane midway between
 * the two stubs, which leaves both cards by the front and crosses neither.
 */
export const routeBetweenPorts = (from: Point, fromSide: string, to: Point, toSide: string): Point[] => {
  const out = facing(fromSide)
  const back = facing(toSide)
  const left = shifted(from, { dx: out.dx * portClearance, dy: out.dy * portClearance })
  const arrive = shifted(to, { dx: back.dx * portClearance, dy: back.dy * portClearance })
  const sideways = out.dx !== 0
  const ahead = sideways ? (arrive.x - left.x) * out.dx > 0 : (arrive.y - left.y) * out.dy > 0

  if (ahead) {
    const corner = sideways ? { x: arrive.x, y: left.y } : { x: left.x, y: arrive.y }
    return normaliseRoute([from, left, corner, arrive, to])
  }

  const lane = sideways ? (left.y + arrive.y) / 2 : (left.x + arrive.x) / 2
  const corners = sideways
    ? [
        { x: left.x, y: lane },
        { x: arrive.x, y: lane }
      ]
    : [
        { x: lane, y: left.y },
        { x: lane, y: arrive.y }
      ]

  return normaliseRoute([from, left, ...corners, arrive, to])
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

/**
 * Move the ends of one Flow with the components they are attached to.
 *
 * A route of two points is not a shape anyone drew: it is what `routeBetweenPorts` derives from the two ports, and
 * the document keeps it that way - nothing writes a derived route back. So when a port moves, the derivation is
 * made again from the moved port rather than the old run bent to reach it. `moveRouteEnd` would insert a corner
 * against the anchored far end, which leaves a run arriving sideways into a port and puts the draft somewhere the
 * committed document is not - the divergence `ROUTE-002` forbids, since both must reach the same construction.
 *
 * A route with waypoints is a shape someone drew, and only the run beside the moved port is repaired.
 *
 * Both ends are given at once because they can move together - a Flow whose two ends are on the same Card, or on
 * two Cards dragged as a group - and a derived route has to be made once from both new ports rather than twice.
 */
export const moveRouteEnds = (
  points: readonly Point[],
  ports: Readonly<{ source: string; target: string }>,
  offsets: Readonly<{ source?: Offset; target?: Offset }>
): Point[] => {
  if (!offsets.source && !offsets.target) return points.map((point) => ({ ...point }))

  if (points.length === 2) {
    const from = offsets.source ? shifted(points[0], offsets.source) : points[0]
    const to = offsets.target ? shifted(points[1], offsets.target) : points[1]
    return routeBetweenPorts(from, ports.source, to, ports.target)
  }

  let moved = points.map((point) => ({ ...point }))
  if (offsets.source) moved = moveRouteEnd(moved, 'start', offsets.source)
  if (offsets.target) moved = moveRouteEnd(moved, 'end', offsets.target)
  return moved
}
