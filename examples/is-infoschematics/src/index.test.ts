import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { infoschematicsInfoschematic } from './index.ts'

const diagram = infoschematicsInfoschematic.diagram

const expectUnique = (values: readonly string[]) => {
  expect(new Set(values).size).toBe(values.length)
}

const expectSerialisable = (value: unknown): void => {
  if (value === null) return

  if (Array.isArray(value)) {
    for (const item of value) expectSerialisable(item)
    return
  }

  if (typeof value === 'object') {
    for (const item of Object.values(value)) expectSerialisable(item)
    return
  }

  expect(['boolean', 'number', 'string']).toContain(typeof value)
}

describe('infoschematicsInfoschematic', () => {
  it('models the repository as four architectural layers', () => {
    expect(diagram.regions).toHaveLength(11)
    expect(diagram.regions.filter(({ appearance }) => appearance?.label?.mount === 'boundary')).toHaveLength(4)
    expect(diagram.cards).toHaveLength(9)
    expect(diagram.flows).toHaveLength(17)

    expect(diagram.cards.map((card) => card.id)).toEqual([
      'PKG-DM',
      'PKG-DC',
      'PKG-VM',
      'PKG-VC',
      'PKG-VP',
      'PKG-VS',
      'PKG-SVG',
      'EX-IS',
      'HOST-SITE'
    ])
  })

  it('authors visual treatments and Domain classification independently of Scope', () => {
    expect(diagram.appearance).toEqual({
      card: {
        compact: true,
        description: false,
        identity: true,
        stereotype: true
      },
      grid: 'major-plus-minor',
      surface: 'blueprint'
    })
    expect(diagram.collections.map(({ id }) => id)).toEqual([
      'product-foundation',
      'interactive-experience',
      'publication'
    ])

    const collections = new Set(diagram.collections.map(({ id }) => id))
    expect(diagram.cards.every((card) => card.collection && collections.has(card.collection))).toBe(true)
    expect(diagram.cards.every((card) => card.stereotype)).toBe(true)

    const setByElement = new Map(diagram.sets.flatMap((set) => set.elements.map((element) => [element, set.id])))
    const publicationCards = diagram.cards.filter(({ collection }) => collection === 'publication')
    expect(new Set(publicationCards.map(({ id }) => setByElement.get(id)))).toEqual(
      new Set(['renderer-output', 'authored-examples', 'application-hosts'])
    )

    // Each band is a framed row holding filled panels inset inside it, so a boundary-mounted
    // title reads against the backdrop and no panel repeats its band's frame line.
    const bands = diagram.regions.filter(({ appearance }) => appearance?.label?.mount === 'boundary')
    const panels = diagram.regions.filter(({ appearance }) => appearance?.label?.mount !== 'boundary')
    expect(bands.map(({ appearance }) => appearance?.frame?.style)).toEqual(['solid', 'dashed', 'dotted', 'solid'])
    expect(bands.every(({ appearance }) => appearance?.fill === undefined)).toBe(true)
    expect(panels.every(({ appearance }) => appearance?.fill !== undefined)).toBe(true)
    expect(panels.every(({ appearance }) => appearance?.frame === undefined)).toBe(true)
    expect(diagram.regions.every(({ appearance }) => appearance?.label?.placement !== undefined)).toBe(true)
  })

  it('expresses only the allowed dependency direction', () => {
    const edges = diagram.flows.map((flow) => `${flow.source.element}->${flow.target.element}`)

    expect(new Set(edges)).toEqual(
      new Set([
        'PKG-DC->PKG-DM',
        'PKG-VM->PKG-DM',
        'PKG-VC->PKG-DM',
        'PKG-VC->PKG-VM',
        'PKG-VP->PKG-DM',
        'PKG-VP->PKG-VM',
        'PKG-VP->PKG-VC',
        'PKG-VS->PKG-DC',
        'PKG-VS->PKG-DM',
        'PKG-VS->PKG-VM',
        'PKG-VS->PKG-VC',
        'PKG-VS->PKG-VP',
        'PKG-SVG->PKG-DM',
        'PKG-SVG->PKG-VM',
        'EX-IS->PKG-DC',
        'HOST-SITE->PKG-VS',
        'HOST-SITE->EX-IS'
      ])
    )
  })

  it('uses stable unique identities and valid authored references', () => {
    const regionIds = diagram.regions.map((region) => region.id)
    const cardIds = diagram.cards.map((card) => card.id)
    const flowIds = diagram.flows.map((flow) => flow.id)
    const sceneIds = infoschematicsInfoschematic.themes.flatMap((theme) => theme.scenes.map((scene) => scene.id))
    const storyIds = infoschematicsInfoschematic.stories.map((story) => story.id)

    for (const ids of [regionIds, cardIds, flowIds, sceneIds, storyIds]) {
      expectUnique(ids)
    }
    const cards = new Set(cardIds)
    const flows = new Set(flowIds)
    const flowFamilies = new Set(diagram.families.map((family) => family.id))

    for (const flow of diagram.flows) {
      expect(cards.has(flow.source.element)).toBe(true)
      expect(cards.has(flow.target.element)).toBe(true)
      expect(flow.source.element).not.toBe(flow.target.element)
      expect(flow.family && flowFamilies.has(flow.family)).toBe(true)
    }

    for (const scene of infoschematicsInfoschematic.themes.flatMap((theme) => theme.scenes)) {
      for (const element of scene.focus?.elements ?? []) expect(cards.has(element) || flows.has(element)).toBe(true)
    }

    for (const story of infoschematicsInfoschematic.stories) {
      for (const scene of story.scenes) {
        const placement = scene.callout?.placement
        if (placement && 'element' in placement) expect(cards.has(placement.element)).toBe(true)
      }
    }
  })

  it('provides several reusable scenes and one concise story', () => {
    expect(infoschematicsInfoschematic.themes).toHaveLength(1)
    expect(infoschematicsInfoschematic.themes[0]?.scenes).toHaveLength(4)
    expect(infoschematicsInfoschematic.stories).toHaveLength(1)
    expect(infoschematicsInfoschematic.stories[0]?.scenes).toHaveLength(3)
    expect(infoschematicsInfoschematic.stories[0]?.scenes.every((scene) => scene.focus?.elements?.length)).toBe(true)
  })

  it('remains framework-neutral serialisable authored data', () => {
    expectSerialisable(infoschematicsInfoschematic)
    expect(JSON.parse(JSON.stringify(infoschematicsInfoschematic))).toEqual(infoschematicsInfoschematic)

    const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      dependencies: Record<string, string>
    }
    const source = readFileSync(new URL('./index.ts', import.meta.url), 'utf8')

    expect(packageJson.dependencies).toEqual({ '@infoschematics/domain-core': '0.1.0' })
    expect(source).not.toMatch(/from ['"]react|window\.|document\.|"renderer"\s*:/)
    expect(source).not.toMatch(/@infoschematics\/(view-|render-)/)
  })
})
