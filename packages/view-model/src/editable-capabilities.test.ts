import type { CardConfig } from '@infoschematics/domain-model/card'
import type { FlowConfig } from '@infoschematics/domain-model/flow'
import type { RegionConfig } from '@infoschematics/domain-model/region'
import { describe, expect, it } from 'vitest'
import {
  type AlignEdge,
  type ArtefactKind,
  type ArtefactOperation,
  type ArtefactSelection,
  type ArtefactSelectionSet,
  alignOffsets,
  artefactCan,
  artefactCapabilities,
  artefactKinds,
  createArtefactOperation,
  defineArtefactSelection,
  distributeOffsets,
  everyInteractionLayer,
  groupMovableSelection,
  interactionLayerOpen,
  movableBox,
  moveArtefactOperation,
  orderArtefactOperations,
  removeArtefactOperation,
  reorderArtefactOperation,
  resizeArtefactOperation,
  sameArtefact,
  selectionAnchor,
  selectionSetWithinLayers,
  selectionWithinLayers,
  toggleArtefactSelection,
  toggleInteractionLayer
} from './editable.ts'

const regionSelection = defineArtefactSelection({
  code: null,
  geometry: 'box',
  id: 'region-one',
  kind: 'region'
})
const cardSelection = defineArtefactSelection({
  code: 'CARD-01',
  geometry: 'box',
  id: 'card-one',
  kind: 'card'
})
const fabricSelection = defineArtefactSelection({
  code: 'FABRIC-01',
  geometry: 'box',
  id: 'fabric-one',
  kind: 'fabric'
})
const flowSelection = defineArtefactSelection({
  code: 'FLOW-01',
  geometry: 'route',
  id: 'flow-one',
  kind: 'flow'
})
const graphicSelection = defineArtefactSelection({
  code: null,
  geometry: 'box',
  id: 'graphic-one',
  kind: 'graphic'
})
const pointSelection = defineArtefactSelection({
  code: 'POINT-01',
  geometry: 'point',
  id: 'point-one',
  kind: 'point'
})

const region: RegionConfig = {
  box: { height: 80, radius: 8, width: 400, x: 0, y: 10 },
  frame: { style: 'solid' },
  id: 'region-one',
  label: 'Region one'
}
const card: CardConfig = {
  code: 'CARD-01',
  detail: 'A card',
  id: 'card-one',
  label: 'Card one',
  placement: { box: { height: 80, width: 120, x: 30, y: 40 } },
  scope: 'scope-one',
  scopes: ['scope-one']
}
const flow: FlowConfig = {
  code: 'FLOW-01',
  family: 'family-one',
  id: 'flow-one',
  points: [
    { x: 0, y: 0 },
    { x: 100, y: 0 }
  ],
  source: 'card-one',
  sourcePort: 'E1',
  target: 'card-two',
  targetPort: 'W1'
}

