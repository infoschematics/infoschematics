import type { Box } from '@infoschematics/view-model/geometry'
import { describe, expect, it } from 'vitest'
import { finitePoint, placeableBox, positiveExtent } from './placement-guards.ts'

describe('placement guards', () => {
  it('refuses a coordinate that is not a number on both axes', () => {
    expect(finitePoint({ x: 10, y: 20 })).toBe(true)
    expect(finitePoint({ x: Number.NaN, y: 20 })).toBe(false)
    expect(finitePoint({ x: 10, y: Number.POSITIVE_INFINITY })).toBe(false)
  })

  it('refuses an extent with no width, no height, or a negative one', () => {
    expect(positiveExtent({ height: 80, width: 160 })).toBe(true)
    expect(positiveExtent({ height: 80, width: 0 })).toBe(false)
    expect(positiveExtent({ height: -1, width: 160 })).toBe(false)
    expect(positiveExtent({ height: Number.NaN, width: 160 })).toBe(false)
  })

  it('asks both questions of a rectangle a creation is placed by', () => {
    expect(placeableBox({ height: 80, width: 160, x: 10, y: 20 })).toBe(true)
    // Somewhere but at no size, and at a size but nowhere: each is refused on its own.
    expect(placeableBox({ height: 0, width: 160, x: 10, y: 20 })).toBe(false)
    expect(placeableBox({ height: 80, width: 160, x: Number.NaN, y: 20 } as Box)).toBe(false)
  })
})
