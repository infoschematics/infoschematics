import { describe, expect, it } from 'vitest'
import { defineInfoschematic } from '@infoschematics/domain-core'
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
  planArtefactRemoval,
  recordArtefactOperation,
  recordArtefactOperations,
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
const lane = defineArtefactSelection({
  code: null,
  geometry: 'lane' as const,
  id: 'lane-one',
  kind: 'lane' as const,
})
const zone = defineArtefactSelection({
  code: null,
  geometry: 'zone' as const,
  id: 'zone-one',
  kind: 'zone' as const,
  laneId: 'lane-one',
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
        renderer: 'graphic',
      },
    ],
    lanes: [
      {
        height: 100,
        id: 'lane-one',
        label: 'Lane',
        labelY: 10,
        panel: { height: 100, radius: 4, width: 500, x: 0, y: 0 },
        y: 0,
        zones: [{ fill: '#000', id: 'zone-one', label: 'Zone', width: 200, x: 0 }],
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

  it('creates serialisable operations for all six artefact kinds', () => {
    const operations = [
      createArtefactOperation(card, config.infoschematic.cards[0]!, 0),
      createArtefactOperation(fabric, config.infoschematic.fabrics[0]!, 0),
      createArtefactOperation(flow, config.infoschematic.flows[0]!, 0),
      createArtefactOperation(graphic, config.infoschematic.graphics[0]!, 0),
      createArtefactOperation(lane, config.infoschematic.lanes[0]!, 0),
      createArtefactOperation(zone, config.infoschematic.lanes[0]!.zones[0]!, 0),
    ]

    expect(operations.every(Boolean)).toBe(true)
    expect(operations.map((operation) => operation?.target.kind)).toEqual([
      'card',
      'fabric',
      'flow',
      'graphic',
      'lane',
      'zone',
    ])
    expect(
      operations.map((operation) =>
        operation?.operation === 'create'
          ? createdArtefactDetails(operation)?.geometry.role
          : undefined,
      ),
    ).toEqual(['box', 'box', 'route', 'box', 'lane', 'zone'])
    expect(JSON.parse(JSON.stringify(operations))).toEqual(operations)
    expect(
      [card, fabric, flow, graphic, lane, zone].map((target) =>
        artefactIndex(config, target),
      ),
    ).toEqual([0, 0, 0, 0, 0, 0])
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

  it('cascades endpoint Flows before owners and Lane Zones before Lane', () => {
    const cardPlan = planArtefactRemoval(config, card)
    const fabricPlan = planArtefactRemoval(config, fabric)
    const lanePlan = planArtefactRemoval(config, lane)

    expect(
      cardPlan.operations.map((entry) => `${entry.operation}:${entry.target.kind}`),
    ).toEqual(['remove:flow', 'remove:card'])
    expect(
      fabricPlan.operations.map(
        (entry) => `${entry.operation}:${entry.target.kind}`,
      ),
    ).toEqual(['remove:flow', 'remove:fabric'])
    expect(
      lanePlan.operations.map((entry) => `${entry.operation}:${entry.target.kind}`),
    ).toEqual(['remove:zone', 'remove:lane'])
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
