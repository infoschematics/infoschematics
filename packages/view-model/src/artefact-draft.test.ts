import type { InfoschematicConfig } from '@infoschematics/domain-model'
import type { CardConfig } from '@infoschematics/domain-model/card'
import type { FabricConfig } from '@infoschematics/domain-model/fabric'
import type { FlowConfig } from '@infoschematics/domain-model/flow'
import type { GraphicConfig } from '@infoschematics/domain-model/graphic'
import type { RegionConfig } from '@infoschematics/domain-model/region'
import { describe, expect, it } from 'vitest'

import { type ArtefactDraftOperation, applyArtefactOperations } from './artefact-draft.ts'
import type { ArtefactSelection } from './editable.ts'

const region = (id: string, x: number): RegionConfig => ({
  box: { height: 160, radius: 8, width: 80, x, y: 40 },
  fill: '#eef',
  frame: { style: 'solid' },
  id,
  label: id
})

const card = (id: string, code: string, x: number, wraps?: string): CardConfig => ({
  code,
  detail: `${id} detail`,
  id,
  label: id,
  placement: { box: { height: 60, width: 100, x, y: 80 }, ports: { east: 2 } },
  scope: 'scope-one',
  scopes: ['scope-one'],
  ...(wraps ? { wraps } : {})
})

const fabric = (id: string, code: string, x: number): FabricConfig => ({
  appearance: {
    caption: `${id} caption`,
    properties: { emphasis: true, rank: 2 },
    renderer: 'fabric-special'
  },
  code,
  detail: `${id} detail`,
  id,
  label: id,
  placement: { box: { height: 100, width: 180, x, y: 260 } },
  scope: 'scope-one',
  scopes: ['scope-one']
})

const flow = (id: string, code: string, source: string, target: string): FlowConfig => ({
  code,
  conformsTo: ['contract-one'],
  family: 'family-one',
  id,
  label: { along: 0.4 },
  points: [
    { x: 100, y: 110 },
    { x: 240, y: 110 }
  ],
  source,
  sourcePort: 'E1',
  target,
  targetPort: 'W1'
})

const graphic = (id: string, x: number): GraphicConfig => ({
  id,
  label: id,
  placement: { height: 70, width: 90, x, y: 430 },
  properties: { caption: `${id} caption`, opacity: 0.8 },
  renderer: 'graphic-special',
  scopes: ['scope-one']
})

const config = (): InfoschematicConfig => ({
  calloutPositions: [{ x: 20, y: 20 }],
  infoschematic: {
    cards: [card('card-one', 'C1', 100), card('card-two', 'C2', 300)],
    fabrics: [fabric('fabric-one', 'F1', 80), fabric('fabric-two', 'F2', 400)],
    flowFamilies: [
      {
        color: '#123',
        description: 'Family',
        id: 'family-one',
        label: 'Family one',
        prefix: 'F'
      }
    ],
    flows: [flow('flow-one', 'L1', 'card-one', 'card-two'), flow('flow-two', 'L2', 'fabric-one', 'card-one')],
    graphics: [graphic('graphic-one', 100), graphic('graphic-two', 300)],
    interfaces: [],
    regions: [region('region-one', 80), region('region-two', 220)],
    points: [],
    scopes: [
      {
        color: '#456',
        description: 'Scope',
        fill: '#def',
        id: 'scope-one',
        label: 'Scope one',
        prefix: 'S'
      }
    ],
    specificationGroups: [],
    viewBox: { height: 600, width: 1000, x: 0, y: 0 }
  },
  standaloneScenes: [
    {
      code: 'S1',
      description: 'Standalone',
      focus: { artefacts: ['card-one'], graphics: ['graphic-one', 'graphic-two'] },
      id: 'standalone-one',
      label: 'Standalone'
    }
  ],
  stories: [
    {
      code: 'ST1',
      id: 'story-one',
      scenes: [
        {
          focus: { graphics: ['graphic-one', 'graphic-two'] },
          graphic: 'graphic-one',
          id: 'story-scene-one'
        }
      ],
      title: 'Story'
    }
  ],
  themes: [
    {
      id: 'theme-one',
      scenes: [
        {
          code: 'T1',
          focus: { graphics: ['graphic-one', 'graphic-two'] },
          id: 'theme-scene-one',
          label: 'Theme scene'
        }
      ],
      title: 'Theme'
    }
  ],
  title: 'Draft materialiser'
})

