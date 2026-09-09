import { defineInfoschematic, defineInfoschematicModel, infoschematicModelOf } from '@infoschematics/domain-core'
import { describe, expect, it } from 'vitest'
import { establishedInfoschematicOf } from './compatibility.ts'

describe('establishedInfoschematicOf', () => {
  it('preserves legacy geometry, ports, Card composition, and copied scenes', () => {
    const legacy = defineInfoschematic({
      id: 'legacy',
      title: 'Compatibility',
      calloutPositions: [{ x: 0.25, y: 0.75 }],
      infoschematic: {
        scopes: [
          {
            id: 'edge',
            prefix: 'EDG',
            label: 'Edge',
            description: 'Edge.',
            color: '#123456',
            fill: '#abcdef'
          }
        ],
        flowFamilies: [
          {
            id: 'media',
            prefix: 'MED',
            label: 'Media',
            description: 'Media.',
            color: '#ff00ff'
          }
        ],
        cards: [
          {
            id: 'sink',
            code: 'SNK',
            label: 'Sink',
            detail: 'Receives.',
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
          id: 'delivery',
          code: 'STY',
          title: 'Delivery',
          scenes: [{ sourceScene: 'overview', duration: 3 }]
        }
      ]
    })
    const canonical = defineInfoschematicModel(infoschematicModelOf(legacy))
    const adapted = establishedInfoschematicOf(canonical)

    expect(establishedInfoschematicOf(legacy)).toBe(legacy)
    expect(adapted.calloutPositions).toEqual([{ x: 0.25, y: 0.75 }])

    expect(adapted.infoschematic.flows[0]).toMatchObject({
      code: 'MED-01',
      source: 'SRC',
      sourcePort: 'E1',
      target: 'SNK',
      targetPort: 'W1',
      points: [
        { x: 20, y: 50 },
        { x: 60, y: 50 },
        { x: 100, y: 50 }
      ]
    })
    expect(adapted.standaloneScenes).toEqual([])
    expect(adapted.themes[0]?.scenes[0]).toMatchObject({
      id: 'OVR',
      focus: { artefacts: ['SRC', 'SNK'], flows: ['MED-01'] }
    })
    expect(adapted.stories[0]?.scenes[0]).toMatchObject({
      id: 'STY-1',
      duration: 3,
      focus: { artefacts: ['SRC', 'SNK'], flows: ['MED-01'] }
    })
    expect(adapted.stories[0]?.scenes[0]).not.toHaveProperty('sourceScene')
  })

  it('lets a Flow override its Family line treatment', () => {
    const canonical = defineInfoschematicModel({
      id: 'line-treatments',
      title: 'Line treatments',
      diagram: {
        bounds: { x: 0, y: 0, width: 240, height: 100 },
        cards: [
          { id: 'SRC', label: 'Source', bounds: { x: 20, y: 20, width: 80, height: 60 } },
          { id: 'SNK', label: 'Sink', bounds: { x: 140, y: 20, width: 80, height: 60 } }
        ],
        families: [
          { id: 'implied', label: 'Implied', appearance: { line: 'dashed' } },
          { id: 'direct', label: 'Direct' }
        ],
        flows: [
          {
            id: 'DEFAULT-DASHED',
            family: 'implied',
            source: { element: 'SRC', port: 'E1' },
            target: { element: 'SNK', port: 'W1' }
          },
          {
            id: 'OVERRIDE-SOLID',
            family: 'implied',
            appearance: { line: 'solid' },
            source: { element: 'SRC', port: 'E1' },
            target: { element: 'SNK', port: 'W1' }
          },
          {
            id: 'OVERRIDE-DASHED',
            family: 'direct',
            appearance: { line: 'dashed' },
            source: { element: 'SRC', port: 'E1' },
            target: { element: 'SNK', port: 'W1' }
          }
        ]
      }
    })

    expect(establishedInfoschematicOf(canonical).infoschematic.flows.map(({ dashed }) => dashed)).toEqual([
      true,
      undefined,
      true
    ])
  })
})
