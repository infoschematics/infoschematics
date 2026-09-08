import { describe, expect, it } from 'vitest'

import { gridTreatments, regionLabelPlacements, surfaceTreatments } from './appearance.ts'
import { type AppearanceOptionKey, appearanceOptionKeys, appearanceOptions } from './option-catalogue.ts'
import { regionFrameStyles, regionLabelMounts } from './region.ts'

describe('appearance option catalogue', () => {
  it('offers each choice the values its union states, in order', () => {
    expect(appearanceOptions.surface.values).toEqual(surfaceTreatments)
    expect(appearanceOptions.grid.values).toEqual(gridTreatments)
    expect(appearanceOptions['region.frame.style'].values).toEqual(regionFrameStyles)
    expect(appearanceOptions['region.labelMount'].values).toEqual(regionLabelMounts)
    expect(appearanceOptions['region.labelPlacement'].values).toEqual(regionLabelPlacements)
  })

  it('describes every authored appearance option once', () => {
    // The key union is derived from the config types, so this is the runtime
    // half of a guarantee the compiler already enforces: a described key that
    // no longer exists is as much a drift as an option nobody described.
    const expected: readonly AppearanceOptionKey[] = [
      'card.compact',
      'card.description',
      'card.identity',
      'card.stereotype',
      'grid',
      'region.fill',
      'region.frame.opacity',
      'region.frame.style',
      'region.labelMount',
      'region.labelOffset',
      'region.labelPlacement',
      'surface'
    ]

    expect([...appearanceOptionKeys].sort()).toEqual([...expected].sort())
  })

  it('carries values only where a choice is offered', () => {
    for (const key of appearanceOptionKeys) {
      const descriptor = appearanceOptions[key]
      if (descriptor.control === 'choice') expect(descriptor.values.length).toBeGreaterThan(0)
      else expect(descriptor.values).toEqual([])
    }
  })

  it('bounds every number control', () => {
    for (const key of appearanceOptionKeys) {
      const descriptor = appearanceOptions[key]
      if (descriptor.control !== 'number') continue
      expect(descriptor.range).toBeDefined()
      expect(descriptor.range?.min).toBeLessThan(descriptor.range?.max ?? Number.NEGATIVE_INFINITY)
    }
  })

  it('states a default a choice actually offers', () => {
    for (const key of appearanceOptionKeys) {
      const descriptor = appearanceOptions[key]
      if (descriptor.control !== 'choice' || descriptor.default === undefined) continue
      expect(descriptor.values).toContain(descriptor.default)
    }
  })
})
