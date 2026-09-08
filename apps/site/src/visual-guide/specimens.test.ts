import { gridTreatments, regionLabelPlacements, surfaceTreatments } from '@infoschematics/domain-core'
import { describe, expect, it } from 'vitest'
import { cardDetailSpecimens, gridSpecimens, regionLabelPlacementSpecimens, surfaceSpecimens } from './specimens.ts'

describe('visual guide specimens', () => {
  it('has one surface specimen per surface treatment', () => {
    expect(surfaceSpecimens).toHaveLength(surfaceTreatments.length)
    for (const [index, treatment] of surfaceTreatments.entries()) {
      const specimen = surfaceSpecimens[index]
      expect(specimen).toBeDefined()
      expect(specimen?.config.infoschematic.appearance?.surface).toBe(treatment)
    }
  })

  it('has one grid specimen per grid treatment', () => {
    expect(gridSpecimens).toHaveLength(gridTreatments.length)
    for (const [index, treatment] of gridTreatments.entries()) {
      const specimen = gridSpecimens[index]
      expect(specimen).toBeDefined()
      expect(specimen?.config.infoschematic.appearance?.grid).toBe(treatment)
    }
  })

  it('has one region label placement specimen per placement', () => {
    expect(regionLabelPlacementSpecimens).toHaveLength(regionLabelPlacements.length)
    for (const [index, placement] of regionLabelPlacements.entries()) {
      const specimen = regionLabelPlacementSpecimens[index]
      expect(specimen).toBeDefined()
      expect(specimen?.config.infoschematic.regions[0]?.labelPlacement).toBe(placement)
    }
  })

  it('covers every CardDetailDefaults flag across the curated progressive sequence', () => {
    const flags = ['compact', 'identity', 'stereotype', 'description'] as const

    for (const flag of flags) {
      const hasFlagTrue = cardDetailSpecimens.some(
        (specimen) => specimen.config.infoschematic.appearance?.card?.[flag] === true
      )
      expect(hasFlagTrue).toBe(true)
    }
  })

  it('gives every specimen a unique key', () => {
    const allSpecimens = [
      ...surfaceSpecimens,
      ...gridSpecimens,
      ...regionLabelPlacementSpecimens,
      ...cardDetailSpecimens
    ]
    const keys = allSpecimens.map((specimen) => specimen.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
