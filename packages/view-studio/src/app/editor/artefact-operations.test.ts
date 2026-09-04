import { describe, expect, it } from 'vitest'
import { defineInfoschematic } from '@infoschematics/domain-core'
import {
  applyArtefactOperations,
  type ArtefactDraftOperation,
} from '@infoschematics/view-model/artefact-draft'
import {
  artefactCan,
  createArtefactOperation,
  defineArtefactSelection,
  moveArtefactOperation,
  removeArtefactOperation,
  reorderArtefactOperation,
  resizeArtefactOperation,
} from '@infoschematics/view-model/editable'
import {
  applyDiscreteDraft,
  applyGestureDraft,
  beginDraftGesture,
  createEditorDraftHistory,
  emptyEditorDraft,
  endDraftGesture,
  redoEditorDraft,
  undoEditorDraft,
} from './editor-draft.ts'
import {
  artefactIndex,
  artefactOperationKey,
  artefactSourceChanges,
  createdArtefactDetails,
  discardArtefactOperation,
  effectiveArtefactOperation,
  effectiveArtefactValue,
  planArtefactRemoval,
  recordArtefactOperation,
  recordArtefactOperations,
  replaceArtefactPropertiesOperation,
} from './artefact-operations.ts'

const card = defineArtefactSelection({
  code: 'CARD-01',
  geometry: 'box' as const,
  id: 'card-one',
  kind: 'card' as const,
})
const fabric = defineArtefactSelection({
  code: 'FABRIC-01',
  geometry: 'box' as const,
  id: 'fabric-one',
  kind: 'fabric' as const,
})
const flow = defineArtefactSelection({
  code: 'FLOW-01',
  geometry: 'route' as const,
  id: 'flow-one',
  kind: 'flow' as const,
})
const graphic = defineArtefactSelection({
  code: null,
  geometry: 'box' as const,
  id: 'graphic-one',
  kind: 'graphic' as const,
})
const region = defineArtefactSelection({
  code: null,
  geometry: 'box' as const,
  id: 'region-one',
  kind: 'region' as const,
})

const config = defineInfoschematic({
  title: 'Operations',
  infoschematic: {
    cards: [
      {
        code: 'CARD-01',
        detail: 'Card',
        id: 'card-one',
        label: 'Card',
        placement: { box: { height: 80, width: 120, x: 20, y: 30 } },
        scope: 'scope',
        scopes: ['scope'],
      },
    ],
    fabrics: [
      {
        appearance: {
          caption: 'Fabric caption',
          properties: { emphasis: true, rank: 2 },
          renderer: 'fabric-special',
        },
        code: 'FABRIC-01',
        detail: 'Fabric',
        id: 'fabric-one',
        label: 'Fabric',
        placement: { box: { height: 100, width: 180, x: 300, y: 30 } },
        scope: 'scope',
        scopes: ['scope'],
      },
    ],
    flows: [
      {
        code: 'FLOW-01',
        family: 'family',
        id: 'flow-one',
        points: [
          { x: 140, y: 70 },
          { x: 300, y: 70 },
        ],
        source: 'card-one',
        sourcePort: 'E1',
        target: 'fabric-one',
        targetPort: 'W1',
      },
    ],
    graphics: [
      {
        id: 'graphic-one',
        placement: { height: 60, width: 80, x: 100, y: 100 },
        properties: { caption: 'Graphic caption', opacity: 0.8 },
        renderer: 'graphic-special',
      },
    ],
    regions: [
      {
        box: { height: 100, radius: 4, width: 500, x: 0, y: 0 },
        fill: '#000',
        frame: { style: 'solid' },
        id: 'region-one',
        label: 'Region',
      },
    ],
  },
  stories: [
    {
      code: 'STORY-01',
      id: 'story-one',
      scenes: [{ graphic: 'graphic-one' }],
      title: 'Story',
    },
  ],
})

