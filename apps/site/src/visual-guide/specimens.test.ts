import { describe, expect, it } from 'vitest'
import { guideProperties, guidePropertyKeys } from './curriculum.ts'
import { anatomySpecimen, guidePropertyValue, specimenFor, withGuideProperty } from './specimens.ts'

describe('components guide specimens', () => {
  it('contains every primary artefact kind and connects the Point in the labelled example', () => {
    const definition = anatomySpecimen.infoschematic

    expect(definition.regions).toHaveLength(1)
    expect(definition.fabrics).toHaveLength(1)
    expect(definition.cards).toHaveLength(1)
    expect(definition.flows).toHaveLength(2)
    expect(definition.points).toHaveLength(1)
    expect(definition.graphics).toHaveLength(1)
    expect(definition.flows.some(({ source, target }) => source === 'point' || target === 'point')).toBe(true)
  })

  it('isolates Region and Card specimens from unrelated diagram parts', () => {
    const region = specimenFor('region').infoschematic
    const card = specimenFor('card').infoschematic

    expect(region.regions).toHaveLength(1)
    expect(region.cards).toHaveLength(0)
    expect(region.flows).toHaveLength(0)
    expect(card.cards).toHaveLength(1)
    expect(card.regions).toHaveLength(0)
    expect(card.flows).toHaveLength(0)
  })

  it.each(guidePropertyKeys)('round-trips the %s guide control', (key) => {
    const descriptor = guideProperties[key]
    const sectionKind = key.slice(0, key.indexOf('.')) as Parameters<typeof specimenFor>[0]
    const original = specimenFor(sectionKind)
    const value =
      descriptor.control === 'flag'
        ? !guidePropertyValue(original, key)
        : descriptor.control === 'number'
          ? (descriptor.range?.max ?? 1)
          : descriptor.control === 'colour'
            ? '#654ea3'
            : descriptor.control === 'text'
              ? 'Updated caption'
              : (descriptor.values?.at(-1) ?? '')
    const updated = withGuideProperty(original, key, value)

    expect(guidePropertyValue(updated, key)).toBe(value)
  })
})
