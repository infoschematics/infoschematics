import { describe, expect, it } from 'vitest'
import {
  guideAppearanceOptionKeys,
  treatmentSections,
  uncataloguedGuideOptions,
  visualArtefacts,
  visualGroupings
} from './curriculum.ts'

describe('visual guide curriculum', () => {
  it('teaches each primary artefact exactly once', () => {
    expect(visualArtefacts.map(({ id }) => id)).toEqual(['region', 'fabric', 'card', 'flow', 'point', 'graphic'])
    expect(new Set(visualArtefacts.map(({ id }) => id))).toHaveLength(visualArtefacts.length)
  })

  it('distinguishes all three independent groupings', () => {
    expect(visualGroupings.map(({ id }) => id)).toEqual(['scope', 'domain', 'flow-family'])
  })

  it('gives every catalogued appearance option one treatment section', () => {
    const guideKeys = treatmentSections.flatMap(({ optionKeys }) => optionKeys)
    expect(uncataloguedGuideOptions).toEqual([])
    expect(new Set(guideKeys)).toHaveLength(guideKeys.length)
    expect(new Set(guideKeys)).toEqual(new Set(guideAppearanceOptionKeys))
  })
})
