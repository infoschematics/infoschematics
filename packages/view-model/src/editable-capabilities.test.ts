import { describe, expect, it } from 'vitest'
import type { CardConfig } from '@infoschematics/domain-model/card'
import type { FlowConfig } from '@infoschematics/domain-model/flow'
import type { LaneConfig } from '@infoschematics/domain-model/lane'
import type { ZoneConfig } from '@infoschematics/domain-model/zone'
import {
  artefactCan,
  artefactCapabilities,
  createArtefactOperation,
  defineArtefactSelection,
  moveArtefactOperation,
  orderArtefactOperations,
  removeArtefactOperation,
  reorderArtefactOperation,
  resizeArtefactOperation,
  type ArtefactKind,
  type ArtefactOperation,
  type ArtefactSelection,
} from './editable.ts'

const laneSelection = defineArtefactSelection({
  code: null,
  geometry: 'lane',
  id: 'lane-one',
  kind: 'lane',
})
const zoneSelection = defineArtefactSelection({
  code: null,
  geometry: 'zone',
  id: 'zone-one',
  kind: 'zone',
  laneId: 'lane-one',
})
const cardSelection = defineArtefactSelection({
  code: 'CARD-01',
  geometry: 'box',
  id: 'card-one',
  kind: 'card',
})
const fabricSelection = defineArtefactSelection({
  code: 'FABRIC-01',
  geometry: 'box',
  id: 'fabric-one',
  kind: 'fabric',
})
const flowSelection = defineArtefactSelection({
  code: 'FLOW-01',
  geometry: 'route',
  id: 'flow-one',
  kind: 'flow',
})
const graphicSelection = defineArtefactSelection({
  code: null,
  geometry: 'box',
  id: 'graphic-one',
  kind: 'graphic',
})

const lane: LaneConfig = {
  height: 80,
  id: 'lane-one',
  label: 'Lane one',
  labelY: 20,
  panel: { height: 80, radius: 8, width: 400, x: 0, y: 10 },
  y: 10,
  zones: [],
}
const zone: ZoneConfig = {
  fill: '#112233',
  id: 'zone-one',
  label: 'Zone one',
  width: 100,
  x: 20,
}
const card: CardConfig = {
  code: 'CARD-01',
  detail: 'A card',
  id: 'card-one',
  label: 'Card one',
  placement: { box: { height: 80, width: 120, x: 30, y: 40 } },
  scope: 'scope-one',
  scopes: ['scope-one'],
}
const flow: FlowConfig = {
  code: 'FLOW-01',
  family: 'family-one',
  id: 'flow-one',
  points: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ],
  source: 'card-one',
  sourcePort: 'E1',
  target: 'card-two',
  targetPort: 'W1',
}

describe('artefact capability matrix', () => {
  const kinds: readonly ArtefactKind[] = [
    'lane',
    'zone',
    'fabric',
    'card',
    'flow',
    'graphic',
  ]

  it('covers every supported operation for all six kinds', () => {
    expect(Object.keys(artefactCapabilities)).toEqual(
      expect.arrayContaining([...kinds]),
    )
    for (const kind of kinds) {
      expect(artefactCan(kind, 'create')).toBe(true)
      expect(artefactCan(kind, 'select')).toBe(true)
      expect(artefactCan(kind, 'edit-properties')).toBe(true)
      expect(artefactCan(kind, 'remove')).toBe(true)
      expect(artefactCan(kind, 'reorder')).toBe(true)
    }
    expect(artefactCan('flow', 'move')).toBe(false)
    expect(artefactCan('flow', 'resize')).toBe(false)
  })

  it('retains stable identity and kind-specific geometry role', () => {
    const selections: readonly ArtefactSelection[] = [
      laneSelection,
      zoneSelection,
      fabricSelection,
      cardSelection,
      flowSelection,
      graphicSelection,
    ]

    expect(selections.map(({ kind, geometry, id, code }) => ({ kind, geometry, id, code }))).toEqual([
      { code: null, geometry: 'lane', id: 'lane-one', kind: 'lane' },
      { code: null, geometry: 'zone', id: 'zone-one', kind: 'zone' },
      { code: 'FABRIC-01', geometry: 'box', id: 'fabric-one', kind: 'fabric' },
      { code: 'CARD-01', geometry: 'box', id: 'card-one', kind: 'card' },
      { code: 'FLOW-01', geometry: 'route', id: 'flow-one', kind: 'flow' },
      { code: null, geometry: 'box', id: 'graphic-one', kind: 'graphic' },
    ])
    expect(selections.every(Object.isFrozen)).toBe(true)
  })
})

