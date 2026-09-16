import {
  defaultCalloutPositions,
  defineInfoschematic,
  defineInfoschematicModel,
  infoschematicModelOf
} from '@infoschematics/domain-core'
import { describe, expect, it } from 'vitest'

describe('infoschematicModelOf', () => {
  it('projects established input into the agreed vocabulary without changing the input', () => {
    const config = defineInfoschematic({
      id: 'legacy',
      title: 'Compatibility',
      synopsis: 'Existing authored input.',
      calloutPositions: [{ x: 0.25, y: 0.75 }],
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
        calloutPositions: [{ x: 0.25, y: 0.75 }],
        cards: [
          { id: 'SNK', ports: { east: 7, north: 7, south: 7, west: 7 } },
          { id: 'ADP', adapts: 'SNK' }
        ],
        points: [{ id: 'SRC', at: { x: 20, y: 50 } }],
        flows: [
          {
            id: 'MED-01',
            source: { element: 'SRC', port: 'E1' },
            target: { element: 'SNK', port: 'W1' },
            route: { waypoints: [{ x: 60, y: 50 }] }
          }
        ]
      },
      sequences: [
        {
          id: 'OVERVIEW',
          presentation: { callouts: false, display: 'expanded', timed: false },
          scenes: [{ id: 'OVR', focus: { elements: ['SRC', 'SNK', 'MED-01'] } }]
        },
        {
          id: 'STY',
          presentation: { callouts: true, display: 'collapsed', timed: true },
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

  it('preserves mixed legacy line treatments as Flow overrides', () => {
    const model = defineInfoschematicModel(
      infoschematicModelOf(
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
              },
              {
                id: 'unused',
                prefix: 'NON',
                label: 'Unused',
                description: 'Visibility only.',
                color: '#999999',
                fill: '#eeeeee'
              }
            ]
          }
        })
      )
    )

    expect(model.diagram.families).toMatchObject([{ id: 'media', appearance: { color: '#ff00ff' } }])
    expect(model.diagram.flows).toMatchObject([
      { id: 'MED-01', family: 'media' },
      { id: 'MED-02', family: 'media', appearance: { line: 'dashed' } }
    ])
    expect(model.diagram.collections.map(({ id }) => id)).toEqual(['edge'])
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
        gridSize: 10,
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
    expect(model.diagram.calloutPositions).toEqual(defaultCalloutPositions)
    expect(model.sequences).toEqual([])
    expect(JSON.parse(JSON.stringify(model))).toEqual(model)

    expect(() =>
      defineInfoschematicModel({
        id: 'BROKEN',
        title: 'Broken',
        diagram: {
          bounds: { x: 0, y: 0, width: 400, height: 300 },
          gridSize: 10,
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

describe('Diagram Dynamics', () => {
  const dynamicModel = (dynamics: unknown) =>
    defineInfoschematicModel({
      id: 'DYNAMIC',
      title: 'Dynamics',
      diagram: {
        bounds: { x: 0, y: 0, width: 400, height: 300 },
        gridSize: 10,
        cards: [
          { id: 'SRC', label: 'Source', bounds: { x: 20, y: 20, width: 100, height: 60 } },
          { id: 'SNK', label: 'Sink', bounds: { x: 260, y: 20, width: 100, height: 60 } }
        ],
        flows: [
          { id: 'LOAD', source: { element: 'SRC', port: 'E1' }, target: { element: 'SNK', port: 'W1' } },
          { id: 'REPLY', source: { element: 'SNK', port: 'W1' }, target: { element: 'SRC', port: 'E1' } }
        ],
        regions: [{ id: 'ZONE', label: 'Zone', bounds: { x: 0, y: 0, width: 400, height: 120 } }],
        dynamics: dynamics as never
      }
    })

  it('defaults to no Dynamics and normalises authored targets as sorted sets', () => {
    expect(
      defineInfoschematicModel({
        id: 'NONE',
        title: 'None',
        diagram: { bounds: { x: 0, y: 0, width: 10, height: 10 }, gridSize: 0 }
      }).diagram.dynamics
    ).toEqual([])

    const model = dynamicModel([
      { id: 'delivery', label: 'Record delivered', kind: 'signal-flow', flows: ['REPLY', 'LOAD', 'REPLY'] },
      { id: 'attention', label: 'Needs attention', kind: 'emphasise-elements', elements: ['SNK', 'ZONE', 'SNK'] }
    ])

    expect(model.diagram.dynamics).toEqual([
      { id: 'delivery', label: 'Record delivered', kind: 'signal-flow', flows: ['LOAD', 'REPLY'] },
      { id: 'attention', label: 'Needs attention', kind: 'emphasise-elements', elements: ['SNK', 'ZONE'] }
    ])
  })

  it('emphasises any authored visual element but signals only Flows', () => {
    expect(
      dynamicModel([
        { id: 'everything', label: 'Everything', kind: 'emphasise-elements', elements: ['LOAD', 'SRC', 'ZONE'] }
      ]).diagram.dynamics[0]
    ).toMatchObject({ elements: ['LOAD', 'SRC', 'ZONE'] })

    expect(() => dynamicModel([{ id: 'wrong', label: 'Wrong kind', kind: 'signal-flow', flows: ['SRC'] }])).toThrow(
      'Diagram Dynamic wrong references a non-Flow element: SRC'
    )
  })

  it('rejects unknown targets, duplicate ids, and declarations that target nothing', () => {
    expect(() => dynamicModel([{ id: 'missing', label: 'Missing', kind: 'signal-flow', flows: ['ABSENT'] }])).toThrow(
      'Diagram Dynamic missing references unknown id: ABSENT'
    )

    expect(() =>
      dynamicModel([{ id: 'missing', label: 'Missing', kind: 'emphasise-elements', elements: ['ABSENT'] }])
    ).toThrow('Diagram Dynamic missing references unknown id: ABSENT')

    expect(() =>
      dynamicModel([
        { id: 'twice', label: 'First', kind: 'signal-flow', flows: ['LOAD'] },
        { id: 'twice', label: 'Second', kind: 'emphasise-elements', elements: ['SRC'] }
      ])
    ).toThrow('Duplicate Diagram Dynamic id: twice')

    expect(() => dynamicModel([{ id: 'empty', label: 'Empty', kind: 'signal-flow', flows: [] }])).toThrow(
      'Diagram Dynamic empty names no Flow to signal'
    )
    expect(() => dynamicModel([{ id: 'empty', label: 'Empty', kind: 'emphasise-elements', elements: [] }])).toThrow(
      'Diagram Dynamic empty names no element to emphasise'
    )
  })

  it('lets an emphasis depict a state and refuses the claim on the kind that cannot sustain one', () => {
    // Authored as the document wrote it: nothing is defaulted in, so a declaration that says nothing about depiction
    // canonicalises exactly as it did before the field existed.
    expect(
      dynamicModel([
        { id: 'stage', label: 'We are on this stage', kind: 'emphasise-elements', elements: ['SNK'], depicts: 'state' },
        { id: 'arrived', label: 'A record arrived', kind: 'emphasise-elements', elements: ['SRC'], depicts: 'event' },
        { id: 'quiet', label: 'Needs attention', kind: 'emphasise-elements', elements: ['ZONE'] }
      ]).diagram.dynamics
    ).toEqual([
      { id: 'stage', label: 'We are on this stage', kind: 'emphasise-elements', elements: ['SNK'], depicts: 'state' },
      { id: 'arrived', label: 'A record arrived', kind: 'emphasise-elements', elements: ['SRC'], depicts: 'event' },
      { id: 'quiet', label: 'Needs attention', kind: 'emphasise-elements', elements: ['ZONE'] }
    ])

    expect(() =>
      dynamicModel([
        { id: 'sustained', label: 'Sustained signal', kind: 'signal-flow', flows: ['LOAD'], depicts: 'state' }
      ])
    ).toThrow('Diagram Dynamic sustained is a signal-flow Dynamic and cannot declare depicts')
  })
})
