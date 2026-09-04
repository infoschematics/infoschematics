import { defineInfoschematic } from '@infoschematics/domain-core'
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

    expect(runtime.infoschematicRegister.byCode('IN-01')).toMatchObject({ id: 'source', kind: 'card' })
    expect(runtime.infoschematicFlows[0]?.d).toBe('M260 140 H500')
    expect(runtime.infoschematicPlaceables(everyScope)).toEqual([
      {
        box: { x: 100, y: 100, width: 160, height: 80 },
        code: 'IN-01',
        id: 'source',
        ports: { east: 1 }
      },
      {
        box: { x: 500, y: 100, width: 160, height: 80 },
        code: 'OUT-01',
        id: 'target',
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

    expect(runtime.stories[0]?.steps[0]?.graphic).toMatchObject({ id: 'annotation', renderer: 'custom' })
    expect(runtime.stories[0]?.steps[1]?.graphic).toBeUndefined()
  })
})
