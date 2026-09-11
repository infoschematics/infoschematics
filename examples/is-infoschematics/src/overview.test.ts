import { describe, expect, it } from 'vitest'
import { homepageInfoschematic } from './overview.ts'

const diagram = homepageInfoschematic.diagram

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

describe('homepageInfoschematic', () => {
  it('converges two grouped inputs on the product and branches to two outputs', () => {
    expect(homepageInfoschematic.title).toBe('What makes an Infoschematic')
    expect(diagram.bounds).toEqual({ height: 408, width: 1268, x: 0, y: 0 })
    expect(diagram.cards.map((card) => card.id)).toEqual(['STR-01', 'PRS-02', 'INFO-03', 'OUT-04', 'OUT-05'])
    expect(diagram.flows.map((flow) => flow.id)).toEqual(['SHAPE', 'DIRECT', 'RENDER', 'PRESENT'])
    expect(diagram.regions.map((region) => region.label)).toEqual(['Inputs', 'Product', 'Outputs'])
  })

  it('names every product input and distinguishes static from live output', () => {
    expect(diagram.cards.find((card) => card.id === 'STR-01')?.description).toBe('Diagram, scopes, specifications')
    expect(diagram.cards.find((card) => card.id === 'PRS-02')?.description).toBe('Scenes, themes, stories')
    expect(diagram.cards.find((card) => card.id === 'OUT-04')?.stereotype).toBe('Static output')
    expect(diagram.cards.find((card) => card.id === 'OUT-05')?.stereotype).toBe('Live output')
  })

  it('authors the shared blueprint treatment and remains serialisable', () => {
    expect(diagram.appearance).toEqual({
      card: { compact: false, description: true, identity: true, stereotype: true },
      grid: 'major-plus-minor',
      surface: 'blueprint'
    })
    expectSerialisable(homepageInfoschematic)
  })
})
