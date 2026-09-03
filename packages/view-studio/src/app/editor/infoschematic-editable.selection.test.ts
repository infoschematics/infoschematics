import { describe, expect, it } from 'vitest'
import { defineInfoschematic } from '@infoschematics/domain-core'
import {
  moveArtefactOperation,
  resizeArtefactOperation,
} from '@infoschematics/view-model/editable'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import { infoschematicEditable } from './infoschematic-editable.ts'

const config = defineInfoschematic({
  title: 'Editable selections',
  infoschematic: {
    cards: [
      {
        code: 'CARD-01',
        detail: 'A Card',
        id: 'card-one',
        label: 'Card one',
        placement: {
          box: { height: 80, width: 120, x: 80, y: 100 },
          ports: { east: 1 },
        },
        scope: 'scope-one',
        scopes: ['scope-one'],
      },
      {
        code: 'ADAPTER-01',
        detail: 'An adapter',
        id: 'adapter-one',
        label: 'Adapter one',
        placement: { box: { height: 40, width: 40, x: 180, y: 120 } },
        scope: 'scope-one',
        scopes: ['scope-one'],
        wraps: 'card-one',
      },
    ],
    fabrics: [
      {
        code: 'FABRIC-01',
        detail: 'A Fabric',
        id: 'fabric-one',
        label: 'Fabric one',
        placement: {
          box: { height: 100, width: 180, x: 300, y: 90 },
          ports: { west: 1 },
        },
        scope: 'scope-one',
        scopes: ['scope-one'],
      },
    ],
    flowFamilies: [
      {
        color: '#336699',
        description: 'A family',
        id: 'family-one',
        label: 'Family one',
        prefix: 'FAM',
      },
    ],
    flows: [
      {
        code: 'FLOW-01',
        family: 'family-one',
        id: 'flow-one',
        points: [
          { x: 200, y: 140 },
          { x: 300, y: 140 },
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
        label: 'Graphic one',
        placement: { height: 60, width: 90, x: 500, y: 80 },
        renderer: 'illustration',
      },
    ],
    lanes: [
      {
        height: 200,
        id: 'lane-one',
        label: 'Lane one',
        labelY: 80,
        panel: { height: 200, radius: 10, width: 700, x: 20, y: 60 },
        y: 60,
        zones: [
          {
            fill: '#112233',
            id: 'zone-one',
            label: 'Zone one',
            width: 220,
            x: 40,
          },
        ],
      },
    ],
    scopes: [
      {
        color: '#336699',
        description: 'A scope',
        fill: '#112233',
        id: 'scope-one',
        label: 'Scope one',
        prefix: 'ONE',
      },
    ],
  },
})

const runtime = createInfoschematicRuntime(config)
const diagram = infoschematicEditable(
  runtime.editableModel,
  runtime.infoschematicFlows,
  new Set(['scope-one']),
  new Map(),
  new Map(),
  new Map(),
  [],
  {
    fabrics: config.infoschematic.fabrics,
    graphics: config.infoschematic.graphics,
  },
)

describe('Infoschematic editable selection adapter', () => {
  it('resolves all six kinds with stable identity and geometry', () => {
    expect(diagram.selectionFor('lane:lane-one')).toMatchObject({
      geometry: { height: 200, role: 'lane', y: 60 },
      selection: { code: null, geometry: 'lane', id: 'lane-one', kind: 'lane' },
    })
    expect(diagram.selectionFor('zone:lane-one:zone-one')).toMatchObject({
      geometry: { laneId: 'lane-one', role: 'zone', width: 220, x: 40 },
      selection: {
        code: null,
        geometry: 'zone',
        id: 'zone-one',
        kind: 'zone',
        laneId: 'lane-one',
      },
    })
    expect(diagram.selectionFor('FABRIC-01')).toMatchObject({
      geometry: { box: { height: 100, width: 180, x: 300, y: 90 }, role: 'box' },
      selection: {
        code: 'FABRIC-01',
        geometry: 'box',
        id: 'fabric-one',
        kind: 'fabric',
      },
    })
    expect(diagram.selectionFor('CARD-01')).toMatchObject({
      geometry: { box: { height: 80, width: 120, x: 80, y: 100 }, role: 'box' },
      selection: { code: 'CARD-01', geometry: 'box', id: 'card-one', kind: 'card' },
    })
    expect(diagram.selectionFor('FLOW-01')).toMatchObject({
      geometry: { role: 'route' },
      selection: { code: 'FLOW-01', geometry: 'route', id: 'flow-one', kind: 'flow' },
    })
    expect(diagram.selectionFor('graphic:graphic-one')).toMatchObject({
      geometry: { box: { height: 60, width: 90, x: 500, y: 80 }, role: 'box' },
      selection: { code: null, geometry: 'box', id: 'graphic-one', kind: 'graphic' },
    })
  })

  it('returns kind capabilities and refuses generic Flow move or resize', () => {
    const lane = diagram.selectionFor('lane:lane-one')
    const flow = diagram.selectionFor('FLOW-01')

    expect(lane?.capabilities).toMatchObject({ move: true, resize: true, reorder: true })
    expect(flow?.capabilities).toMatchObject({ move: false, resize: false, reorder: true })
    expect(
      flow && moveArtefactOperation(flow.selection, flow.geometry, { dx: 10, dy: 10 }),
    ).toBeUndefined()
    expect(
      flow && resizeArtefactOperation(flow.selection, flow.geometry, { height: 40, width: 40 }),
    ).toBeUndefined()
  })

  it('keeps adapters non-resizable and redirects movement to the wrapped Card', () => {
    const adapter = diagram.selectionFor('ADAPTER-01')

    expect(adapter).toMatchObject({
      capabilities: { move: true, resize: false },
      movementTarget: { id: 'card-one', kind: 'card' },
      selection: { id: 'adapter-one', kind: 'card' },
    })
  })

  it('resolves port and waypoint handles to their owning artefacts', () => {
    expect(diagram.selectionFor('port:CARD-01:E1')?.selection).toMatchObject({
      id: 'card-one',
      kind: 'card',
    })
    expect(diagram.selectionFor('waypoint:FLOW-01:1')?.selection).toMatchObject({
      id: 'flow-one',
      kind: 'flow',
    })
    expect(diagram.selectionFor('missing')).toBeUndefined()
  })
})
