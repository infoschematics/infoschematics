import { defineInfoschematic, defineInfoschematicModel, infoschematicModelOf } from '@infoschematics/domain-core'
import { describe, expect, it } from 'vitest'
import { createInfoschematicRuntime } from './runtime.ts'

describe('createInfoschematicRuntime', () => {
  const config = defineInfoschematic({
    title: 'Runtime',
    infoschematic: {
      scopes: [
        {
          id: 'inside',
          prefix: 'IN',
          label: 'Inside',
          description: 'Inside the system',
          color: '#6699cc',
          fill: '#112233'
        },
        {
          id: 'outside',
          prefix: 'OUT',
          label: 'Outside',
          description: 'Outside the system',
          color: '#cc9966',
          fill: '#332211'
        }
      ],
      flowFamilies: [
        {
          id: 'request',
          prefix: 'REQ',
          label: 'Request',
          description: 'A request',
          color: '#79c9ff'
        }
      ],
      cards: [
        {
          id: 'source',
          code: 'IN-01',
          label: 'Source',
          detail: 'The source',
          scope: 'inside',
          scopes: ['inside'],
          placement: {
            box: { x: 100, y: 100, width: 160, height: 80 },
            ports: { east: 1 }
          }
        },
        {
          id: 'target',
          code: 'OUT-01',
          label: 'Target',
          detail: 'The target',
          scope: 'outside',
          scopes: ['outside'],
          placement: {
            box: { x: 500, y: 100, width: 160, height: 80 },
            ports: { west: 1 }
          }
        }
      ],
      flows: [
        {
          id: 'request-flow',
          code: 'REQ-01',
          family: 'request',
          source: 'source',
          sourcePort: 'E1',
          target: 'target',
          targetPort: 'W1',
          points: [
            { x: 260, y: 140 },
            { x: 500, y: 140 }
          ]
        }
      ]
    }
  })

  it('derives the register, routed geometry and visibility without React', () => {
    const runtime = createInfoschematicRuntime(config)
    const everyScope = new Set(['inside', 'outside'])

    expect(runtime.infoschematicRegister.byCode('IN-01')).toMatchObject({ id: 'IN-01', kind: 'card' })
    expect(runtime.infoschematicFlows[0]?.d).toBe('M260 140 H500')
    expect(runtime.infoschematicPlaceables(everyScope)).toEqual([
      {
        box: { x: 100, y: 100, width: 160, height: 80 },
        code: 'IN-01',
        id: 'IN-01',
        ports: { east: 1 }
      },
      {
        box: { x: 500, y: 100, width: 160, height: 80 },
        code: 'OUT-01',
        id: 'OUT-01',
        ports: { west: 1 }
      }
    ])
    expect(runtime.infoschematicFlowIsVisible(runtime.infoschematicFlows[0]!, new Set(['request']), everyScope)).toBe(
      true
    )
    expect(
      runtime.infoschematicFlowIsVisible(runtime.infoschematicFlows[0]!, new Set(['request']), new Set(['inside']))
    ).toBe(false)
  })

  it('derives equivalent canonical and established runtime values at the public boundary', () => {
    const established = createInfoschematicRuntime(config)
    const canonical = createInfoschematicRuntime(defineInfoschematicModel(infoschematicModelOf(config)))

    expect({
      cards: established.infoschematicCards,
      families: established.infoschematicFamilies,
      flows: established.infoschematicFlows,
      overlays: established.infoschematicOverlays,
      points: established.infoschematicPoints,
      regions: established.infoschematicRegions,
      scopes: established.infoschematicScopes,
      sequences: established.sequences
    }).toEqual({
      cards: canonical.infoschematicCards,
      families: canonical.infoschematicFamilies,
      flows: canonical.infoschematicFlows,
      overlays: canonical.infoschematicOverlays,
      points: canonical.infoschematicPoints,
      regions: canonical.infoschematicRegions,
      scopes: canonical.infoschematicScopes,
      sequences: canonical.sequences
    })
    expect(canonical.config).toEqual(defineInfoschematicModel(infoschematicModelOf(config)))
  })

  it('resolves Story Graphics only through authored Graphic records', () => {
    const runtime = createInfoschematicRuntime(
      defineInfoschematic({
        title: 'Graphics',
        infoschematic: {
          graphics: [{ id: 'annotation', label: 'A host annotation', renderer: 'custom' }]
        },
        stories: [
          {
            id: 'story',
            code: 'STORY-01',
            title: 'Story',
            scenes: [{ graphic: 'annotation' }, { graphic: 'missing' }]
          }
        ]
      })
    )

    expect(runtime.stories[0]?.steps[0]?.graphic).toMatchObject({
      id: 'annotation',
      kind: { key: 'custom', version: 1 }
    })
    expect(runtime.stories[0]?.steps[1]?.graphic).toBeUndefined()
  })
  it('routes a Flow with no waypoints from its ports, so no placement can leave it undrawable', () => {
    /*
     * A Producer may move either end of a Flow off the other's axis, which is what `COMPOSE-002` records: the
     * naked two-point run the runtime used to derive then failed `ROUTE-001` inside the host's own `useMemo`.
     */
    const document = (dy: number, sourcePort: string, sourceSide: 'east' | 'north' | 'south' | 'west') =>
      defineInfoschematic({
        title: 'Routed from ports',
        infoschematic: {
          cards: [
            {
              id: 'a',
              code: 'A',
              label: 'A',
              detail: 'Source',
              placement: { box: { x: 100, y: 100, width: 120, height: 60 }, ports: { [sourceSide]: 1 } }
            },
            {
              id: 'b',
              code: 'B',
              label: 'B',
              detail: 'Target',
              placement: { box: { x: 400, y: 100 + dy, width: 120, height: 60 }, ports: { west: 1 } }
            }
          ],
          flowFamilies: [{ id: 'f', label: 'F', description: 'One family', color: '#88aacc' }],
          flows: [
            {
              code: 'F-001',
              family: 'f',
              source: 'a',
              sourcePort: sourcePort,
              target: 'b',
              targetPort: 'W1',
              points: [
                { x: 220, y: 130 },
                { x: 400, y: 130 + dy }
              ]
            }
          ]
        }
      })

    // Aligned ports keep the straight run they have today: the construction collapses to it.
    expect(createInfoschematicRuntime(document(0, 'E1', 'east')).infoschematicFlows[0]?.d).toBe('M220 130 H400')

    // Off the axis, every side pairing draws rather than throwing.
    for (const [port, side] of [
      ['E1', 'east'],
      ['N1', 'north'],
      ['S1', 'south'],
      ['W1', 'west']
    ] as const)
      for (const dy of [-90, 10, 240]) {
        const flow = createInfoschematicRuntime(document(dy, port, side)).infoschematicFlows[0]
        expect(flow?.d, `${port} ${dy}`).toMatch(/^M[\d-]+ [\d-]+( [HV][\d-]+)+$/)
        expect(flow?.points.length, `${port} ${dy}`).toBeGreaterThan(2)
      }
  })

  it('draws a committed move exactly where the draft showed it', () => {
    const document = (dy: number) =>
      defineInfoschematic({
        title: 'Draft and commit agree',
        infoschematic: {
          cards: [
            {
              id: 'a',
              code: 'A',
              label: 'A',
              detail: 'Source',
              placement: { box: { x: 100, y: 100, width: 120, height: 60 }, ports: { east: 1 } }
            },
            {
              id: 'b',
              code: 'B',
              label: 'B',
              detail: 'Target',
              placement: { box: { x: 400, y: 100 + dy, width: 120, height: 60 }, ports: { west: 1 } }
            }
          ],
          flowFamilies: [{ id: 'f', label: 'F', description: 'One family', color: '#88aacc' }],
          flows: [
            {
              code: 'F-001',
              family: 'f',
              source: 'a',
              sourcePort: 'E1',
              target: 'b',
              targetPort: 'W1',
              points: [
                { x: 220, y: 130 },
                { x: 400, y: 130 + dy }
              ]
            }
          ]
        }
      })

    for (const dy of [10, -40, 120]) {
      const before = createInfoschematicRuntime(document(0))
      const draft = before.editableModel.flowsAfterMoves(before.infoschematicFlows, new Map([['B', { dx: 0, dy }]]))
      const committed = createInfoschematicRuntime(document(dy))

      expect(draft[0]?.d, String(dy)).toBe(committed.infoschematicFlows[0]?.d)
    }
  })
})
