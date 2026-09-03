import { describe, expect, it } from 'vitest'
import { defineArtefactSelection } from '@infoschematics/view-model/editable'
import { orderSourceChanges } from './source-changes.ts'

const lane = defineArtefactSelection({ code: null, geometry: 'lane', id: 'lane', kind: 'lane' })
const zone = defineArtefactSelection({ code: null, geometry: 'zone', id: 'zone', kind: 'zone', laneId: 'lane' })
const card = defineArtefactSelection({ code: 'STD-01', geometry: 'box', id: 'card', kind: 'card' })
const flow = defineArtefactSelection({ code: 'TEL-01', geometry: 'route', id: 'flow', kind: 'flow' })

describe('source change ordering', () => {
  it('creates owners and endpoints before dependants, then removes in reverse', () => {
    const changes = [
      { field: 'create', phase: 'create', source: 'flow', target: flow },
      { field: 'remove', phase: 'remove', source: 'lane', target: lane },
      { field: 'create', phase: 'create', source: 'zone', target: zone },
      { field: 'remove', phase: 'remove', source: 'card', target: card },
      { field: 'create', phase: 'create', source: 'card', target: card },
      { field: 'remove', phase: 'remove', source: 'flow', target: flow },
      { field: 'create', phase: 'create', source: 'lane', target: lane },
      { field: 'remove', phase: 'remove', source: 'zone', target: zone },
    ] as const

    expect(orderSourceChanges(changes).map((change) => change.source)).toEqual([
      'lane',
      'zone',
      'card',
      'flow',
      'flow',
      'card',
      'zone',
      'lane',
    ])
  })

  it('orders updates by kind, owner, authored index, field and identity', () => {
    const changes = [
      { authoredIndex: 2, field: 'width', owner: 'lane-b', phase: 'update', source: 'late zone', target: zone },
      { authoredIndex: 0, field: 'y', owner: 'lane-a', phase: 'update', source: 'lane', target: lane },
      { authoredIndex: 1, field: 'x', owner: 'lane-a', phase: 'update', source: 'zone x', target: zone },
      { authoredIndex: 1, field: 'fill', owner: 'lane-a', phase: 'update', source: 'zone fill', target: zone },
      { field: 'name', phase: 'update', source: 'card', target: card },
      { field: 'points', phase: 'update', source: 'flow', target: flow },
    ] as const

    expect(orderSourceChanges(changes).map((change) => change.source)).toEqual([
      'lane',
      'zone fill',
      'zone x',
      'late zone',
      'card',
      'flow',
    ])
    expect(Object.isFrozen(orderSourceChanges(changes))).toBe(true)
  })
})
