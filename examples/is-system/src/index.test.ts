import { describe, expect, it } from 'vitest'

import { systemExample } from './index.ts'

const diagram = systemExample.infoschematic

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
    expect(diagram.viewBox).toEqual({ height: 600, width: 1400, x: 0, y: 0 })
    expect(diagram.cards).toHaveLength(4)
    expect(diagram.flows).toHaveLength(3)
    expect(diagram.cards.map((card) => card.code)).toEqual(['OBS-01', 'MAP-02', 'LIT-03', 'SEE-04'])
    expect(diagram.flows.map((flow) => flow.code)).toEqual(['SELECT', 'CONNECT', 'REVEAL'])
  })

  it('authors the blueprint treatment with every Card detail on', () => {
    expect(diagram.appearance).toEqual({
      card: { compact: true, description: true, identity: true, stereotype: true },
      grid: 'major-plus-minor',
      surface: 'blueprint',
    })
    expect(diagram.domains?.map((domain) => domain.id)).toEqual(['observe', 'arrange', 'illuminate', 'understand'])
    for (const flow of diagram.flows) expect(flow.label).toEqual({ along: 0.5 })
  })

  it('remains serialisable data with no runtime values', () => {
    expectSerialisable(systemExample)
  })
})
