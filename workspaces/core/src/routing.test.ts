import { describe, expect, it } from 'vitest'
import { projectOntoRoute } from './geometry.ts'
import { moveRouteEnd, normaliseRoute } from './routing.ts'
import { moveWaypoint } from './waypoints.ts'

const orthogonal = (points: readonly { x: number; y: number }[]) =>
  points.slice(1).every((point, index) => point.x === points[index].x || point.y === points[index].y)

// A route arriving vertically, turning, and running away horizontally.
const elbow = [
  { x: 100, y: 100 },
  { x: 100, y: 200 },
  { x: 300, y: 200 }
]

describe('moving a route end', () => {
  it('carries the endpoint the whole way', () => {
    const moved = moveRouteEnd(elbow, 'start', { dx: 20, dy: -10 })

    expect(moved[0]).toEqual({ x: 120, y: 90 })
  })

  // The neighbour takes only what keeps their run pointing the way it did, so
  // the corner stays square rather than the run leaning.
  it('gives the neighbour only the coordinate they shared', () => {
    const moved = moveRouteEnd(elbow, 'start', { dx: 20, dy: -10 })

    expect(moved[1]).toEqual({ x: 120, y: 200 })
    expect(orthogonal(moved)).toBe(true)
  })

  it('leaves the far end where it was', () => {
    const moved = moveRouteEnd(elbow, 'start', { dx: 20, dy: -10 })

    expect(moved.at(-1)).toEqual({ x: 300, y: 200 })
  })

  // Moving along the run only lengthens it, so nothing else need change.
  it('changes nothing but the endpoint when the move runs with the first leg', () => {
    const moved = moveRouteEnd(elbow, 'start', { dx: 0, dy: 40 })

    expect(moved).toEqual([{ x: 100, y: 140 }, elbow[1], elbow[2]])
  })

  it('moves the other end by the same rule', () => {
    const moved = moveRouteEnd(elbow, 'end', { dx: 15, dy: 25 })

    expect(moved.at(-1)).toEqual({ x: 315, y: 225 })
    expect(moved[1]).toEqual({ x: 100, y: 225 })
    expect(orthogonal(moved)).toBe(true)
  })

  // Both ends of a straight run are anchored to their own components, so there
  // is no neighbour to give: the run gains a corner instead.
  it('bends a straight run rather than leaning it', () => {
    const straight = [
      { x: 100, y: 100 },
      { x: 100, y: 300 }
    ]
    const moved = moveRouteEnd(straight, 'start', { dx: 40, dy: 0 })

    expect(moved).toHaveLength(3)
    expect(moved[0]).toEqual({ x: 140, y: 100 })
    expect(moved.at(-1)).toEqual({ x: 100, y: 300 })
    expect(orthogonal(moved)).toBe(true)
  })

  it('does not bend a straight run moved along its own axis', () => {
    const straight = [
      { x: 100, y: 100 },
      { x: 100, y: 300 }
    ]

    expect(moveRouteEnd(straight, 'start', { dx: 0, dy: 30 })).toHaveLength(2)
  })

  it('returns the route untouched when nothing moves', () => {
    expect(moveRouteEnd(elbow, 'start', { dx: 0, dy: 0 })).toEqual(elbow)
  })

  it('keeps every run orthogonal whichever way an end is dragged', () => {
    for (const dx of [-40, -10, 0, 10, 40]) {
      for (const dy of [-40, -10, 0, 10, 40]) {
        expect(orthogonal(moveRouteEnd(elbow, 'start', { dx, dy })), `${dx},${dy}`).toBe(true)
        expect(orthogonal(moveRouteEnd(elbow, 'end', { dx, dy })), `${dx},${dy}`).toBe(true)
      }
    }
  })
})

describe('normalising a route', () => {
  it('merges runs that point the same way', () => {
    const collinear = [
      { x: 0, y: 0 },
      { x: 0, y: 50 },
      { x: 0, y: 100 }
    ]

    expect(normaliseRoute(collinear)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 100 }
    ])
  })

  it('drops a point that repeats the one before it', () => {
    const repeated = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 40, y: 0 }
    ]

    expect(normaliseRoute(repeated)).toHaveLength(2)
  })

  it('leaves a route whose runs already alternate', () => {
    expect(normaliseRoute(elbow)).toEqual(elbow)
  })
})

// A label belongs to its line, so a drop is pulled onto it rather than left
// beside it - and which run it lands on decides which way it may still travel.
describe('projecting onto a route', () => {
  const elbowPath = 'M100 100 V200 H300'

  it('pulls a point beside a vertical run onto it', () => {
    const { at, vertical } = projectOntoRoute(elbowPath, { x: 140, y: 150 })

    expect(at).toEqual({ x: 100, y: 150 })
    expect(vertical).toBe(true)
  })

  it('pulls a point beside a horizontal run onto it', () => {
    const { at, vertical } = projectOntoRoute(elbowPath, { x: 220, y: 260 })

    expect(at).toEqual({ x: 220, y: 200 })
    expect(vertical).toBe(false)
  })

  it('never lands beyond the run it belongs to', () => {
    expect(projectOntoRoute(elbowPath, { x: 900, y: 200 }).at).toEqual({ x: 300, y: 200 })
    expect(projectOntoRoute(elbowPath, { x: 100, y: -400 }).at).toEqual({ x: 100, y: 100 })
  })

  it('takes the nearer run where two are in reach', () => {
    expect(projectOntoRoute(elbowPath, { x: 104, y: 260 }).vertical).toBe(false)
    expect(projectOntoRoute(elbowPath, { x: 160, y: 104 }).vertical).toBe(true)
  })
})

// Re-attaching an end used to square the run beside the new port and leave the
// one past it diagonal. Every end of every flow, against every port.
describe('re-attaching never leaves a diagonal', () => {
  const orthogonal = (points: readonly { x: number; y: number }[]) =>
    points.slice(1).every((point, index) => point.x === points[index].x || point.y === points[index].y)

  const elbow = [
    { x: 100, y: 100 },
    { x: 100, y: 200 },
    { x: 300, y: 200 },
    { x: 300, y: 400 }
  ]

  it('keeps every run square when the next point is realigned', () => {
    for (const y of [80, 120, 160, 240]) {
      const moved = moveRouteEnd(elbow, 'start', { dx: 40, dy: y - 100 })
      const next = moveWaypoint(moved, 1, { x: moved[1].x, y: moved[0].y })
      expect(orthogonal(next), `y ${y}`).toBe(true)
    }
  })
})
