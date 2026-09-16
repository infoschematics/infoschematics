import type { DiagramDynamic } from '@infoschematics/domain-model'
import { describe, expect, it } from 'vitest'
import { dynamicDepictsState, emphasisDepictsState, resolveDiagramDynamics } from './dynamics.ts'

const dynamics: readonly DiagramDynamic[] = [
  { id: 'delivered', label: 'Record delivered', kind: 'signal-flow', flows: ['LOAD', 'REPLY'] },
  { id: 'attention', label: 'Sink needs attention', kind: 'emphasise-elements', elements: ['SNK', 'ZONE'] }
]

const held: DiagramDynamic = {
  id: 'on-this-stage',
  label: 'We are on this stage',
  kind: 'emphasise-elements',
  elements: ['SNK'],
  depicts: 'state'
}

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

  it('carries a state onto every element it names and leaves an event exactly as it resolved before', () => {
    const resolved = resolveDiagramDynamics(
      [held, ...dynamics],
      [
        { dynamicId: 'on-this-stage', occurrenceKey: 'run-1' },
        { dynamicId: 'attention', occurrenceKey: 'run-1' }
      ]
    )

    // SNK is emphasised once for this occurrence, by the declaration supplied first; ZONE comes from the event.
    expect(resolved.emphasis).toEqual([
      { depicts: 'state', dynamicId: 'on-this-stage', elementId: 'SNK', occurrenceKey: 'run-1' },
      { dynamicId: 'attention', elementId: 'ZONE', occurrenceKey: 'run-1' }
    ])
    // An event resolves without the field at all, so nothing downstream can mistake absence for an authored 'event'.
    expect(Object.hasOwn(resolved.emphasis[1] ?? {}, 'depicts')).toBe(false)
    expect(resolved.emphasis.map(emphasisDepictsState)).toEqual([true, false])
    expect(resolved.signals).toEqual([])
  })

  it('reads an absent or explicit event depiction as an event, so an older document keeps its finite reading', () => {
    const explicit: DiagramDynamic = { ...held, id: 'arrived', depicts: 'event' }

    expect(dynamicDepictsState(held)).toBe(true)
    expect(dynamicDepictsState(explicit)).toBe(false)
    expect(dynamicDepictsState(dynamics[1] as DiagramDynamic)).toBe(false)
    // The kind that cannot sustain a treatment never reports a state, whatever a caller hands this function.
    expect(dynamicDepictsState({ ...(dynamics[0] as DiagramDynamic), depicts: 'state' } as DiagramDynamic)).toBe(false)

    expect(resolveDiagramDynamics([explicit], [{ dynamicId: 'arrived', occurrenceKey: 'run-1' }]).emphasis).toEqual([
      { dynamicId: 'arrived', elementId: 'SNK', occurrenceKey: 'run-1' }
    ])
  })

  it('resolves one emphasis per element and occurrence however two declarations disagree about depiction', () => {
    const alsoHeld: DiagramDynamic = { ...held, id: 'also-here' }
    const event: DiagramDynamic = { id: 'arrived', label: 'Arrived', kind: 'emphasise-elements', elements: ['SNK'] }

    // Identity stays the target and the occurrence, so the first declaration supplied owns the emphasis — its
    // depiction as much as its accessible meaning.
    expect(
      resolveDiagramDynamics(
        [held, alsoHeld, event],
        [
          { dynamicId: 'on-this-stage', occurrenceKey: 'run-1' },
          { dynamicId: 'arrived', occurrenceKey: 'run-1' }
        ]
      ).emphasis
    ).toEqual([{ depicts: 'state', dynamicId: 'on-this-stage', elementId: 'SNK', occurrenceKey: 'run-1' }])

    expect(
      resolveDiagramDynamics(
        [event, held],
        [
          { dynamicId: 'arrived', occurrenceKey: 'run-1' },
          { dynamicId: 'on-this-stage', occurrenceKey: 'run-1' }
        ]
      ).emphasis
    ).toEqual([{ dynamicId: 'arrived', elementId: 'SNK', occurrenceKey: 'run-1' }])
  })

  it('resolves nothing when either side is empty, so absence leaves output unchanged', () => {
    expect(resolveDiagramDynamics([], [{ dynamicId: 'delivered', occurrenceKey: 'run-1' }])).toEqual({
      emphasis: [],
      signals: []
    })
    expect(resolveDiagramDynamics(dynamics, [])).toEqual({ emphasis: [], signals: [] })
  })
})