describe('typed artefact operation lifecycle', () => {
  it('retains negative Flow geometry capabilities for command gating', () => {
    expect(artefactCan('flow', 'move')).toBe(false)
    expect(artefactCan('flow', 'resize')).toBe(false)
    expect(
      moveArtefactOperation(
        flow,
        { points: config.infoschematic.flows[0]!.points, role: 'route' },
        { dx: 1, dy: 1 },
      ),
    ).toBeUndefined()
    expect(
      resizeArtefactOperation(
        flow,
        { points: config.infoschematic.flows[0]!.points, role: 'route' },
        { height: 10, width: 10 },
      ),
    ).toBeUndefined()
  })

  it('creates serialisable operations for all five artefact kinds', () => {
    const operations = [
      createArtefactOperation(card, config.infoschematic.cards[0]!, 0),
      createArtefactOperation(fabric, config.infoschematic.fabrics[0]!, 0),
      createArtefactOperation(flow, config.infoschematic.flows[0]!, 0),
      createArtefactOperation(graphic, config.infoschematic.graphics[0]!, 0),
      createArtefactOperation(region, config.infoschematic.regions[0]!, 0),
    ]

    expect(operations.every(Boolean)).toBe(true)
    expect(operations.map((operation) => operation?.target.kind)).toEqual([
      'card',
      'fabric',
      'flow',
      'graphic',
      'region',
    ])
    expect(
      operations.map((operation) =>
        operation?.operation === 'create'
          ? createdArtefactDetails(operation)?.geometry.role
          : undefined,
      ),
    ).toEqual(['box', 'box', 'route', 'box', 'box'])
    expect(JSON.parse(JSON.stringify(operations))).toEqual(operations)
    expect(
      [card, fabric, flow, graphic, region].map((target) =>
        artefactIndex(config, target),
      ),
    ).toEqual([0, 0, 0, 0, 0])
  })

  it('replaces partial properties for all five kinds without losing authored fields', () => {
    const replacements = [
      replaceArtefactPropertiesOperation(config, [], card, {
        kind: 'card',
        value: { detail: 'Card replaced', placement: { box: { x: 25 } } },
      }),
      replaceArtefactPropertiesOperation(config, [], fabric, {
        kind: 'fabric',
        value: { appearance: { caption: 'Fabric replaced' } },
      }),
      replaceArtefactPropertiesOperation(config, [], flow, {
        kind: 'flow',
        value: { dashed: true },
      }),
      replaceArtefactPropertiesOperation(config, [], graphic, {
        kind: 'graphic',
        value: { properties: { opacity: 1 } },
      }),
      replaceArtefactPropertiesOperation(config, [], region, {
        kind: 'region',
        value: { fill: '#abc', label: 'Region replaced' },
      }),
    ]
    expect(replacements.every(Boolean)).toBe(true)
    const operations = replacements.filter(
      (operation): operation is NonNullable<typeof operation> => Boolean(operation),
    ) as readonly ArtefactDraftOperation[]
    const materialised = applyArtefactOperations(config, operations)

    expect(materialised.rejected).toEqual([])
    expect(materialised.config.infoschematic.cards[0]).toMatchObject({
      code: 'CARD-01',
      detail: 'Card replaced',
      placement: {
        ...config.infoschematic.cards[0]!.placement,
        box: { ...config.infoschematic.cards[0]!.placement.box, x: 25 },
      },
      scope: 'scope',
    })
    expect(materialised.config.infoschematic.fabrics[0]).toMatchObject({
      appearance: {
        caption: 'Fabric replaced',
        properties: { emphasis: true, rank: 2 },
        renderer: 'fabric-special',
      },
      placement: config.infoschematic.fabrics[0]!.placement,
    })
    expect(materialised.config.infoschematic.flows[0]).toMatchObject({
      dashed: true,
      family: 'family',
      points: config.infoschematic.flows[0]!.points,
      source: 'card-one',
      sourcePort: 'E1',
      target: 'fabric-one',
      targetPort: 'W1',
    })
    expect(materialised.config.infoschematic.graphics[0]).toMatchObject({
      placement: config.infoschematic.graphics[0]!.placement,
      properties: { caption: 'Graphic caption', opacity: 1 },
      renderer: 'graphic-special',
    })
    expect(materialised.config.infoschematic.regions[0]).toEqual({
      ...config.infoschematic.regions[0],
      fill: '#abc',
      label: 'Region replaced',
    })
    expect(JSON.parse(JSON.stringify(operations))).toEqual(operations)
    expect(operations.every(Object.isFrozen)).toBe(true)
    expect(
      artefactSourceChanges(operations).map((change) => change.target.kind),
    ).toEqual(['region', 'fabric', 'card', 'graphic', 'flow'])
  })

  it('coalesces property edits and keeps them undoable, discardable and ordered', () => {
    const first = replaceArtefactPropertiesOperation(config, [], card, {
      kind: 'card',
      value: { detail: 'First detail' },
    })!
    const once = recordArtefactOperation([], first)
    const latest = replaceArtefactPropertiesOperation(config, once, card, {
      kind: 'card',
      value: { label: 'Latest label' },
    })!
    const operations = recordArtefactOperation(once, latest)

    expect(operations).toEqual([latest])
    expect(effectiveArtefactValue(config, operations, card)).toMatchObject({
      detail: 'First detail',
      label: 'Latest label',
    })
    expect(artefactSourceChanges(operations)).toHaveLength(1)
    expect(artefactSourceChanges(operations)[0]?.source).toContain(
      'replace card',
    )
    expect(
      discardArtefactOperation(operations, artefactOperationKey(latest)),
    ).toEqual([])

    const changed = {
      ...emptyEditorDraft(),
      artefactOperations:
        operations as ReturnType<typeof emptyEditorDraft>['artefactOperations'],
    }
    const history = applyDiscreteDraft(
      createEditorDraftHistory(emptyEditorDraft()),
      changed,
    )
    expect(undoEditorDraft(history).current.artefactOperations).toEqual([])
    expect(redoEditorDraft(undoEditorDraft(history)).current).toEqual(changed)
  })

  it('rejects a property patch for the wrong selected kind', () => {
    expect(
      replaceArtefactPropertiesOperation(config, [], flow, {
        kind: 'card',
        value: { detail: 'Wrong kind' },
      }),
    ).toBeUndefined()
  })

  it('materialises the latest value for a newly-created target', () => {
    const target = defineArtefactSelection({
      code: 'CARD-NEW',
      geometry: 'box' as const,
      id: 'card-new',
      kind: 'card' as const,
    })
    const value = {
      ...config.infoschematic.cards[0]!,
      code: 'CARD-NEW',
      id: 'card-new',
      label: 'New card',
    }
    const created = createArtefactOperation(target, value, 1)!
    const replaced = replaceArtefactPropertiesOperation(
      config,
      [created],
      target,
      { kind: 'card', value: { detail: 'Edited before rebuild' } },
    )!
    const operations = recordArtefactOperation([created], replaced)

    expect(effectiveArtefactValue(config, operations, target)).toMatchObject({
      detail: 'Edited before rebuild',
      label: 'New card',
      placement: value.placement,
    })
    expect(effectiveArtefactOperation(operations, target)).toEqual(replaced)
  })

  it('coalesces repeated geometry changes and stays serialisable', () => {
    const first = moveArtefactOperation(
      card,
      { box: { height: 80, width: 120, x: 20, y: 30 }, role: 'box' },
      { dx: 10, dy: 0 },
    )
    const latest = moveArtefactOperation(
      card,
      { box: { height: 80, width: 120, x: 20, y: 30 }, role: 'box' },
      { dx: 30, dy: 20 },
    )
    const resized = resizeArtefactOperation(
      card,
      { box: { height: 80, width: 120, x: 20, y: 30 }, role: 'box' },
      { height: 100, width: 160 },
    )
    const operations = recordArtefactOperations(
      [],
      [first, latest, resized].filter(Boolean) as NonNullable<
        typeof first | typeof latest | typeof resized
      >[],
    )

    expect(operations).toHaveLength(2)
    expect(operations.find((entry) => entry.operation === 'move')).toEqual(latest)
    expect(JSON.parse(JSON.stringify(operations))).toEqual(operations)
  })

  it('unmakes an artefact created and removed in the same draft', () => {
    const created = createArtefactOperation(card, config.infoschematic.cards[0]!, 0)!

    expect(
      recordArtefactOperation([created], removeArtefactOperation(card)),
    ).toEqual([])
  })

  it('coalesces reorders from the authored index and unmakes a return', () => {
    const first = reorderArtefactOperation(card, 0, 1, 3)!
    const next = reorderArtefactOperation(card, 1, 2, 3)!
    const back = reorderArtefactOperation(card, 2, 0, 3)!

    expect(recordArtefactOperations([], [first, next])).toEqual([
      { ...next, from: 0 },
    ])
    expect(recordArtefactOperations([], [first, next, back])).toEqual([])
  })

  it('cascades endpoint Flows before owners and removes a Region alone', () => {
    const cardPlan = planArtefactRemoval(config, card)
    const fabricPlan = planArtefactRemoval(config, fabric)
    const regionPlan = planArtefactRemoval(config, region)

    expect(
      cardPlan.operations.map((entry) => `${entry.operation}:${entry.target.kind}`),
    ).toEqual(['remove:flow', 'remove:card'])
    expect(
      fabricPlan.operations.map(
        (entry) => `${entry.operation}:${entry.target.kind}`,
      ),
    ).toEqual(['remove:flow', 'remove:fabric'])
    expect(
      regionPlan.operations.map((entry) => `${entry.operation}:${entry.target.kind}`),
    ).toEqual(['remove:region'])
  })

  it('blocks a Graphic referenced by Story with an explicit reason', () => {
    expect(planArtefactRemoval(config, graphic)).toEqual({
      blockedReason: 'Graphic graphic-one is referenced by a Story',
      operations: [],
    })
  })

  it('orders source rows deterministically and dependency-safely', () => {
    const changes = artefactSourceChanges([
      removeArtefactOperation(card),
      removeArtefactOperation(flow),
      removeArtefactOperation(fabric),
    ])

    expect(changes.map(({ target }) => target.kind)).toEqual([
      'flow',
      'card',
      'fabric',
    ])
    expect(changes.map(({ key }) => key)).toEqual(
      changes.map(({ target }) => `${target.kind}:${target.id}:remove`),
    )
  })

  it('groups a pointer gesture into one undo step and restores its latest edit', () => {
    const first = moveArtefactOperation(
      card,
      { box: { height: 80, width: 120, x: 20, y: 30 }, role: 'box' },
      { dx: 10, dy: 0 },
    )!
    const latest = moveArtefactOperation(
      card,
      { box: { height: 80, width: 120, x: 20, y: 30 }, role: 'box' },
      { dx: 30, dy: 0 },
    )!
    let history = beginDraftGesture(createEditorDraftHistory(emptyEditorDraft()))
    history = applyGestureDraft(history, {
      ...history.current,
      artefactOperations: recordArtefactOperation(
        history.current.artefactOperations,
        first,
      ),
    })
    history = applyGestureDraft(history, {
      ...history.current,
      artefactOperations: recordArtefactOperation(
        history.current.artefactOperations,
        latest,
      ),
    })
    history = endDraftGesture(history)

    expect(history.past).toHaveLength(1)
    const undone = undoEditorDraft(history)
    expect(undone.current.artefactOperations).toEqual([])
    expect(redoEditorDraft(undone).current.artefactOperations).toEqual([latest])
    expect(artefactOperationKey(latest)).toBe('card:card-one:move')
  })
})
