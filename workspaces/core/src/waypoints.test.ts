import { describe, expect, it } from 'vitest'
import { deleteWaypoint, insertWaypoint, moveSegment, moveWaypoint, segmentAt } from './waypoints.ts'

const orthogonal = (points: readonly { x: number; y: number }[]) =>
  points.slice(1).every((point, index) => point.x === points[index].x || point.y === points[index].y)

// A three-run route: up, across, up again - enough corners for a waypoint in
// the middle to have a distinct neighbour on each side.
const route = [
  { x: 100, y: 100 },
  { x: 100, y: 200 },
  { x: 300, y: 200 },
  { x: 300, y: 400 },
  { x: 500, y: 400 }
]

describe('finding the run under a point', () => {
  it('names the horizontal run a point sits on', () => {
    expect(segmentAt(route, { x: 200, y: 200 })).toBe(1)
  })

  it('names the vertical run a point sits on', () => {
    expect(segmentAt(route, { x: 100, y: 150 })).toBe(0)
  })

  it('tolerates a click a few units off the line', () => {
    expect(segmentAt(route, { x: 203, y: 197 })).toBe(1)
  })

  it('finds nothing far from every run', () => {
    expect(segmentAt(route, { x: 900, y: 900 })).toBeUndefined()
  })
})

describe('inserting a waypoint', () => {
  it('lands in the run it was clicked on', () => {
    const inserted = insertWaypoint(route, { x: 200, y: 203 })

    // Pulled onto the horizontal run's own line, not left where it was clicked.
    expect(inserted[2]).toEqual({ x: 200, y: 200 })
    expect(inserted).toHaveLength(route.length + 1)
  })

  it('leaves the route orthogonal either side of the new corner', () => {
    const inserted = insertWaypoint(route, { x: 100, y: 150 })

    expect(orthogonal(inserted)).toBe(true)
  })

  it('changes nothing when the point lies on no run', () => {
    expect(insertWaypoint(route, { x: 900, y: 900 })).toEqual(route)
  })

  it('does not duplicate a corner the click lands on', () => {
    expect(insertWaypoint(route, { x: 100, y: 200 })).toEqual(route)
  })
})

describe('moving a waypoint', () => {
  it('keeps both neighbouring runs orthogonal', () => {
    const moved = moveWaypoint(route, 2, { x: 350, y: 250 })

    expect(moved[2]).toEqual({ x: 350, y: 250 })
    // The run before shared a y with the old position, so the neighbour takes
    // the new y and the run stays horizontal.
    expect(moved[1]).toEqual({ x: 100, y: 250 })
    // The run after shared an x, so the neighbour takes the new x instead.
    expect(moved[3]).toEqual({ x: 350, y: 400 })
    expect(orthogonal(moved)).toBe(true)
  })

  it('leaves the far ends of the route where they were', () => {
    const moved = moveWaypoint(route, 2, { x: 350, y: 250 })

    expect(moved[0]).toEqual(route[0])
    expect(moved.at(-1)).toEqual(route.at(-1))
  })

  it('refuses to move a terminal point', () => {
    expect(moveWaypoint(route, 0, { x: 0, y: 0 })).toEqual(route)
    expect(moveWaypoint(route, route.length - 1, { x: 0, y: 0 })).toEqual(route)
  })
})

describe('deleting a waypoint', () => {
  it('never leaves a diagonal run behind', () => {
    // Only one interior corner, so removing it cannot cascade into a further
    // merge - a clean case for checking the elbow itself is orthogonal.
    const elbow = [
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 200, y: 100 }
    ]

    const deleted = deleteWaypoint(elbow, 1)

    expect(orthogonal(deleted)).toBe(true)
    expect(deleted[0]).toEqual(elbow[0])
    expect(deleted.at(-1)).toEqual(elbow.at(-1))
  })

  it('joins the neighbours directly when they already align', () => {
    const straight = [
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 0, y: 300 }
    ]

    expect(deleteWaypoint(straight, 1)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 300 }
    ])
  })

  it('refuses to delete a terminal point', () => {
    expect(deleteWaypoint(route, 0)).toEqual(route)
    expect(deleteWaypoint(route, route.length - 1)).toEqual(route)
  })
})

describe('dragging a segment', () => {
  it('moves both ends perpendicular to the run, carrying them together', () => {
    // Run 1-2 is horizontal, so a drag moves both ends in y only.
    const moved = moveSegment(route, 1, { x: 999, y: 260 })

    expect(moved[1]).toEqual({ x: 100, y: 260 })
    expect(moved[2]).toEqual({ x: 300, y: 260 })
    expect(orthogonal(moved)).toBe(true)
  })

  it('leaves the runs beyond each end alone bar their shared corner', () => {
    const moved = moveSegment(route, 1, { x: 999, y: 260 })

    expect(moved[0]).toEqual(route[0])
    expect(moved[3]).toEqual(route[3])
    expect(moved[4]).toEqual(route[4])
  })

  it('refuses a run touching the start', () => {
    expect(moveSegment(route, 0, { x: 999, y: 999 })).toEqual(route)
  })

  it('refuses a run touching the end', () => {
    expect(moveSegment(route, route.length - 2, { x: 999, y: 999 })).toEqual(route)
  })
})

describe('every operation leaves the route orthogonal', () => {
  const long = [
    { x: 0, y: 0 },
    { x: 0, y: 80 },
    { x: 160, y: 80 },
    { x: 160, y: 240 },
    { x: 420, y: 240 },
    { x: 420, y: 40 },
    { x: 600, y: 40 }
  ]

  it('across a sweep of moves, inserts, deletes and segment drags', () => {
    for (const delta of [-70, -10, 0, 10, 70]) {
      for (let index = 1; index < long.length - 1; index += 1) {
        const point = long[index]
        expect(orthogonal(moveWaypoint(long, index, { x: point.x + delta, y: point.y + delta }))).toBe(true)
      }
      for (let index = 1; index <= long.length - 3; index += 1) {
        expect(orthogonal(moveSegment(long, index, { x: 250 + delta, y: 250 + delta }))).toBe(true)
      }
    }

    for (let index = 1; index < long.length - 1; index += 1) {
      expect(orthogonal(deleteWaypoint(long, index))).toBe(true)
    }

    for (const run of [0, 2, 4]) {
      const start = long[run]
      const end = long[run + 1]
      const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
      expect(orthogonal(insertWaypoint(long, midpoint))).toBe(true)
    }
  })

  // A terminal sits on a port. Leaning it to keep a run square pulls it off the
  // card, and refusing the drag leaves the reader unable to bend a route at all
  // near its ends - so the run gains a corner instead.
  it('bends rather than drag a terminal off its port', () => {
    const route = [
      { x: 100, y: 100 },
      { x: 100, y: 300 },
      { x: 400, y: 300 }
    ]

    const moved = moveWaypoint(route, 1, { x: 250, y: 200 })

    expect(moved[0]).toEqual(route[0])
    expect(moved.at(-1)).toEqual(route.at(-1))
    expect(moved).toContainEqual({ x: 250, y: 200 })
    expect(orthogonal(moved)).toBe(true)
  })
})
