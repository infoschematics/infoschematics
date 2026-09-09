import { describe, expect, it } from 'vitest'
import { defaultCalloutPositions } from './model.ts'
import { parseInfoschematic } from './parse.ts'
import { serialiseInfoschematicJson, serialiseInfoschematicYaml } from './serialise.ts'

const structured = `
id: COMPACT
title: Compact authoring
description: The structured equivalent.
diagram:
  bounds: { x: 0, y: 0, width: 800, height: 500 }
  calloutPositions:
${defaultCalloutPositions.map(({ x, y }) => `    - { x: ${x}, y: ${y} }`).join('\n')}
  collections:
    - id: CORE
      label: Core
      appearance: { color: '#1f6feb', fill: '#0d1117' }
  families:
    - id: DATA
      label: Data
      appearance: { color: '#3fb950' }
  cards:
    - id: SRC
      label: Source
      description: Emits records.
      collection: CORE
      bounds: { x: 100, y: 160, width: 200, height: 120 }
      ports: { north: 0, east: 3, south: 7, west: 1 }
      provides: []
    - id: SNK
      label: Sink
      collection: CORE
      bounds: { x: 500, y: 160, width: 200, height: 120 }
      ports: { north: 7, east: 3, south: 7, west: 3 }
    - id: ADP
      label: Adapter
      adapts: SNK
      bounds: { x: 480, y: 140, width: 240, height: 180 }
      ports: { north: 1, east: 1, south: 1, west: 1 }
  flows:
    - id: LOAD
      family: DATA
      source: { element: SRC, port: E2 }
      target: { element: SNK, port: W2 }
      direction: forward
      route:
        labelAt: 0.8286
        waypoints:
          - { x: 470, y: 890 }
          - { x: 470, y: 810 }
      appearance: { line: dashed }
scopes:
  - id: DELIVERY
    label: Delivery architecture
    elements: [SRC, SNK]
`

const compact = `
id: COMPACT
title: Compact authoring
description: The structured equivalent.
diagram:
  bounds: 0 0 800 500
  collections:
    - id: CORE
      label: Core
      appearance: { color: '#1f6feb', fill: '#0d1117' }
  families:
    - id: DATA
      label: Data
      color: '#3fb950'
  cards:
    - id: SRC
      label: Source
      description: Emits records.
      collection: CORE
      bounds: 100 160 200 120
      ports: 0 3 7 1
    - id: SNK
      label: Sink
      collection: CORE
      bounds: 500 160 200 120
      ports: 7 3
    - id: ADP
      label: Adapter
      adapts: SNK
      bounds: 480 140 240 180
      ports: 1
  flows:
    - id: LOAD
      family: DATA
      link: SRC E2 -> SNK W2
      labelAt: 0.8286
      waypoints: 470,890 470,810
      line: dashed
scopes:
  - id: DELIVERY
    label: Delivery architecture
    elements: [SRC, SNK]
`

const modelOf = (document: string) => {
  const parsed = parseInfoschematic(document)
  if (!parsed.ok) throw new Error(parsed.issues.map(({ message, path }) => `${path}: ${message}`).join('\n'))
  return parsed.model
}

describe('canonical authored form', () => {
  it('normalises every shorthand to the existing structured runtime values', () => {
    const structuredModel = modelOf(structured)
    const compactModel = modelOf(compact)

    expect(compactModel).toEqual(structuredModel)
    expect(compactModel.diagram.bounds).toEqual({
      x: 0,
      y: 0,
      width: 800,
      height: 500
    })
    expect(compactModel.diagram.cards[0]?.ports).toEqual({
      north: 0,
      east: 3,
      south: 7,
      west: 1
    })
    expect(compactModel.diagram.flows[0]).toMatchObject({
      appearance: { line: 'dashed' },
      direction: 'forward',
      route: {
        labelAt: 0.8286,
        waypoints: [
          { x: 470, y: 890 },
          { x: 470, y: 810 }
        ]
      },
      source: { element: 'SRC', port: 'E2' },
      target: { element: 'SNK', port: 'W2' }
    })
    expect(compactModel.diagram.calloutPositions).toEqual(defaultCalloutPositions)
  })

  it('emits compact semantic order and is idempotent in YAML and JSON', () => {
    const model = modelOf(structured)
    const yaml = serialiseInfoschematicYaml(model)
    const json = serialiseInfoschematicJson(model)

    expect(yaml.indexOf('id: COMPACT')).toBeLessThan(yaml.indexOf('title: Compact authoring'))
    expect(yaml.indexOf('description: The structured equivalent.')).toBeLessThan(yaml.indexOf('diagram:'))
    expect(yaml.indexOf('bounds: 0 0 800 500')).toBeLessThan(yaml.indexOf('families:'))
    expect(yaml.indexOf('diagram:')).toBeLessThan(yaml.indexOf('scopes:'))
    expect(yaml).toContain('link: SRC E2 -> SNK W2')
    expect(yaml).toContain('waypoints: 470,890 470,810')
    expect(yaml).toContain('line: dashed')
    expect(yaml).not.toContain('direction: forward')
    expect(yaml).not.toContain('provides: []')
    expect(yaml).not.toContain('calloutPositions:')
    expect(yaml).not.toContain('appearance: { line:')

    expect(serialiseInfoschematicYaml(modelOf(yaml))).toBe(yaml)
    expect(serialiseInfoschematicJson(modelOf(json))).toBe(json)
    expect(modelOf(yaml)).toEqual(model)
    expect(modelOf(json)).toEqual(model)
  })

  it('keeps bidirectionality in the borrowed arrow notation', () => {
    const bidirectional = compact.replace('SRC E2 -> SNK W2', 'SRC E2 <-> SNK W2')
    expect(modelOf(bidirectional).diagram.flows[0]?.direction).toBe('bidirectional')
    expect(serialiseInfoschematicYaml(modelOf(bidirectional))).toContain('link: SRC E2 <-> SNK W2')
  })
})