const selections = {
  card: {
    code: 'C1',
    geometry: 'box',
    id: 'card-one',
    kind: 'card'
  },
  fabric: {
    code: 'F1',
    geometry: 'box',
    id: 'fabric-one',
    kind: 'fabric'
  },
  flow: {
    code: 'L1',
    geometry: 'route',
    id: 'flow-one',
    kind: 'flow'
  },
  graphic: {
    code: null,
    geometry: 'box',
    id: 'graphic-one',
    kind: 'graphic'
  },
  region: {
    code: null,
    geometry: 'box',
    id: 'region-one',
    kind: 'region'
  }
} as const satisfies Record<string, ArtefactSelection>

describe('applyArtefactOperations', () => {
  it('creates all five kinds in authored order and deep-copies operation values', () => {
    const initial = config()
    initial.infoschematic.regions = [] as never
    initial.infoschematic.cards = [] as never
    initial.infoschematic.fabrics = [] as never
    initial.infoschematic.flows = [] as never
    initial.infoschematic.graphics = [] as never
    const before = structuredClone(initial)
    const createdRegion = region('region-created', 120)
    const createdFabric = fabric('fabric-created', 'FC', 140)
    const createdCard = card('card-created', 'CC', 180)
    const createdFlow = flow('flow-created', 'LC', 'fabric-created', 'card-created')
    const createdGraphic = graphic('graphic-created', 220)
    const operations: readonly ArtefactDraftOperation[] = [
      {
        at: 0,
        operation: 'create',
        target: {
          code: null,
          geometry: 'box',
          id: 'region-created',
          kind: 'region'
        },
        value: createdRegion
      },
      {
        at: 0,
        operation: 'create',
        target: {
          code: 'FC',
          geometry: 'box',
          id: 'fabric-created',
          kind: 'fabric'
        },
        value: createdFabric
      },
      {
        at: 0,
        operation: 'create',
        target: {
          code: 'CC',
          geometry: 'box',
          id: 'card-created',
          kind: 'card'
        },
        value: createdCard
      },
      {
        at: 0,
        operation: 'create',
        target: {
          code: 'LC',
          geometry: 'route',
          id: 'flow-created',
          kind: 'flow'
        },
        value: createdFlow
      },
      {
        at: 0,
        operation: 'create',
        target: {
          code: null,
          geometry: 'box',
          id: 'graphic-created',
          kind: 'graphic'
        },
        value: createdGraphic
      }
    ]

    const result = applyArtefactOperations(initial, operations)
    ;(createdGraphic.properties as { caption: string }).caption = 'mutated after apply'
    createdRegion.fill = 'mutated after apply'

    expect(result.rejected).toEqual([])
    expect(result.config.infoschematic.regions[0]?.id).toBe('region-created')
    expect(result.config.infoschematic.fabrics[0]?.id).toBe('fabric-created')
    expect(result.config.infoschematic.cards[0]?.id).toBe('card-created')
    expect(result.config.infoschematic.flows[0]?.id).toBe('flow-created')
    expect(result.config.infoschematic.graphics[0]?.properties?.caption).toBe('graphic-created caption')
    expect(result.config.infoschematic.regions[0]?.fill).toBe('#eef')
    expect(initial).toEqual(before)
    expect(result.config).not.toBe(initial)
  })

  it('moves and resizes box geometry without losing authored data', () => {
    const initial = config()
    const operations: readonly ArtefactDraftOperation[] = [
      {
        geometry: { box: { height: 190, width: 120, x: 95, y: 55 }, role: 'box' },
        operation: 'move',
        target: selections.region
      },
      {
        geometry: {
          box: { height: 110, width: 190, x: 90, y: 275 },
          role: 'box'
        },
        operation: 'move',
        target: selections.fabric
      },
      {
        geometry: {
          box: { height: 75, width: 130, x: 150, y: 120 },
          role: 'box'
        },
        operation: 'resize',
        target: selections.card
      },
      {
        geometry: {
          box: { height: 85, width: 105, x: 130, y: 450 },
          role: 'box'
        },
        operation: 'move',
        target: selections.graphic
      }
    ]

    const result = applyArtefactOperations(initial, operations)

    expect(result.rejected).toEqual([])
    // The authored corner radius survives a geometry rewrite of the box.
    expect(result.config.infoschematic.regions[0]).toMatchObject({
      box: { height: 190, radius: 8, width: 120, x: 95, y: 55 },
      fill: '#eef'
    })
    expect(result.config.infoschematic.fabrics[0]).toMatchObject({
      appearance: {
        properties: { emphasis: true, rank: 2 },
        renderer: 'fabric-special'
      },
      placement: { box: { height: 110, width: 190, x: 90, y: 275 } }
    })
    expect(result.config.infoschematic.cards[0]?.placement).toMatchObject({
      box: { height: 75, width: 130, x: 150, y: 120 },
      ports: { east: 2 }
    })
    expect(result.config.infoschematic.graphics[0]).toMatchObject({
      placement: { height: 85, width: 105, x: 130, y: 450 },
      properties: { caption: 'graphic-one caption', opacity: 0.8 },
      renderer: 'graphic-special'
    })
    expect(result.config.infoschematic.scopes).toEqual(initial.infoschematic.scopes)
    expect(result.config.infoschematic.flowFamilies).toEqual(initial.infoschematic.flowFamilies)
  })

  it('replaces all five authored values, including Flow route properties', () => {
    const initial = config()
    const originalRegion = initial.infoschematic.regions[0]
    const operations: readonly ArtefactDraftOperation[] = [
      {
        operation: 'replace-properties',
        target: selections.region,
        value: { ...originalRegion!, fill: '#abc', label: 'Region replaced' }
      },
      {
        operation: 'replace-properties',
        target: selections.fabric,
        value: {
          ...initial.infoschematic.fabrics[0]!,
          appearance: {
            properties: { emphasis: false, rank: 3 },
            renderer: 'fabric-special'
          }
        }
      },
      {
        operation: 'replace-properties',
        target: selections.card,
        value: { ...initial.infoschematic.cards[0]!, detail: 'Card replaced' }
      },
      {
        operation: 'replace-properties',
        target: selections.flow,
        value: {
          ...initial.infoschematic.flows[0]!,
          dashed: true,
          points: [
            { x: 120, y: 130 },
            { x: 260, y: 150 }
          ]
        }
      },
      {
        operation: 'replace-properties',
        target: selections.graphic,
        value: {
          ...initial.infoschematic.graphics[0]!,
          properties: { caption: 'Graphic replaced', opacity: 1 }
        }
      }
    ]

    const result = applyArtefactOperations(initial, operations)

    expect(result.rejected).toEqual([])
    expect(result.config.infoschematic.regions[0]).toMatchObject({
      fill: '#abc',
      label: 'Region replaced'
    })
    expect(result.config.infoschematic.fabrics[0]?.appearance).toEqual({
      properties: { emphasis: false, rank: 3 },
      renderer: 'fabric-special'
    })
    expect(result.config.infoschematic.cards[0]?.detail).toBe('Card replaced')
    expect(result.config.infoschematic.flows[0]).toMatchObject({
      conformsTo: ['contract-one'],
      dashed: true,
      family: 'family-one',
      points: [
        { x: 120, y: 130 },
        { x: 260, y: 150 }
      ]
    })
    expect(result.config.infoschematic.graphics[0]).toMatchObject({
      properties: { caption: 'Graphic replaced', opacity: 1 },
      renderer: 'graphic-special',
      scopes: ['scope-one']
    })
  })

  it('reorders only inside each fixed authored kind', () => {
    const initial = config()
    const secondSelections = {
      card: { ...selections.card, code: 'C2', id: 'card-two' },
      fabric: { ...selections.fabric, code: 'F2', id: 'fabric-two' },
      flow: { ...selections.flow, code: 'L2', id: 'flow-two' },
      graphic: { ...selections.graphic, id: 'graphic-two' },
      region: { ...selections.region, id: 'region-two' }
    } as const satisfies Record<string, ArtefactSelection>
    const operations = Object.values(secondSelections).map((target) => ({
      from: 1,
      operation: 'reorder' as const,
      target,
      to: 0
    }))

    const result = applyArtefactOperations(initial, operations)

    expect(result.rejected).toEqual([])
    expect(result.config.infoschematic.regions.map(({ id }) => id)).toEqual(['region-two', 'region-one'])
    expect(result.config.infoschematic.fabrics.map(({ id }) => id)).toEqual(['fabric-two', 'fabric-one'])
    expect(result.config.infoschematic.cards.map(({ id }) => id)).toEqual(['card-two', 'card-one'])
    expect(result.config.infoschematic.flows.map(({ id }) => id)).toEqual(['flow-two', 'flow-one'])
    expect(result.config.infoschematic.graphics.map(({ id }) => id)).toEqual(['graphic-two', 'graphic-one'])
  })

  it('cascades owned and referenced records while preserving unrelated content', () => {
    const initial = config()
    initial.infoschematic.cards = [
      ...initial.infoschematic.cards,
      card('adapter-one', 'A1', 100, 'card-one'),
      card('adapter-two', 'A2', 100, 'adapter-one')
    ]
    initial.infoschematic.flows = [
      ...initial.infoschematic.flows,
      flow('flow-adapter', 'LA', 'adapter-two', 'card-two'),
      flow('flow-unrelated', 'LU', 'card-two', 'fabric-two')
    ]
    const operations: readonly ArtefactDraftOperation[] = [
      { operation: 'remove', target: selections.card },
      { operation: 'remove', target: selections.fabric },
      { operation: 'remove', target: selections.graphic },
      { operation: 'remove', target: selections.region }
    ]

    const result = applyArtefactOperations(initial, operations)

    expect(result.rejected).toEqual([])
    expect(result.config.infoschematic.cards.map(({ id }) => id)).toEqual(['card-two'])
    expect(result.config.infoschematic.fabrics.map(({ id }) => id)).toEqual(['fabric-two'])
    expect(result.config.infoschematic.flows.map(({ id }) => id)).toEqual(['flow-unrelated'])
    expect(result.config.infoschematic.graphics.map(({ id }) => id)).toEqual(['graphic-two'])
    expect(result.config.infoschematic.regions.map(({ id }) => id)).toEqual(['region-two'])
    expect(result.config.standaloneScenes[0]?.focus.graphics).toEqual(['graphic-two'])
    expect(result.config.themes[0]?.scenes[0]?.focus.graphics).toEqual(['graphic-two'])
    expect(result.config.stories[0]?.scenes[0]).toEqual({
      focus: { graphics: ['graphic-two'] },
      id: 'story-scene-one'
    })
  })

  it('rejects duplicate, stale, missing and unsupported operations explicitly', () => {
    const initial = config()
    const unsupportedFlowMove = {
      geometry: { box: { height: 10, width: 10, x: 0, y: 0 }, role: 'box' },
      operation: 'move',
      target: selections.flow
    } as unknown as ArtefactDraftOperation
    const result = applyArtefactOperations(initial, [
      {
        at: 0,
        operation: 'create',
        target: selections.card,
        value: initial.infoschematic.cards[0]!
      },
      {
        from: 0,
        operation: 'reorder',
        target: { ...selections.card, code: 'C2', id: 'card-two' },
        to: 1
      },
      {
        operation: 'remove',
        target: { ...selections.graphic, id: 'missing-graphic' }
      },
      unsupportedFlowMove
    ])

    expect(result.rejected.map(({ index, reason }) => ({ index, reason }))).toEqual([
      { index: 0, reason: 'duplicate-identity' },
      { index: 1, reason: 'stale-order' },
      { index: 2, reason: 'missing-target' },
      { index: 3, reason: 'invalid-geometry' }
    ])
    expect(result.config).toEqual(initial)
    expect(result.config).not.toBe(initial)
  })
})
