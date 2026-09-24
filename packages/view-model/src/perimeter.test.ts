import { describe, expect, it } from 'vitest'
import { emphasisPerimeterPath, emphasisPointRadius, roundedRectanglePath } from './perimeter.ts'
import { visualTokens } from './tokens.ts'

/** Every coordinate a path names, so a perimeter can be asked whether it stays inside the box it is meant to trace. */
const coordinates = (d: string) => {
  const pairs: { x: number; y: number }[] = []
  for (const command of d.matchAll(/([MA])([^MAVHZ]*)/g)) {
    const numbers = (command[2] ?? '').trim().split(/\s+/).filter(Boolean).map(Number)
    if (command[1] === 'M') pairs.push({ x: numbers[0] as number, y: numbers[1] as number })
    else pairs.push({ x: numbers[5] as number, y: numbers[6] as number })
  }
  return pairs
}

describe('rounded rectangle perimeter', () => {
  it('traces one closed clockwise path that starts and ends at the same point', () => {
    const d = roundedRectanglePath({ height: 72, width: 132, x: 294, y: 54 }, 14)

    expect(d).toBe(
      'M308 54 H412 A14 14 0 0 1 426 68 V112 A14 14 0 0 1 412 126 H308 A14 14 0 0 1 294 112 V68 A14 14 0 0 1 308 54 Z'
    )
    // A mark travelling this path crosses the seam without a jump only because the last point is the first one.
    const corners = coordinates(d)
    expect(corners.at(-1)).toEqual(corners[0])
    expect(d.endsWith(' Z')).toBe(true)
  })

  it('fits the corner radius to the box, so an extreme aspect ratio draws a stadium and not crossing arcs', () => {
    const flat = roundedRectanglePath({ height: 20, width: 200, x: 0, y: 0 }, 14)
    const tall = roundedRectanglePath({ height: 200, width: 18, x: 0, y: 0 }, 14)

    // Half the shorter side: ten for the flat box, nine for the narrow one, fourteen for anything big enough.
    expect(flat).toContain('A10 10 0 0 1')
    expect(flat).not.toContain('A14 14')
    expect(tall).toContain('A9 9 0 0 1')
    expect(roundedRectanglePath({ height: 200, width: 200, x: 0, y: 0 }, 14)).toContain('A14 14 0 0 1')

    // The whole point of fitting: an unfitted arc would name points above the top edge and below the bottom one.
    for (const { x, y } of coordinates(flat)) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(200)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(20)
    }
  })

  it('degrades a box with no extent to a closed path rather than an arc with no radius to draw', () => {
    expect(roundedRectanglePath({ height: 0, width: 0, x: 40, y: 40 }, 14)).toBe(
      'M40 40 H40 A0 0 0 0 1 40 40 V40 A0 0 0 0 1 40 40 H40 A0 0 0 0 1 40 40 V40 A0 0 0 0 1 40 40 Z'
    )
  })

  it('outsets an emphasis perimeter from the element by the shared emphasis tokens', () => {
    const { inset, radius } = visualTokens.canvas.emphasis
    const element = { height: 60, width: 120, x: 300, y: 60 }

    // The same outset rectangle both renderers drew as a `rect` before the perimeter became one calculation.
    expect(emphasisPerimeterPath(element)).toBe(
      roundedRectanglePath({ height: 60 + inset * 2, width: 120 + inset * 2, x: 300 - inset, y: 60 - inset }, radius)
    )
    expect(emphasisPerimeterPath(element)).toBe(
      'M308 54 H412 A14 14 0 0 1 426 68 V112 A14 14 0 0 1 412 126 H308 A14 14 0 0 1 294 112 V68 A14 14 0 0 1 308 54 Z'
    )
  })

  it('fits the emphasis radius for an element too small to carry it', () => {
    // Outset by six on each side an eight-unit element is twenty across, so the radius fits to ten, not fourteen.
    expect(emphasisPerimeterPath({ height: 8, width: 8, x: 0, y: 0 })).toContain('A10 10 0 0 1')
    expect(visualTokens.canvas.emphasis.radius).toBe(14)
  })

  it('outsets an emphasis ring for a Point by the same inset it outsets a box by', () => {
    const { pointRadius } = visualTokens.canvas.geometry
    const { inset } = visualTokens.canvas.emphasis

    // Derived, not restated: a renderer summing these two tokens itself is exactly the drift this replaces.
    expect(emphasisPointRadius).toBe(pointRadius + inset)
    // Outside the Point rather than over it, by the very inset a Card's perimeter is outset by.
    expect(emphasisPointRadius).toBeGreaterThan(pointRadius)
    expect(emphasisPointRadius - pointRadius).toBe(inset)
  })
})