describe('serialisable immutable operations', () => {
  it('creates only matching authored values and deep-freezes snapshots', () => {
    const operation = createArtefactOperation(cardSelection, card, 2)

    expect(operation).toMatchObject({ at: 2, operation: 'create', target: cardSelection })
    expect(Object.isFrozen(operation)).toBe(true)
    expect(Object.isFrozen(operation?.value)).toBe(true)
    expect(Object.isFrozen(operation?.value.scopes)).toBe(true)
    expect(JSON.parse(JSON.stringify(operation))).toEqual(operation)
    expect(
      createArtefactOperation(
        cardSelection,
        { ...card, id: 'different-card' },
        2,
      ),
    ).toBeUndefined()
  })

  it('moves only axes represented by each geometry role and clamps bounds', () => {
    const bounds = { height: 200, width: 300, x: 0, y: 0 }
    const movedLane = moveArtefactOperation(
      laneSelection,
      { height: 50, role: 'lane', y: 20 },
      { dx: 100, dy: 180 },
      bounds,
    )
    const movedZone = moveArtefactOperation(
      zoneSelection,
      { laneId: 'lane-one', role: 'zone', width: 50, x: 20 },
      { dx: 280, dy: 100 },
      bounds,
    )
    const movedCard = moveArtefactOperation(
      cardSelection,
      { box: { height: 40, width: 60, x: 20, y: 20 }, role: 'box' },
      { dx: 400, dy: -100 },
      bounds,
    )

    expect(movedLane?.geometry).toEqual({ height: 50, role: 'lane', y: 150 })
    expect(movedZone?.geometry).toEqual({
      laneId: 'lane-one',
      role: 'zone',
      width: 50,
      x: 250,
    })
    expect(movedCard?.geometry).toEqual({
      box: { height: 40, width: 60, x: 240, y: 0 },
      role: 'box',
    })
    expect(
      moveArtefactOperation(
        flowSelection,
        { points: flow.points, role: 'route' },
        { dx: 10, dy: 10 },
      ),
    ).toBeUndefined()
  })

  it('enforces kind minima while fixed Lane and Zone axes stay absent', () => {
    const resizedLane = resizeArtefactOperation(
      laneSelection,
      { height: 80, role: 'lane', y: 10 },
      { height: 2, width: 999 },
    )
    const resizedZone = resizeArtefactOperation(
      zoneSelection,
      { laneId: 'lane-one', role: 'zone', width: 100, x: 20 },
      { height: 999, width: 2 },
    )
    const resizedCard = resizeArtefactOperation(
      cardSelection,
      { box: card.placement.box, role: 'box' },
      { height: 1, width: 1 },
    )

    expect(resizedLane?.geometry).toEqual({ height: 20, role: 'lane', y: 10 })
    expect(resizedLane?.geometry).not.toHaveProperty('width')
    expect(resizedZone?.geometry).toEqual({
      laneId: 'lane-one',
      role: 'zone',
      width: 20,
      x: 20,
    })
    expect(resizedZone?.geometry).not.toHaveProperty('height')
    expect(resizedCard?.geometry).toMatchObject({
      box: { height: 40, width: 40 },
      role: 'box',
    })
  })

  it('normalises reorder indices and keeps removal total', () => {
    expect(reorderArtefactOperation(cardSelection, -2, 8, 3)).toMatchObject({
      from: 0,
      operation: 'reorder',
      to: 2,
    })
    expect(reorderArtefactOperation(cardSelection, 0, 1, 0)).toBeUndefined()
    expect(removeArtefactOperation(cardSelection)).toEqual({
      operation: 'remove',
      target: cardSelection,
    })
  })
})

describe('dependency-safe operation ordering', () => {
  it('creates containers and endpoints first, then removes dependants first', () => {
    const createLane = createArtefactOperation(laneSelection, lane, 0)
    const createZone = createArtefactOperation(zoneSelection, zone, 0)
    const createCard = createArtefactOperation(cardSelection, card, 0)
    const createFlow = createArtefactOperation(flowSelection, flow, 0)
    const operations: ArtefactOperation[] = [
      createFlow!,
      createZone!,
      createCard!,
      createLane!,
      removeArtefactOperation(laneSelection),
      removeArtefactOperation(cardSelection),
      removeArtefactOperation(flowSelection),
      removeArtefactOperation(zoneSelection),
    ]

    expect(
      orderArtefactOperations(operations).map(
        (operation) => `${operation.operation}:${operation.target.kind}`,
      ),
    ).toEqual([
      'create:lane',
      'create:zone',
      'create:card',
      'create:flow',
      'remove:flow',
      'remove:card',
      'remove:zone',
      'remove:lane',
    ])
    expect(orderArtefactOperations(operations)).not.toBe(operations)
    expect(Object.isFrozen(orderArtefactOperations(operations))).toBe(true)
  })
})
