import { describe, expect, it } from 'vitest'
import { showcaseExample } from './index.ts'

const diagram = showcaseExample.diagram

const expectSerialisable = (value: unknown): void => {
  if (value === null) return
  // The canonical parser materialises absent optional fields as explicit undefined, which JSON serialisation drops.
  if (value === undefined) return
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

describe('showcaseExample', () => {
  it('lays the document out as one band per concern', () => {
    expect(showcaseExample.title).toBe('Every capability, in one Infoschematic')
    expect(diagram.bounds).toEqual({ height: 1180, width: 1680, x: 0, y: 0 })
    expect(diagram.gridSize).toBe(20)
    expect(diagram.regions.map((region) => region.id)).toEqual([
      'REG-STRUCTURE',
      'REG-ADAPT',
      'REG-SUBSTRATE',
      'REG-EDGE'
    ])
  })

  it('authors the notation no other example has ever carried', () => {
    const cards = new Map(diagram.cards.map((card) => [card.id, card]))
    expect(cards.get('ADPT-01')?.adapts).toBe('CARD-03')
    expect(cards.get('WRAP-01')?.wraps).toBe('CARD-04')
    expect(diagram.fabrics.map((fabric) => fabric.id)).toEqual(['FAB-01', 'FAB-02'])
    expect(diagram.fabrics[0]).toMatchObject({ id: 'FAB-01', kind: { key: 'message-bus', version: 1 } })
    expect(diagram.fabrics[0]?.properties).toEqual({ durable: true, topics: 12 })
    // The same visual identity, authored wrapped on one Fabric and unwrapped on the other.
    expect(diagram.fabrics[1]?.appearance).toMatchObject({ color: '#6c8ebf', icon: 'store' })
    expect(diagram.overlays.map((overlay) => overlay.id)).toEqual(['OVL-01'])
    expect(diagram.calloutPositions).toEqual([
      { x: 120, y: 1060 },
      { x: 1180, y: 1060 }
    ])
    expect(diagram.points.map((point) => point.appearance?.icon)).toContain('sink')
  })

  it('exercises each Flow treatment the contract offers', () => {
    const flows = new Map(diagram.flows.map((flow) => [flow.id, flow]))
    expect(flows.get('FLOW-02')?.direction).toBe('forward')
    expect(flows.get('FLOW-05')?.direction).toBe('bidirectional')
    // A per-Flow override against its Family default is the pair that has to be authored together to mean anything.
    expect(flows.get('FLOW-05')?.appearance?.line).toBe('dashed')
    expect(diagram.families.find((family) => family.id === 'stream')?.appearance?.line).toBe('solid')
    expect(flows.get('FLOW-03')?.route?.waypoints).toEqual([
      { x: 610, y: 380 },
      { x: 840, y: 380 }
    ])
    expect(flows.get('FLOW-01')?.route?.labelAt).toBe(0.5)
  })

  it('keeps every two-port Flow axis-aligned, which the geometry requires of an unrouted route', () => {
    const bounds = new Map([
      ...diagram.cards.map((card) => [card.id, card.bounds] as const),
      ...diagram.fabrics.map((fabric) => [fabric.id, fabric.bounds] as const)
    ])
    const centre = (id: string, axis: 'x' | 'y') => {
      const box = bounds.get(id)
      if (box) return axis === 'x' ? box.x + box.width / 2 : box.y + box.height / 2
      const point = diagram.points.find((candidate) => candidate.id === id)
      return point ? point.at[axis] : Number.NaN
    }
    for (const flow of diagram.flows) {
      if (flow.route?.waypoints?.length) continue
      const horizontal = centre(flow.source.element, 'y') === centre(flow.target.element, 'y')
      const vertical = centre(flow.source.element, 'x') === centre(flow.target.element, 'x')
      expect(horizontal || vertical, `${flow.id} runs diagonally`).toBe(true)
    }
  })

  it('names three Dynamics, covering a signal and both depictions of emphasis', () => {
    expect(diagram.dynamics.map((dynamic) => dynamic.kind)).toEqual([
      'signal-flow',
      'emphasise-elements',
      'emphasise-elements'
    ])
    expect(diagram.dynamics[1]).toMatchObject({ depicts: 'event', elements: ['CARD-02'] })
    expect(diagram.dynamics[2]).toMatchObject({ depicts: 'state', elements: ['FAB-01'] })
  })

  it('carries a Story whose Scenes drive visibility, focus and Callouts', () => {
    const scenes = showcaseExample.sequences[0]?.scenes ?? []
    expect(showcaseExample.sequences[0]?.presentation).toEqual({
      callouts: true,
      display: 'expanded',
      timed: true
    })
    expect(scenes).toHaveLength(3)
    expect(scenes[0]?.visibility?.show?.scopes).toEqual(['SCOPE-PIPELINE'])
    expect(scenes[1]?.visibility?.hide?.elements).toEqual(['PT-01', 'PT-02'])
    expect(scenes[0]?.callout?.takeaways).toHaveLength(2)
    expect(scenes[1]?.callout?.placement).toEqual({ at: { x: 1180, y: 1060 } })
    expect(scenes[0]?.callout?.placement).toEqual({ element: 'CARD-01' })
  })

  it('reaches every depth of the Specification group', () => {
    const specification = showcaseExample.specifications[0]?.specifications[0]
    expect(specification?.owner).toBeTypeOf('string')
    expect(specification?.documents?.[0]).toMatchObject({ code: 'MI-1', version: '2.1' })
    expect(specification?.interfaces?.[0]?.operations?.[0]?.realisedBy).toEqual(['FLOW-01'])
    expect(specification?.realisedBy).toEqual(['CARD-01', 'CARD-04'])
  })

  it('stays serialisable data, with nothing a host has to supply', () => {
    expectSerialisable(showcaseExample)
  })
})
