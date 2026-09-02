import type { Box, Point } from './geometry.ts'

// Alignment guides come from what is already on the stage rather than from a
// fixed grid, because a diagram's own edges and centres are what a viewer reads
// alignment against. Nothing here knows what the boxes are.

export type Axis = 'x' | 'y'

export type Guide = {
  axis: Axis
  at: number
  /** What the guide came from, so the editor can say why it snapped. */
  from: 'centre' | 'edge' | 'handle'
}

export const snapThreshold = 6

const push = (guides: Guide[], axis: Axis, at: number, from: Guide['from']) => {
  if (!guides.some((guide) => guide.axis === axis && guide.at === at)) guides.push({ at, axis, from })
}

/** Edges and centres of every box, plus the position of every other handle. */
export const guidesFrom = (boxes: readonly Box[], handles: readonly Point[]): readonly Guide[] => {
  const guides: Guide[] = []

  for (const box of boxes) {
    push(guides, 'x', box.x, 'edge')
    push(guides, 'x', box.x + box.width, 'edge')
    push(guides, 'x', box.x + box.width / 2, 'centre')
    push(guides, 'y', box.y, 'edge')
    push(guides, 'y', box.y + box.height, 'edge')
    push(guides, 'y', box.y + box.height / 2, 'centre')
  }

  for (const handle of handles) {
    push(guides, 'x', handle.x, 'handle')
    push(guides, 'y', handle.y, 'handle')
  }

  return guides
}

export type Snap = { guides: readonly Guide[]; point: Point }

/**
 * Pull a point onto the nearest guide within the threshold, per axis. Both axes
 * snap independently, so a drag can align horizontally without being dragged
 * vertically to do it.
 */
export const snapToGuides = (point: Point, guides: readonly Guide[], threshold = snapThreshold): Snap => {
  const nearest = (axis: Axis, value: number) =>
    guides
      .filter((guide) => guide.axis === axis && Math.abs(guide.at - value) <= threshold)
      .sort((left, right) => Math.abs(left.at - value) - Math.abs(right.at - value))
      .at(0)

  const x = nearest('x', point.x)
  const y = nearest('y', point.y)

  return {
    guides: [x, y].filter((guide): guide is Guide => Boolean(guide)),
    point: { x: x?.at ?? point.x, y: y?.at ?? point.y }
  }
}
