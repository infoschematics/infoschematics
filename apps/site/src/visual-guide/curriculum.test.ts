import { describe, expect, it } from 'vitest'
import { componentSections, guideProperties, guidePropertyKeys, uncataloguedGuideProperties } from './curriculum.ts'

describe('components guide curriculum', () => {
  it('teaches the Canvas and each primary artefact in reading order', () => {
    expect(componentSections.map(({ id }) => id)).toEqual([
      'canvas',
      'region',
      'fabric',
      'card',
      'flow',
      'point',
      'graphic'
    ])
    expect(new Set(componentSections.map(({ id }) => id))).toHaveLength(componentSections.length)
  })

  it('gives every interactive property exactly one component section', () => {
    const sectionKeys = componentSections.flatMap(({ propertyKeys }) => propertyKeys)

    expect(uncataloguedGuideProperties).toEqual([])
    expect(new Set(sectionKeys)).toHaveLength(sectionKeys.length)
    expect(new Set(sectionKeys)).toEqual(new Set(guidePropertyKeys))
  })

  it('gives every property a control descriptor', () => {
    expect(Object.keys(guideProperties)).toEqual(expect.arrayContaining([...guidePropertyKeys]))
  })
})