describe('artefact capability matrix', () => {
  const kinds: readonly ArtefactKind[] = ['region', 'fabric', 'card', 'point', 'flow', 'graphic']

  it('covers every supported operation for all six kinds', () => {
    expect(Object.keys(artefactCapabilities)).toEqual(expect.arrayContaining([...kinds]))
    for (const kind of kinds) {
      expect(artefactCan(kind, 'create')).toBe(true)
      expect(artefactCan(kind, 'select')).toBe(true)
      expect(artefactCan(kind, 'edit-properties')).toBe(true)
      expect(artefactCan(kind, 'remove')).toBe(true)
      expect(artefactCan(kind, 'reorder')).toBe(true)
    }
    expect(artefactCan('region', 'move')).toBe(true)
    expect(artefactCan('region', 'resize')).toBe(true)
    expect(artefactCan('flow', 'move')).toBe(false)
    expect(artefactCan('flow', 'resize')).toBe(false)
    /* A Point is the only kind that moves and cannot be resized. `EDIT-008` requires it to move as a coordinate
       without acquiring box geometry, and a resize is the operation that would have to give it one. */
    expect(artefactCan('point', 'move')).toBe(true)
    expect(artefactCan('point', 'resize')).toBe(false)
  })

  it('retains stable identity and kind-specific geometry role', () => {
    const selections: readonly ArtefactSelection[] = [
      regionSelection,
      fabricSelection,
      cardSelection,
      pointSelection,
      flowSelection,
      graphicSelection
    ]

    expect(selections.map(({ kind, geometry, id, code }) => ({ kind, geometry, id, code }))).toEqual([
      { code: null, geometry: 'box', id: 'region-one', kind: 'region' },
      { code: 'FABRIC-01', geometry: 'box', id: 'fabric-one', kind: 'fabric' },
      { code: 'CARD-01', geometry: 'box', id: 'card-one', kind: 'card' },
      { code: 'POINT-01', geometry: 'point', id: 'point-one', kind: 'point' },
      { code: 'FLOW-01', geometry: 'route', id: 'flow-one', kind: 'flow' },
      { code: null, geometry: 'box', id: 'graphic-one', kind: 'graphic' }
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
    expect(createArtefactOperation(cardSelection, { ...card, id: 'different-card' }, 2)).toBeUndefined()
  })

  it('moves boxes on both axes, clamps bounds, and refuses routes', () => {
    const bounds = { height: 200, width: 300, x: 0, y: 0 }
    const movedRegion = moveArtefactOperation(
      regionSelection,
      { box: { height: 50, width: 50, x: 20, y: 20 }, role: 'box' },
      { dx: 280, dy: 180 },
      bounds
    )
    const movedCard = moveArtefactOperation(
      cardSelection,
      { box: { height: 40, width: 60, x: 20, y: 20 }, role: 'box' },
      { dx: 400, dy: -100 },
      bounds
    )

    expect(movedRegion?.geometry).toEqual({
      box: { height: 50, width: 50, x: 250, y: 150 },
      role: 'box'
    })
    expect(movedCard?.geometry).toEqual({
      box: { height: 40, width: 60, x: 240, y: 0 },
      role: 'box'
    })
    expect(
      moveArtefactOperation(flowSelection, { points: flow.points, role: 'route' }, { dx: 10, dy: 10 })
    ).toBeUndefined()
  })

  it('enforces kind minima on both region axes', () => {
    const resizedRegion = resizeArtefactOperation(
      regionSelection,
      { box: { height: 80, width: 100, x: 20, y: 10 }, role: 'box' },
      { height: 2, width: 2 }
    )
    const resizedCard = resizeArtefactOperation(
      cardSelection,
      { box: card.placement.box, role: 'box' },
      { height: 1, width: 1 }
    )

    expect(resizedRegion?.geometry).toEqual({
      box: { height: 20, width: 20, x: 20, y: 10 },
      role: 'box'
    })
    expect(resizedCard?.geometry).toMatchObject({
      box: { height: 40, width: 40 },
      role: 'box'
    })
  })

  it('normalises reorder indices and keeps removal total', () => {
    expect(reorderArtefactOperation(cardSelection, -2, 8, 3)).toMatchObject({
      from: 0,
      operation: 'reorder',
      to: 2
    })
    expect(reorderArtefactOperation(cardSelection, 0, 1, 0)).toBeUndefined()
    expect(removeArtefactOperation(cardSelection)).toEqual({
      operation: 'remove',
      target: cardSelection
    })
  })
})

describe('dependency-safe operation ordering', () => {
  it('creates geography and endpoints first, then removes dependants first', () => {
    const createRegion = createArtefactOperation(regionSelection, region, 0)
    const createCard = createArtefactOperation(cardSelection, card, 0)
    const createFlow = createArtefactOperation(flowSelection, flow, 0)
    const operations: ArtefactOperation[] = [
      createFlow!,
      createCard!,
      createRegion!,
      removeArtefactOperation(regionSelection),
      removeArtefactOperation(cardSelection),
      removeArtefactOperation(flowSelection)
    ]

    expect(
      orderArtefactOperations(operations).map((operation) => `${operation.operation}:${operation.target.kind}`)
    ).toEqual(['create:region', 'create:card', 'create:flow', 'remove:flow', 'remove:card', 'remove:region'])
    expect(orderArtefactOperations(operations)).not.toBe(operations)
    expect(Object.isFrozen(orderArtefactOperations(operations))).toBe(true)
  })
})

describe('Design-session interaction layers', () => {
  it('opens every kind the capability matrix covers', () => {
    expect([...artefactKinds].sort()).toEqual(Object.keys(artefactCapabilities).sort())
    expect([...everyInteractionLayer()].sort()).toEqual([...artefactKinds].sort())
    for (const kind of artefactKinds) expect(interactionLayerOpen(kind, everyInteractionLayer())).toBe(true)
  })

  it('reads an absent set as an unfiltered session rather than a closed one', () => {
    for (const kind of artefactKinds) expect(interactionLayerOpen(kind)).toBe(true)
    expect(interactionLayerOpen('card', new Set())).toBe(false)
  })

  it('closes and reopens one kind without disturbing the others', () => {
    const closed = toggleInteractionLayer(everyInteractionLayer(), 'graphic')

    expect(interactionLayerOpen('graphic', closed)).toBe(false)
    expect(artefactKinds.filter((kind) => interactionLayerOpen(kind, closed))).toEqual([
      'region',
      'fabric',
      'card',
      'point',
      'flow'
    ])
    expect([...toggleInteractionLayer(closed, 'graphic')].sort()).toEqual([...artefactKinds].sort())
    expect(interactionLayerOpen('graphic', everyInteractionLayer())).toBe(true)
  })

  it('drops a selection whose layer has closed and keeps every other', () => {
    const withoutCards = toggleInteractionLayer(everyInteractionLayer(), 'card')

    expect(selectionWithinLayers(cardSelection, withoutCards)).toBeNull()
    expect(selectionWithinLayers(flowSelection, withoutCards)).toBe(flowSelection)
    expect(selectionWithinLayers(cardSelection, everyInteractionLayer())).toBe(cardSelection)
    expect(selectionWithinLayers(cardSelection)).toBe(cardSelection)
    expect(selectionWithinLayers(null, withoutCards)).toBeNull()
  })
})

describe('Ordered multi-selection', () => {
  const graphicSelection = defineArtefactSelection({
    code: null,
    geometry: 'box',
    id: 'graphic-one',
    kind: 'graphic'
  })

  it('keeps the element chosen first as the anchor however the group grows', () => {
    const built = [cardSelection, regionSelection, graphicSelection].reduce<ArtefactSelectionSet>(
      (selection, artefact) => toggleArtefactSelection(selection, artefact),
      []
    )

    expect(built.map((artefact) => artefact.id)).toEqual(['card-one', 'region-one', 'graphic-one'])
    expect(selectionAnchor(built)).toBe(cardSelection)
    expect(selectionAnchor([])).toBeNull()
  })

  it('promotes the next element when the anchor is taken back out', () => {
    const built = toggleArtefactSelection(toggleArtefactSelection([cardSelection], regionSelection), graphicSelection)
    const withoutAnchor = toggleArtefactSelection(built, cardSelection)

    expect(withoutAnchor.map((artefact) => artefact.id)).toEqual(['region-one', 'graphic-one'])
    expect(selectionAnchor(withoutAnchor)).toBe(regionSelection)
    expect(toggleArtefactSelection(withoutAnchor, cardSelection).map((artefact) => artefact.id)).toEqual([
      'region-one',
      'graphic-one',
      'card-one'
    ])
  })

  it('identifies an element by kind and id, whatever geometry it carries', () => {
    expect(sameArtefact(cardSelection, { ...cardSelection, code: 'RENAMED' })).toBe(true)
    expect(sameArtefact(cardSelection, regionSelection)).toBe(false)
    expect(sameArtefact(cardSelection, { ...cardSelection, kind: 'graphic' })).toBe(false)
  })

  it('takes a closed layer out of a group exactly as it does out of a single selection', () => {
    const withoutCards = toggleInteractionLayer(everyInteractionLayer(), 'card')
    const group: ArtefactSelectionSet = [cardSelection, regionSelection, flowSelection]

    expect(selectionSetWithinLayers(group, withoutCards).map((artefact) => artefact.id)).toEqual([
      'region-one',
      'flow-one'
    ])
    expect(selectionSetWithinLayers(group, everyInteractionLayer())).toEqual(group)
    expect(selectionSetWithinLayers(group)).toEqual(group)
    expect(selectionSetWithinLayers([cardSelection], withoutCards)).toEqual([])
  })

  it('reads participation out of the capability matrix, so a Flow never joins a group move', () => {
    const group: ArtefactSelectionSet = [cardSelection, flowSelection, regionSelection, pointSelection]

    expect(groupMovableSelection(group).map((artefact) => artefact.kind)).toEqual(['card', 'region', 'point'])
    expect(artefactCan('flow', 'move')).toBe(false)
    /* Route geometry is the one a group operation cannot measure, because a Flow is a path rather than a place and
       has no single extent to bring onto a line. A Point has no extent either and is still a place, so it takes
       part - which is why this reads the geometry role rather than asserting every participant has a box. */
    for (const artefact of groupMovableSelection(group)) expect(artefact.geometry).not.toBe('route')
  })
})

describe('Group alignment geometry', () => {
  const anchor = { height: 40, width: 100, x: 100, y: 100 }
  const wide = { height: 20, width: 200, x: 150, y: 220 }
  const small = { height: 60, width: 40, x: 400, y: 300 }

  const edges: readonly [AlignEdge, number, number][] = [
    ['left', 100, 100],
    ['centre-x', 50, 130],
    ['right', 0, 160],
    ['top', 100, 100],
    ['centre-y', 110, 90],
    ['bottom', 120, 80]
  ]

  it.each(edges)('brings every box onto the anchor %s and moves on that axis alone', (edge, ...expected) => {
    const offsets = alignOffsets(anchor, [anchor, wide, small], edge)
    const horizontal = edge === 'left' || edge === 'centre-x' || edge === 'right'

    expect(offsets[0]).toEqual({ dx: 0, dy: 0 })
    for (const offset of offsets) expect(horizontal ? offset.dy : offset.dx).toBe(0)

    const moved = [wide, small].map((box, index) => {
      const offset = offsets[index + 1] ?? { dx: 0, dy: 0 }
      return { ...box, x: box.x + offset.dx, y: box.y + offset.dy }
    })
    expect(moved.map((box) => (horizontal ? box.x : box.y))).toEqual(expected)
  })

  it('leaves an already-aligned group alone, so the operation can be repeated', () => {
    const aligned = [anchor, { ...wide, x: anchor.x }, { ...small, x: anchor.x }]

    expect(alignOffsets(anchor, aligned, 'left')).toEqual([
      { dx: 0, dy: 0 },
      { dx: 0, dy: 0 },
      { dx: 0, dy: 0 }
    ])
  })

  it('spaces a run evenly between the two boxes it does not move', () => {
    const boxes = [
      { height: 20, width: 100, x: 0, y: 0 },
      { height: 20, width: 20, x: 110, y: 0 },
      { height: 20, width: 40, x: 150, y: 0 },
      { height: 20, width: 100, x: 400, y: 0 }
    ]
    const offsets = distributeOffsets(boxes, 'horizontal')
    const placed = boxes.map((box, index) => ({ ...box, x: box.x + (offsets[index]?.dx ?? 0) }))

    expect(offsets[0]).toEqual({ dx: 0, dy: 0 })
    expect(offsets[3]).toEqual({ dx: 0, dy: 0 })
    for (const offset of offsets) expect(offset.dy).toBe(0)

    const gaps = placed.slice(1).map((box, index) => box.x - ((placed[index]?.x ?? 0) + (placed[index]?.width ?? 0)))
    expect(gaps).toEqual([80, 80, 80])
  })

  it('reads the run in its own order, not the order the boxes were selected in', () => {
    const boxes = [
      { height: 100, width: 20, x: 0, y: 300 },
      { height: 20, width: 20, x: 0, y: 0 },
      { height: 20, width: 20, x: 0, y: 100 }
    ]
    const offsets = distributeOffsets(boxes, 'vertical')
    const placed = boxes.map((box, index) => ({ ...box, y: box.y + (offsets[index]?.dy ?? 0) }))

    expect(offsets[1]).toEqual({ dx: 0, dy: 0 })
    expect(offsets[0]).toEqual({ dx: 0, dy: 0 })
    expect(placed.map((box) => box.y)).toEqual([300, 0, 150])
  })

  /*
   * A mixed group, which is the case the third geometry role exists for.
   *
   * A Point is measured as a zero-extent box at its coordinate, so no group operation needs a special case for it:
   * align resolves every edge of that box to the coordinate, and distribute counts the Point as a participant that
   * occupies none of the run. Both halves of `ADR-INFOSCHEMATICS-031`'s arithmetic are asserted here, including its
   * worked example, because the prediction before it was worked through was that distribute would be incoherent.
   */
  it('measures a Point as a place, so a mixed group aligns and distributes with one', () => {
    const point = movableBox({ at: { x: 260, y: 40 }, role: 'point' })
    const boxed = movableBox({ box: { height: 40, width: 100, x: 100, y: 100 }, role: 'box' })

    expect(point).toEqual({ height: 0, width: 0, x: 260, y: 40 })
    expect(boxed).toEqual({ height: 40, width: 100, x: 100, y: 100 })

    // Left, centre and right all name the same line for a thing with no width, and the anchor stays still.
    expect(alignOffsets(boxed, [boxed, point], 'left')).toEqual([
      { dx: 0, dy: 0 },
      { dx: -160, dy: 0 }
    ])
    expect(alignOffsets(boxed, [boxed, point], 'centre-x')).toEqual([
      { dx: 0, dy: 0 },
      { dx: -110, dy: 0 }
    ])
    expect(alignOffsets(boxed, [boxed, point], 'right')).toEqual([
      { dx: 0, dy: 0 },
      { dx: -60, dy: 0 }
    ])

    // Two Cards with a hundred units of clear space between them, and a Point that lands one gap from each.
    const run = [
      movableBox({ box: { height: 40, width: 100, x: 0, y: 0 }, role: 'box' }),
      movableBox({ at: { x: 120, y: 0 }, role: 'point' }),
      movableBox({ box: { height: 40, width: 100, x: 300, y: 0 }, role: 'box' })
    ]
    const offsets = distributeOffsets(run, 'horizontal')

    expect(offsets[0]).toEqual({ dx: 0, dy: 0 })
    expect(offsets[2]).toEqual({ dx: 0, dy: 0 })
    expect(120 + (offsets[1]?.dx ?? 0)).toBe(200)
  })

  it('has nothing to space when fewer than three boxes are held', () => {
    const pair = [
      { height: 20, width: 20, x: 0, y: 0 },
      { height: 20, width: 20, x: 500, y: 0 }
    ]

    expect(distributeOffsets(pair, 'horizontal')).toEqual([
      { dx: 0, dy: 0 },
      { dx: 0, dy: 0 }
    ])
    expect(distributeOffsets([], 'vertical')).toEqual([])
  })
})
