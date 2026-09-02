import { type Box, type Point, pointAlongRoute, routeLength } from './geometry.ts'

// Placing labels on a diagram. Obstacles arrive as boxes rather than being read
// from a model, which is what keeps this reusable: a label does not need to know
// that the thing it is avoiding is a component card.

export type LabelBox = { height: number; width: number }

export type PlacementRoute = {
  /** Identity the caller gets its position back under. */
  id: string
  /** Identity a hand-placed position is keyed by. */
  key: string
  d: string
  /** Share of the route's length, where the label has been placed by hand. */
  along?: number
}

export type PlacementRequest = {
  routes: readonly PlacementRoute[]
  obstacles: readonly Box[]
  /**
   * Where along a route to try, as a fraction of its length, in order. A label
   * lives on its line, so an unplaced one slides along it looking for room
   * rather than stepping sideways off it.
   */
  candidates: readonly number[]
  label: LabelBox
  /** Slack added around an obstacle before a label counts as touching it. */
  obstaclePadding?: number
  /** Positions that override an authored one, as an in-progress drag does. */
  drafts?: ReadonlyMap<string, number>
}

// Placement runs over the whole set rather than one route at a time, because a
// label that clears every obstacle can still land exactly on another label. It
// follows the order it is given, so the result is stable.
export const placeLabels = ({
  routes,
  obstacles,
  candidates,
  label,
  obstaclePadding = 6,
  drafts
}: PlacementRequest): Map<string, Point> => {
  const placed: Point[] = []
  const positions = new Map<string, Point>()
  const halfWidth = label.width / 2
  const halfHeight = label.height / 2

  const clearOfObstacles = ({ x, y }: Point) =>
    !obstacles.some(
      (box) =>
        x + halfWidth > box.x - obstaclePadding &&
        x - halfWidth < box.x + box.width + obstaclePadding &&
        y + halfHeight > box.y - obstaclePadding &&
        y - halfHeight < box.y + box.height + obstaclePadding
    )

  const clearOfLabels = ({ x, y }: Point) =>
    !placed.some((other) => Math.abs(other.x - x) < label.width && Math.abs(other.y - y) < label.height)

  const claim = (route: PlacementRoute, spot: Point) => {
    placed.push(spot)
    positions.set(route.id, spot)
  }

  // Hand-placed labels are honoured first and claim their space, so automatic
  // placement routes around them rather than the other way about.
  for (const route of routes) {
    const along = drafts?.get(route.key) ?? route.along
    if (along !== undefined) claim(route, pointAlongRoute(route.d, along * routeLength(route.d)))
  }

  for (const route of routes) {
    if (positions.has(route.id)) continue
    const length = routeLength(route.d)
    const spot =
      candidates
        .map((fraction) => pointAlongRoute(route.d, length * fraction))
        .find((candidate) => clearOfObstacles(candidate) && clearOfLabels(candidate)) ??
      pointAlongRoute(route.d, length / 2)
    claim(route, spot)
  }

  return positions
}

/**
 * An obstacle a floating panel has to work around, and how much it matters.
 *
 * Weight is what lets one set of obstacles be preferred over another without
 * ranking them in two passes. A card covered is a card the reader cannot see;
 * a line crossed is still legible under a panel edge. Scoring by area alone
 * almost says this - a card is far larger than a segment - but a long line and
 * a small card come out too close, so the caller states which it would rather
 * cover.
 */
export type Obstacle = Box & { weight?: number }

export type SpotRequest = {
  /** Where to try, as fractions of the view, in order of preference. */
  candidates: readonly Point[]
  obstacles: readonly Obstacle[]
  label: LabelBox
  /** The region the fractions are of, and the region the panel must stay in. */
  view: Box
}

const overlapArea = (left: Box, right: Box) => {
  const width = Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x)
  const height = Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y)
  return width > 0 && height > 0 ? width * height : 0
}

/**
 * Where to put a floating panel so it covers as little as possible of what it
 * is describing.
 *
 * The first candidate clear of everything wins, so the preferred position is
 * kept whenever it is free and the panel does not wander between scenes that
 * both have room in the middle. Where nothing is clear - which is the normal
 * case once a Scene has lit most of the canvas - the least-obstructed candidate
 * wins rather than the first, because falling back to a fixed position puts the
 * panel over the diagram precisely when the diagram is busiest.
 *
 * A candidate is clamped into the view before it is scored, so a position near
 * an edge is judged where it would actually be drawn rather than where it was
 * asked for.
 */
export const chooseSpot = ({ candidates, obstacles, label, view }: SpotRequest): Point => {
  const halfWidth = label.width / 2
  const halfHeight = label.height / 2

  const at = (candidate: Point) => {
    const x = Math.min(Math.max(view.x + view.width * candidate.x, view.x + halfWidth), view.x + view.width - halfWidth)
    const y = Math.min(
      Math.max(view.y + view.height * candidate.y, view.y + halfHeight),
      view.y + view.height - halfHeight
    )
    return {
      at: { x: (x - view.x) / view.width, y: (y - view.y) / view.height },
      box: { height: label.height, width: label.width, x: x - halfWidth, y: y - halfHeight }
    }
  }

  let best: { at: Point; cost: number } | undefined
  for (const candidate of candidates) {
    const placed = at(candidate)
    let cost = 0
    for (const obstacle of obstacles) cost += overlapArea(placed.box, obstacle) * (obstacle.weight ?? 1)
    if (cost === 0) return placed.at
    if (!best || cost < best.cost) best = { at: placed.at, cost }
  }
  return best?.at ?? at(candidates[0]).at
}
