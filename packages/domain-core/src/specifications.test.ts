import { describe, expect, it } from 'vitest'
import { defineInfoschematicModel } from './model.ts'
import { parseInfoschematic } from './parse.ts'
import { serialiseInfoschematicYaml } from './serialise.ts'

const definition = () => ({
  id: 'SPECIFICATIONS',
  title: 'Specifications',
  diagram: {
    bounds: { x: 0, y: 0, width: 400, height: 200 },
    cards: [
      { id: 'SRC', label: 'Source', bounds: { x: 20, y: 60, width: 100, height: 60 } },
      { id: 'SNK', label: 'Sink', bounds: { x: 280, y: 60, width: 100, height: 60 } }
    ],
    flows: [
      {
        id: 'FLOW',
        source: { element: 'SRC', port: 'E1' as const },
        target: { element: 'SNK', port: 'W1' as const }
      }
    ]
  },
  specifications: [
    {
      id: 'federation',
      label: 'Federation',
      specifications: [
        {
          id: 'registry',
          label: 'Registry',
          owner: 'federation',
          document: { code: 'API-REGISTRY-001', href: '/registry.yaml', version: '1.0' },
          realisedBy: ['SNK', 'SRC', 'SNK'],
          interfaces: [
            {
              id: 'discovery',
              label: 'Discovery',
              operations: [{ id: 'read', label: 'Read catalogue', realisedBy: ['FLOW'] }]
            }
          ]
        }
      ]
    },
    {
      id: 'external',
      label: 'External',
      specifications: [{ id: 'registry', label: 'Registry profile' }]
    }
  ]
})

describe('canonical specifications', () => {
  it('normalises realisations and identifies nodes by their full parent path', () => {
    const model = defineInfoschematicModel(definition())

    expect(model.specifications[0]?.specifications[0]?.realisedBy).toEqual(['SNK', 'SRC'])
    expect(model.specifications[1]?.specifications[0]?.id).toBe('registry')

    const yaml = serialiseInfoschematicYaml(model)
    const parsed = parseInfoschematic(yaml)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.model).toEqual(model)
    expect(yaml.indexOf('document:')).toBeLessThan(yaml.indexOf('realisedBy:'))
    expect(yaml.indexOf('realisedBy:')).toBeLessThan(yaml.indexOf('interfaces:'))
  })

  it('rejects stale realisation references at every level', () => {
    const input = definition()
    const specification = input.specifications[0]?.specifications[0]
    const operation =
      specification && 'interfaces' in specification ? specification.interfaces?.[0]?.operations?.[0] : undefined
    if (!operation) throw new Error('Test fixture is missing its Operation.')
    operation.realisedBy = ['MISSING']

    expect(() => defineInfoschematicModel(input)).toThrow(
      'Operation federation/registry/discovery/read references unknown id: MISSING'
    )
  })

  it('rejects duplicate ids within a parent while allowing the same id in another group', () => {
    expect(() =>
      defineInfoschematicModel({
        id: 'DUPLICATE',
        title: 'Duplicate',
        diagram: { bounds: { x: 0, y: 0, width: 10, height: 10 } },
        specifications: [
          {
            id: 'federation',
            label: 'Federation',
            specifications: [
              { id: 'registry', label: 'Registry' },
              { id: 'registry', label: 'Duplicate' }
            ]
          }
        ]
      })
    ).toThrow('Duplicate Specification path: federation/registry')
  })

  it('rejects removed diagram-side specification references', () => {
    const parsed = parseInfoschematic(`
id: OLD
title: Old
diagram:
  bounds: 0 0 10 10
  cards:
    - id: CARD
      label: Card
      bounds: 0 0 5 5
      interfaces: [legacy]
`)

    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.issues[0]?.path).toBe('diagram.cards.0')
  })
})
