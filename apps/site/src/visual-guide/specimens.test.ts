import { describe, expect, it } from 'vitest'
import { guideAppearanceOptionKeys, guideAppearanceOptions } from './curriculum.ts'
import { anatomySpecimen, appearanceOptionValue, treatmentSpecimen, withAppearanceOption } from './specimens.ts'

describe('visual guide specimens', () => {
  it('contains every primary artefact kind in the anatomy specimen', () => {
    const definition = anatomySpecimen.infoschematic
    expect(definition.regions).toHaveLength(1)
    expect(definition.fabrics).toHaveLength(1)
    expect(definition.cards).toHaveLength(1)
    expect(definition.flows).toHaveLength(1)
    expect(definition.points).toHaveLength(1)
    expect(definition.graphics).toHaveLength(1)
  })

  it.each(guideAppearanceOptionKeys)('round-trips the %s guide control', (key) => {
    const descriptor = guideAppearanceOptions[key]
    const value =
      descriptor.control === 'flag'
        ? !appearanceOptionValue(treatmentSpecimen(), key)
        : descriptor.control === 'number'
          ? (descriptor.range?.max ?? 1)
          : descriptor.control === 'colour'
            ? '#654ea3'
            : (descriptor.values.at(-1) ?? '')
    const updated = withAppearanceOption(treatmentSpecimen(), key, value)
    expect(appearanceOptionValue(updated, key)).toBe(value)
  })
})
