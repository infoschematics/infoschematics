import { describe, expect, it } from 'vitest'
import { guideProperties, guidePropertyKeys } from './curriculum.ts'
import { anatomySpecimen, guidePropertyValue, specimenFor, specimenSnippet, withGuideProperty } from './specimens.ts'

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

  it('uses independently centred, grid-aligned specimen geometry', () => {
    const fabric = specimenFor('fabric').infoschematic.fabrics[0]
    const card = specimenFor('card').infoschematic.cards[0]

    expect(fabric?.placement.box).toEqual({ x: 210, y: 130, width: 300, height: 140 })
    expect(card?.placement.box).toEqual({ x: 250, y: 140, width: 220, height: 120 })
    expect(fabric?.placement.ports).toEqual({ east: 1, north: 1, south: 1, west: 1 })
    expect(card?.placement.ports).toEqual({ east: 1, north: 1, south: 1, west: 1 })
  })

  it('shows Adapter Cards as a supported composition around a Standard Card', () => {
    const updated = withGuideProperty(specimenFor('card'), 'card.variant', 'adapter')

    expect(updated.infoschematic.cards).toHaveLength(2)
    expect(updated.infoschematic.cards[1]?.wraps).toBe(updated.infoschematic.cards[0]?.id)
    expect(guidePropertyValue(updated, 'card.variant')).toBe('adapter')
  })

  it('serialises the live specimen as YAML and a typed definition', () => {
    const updated = withGuideProperty(specimenFor('fabric'), 'fabric.ports.east', 3)

    expect(specimenSnippet(updated, 'fabric', 'yaml')).toContain('east: 3')
    expect(specimenSnippet(updated, 'fabric', 'yaml')).not.toContain('cards:')
    expect(specimenSnippet(updated, 'fabric', 'typescript')).toContain('defineInfoschematic')
    expect(specimenSnippet(updated, 'fabric', 'typescript')).toContain('"east": 3')
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
