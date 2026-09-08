import { describe, expect, it } from 'vitest'

import { systemExample } from './index.ts'

const diagram = systemExample.diagram

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

describe('systemExample', () => {
  it('tells the four-stage journey with three named connectors', () => {
    expect(systemExample.title).toBe('A system, explained')
    expect(diagram.bounds).toEqual({ height: 248, width: 1268, x: 0, y: 0 })
    expect(diagram.cards).toHaveLength(4)
    expect(diagram.flows).toHaveLength(3)
    expect(diagram.cards.map((card) => card.id)).toEqual(['OBS-01', 'MAP-02', 'LIT-03', 'SEE-04'])
    expect(diagram.flows.map((flow) => flow.id)).toEqual(['SELECT', 'CONNECT', 'REVEAL'])
  })

  it('authors the blueprint treatment with every Card detail on', () => {
    expect(diagram.appearance).toEqual({
      card: { compact: false, description: true, identity: true, stereotype: true },
      grid: 'major-plus-minor',
      surface: 'blueprint'
    })
    expect(diagram.collections.map((collection) => collection.id)).toEqual([
      'observe',
      'arrange',
      'illuminate',
      'understand'
    ])
    for (const flow of diagram.flows) expect(flow.route?.labelAt).toBe(0.5)
  })

  it('remains serialisable data with no runtime values', () => {
    expectSerialisable(systemExample)
  })
})
