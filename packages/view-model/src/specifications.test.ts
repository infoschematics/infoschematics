import { defineInfoschematicModel } from '@infoschematics/domain-core'
import { describe, expect, it } from 'vitest'
import { establishedInfoschematicOf } from './compatibility.ts'
import { createInfoschematicRuntime } from './runtime.ts'

const canonical = defineInfoschematicModel({
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
        source: { element: 'SRC', port: 'E1' },
        target: { element: 'SNK', port: 'W1' }
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
          documents: [
            { code: 'API-REGISTRY-001', href: '/registry.yaml', version: '1.0' },
            { code: 'API-REGISTRY-BINDING-001', href: '/registry-binding.yaml' }
          ],
          realisedBy: ['SRC'],
          interfaces: [
            {
              id: 'discovery',
              label: 'Discovery',
              realisedBy: ['SNK'],
              operations: [{ id: 'read', label: 'Read catalogue', realisedBy: ['FLOW'] }]
            }
          ]
        }
      ]
    }
  ]
})

describe('specification view compatibility', () => {
  it('flattens full paths and derives legacy element annotations from realisations', () => {
    const adapted = establishedInfoschematicOf(canonical)

    expect(adapted.infoschematic.interfaces.map(({ id }) => id)).toEqual([
      'federation/registry',
      'federation/registry/discovery',
      'federation/registry/discovery/read'
    ])
    expect(adapted.infoschematic.specificationGroups[0]).toMatchObject({
      hasDocument: true,
      id: 'federation',
      specifications: ['federation/registry']
    })
    expect(adapted.infoschematic.interfaces[0]?.documents).toHaveLength(2)
    expect(adapted.infoschematic.cards[0]?.services).toEqual(['federation/registry'])
    expect(adapted.infoschematic.cards[1]?.conformsTo).toEqual(['federation/registry/discovery'])
    expect(adapted.infoschematic.flows[0]).toMatchObject({
      conformsTo: ['federation/registry/discovery/read'],
      operation: 'read'
    })
  })

  it('reads realisers directly and builds the reverse index once', () => {
    const runtime = createInfoschematicRuntime(canonical)

    expect(runtime.infoschematicFlowsCarrying('federation/registry/discovery/read').map(({ id }) => id)).toEqual([
      'FLOW'
    ])
    expect(runtime.infoschematicCardsOffering('federation/registry').map(({ id }) => id)).toEqual(['SRC'])
    expect(runtime.infoschematicSpecificationsFor?.('FLOW').map(({ id }) => id)).toEqual([
      'federation/registry/discovery/read'
    ])
    expect(runtime.infoschematicUnroutedInterfaces).toEqual([])
  })
})
