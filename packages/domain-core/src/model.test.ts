import { defineInfoschematic, defineInfoschematicModel, infoschematicModelOf } from '@infoschematics/domain-core'
import { describe, expect, it } from 'vitest'

describe('infoschematicModelOf', () => {
  it('projects established input into the agreed vocabulary without changing the input', () => {
    const config = defineInfoschematic({
      id: 'legacy',
      title: 'Compatibility',
      synopsis: 'Existing authored input.',
      infoschematic: {
        scopes: [
          {
            id: 'edge',
            prefix: 'EDG',
            label: 'Edge',
            description: 'Visible at the edge.',
            color: '#123456',
            fill: '#abcdef'
          }
        ],
        flowFamilies: [
          {
            id: 'media',
            prefix: 'MED',
            label: 'Media',
            description: 'Media flow.',
            color: '#ff00ff'
          }
        ],
        cards: [
          {
            id: 'sink',
            code: 'SNK',
            label: 'Sink',
            detail: 'Receives media.',
            scope: 'edge',
            scopes: ['edge'],
            placement: { box: { x: 100, y: 20, width: 100, height: 60 } }
          },
          {
            id: 'adapter',
            code: 'ADP',
            label: 'Adapter',
            detail: 'Adapts media.',
            scope: 'edge',
            scopes: ['edge'],
            wraps: 'sink',
            placement: { box: { x: 80, y: 20, width: 140, height: 70 } }
          }
        ],
        points: [
          {
            id: 'source',
            code: 'SRC',
            label: 'Source',
            scopes: ['edge'],
            point: { x: 20, y: 50 }
          }
        ],
        flows: [
          {
            id: 'source-to-sink',
            code: 'MED-01',
            family: 'media',
            source: 'source',
            target: 'sink',
            sourcePort: 'E1',
            targetPort: 'W1',
            points: [
              { x: 20, y: 50 },
              { x: 60, y: 50 },
              { x: 100, y: 50 }
            ]
          }
        ]
      },
      standaloneScenes: [
        {
          id: 'overview',
          code: 'OVR',
          label: 'Overview',
          description: 'Source to sink.',
          focus: { artefacts: ['source', 'sink'], flows: ['source-to-sink'] }
        }
      ],
      stories: [
        {
          id: 'delivery-story',
          code: 'STY',
          title: 'Delivery',
          scenes: [{ sourceScene: 'overview', duration: 3 }]
        }
      ]
    })
    const before = structuredClone(config)
    const model = infoschematicModelOf(config)

    expect(config).toEqual(before)
    expect(model).toMatchObject({
      id: 'legacy',
      description: 'Existing authored input.',
      diagram: {
        cards: [{ id: 'SNK', ports: { east: 7, north: 7, south: 7, west: 7 } }, { id: 'ADP' }],
        points: [{ id: 'SRC', at: { x: 20, y: 50 } }],
        flows: [
          {
            id: 'MED-01',
            source: { element: 'SRC', port: 'E1' },
            target: { element: 'SNK', port: 'W1' },
            route: { waypoints: [{ x: 60, y: 50 }] }
          }
        ],
        assemblies: [
          {
            id: 'ADP-ASSEMBLY',
            kind: 'adapter',
            interface: 'SNK',
            adapter: 'ADP'
          }
        ]
      },
      themes: [
        {
          id: 'OVERVIEW',
          scenes: [{ id: 'OVR', focus: { elements: ['SRC', 'SNK', 'MED-01'] } }]
        }
      ],
      stories: [
        {
          id: 'STY',
          scenes: [
            {
              id: 'STY-1',
              label: 'Overview',
              focus: { elements: ['SRC', 'SNK', 'MED-01'] },
              duration: 3
            }
          ]
        }
      ]
    })
  })

  it('represents mixed legacy line treatments as separate families', () => {
    const model = infoschematicModelOf(
      defineInfoschematic({
        id: 'mixed-lines',
        title: 'Mixed lines',
        infoschematic: {
          flowFamilies: [
            {
              id: 'media',
              prefix: 'MED',
              label: 'Media',
              description: 'Media flow.',
              color: '#ff00ff'
            }
          ],
          cards: [
            {
              id: 'sink',
              code: 'SNK',
              label: 'Sink',
              detail: 'Receives media.',
              scope: 'edge',
              scopes: ['edge'],
              placement: { box: { x: 100, y: 20, width: 100, height: 60 } }
            }
          ],
          points: [
            {
              id: 'source',
              code: 'SRC',
              label: 'Source',
              scopes: ['edge'],
              point: { x: 20, y: 50 }
            }
          ],
          flows: [
            {
              id: 'solid',
              code: 'MED-01',
              family: 'media',
              source: 'source',
              target: 'sink',
              sourcePort: 'E1',
              targetPort: 'W1',
              points: [
                { x: 20, y: 50 },
                { x: 100, y: 50 }
              ]
            },
            {
              id: 'dashed',
              code: 'MED-02',
              family: 'media',
              dashed: true,
              source: 'source',
              target: 'sink',
              sourcePort: 'E1',
              targetPort: 'W1',
              points: [
                { x: 20, y: 50 },
                { x: 100, y: 50 }
              ]
            }
          ],
          regions: [
            {
              id: 'area',
              label: 'Area',
              box: { x: 0, y: 0, width: 220, height: 100, radius: 8 }
            }
          ],
          scopes: [
            {
              id: 'edge',
              prefix: 'EDG',
              label: 'Edge',
              description: 'Visible at edge.',
              color: '#123456',
              fill: '#abcdef'
            }
          ]
        }
      })
    )

    expect(model.diagram.families).toMatchObject([
      { id: 'media', appearance: { color: '#ff00ff' } },
      { id: 'media-DASHED', appearance: { color: '#ff00ff', line: 'dashed' } }
    ])
    expect(model.diagram.flows).toMatchObject([
      { id: 'MED-01', family: 'media' },
      { id: 'MED-02', family: 'media-DASHED' }
    ])
    expect(model.diagram.regions[0]).toMatchObject({
      appearance: { cornerRadius: 8 },
      bounds: { x: 0, y: 0, width: 220, height: 100 }
    })
    expect(model.diagram.regions[0]?.bounds).not.toHaveProperty('radius')
  })

  it('normalises new defaults and rejects dangling model references', () => {
    const model = defineInfoschematicModel({
      id: 'MODEL',
      title: 'Model',
      diagram: {
        bounds: { x: 0, y: 0, width: 400, height: 300 },
        cards: [
          {
            id: 'SRC',
            label: 'Source',
            bounds: { x: 20, y: 20, width: 100, height: 60 }
          }
        ]
      }
    })

    expect(model.diagram.cards[0]?.ports).toEqual({
      east: 1,
      north: 1,
      south: 1,
      west: 1
    })
    expect(model.diagram.flows).toEqual([])
    expect(model.themes).toEqual([])
    expect(JSON.parse(JSON.stringify(model))).toEqual(model)

    expect(() =>
      defineInfoschematicModel({
        id: 'BROKEN',
        title: 'Broken',
        diagram: {
          bounds: { x: 0, y: 0, width: 400, height: 300 },
          cards: [
            {
              id: 'SRC',
              label: 'Source',
              bounds: { x: 20, y: 20, width: 100, height: 60 }
            }
          ],
          flows: [
            {
              id: 'FLOW',
              source: { element: 'SRC', port: 'E1' },
              target: { element: 'MISSING', port: 'W1' }
            }
          ]
        }
      })
    ).toThrow('Flow FLOW target references unknown id: MISSING')
  })
})
