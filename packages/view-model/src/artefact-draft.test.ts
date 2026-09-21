import type { InfoschematicConfig } from '@infoschematics/domain-model'
import type { CardConfig } from '@infoschematics/domain-model/card'
import type { FabricConfig } from '@infoschematics/domain-model/fabric'
import type { FlowConfig } from '@infoschematics/domain-model/flow'
import type { GraphicConfig } from '@infoschematics/domain-model/graphic'
import type { PointConfig } from '@infoschematics/domain-model/point'
import type { RegionConfig } from '@infoschematics/domain-model/region'
import { describe, expect, it } from 'vitest'
import { type ArtefactDraftOperation, applyArtefactOperations } from './artefact-draft.ts'
import { adapterBoundsFor } from './assembly.ts'
import type { ArtefactSelection } from './editable.ts'
import { portsForBox } from './ports.ts'

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

const point = (id: string, code: string, x: number): PointConfig => ({
  code,
  id,
  label: `${id} label`,
  point: { x, y: 110 },
  ports: { north: 1 },
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
    points: [point('point-one', 'P1', 500), point('point-two', 'P2', 700)],
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
  point: {
    code: 'P1',
    geometry: 'point',
    id: 'point-one',
    kind: 'point'
  },
  region: {
    code: null,
    geometry: 'box',
    id: 'region-one',
    kind: 'region'
  }
} as const satisfies Record<string, ArtefactSelection>

describe('applyArtefactOperations', () => {
  it('creates all six kinds in authored order and deep-copies operation values', () => {
    const initial = config()
    initial.infoschematic.regions = [] as never
    initial.infoschematic.cards = [] as never
    initial.infoschematic.fabrics = [] as never
    initial.infoschematic.flows = [] as never
    initial.infoschematic.graphics = [] as never
    initial.infoschematic.points = [] as never
    const before = structuredClone(initial)
    const createdRegion = region('region-created', 120)
    const createdFabric = fabric('fabric-created', 'FC', 140)
    const createdCard = card('card-created', 'CC', 180)
    const createdFlow = flow('flow-created', 'LC', 'fabric-created', 'card-created')
    const createdGraphic = graphic('graphic-created', 220)
    const createdPoint = point('point-created', 'PC', 260)
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
      },
      {
        at: 0,
        operation: 'create',
        target: {
          code: 'PC',
          geometry: 'point',
          id: 'point-created',
          kind: 'point'
        },
        value: createdPoint
      }
    ]

    const result = applyArtefactOperations(initial, operations)
    ;(createdGraphic.properties as { caption: string }).caption = 'mutated after apply'
    createdRegion.fill = 'mutated after apply'
    createdPoint.point.x = -1

    expect(result.rejected).toEqual([])
    expect(result.config.infoschematic.regions[0]?.id).toBe('region-created')
    expect(result.config.infoschematic.fabrics[0]?.id).toBe('fabric-created')
    expect(result.config.infoschematic.cards[0]?.id).toBe('card-created')
    expect(result.config.infoschematic.flows[0]?.id).toBe('flow-created')
    expect(result.config.infoschematic.graphics[0]?.properties?.caption).toBe('graphic-created caption')
    expect(result.config.infoschematic.regions[0]?.fill).toBe('#eef')
    expect(result.config.infoschematic.points[0]?.id).toBe('point-created')
    // A Point's coordinate is the whole of its geometry, so a shallow copy would let an authored value drift.
    expect(result.config.infoschematic.points[0]?.point).toEqual({ x: 260, y: 110 })
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

  it('moves attached Flow ends with their Card ports', () => {
    const base = config()
    const baseFlow = base.infoschematic.flows[0]
    if (!baseFlow) throw new Error('fixture requires a Flow')
    const initial: InfoschematicConfig = {
      ...base,
      infoschematic: {
        ...base.infoschematic,
        flows: [
          {
            ...baseFlow,
            points: [
              { x: 200, y: 100 },
              { x: 300, y: 100 }
            ]
          }
        ]
      }
    }

    const result = applyArtefactOperations(initial, [
      {
        geometry: { box: { height: 60, width: 100, x: 150, y: 120 }, role: 'box' },
        operation: 'move',
        target: selections.card
      }
    ])

    expect(result.rejected).toEqual([])
    /* The route was two points, which is nobody's drawing: it is what the ports derive. So the derivation is made
       again from the port that moved, leaving and arriving square to the sides it is attached to, rather than the
       old run bent to reach the new port. */
    expect(result.config.infoschematic.flows[0]?.points).toEqual([
      { x: 250, y: 140 },
      { x: 280, y: 140 },
      { x: 280, y: 100 },
      { x: 300, y: 100 }
    ])
  })

  /*
   * A Point moves as the coordinate it is, and takes the Flow ends attached to it.
   *
   * Every port on a Point resolves to the Point's own coordinate, so unlike a Card there is no per-port offset to
   * look up: the whole move is the delta for each attached end. Leaving those ends where they were would detach a
   * Flow from the thing it is authored as attached to, and nothing in the document would say so.
   */
  it('moves a Point as a coordinate and carries its attached Flow ends', () => {
    const base = config()
    const attached = flow('flow-point', 'LP', 'point-one', 'card-two')
    const initial: InfoschematicConfig = {
      ...base,
      infoschematic: {
        ...base.infoschematic,
        flows: [
          {
            ...attached,
            points: [
              { x: 500, y: 110 },
              { x: 600, y: 110 }
            ]
          }
        ]
      }
    }

    const result = applyArtefactOperations(initial, [
      { geometry: { at: { x: 520, y: 150 }, role: 'point' }, operation: 'move', target: selections.point }
    ])
    const moved = result.config.infoschematic.points

    expect(result.rejected).toEqual([])
    expect(moved[0]?.point).toEqual({ x: 520, y: 150 })
    // Nothing else about the Point changes, and it acquires no box.
    expect(moved[0]).toEqual({ ...point('point-one', 'P1', 520), point: { x: 520, y: 150 } })
    expect(moved[1]?.point).toEqual({ x: 700, y: 110 })
    /* The attached end travels and the far end, on a Card nobody moved, stays - and the derived route is derived
       again between the two ports, exactly as a moved Card's route is. */
    expect(result.config.infoschematic.flows[0]?.points).toEqual([
      { x: 520, y: 150 },
      { x: 580, y: 150 },
      { x: 580, y: 110 },
      { x: 600, y: 110 }
    ])
  })

  it('removes a Point together with the Flows attached to it', () => {
    const base = config()
    const initial: InfoschematicConfig = {
      ...base,
      infoschematic: {
        ...base.infoschematic,
        flows: [...base.infoschematic.flows, flow('flow-point', 'LP', 'point-one', 'card-two')]
      }
    }

    const removed = applyArtefactOperations(initial, [{ operation: 'remove', target: selections.point }])

    expect(removed.rejected).toEqual([])
    expect(removed.config.infoschematic.points.map((entry) => entry.id)).toEqual(['point-two'])
    // A Flow whose end has gone cannot be authored, so removing the Point removes it - as it does for a Fabric.
    expect(removed.config.infoschematic.flows.map((entry) => entry.id)).toEqual(['flow-one', 'flow-two'])
  })

  it('moves Flow ends attached to an Adapter when its wrapped Card moves', () => {
    const initial = config()
    const held = initial.infoschematic.cards[0]
    if (!held) throw new Error('fixture requires a held Card')
    const adapter = card('adapter-one', 'A1', 0, held.id)
    const beforeAdapter = adapterBoundsFor(held.placement.box)
    const beforePort = portsForBox(beforeAdapter, adapter.placement.ports).find(({ id }) => id === 'E1')
    if (!beforePort) throw new Error('fixture requires an Adapter east port')
    initial.infoschematic.cards = [...initial.infoschematic.cards, adapter]
    initial.infoschematic.flows = [
      {
        ...flow('flow-adapter', 'LA', adapter.id, 'card-two'),
        points: [beforePort.at, { x: 300, y: beforePort.at.y }]
      }
    ]

    const movedBox = { ...held.placement.box, x: 150, y: 120 }
    const afterPort = portsForBox(adapterBoundsFor(movedBox), adapter.placement.ports).find(({ id }) => id === 'E1')
    if (!afterPort) throw new Error('fixture requires a moved Adapter east port')
    const result = applyArtefactOperations(initial, [
      {
        geometry: { box: movedBox, role: 'box' },
        operation: 'move',
        target: selections.card
      }
    ])

    expect(result.rejected).toEqual([])
    /* The move leaves the Adapter's east port past the port it feeds, so the derived route cannot turn once without
       running back across the Adapter: it turns twice, on a lane midway between the two stubs. */
    expect(result.config.infoschematic.flows[0]?.points).toEqual([
      afterPort.at,
      { x: 290, y: afterPort.at.y },
      { x: 290, y: 150 },
      { x: 280, y: 150 },
      { x: 280, y: beforePort.at.y },
      { x: 300, y: beforePort.at.y }
    ])
  })

  it('moves a newly created Flow with its newly created Card', () => {
    const initial = config()
    initial.infoschematic.cards = []
    initial.infoschematic.flows = []
    const source = card('card-created-source', 'CS', 100)
    const target = card('card-created-target', 'CT', 300)
    const createdFlow = {
      ...flow('flow-created', 'LC', source.id, target.id),
      points: [
        { x: 200, y: 100 },
        { x: 300, y: 100 }
      ]
    }
    const sourceSelection = {
      code: source.code,
      geometry: 'box',
      id: source.id,
      kind: 'card'
    } as const

    const result = applyArtefactOperations(initial, [
      { at: 0, operation: 'create', target: sourceSelection, value: source },
      {
        at: 1,
        operation: 'create',
        target: { code: target.code, geometry: 'box', id: target.id, kind: 'card' },
        value: target
      },
      {
        at: 0,
        operation: 'create',
        target: { code: createdFlow.code, geometry: 'route', id: createdFlow.id, kind: 'flow' },
        value: createdFlow
      },
      {
        geometry: { box: { ...source.placement.box, x: 150, y: 120 }, role: 'box' },
        operation: 'move',
        target: sourceSelection
      }
    ])

    expect(result.rejected).toEqual([])
    expect(result.config.infoschematic.flows[0]?.points).toEqual([
      { x: 250, y: 140 },
      { x: 280, y: 140 },
      { x: 280, y: 100 },
      { x: 300, y: 100 }
    ])
  })

  it('carries an attached end after an earlier route property draft', () => {
    const initial = config()
    const original = initial.infoschematic.flows[0]
    if (!original) throw new Error('fixture requires a Flow')
    const draftedFlow = {
      ...original,
      points: [
        { x: 200, y: 100 },
        { x: 250, y: 100 },
        { x: 250, y: 180 },
        { x: 300, y: 180 }
      ]
    }
    const result = applyArtefactOperations(initial, [
      { operation: 'replace-properties', target: selections.flow, value: draftedFlow },
      {
        geometry: { box: { height: 60, width: 100, x: 150, y: 120 }, role: 'box' },
        operation: 'move',
        target: selections.card
      }
    ])

    expect(result.rejected).toEqual([])
    expect(result.config.infoschematic.flows[0]?.points).toEqual([
      { x: 250, y: 140 },
      { x: 250, y: 140 },
      { x: 250, y: 180 },
      { x: 300, y: 180 }
    ])
  })

  it('replaces all six authored values, including Flow route properties', () => {
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
        target: selections.point,
        value: { ...initial.infoschematic.points[0]!, label: 'Point replaced', ports: { north: 1, west: 1 } }
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
    // A property edit must not disturb the coordinate that is the whole of a Point's geometry.
    expect(result.config.infoschematic.points[0]).toMatchObject({
      label: 'Point replaced',
      point: { x: 500, y: 110 },
      ports: { north: 1, west: 1 }
    })
  })

  it('reorders only inside each fixed authored kind', () => {
    const initial = config()
    const secondSelections = {
      card: { ...selections.card, code: 'C2', id: 'card-two' },
      fabric: { ...selections.fabric, code: 'F2', id: 'fabric-two' },
      flow: { ...selections.flow, code: 'L2', id: 'flow-two' },
      graphic: { ...selections.graphic, id: 'graphic-two' },
      point: { ...selections.point, code: 'P2', id: 'point-two' },
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
    expect(result.config.infoschematic.points.map(({ id }) => id)).toEqual(['point-two', 'point-one'])
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
