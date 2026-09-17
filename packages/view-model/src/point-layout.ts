import type { Point } from './geometry.ts'
import { visualTokens } from './tokens.ts'

/**
 * Where a Point's authored label is drawn, resolved once for both renderers.
 *
 * A Point carries a required label and neither renderer drew it: the mark reached a screen reader through `<title>`
 * and reached nobody at all in a still image, so a reader of a rendering saw a deliberate terminus with nothing
 * saying what arrives there. Drawing it needs a side to draw it on, because a Point is almost always a route's
 * terminus and text laid over the route it terminates is worse than no text.
 *
 * The side is taken from the routes themselves rather than authored: a Point knows which way its Flows leave, so the
 * label goes to a side nothing leaves by. No text is measured to decide this — `ROUTE-018` keeps label geometry off
 * host font metrics, and a centred single line needs no width to place.
 */
const { pointLabelGap, pointLabelHeight, pointRadius } = visualTokens.canvas.geometry

/** The four sides a label can take, in the order preferred when more than one is free. */
export const pointLabelSides = ['below', 'above', 'right', 'left'] as const

export type PointLabelSide = (typeof pointLabelSides)[number]

export type PointLabelPlacement = Readonly<{
  /**
   * Where the text is anchored, and how.
   *
   * `y` is always the line's visual centre, so every renderer draws it on a middle dominant baseline as `ROUTE-016`
   * already requires of Card text. `x` is a centre only when the label sits above or below the mark; beside the mark
   * it is the edge the text runs away from, which is why the anchor travels with the position instead of a width
   * being estimated to convert one into the other.
   */
  anchor: 'end' | 'middle' | 'start'
  at: Point
  side: PointLabelSide
  text: string
}>

/** A Flow as this calculation needs it: which artefacts it joins, and the run of points it draws. */
export type PointLabelRoute = Readonly<{ points: readonly Point[]; source: string; target: string }>

const sideOfDeparture = (at: Point, departure: Point): PointLabelSide | undefined => {
  const dx = departure.x - at.x
  const dy = departure.y - at.y
  if (dx === 0 && dy === 0) return undefined
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left'
  return dy > 0 ? 'below' : 'above'
}

/**
 * The neighbouring route point of every Flow that starts or ends at this Point.
 *
 * A Flow's terminal point sits on the Point itself, so the point next to it is the one that says which way the route
 * leaves. A route with fewer than two points says nothing and is skipped rather than guessed at.
 */
export const pointDepartures = (id: string, routes: readonly PointLabelRoute[]): readonly Point[] => {
  const departures: Point[] = []
  for (const route of routes) {
    if (route.points.length < 2) continue
    if (route.source === id) {
      const next = route.points[1]
      if (next) departures.push(next)
    }
    if (route.target === id) {
      const previous = route.points.at(-2)
      if (previous) departures.push(previous)
    }
  }
  return departures
}

/** The first preferred side no Flow leaves by, or `below` where every side is taken. */
export const pointLabelSide = (at: Point, departures: readonly Point[]): PointLabelSide => {
  const taken = new Set(departures.map((departure) => sideOfDeparture(at, departure)))
  return pointLabelSides.find((side) => !taken.has(side)) ?? 'below'
}

/**
 * The Point's label placement, or nothing where there is no label to draw.
 *
 * The gap clears the mark's own radius, so the text never touches the circle whatever side it lands on. A blank
 * label draws nothing rather than an empty line: the field is required by the schema, and a document that leaves it
 * empty has said as much as a document that has no Point.
 */
export const resolvePointLabel = (
  point: Readonly<{ at: Point; id: string; label: string }>,
  routes: readonly PointLabelRoute[] = []
): PointLabelPlacement | undefined => {
  const text = point.label.trim()
  if (text === '') return undefined
  if (!Number.isFinite(point.at.x) || !Number.isFinite(point.at.y)) return undefined

  const side = pointLabelSide(point.at, pointDepartures(point.id, routes))
  const clearance = pointRadius + pointLabelGap
  const along = clearance + pointLabelHeight / 2

  const placed: Readonly<{ anchor: PointLabelPlacement['anchor']; at: Point }> =
    side === 'below'
      ? { anchor: 'middle', at: { x: point.at.x, y: point.at.y + along } }
      : side === 'above'
        ? { anchor: 'middle', at: { x: point.at.x, y: point.at.y - along } }
        : side === 'right'
          ? { anchor: 'start', at: { x: point.at.x + clearance, y: point.at.y } }
          : { anchor: 'end', at: { x: point.at.x - clearance, y: point.at.y } }

  return Object.freeze({ anchor: placed.anchor, at: Object.freeze(placed.at), side, text })
}
