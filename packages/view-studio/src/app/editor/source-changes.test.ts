import { defineArtefactSelection } from '@infoschematics/view-model/editable'
import { describe, expect, it } from 'vitest'
import { orderSourceChanges } from './source-changes.ts'

const region = defineArtefactSelection({ code: null, geometry: 'box', id: 'region', kind: 'region' })
const card = defineArtefactSelection({ code: 'STD-01', geometry: 'box', id: 'card', kind: 'card' })
const flow = defineArtefactSelection({ code: 'TEL-01', geometry: 'route', id: 'flow', kind: 'flow' })

describe('source change ordering', () => {
  it('creates geography and endpoints before dependants, then removes in reverse', () => {
    const changes = [
      { field: 'create', phase: 'create', source: 'flow', target: flow },
      { field: 'remove', phase: 'remove', source: 'region', target: region },
      { field: 'remove', phase: 'remove', source: 'card', target: card },
      { field: 'create', phase: 'create', source: 'card', target: card },
      { field: 'remove', phase: 'remove', source: 'flow', target: flow },
      { field: 'create', phase: 'create', source: 'region', target: region }
    ] as const

    expect(orderSourceChanges(changes).map((change) => change.source)).toEqual([
      'region',
      'card',
      'flow',
      'flow',
      'card',
      'region'
    ])
  })

  it('orders updates by kind, authored index, field and identity', () => {
    const changes = [
      { authoredIndex: 2, field: 'box', phase: 'update', source: 'late region', target: region },
      { authoredIndex: 1, field: 'fill', phase: 'update', source: 'region fill', target: region },
      { authoredIndex: 1, field: 'label', phase: 'update', source: 'region label', target: region },
      { field: 'name', phase: 'update', source: 'card', target: card },
      { field: 'points', phase: 'update', source: 'flow', target: flow }
    ] as const

    expect(orderSourceChanges(changes).map((change) => change.source)).toEqual([
      'region fill',
      'region label',
      'late region',
      'card',
      'flow'
    ])
    expect(Object.isFrozen(orderSourceChanges(changes))).toBe(true)
  })
})
