import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { infoschematicsInfoschematic } from './index.ts'

const diagram = infoschematicsInfoschematic.infoschematic

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
    expect(diagram.regions.filter(({ labelMount }) => labelMount === 'boundary')).toHaveLength(4)
    expect(diagram.cards).toHaveLength(9)
    expect(diagram.flows).toHaveLength(17)

    expect(diagram.cards.map((card) => card.id)).toEqual([
      'package-domain-model',
      'package-domain-core',
      'package-view-model',
      'package-view-canvas',
      'package-view-present',
      'package-view-studio',
      'package-render-svg',
      'example-infoschematics',
      'host-site'
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
    expect(diagram.domains?.map(({ id }) => id)).toEqual([
      'product-foundation',
      'interactive-experience',
      'publication'
    ])

    const domains = new Set((diagram.domains ?? []).map(({ id }) => id))
    expect(diagram.cards.every((card) => card.domain && domains.has(card.domain))).toBe(true)
    expect(diagram.cards.every((card) => card.stereotype)).toBe(true)

    const publicationCards = diagram.cards.filter(({ domain }) => domain === 'publication')
    expect(new Set(publicationCards.map(({ scope }) => scope))).toEqual(
      new Set(['renderer-output', 'authored-examples', 'application-hosts'])
    )

    const panels = diagram.regions.filter(({ labelMount }) => labelMount === 'boundary')
    const fills = diagram.regions.filter(({ labelMount }) => labelMount !== 'boundary')
    expect(panels.map(({ frame }) => frame?.style)).toEqual(['solid', 'dashed', 'dotted', 'solid'])
    expect(new Set(fills.map(({ frame }) => frame?.style))).toEqual(new Set(['solid', 'dashed', 'dotted']))
    expect(fills.every(({ fill }) => fill !== undefined)).toBe(true)
    expect(diagram.regions.every(({ labelPlacement }) => labelPlacement !== undefined)).toBe(true)
  })

  it('expresses only the allowed dependency direction', () => {
    const edges = diagram.flows.map((flow) => `${flow.source}->${flow.target}`)

    expect(new Set(edges)).toEqual(
      new Set([
        'package-domain-core->package-domain-model',
        'package-view-model->package-domain-model',
        'package-view-canvas->package-domain-model',
        'package-view-canvas->package-view-model',
        'package-view-present->package-domain-model',
        'package-view-present->package-view-model',
        'package-view-present->package-view-canvas',
        'package-view-studio->package-domain-core',
        'package-view-studio->package-domain-model',
        'package-view-studio->package-view-model',
        'package-view-studio->package-view-canvas',
        'package-view-studio->package-view-present',
        'package-render-svg->package-domain-model',
        'package-render-svg->package-view-model',
        'example-infoschematics->package-domain-core',
        'host-site->package-view-studio',
        'host-site->example-infoschematics'
      ])
    )
  })

  it('uses stable unique identities and valid authored references', () => {
    const regionIds = diagram.regions.map((region) => region.id)
    const cardIds = diagram.cards.map((card) => card.id)
    const flowIds = diagram.flows.map((flow) => flow.id)
    const sceneIds = infoschematicsInfoschematic.standaloneScenes.map((scene) => scene.id)
    const storyIds = infoschematicsInfoschematic.stories.map((story) => story.id)

    for (const ids of [regionIds, cardIds, flowIds, sceneIds, storyIds]) {
      expectUnique(ids)
    }
    expectUnique(diagram.cards.map((card) => card.code))
    expectUnique(diagram.flows.map((flow) => flow.code))
    expectUnique(infoschematicsInfoschematic.standaloneScenes.map((scene) => scene.code))
    expectUnique(infoschematicsInfoschematic.stories.map((story) => story.code))

    const cards = new Set(cardIds)
    const flows = new Set(flowIds)
    const flowFamilies = new Set(diagram.flowFamilies.map((family) => family.id))
    const scenes = new Set(sceneIds)

    for (const flow of diagram.flows) {
      expect(cards.has(flow.source)).toBe(true)
      expect(cards.has(flow.target)).toBe(true)
      expect(flow.source).not.toBe(flow.target)
      expect(flowFamilies.has(flow.family)).toBe(true)
    }

    for (const scene of infoschematicsInfoschematic.standaloneScenes) {
      for (const artefact of scene.focus.artefacts ?? []) expect(cards.has(artefact)).toBe(true)
      for (const flow of scene.focus.flows ?? []) expect(flows.has(flow)).toBe(true)
    }

    for (const story of infoschematicsInfoschematic.stories) {
      for (const scene of story.scenes) {
        if (scene.sourceScene) expect(scenes.has(scene.sourceScene)).toBe(true)
        if (scene.anchor) expect(cards.has(scene.anchor)).toBe(true)
      }
    }
  })

  it('provides several reusable scenes and one concise story', () => {
    expect(infoschematicsInfoschematic.standaloneScenes).toHaveLength(4)
    expect(infoschematicsInfoschematic.stories).toHaveLength(1)
    expect(infoschematicsInfoschematic.stories[0]?.scenes).toHaveLength(3)
    expect(infoschematicsInfoschematic.stories[0]?.scenes.every((scene) => scene.sourceScene)).toBe(true)
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
