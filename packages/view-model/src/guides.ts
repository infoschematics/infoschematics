import type { Box, Point } from './geometry.ts'

// Alignment guides come from what is already on the Infoschematic canvas rather than from a
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
export type BoxSnap = { guides: readonly Guide[]; box: Box }

export type BoxSnapOptions = {
  threshold?: number
  /**
   * When set, the grid is strict: the box origin always lands on a multiple of
   * this, and a guide may only choose between the grid lines either side of
   * where the drop wanted to be - never pull the box off the grid to align.
   */
  grid?: number
}

/**
 * Pull a box onto the nearest guide within the threshold, per axis, by
 * whichever of its edges or centre is closest. Snapping the box rather than
 * the pointer is what makes an edge land exactly on the line it aligned with -
 * the pointer sits somewhere inside the box, generally nowhere a guide is.
 */
export const snapBoxToGuides = (
  box: Box,
  guides: readonly Guide[],
  { threshold = snapThreshold, grid }: BoxSnapOptions = {}
): BoxSnap => {
  const aligned = (axis: Axis, origin: number, size: number) =>
    guides.find(
      (guide) =>
        guide.axis === axis && (guide.at === origin || guide.at === origin + size / 2 || guide.at === origin + size)
    )

  const onGrid = (axis: Axis, origin: number, size: number, unit: number) => {
    const lower = Math.floor(origin / unit) * unit
    const candidates = [...new Set([lower, lower + unit])].sort(
      (left, right) => Math.abs(left - origin) - Math.abs(right - origin)
    )
    for (const at of candidates) {
      if (Math.abs(at - origin) > threshold) continue
      const guide = aligned(axis, at, size)
      if (guide) return { at, guide }
    }
    return { at: candidates[0] as number, guide: undefined }
  }

  const nearest = (axis: Axis, values: readonly number[]) => {
    let best: { delta: number; guide: Guide } | undefined
    for (const value of values) {
      for (const guide of guides) {
        if (guide.axis !== axis) continue
        const delta = guide.at - value
        if (Math.abs(delta) > threshold) continue
        if (!best || Math.abs(delta) < Math.abs(best.delta)) best = { delta, guide }
      }
    }
    return best
  }

  if (grid) {
    const x = onGrid('x', box.x, box.width, grid)
    const y = onGrid('y', box.y, box.height, grid)
    return {
      guides: [x.guide, y.guide].filter((guide): guide is Guide => Boolean(guide)),
      box: { ...box, x: x.at, y: y.at }
    }
  }

  const x = nearest('x', [box.x, box.x + box.width / 2, box.x + box.width])
  const y = nearest('y', [box.y, box.y + box.height / 2, box.y + box.height])

  return {
    guides: [x?.guide, y?.guide].filter((guide): guide is Guide => Boolean(guide)),
    box: { ...box, x: box.x + (x?.delta ?? 0), y: box.y + (y?.delta ?? 0) }
  }
}

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
