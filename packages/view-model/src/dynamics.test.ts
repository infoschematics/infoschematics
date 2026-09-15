import type { DiagramDynamic } from '@infoschematics/domain-model'
import { describe, expect, it } from 'vitest'
import { resolveDiagramDynamics } from './dynamics.ts'

const dynamics: readonly DiagramDynamic[] = [
  { id: 'delivered', label: 'Record delivered', kind: 'signal-flow', flows: ['LOAD', 'REPLY'] },
  { id: 'attention', label: 'Sink needs attention', kind: 'emphasise-elements', elements: ['SNK', 'ZONE'] }
]

describe('resolveDiagramDynamics', () => {
  it('resolves each kind into the occurrences its renderers already understand', () => {
    expect(resolveDiagramDynamics(dynamics, [{ dynamicId: 'delivered', occurrenceKey: 'run-1' }])).toEqual({
      emphasis: [],
      signals: [
        { flowId: 'LOAD', occurrenceKey: 'run-1' },
        { flowId: 'REPLY', occurrenceKey: 'run-1' }
      ]
    })

    expect(resolveDiagramDynamics(dynamics, [{ dynamicId: 'attention', occurrenceKey: 'run-1' }])).toEqual({
      emphasis: [
        { dynamicId: 'attention', elementId: 'SNK', occurrenceKey: 'run-1' },
        { dynamicId: 'attention', elementId: 'ZONE', occurrenceKey: 'run-1' }
      ],
      signals: []
    })
  })

  it('resolves concurrent Dynamics independently and in the order the host supplied them', () => {
    expect(
      resolveDiagramDynamics(dynamics, [
        { dynamicId: 'attention', occurrenceKey: 'run-1' },
        { dynamicId: 'delivered', occurrenceKey: 'run-1' }
      ])
    ).toEqual({
      emphasis: [
        { dynamicId: 'attention', elementId: 'SNK', occurrenceKey: 'run-1' },
        { dynamicId: 'attention', elementId: 'ZONE', occurrenceKey: 'run-1' }
      ],
      signals: [
        { flowId: 'LOAD', occurrenceKey: 'run-1' },
        { flowId: 'REPLY', occurrenceKey: 'run-1' }
      ]
    })
  })

  it('resolves a repeated occurrence once and a changed key as a replay', () => {
    const repeated = resolveDiagramDynamics(dynamics, [
      { dynamicId: 'delivered', occurrenceKey: 'run-1' },
      { dynamicId: 'delivered', occurrenceKey: 'run-1' }
    ])
    expect(repeated.signals).toEqual([
      { flowId: 'LOAD', occurrenceKey: 'run-1' },
      { flowId: 'REPLY', occurrenceKey: 'run-1' }
    ])

    const replayed = resolveDiagramDynamics(dynamics, [
      { dynamicId: 'delivered', occurrenceKey: 'run-1' },
      { dynamicId: 'delivered', occurrenceKey: 'run-2' }
    ])
    expect(replayed.signals.map(({ occurrenceKey }) => occurrenceKey)).toEqual(['run-1', 'run-1', 'run-2', 'run-2'])
  })

  it('ignores an occurrence for a Dynamic the document does not declare', () => {
    expect(resolveDiagramDynamics(dynamics, [{ dynamicId: 'absent', occurrenceKey: 'run-1' }])).toEqual({
      emphasis: [],
      signals: []
    })
  })

  it('resolves nothing when either side is empty, so absence leaves output unchanged', () => {
    expect(resolveDiagramDynamics([], [{ dynamicId: 'delivered', occurrenceKey: 'run-1' }])).toEqual({
      emphasis: [],
      signals: []
    })
    expect(resolveDiagramDynamics(dynamics, [])).toEqual({ emphasis: [], signals: [] })
  })
})
