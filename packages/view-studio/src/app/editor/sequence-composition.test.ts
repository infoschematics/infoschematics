import { describe, expect, it } from 'vitest'
import {
  addSequence,
  addSequenceScene,
  clearSequenceScenes,
  editSequenceScene,
  moveSequenceScene,
  removeSequenceScene,
  type SequenceDraft,
  sequenceCanActivate,
  sequencesAsSource,
  toggleSequenceLit
} from './sequence-composition.ts'

const sequences: readonly SequenceDraft[] = [
  {
    id: 'operations',
    scenes: [
      {
        callout: { body: 'Keep this', properties: { tone: 'quiet' }, renderer: 'aside' },
        code: 'THM-07',
        focus: { artefacts: ['card-a'], flows: ['flow-a'] },
        id: 'overview',
        label: 'Overview'
      },
      { code: 'THM-08', focus: {}, id: 'detail', label: 'Detail' }
    ],
    title: 'Operations'
  }
]

describe('Sequence composition', () => {
  it('creates an empty Sequence and a globally numbered Scene without copying focus', () => {
    const made = addSequence(sequences, 'Operations')
    expect(made.at(-1)).toEqual({ id: 'operations-2', scenes: [], title: 'Operations' })

    const composed = addSequenceScene(made, 'operations-2', 'Overview')
    expect(composed.at(-1)?.scenes[0]).toEqual({
      code: 'THM-09',
      description: '',
      focus: {},
      id: 'overview-2',
      label: 'Overview'
    })
  })

  it('makes move, remove and clear total at collection boundaries', () => {
    expect(moveSequenceScene(sequences, 'operations', 0, -1)).toBe(sequences)
    expect(moveSequenceScene(sequences, 'missing', 0, 1)).toBe(sequences)
    expect(removeSequenceScene(sequences, 'operations', 8)).toBe(sequences)
    expect(clearSequenceScenes(clearSequenceScenes(sequences, 'missing'), 'missing')).toBe(sequences)

    const moved = moveSequenceScene(sequences, 'operations', 0, 1)
    expect(moved[0]?.scenes.map((scene) => scene.id)).toEqual(['detail', 'overview'])
    expect(removeSequenceScene(moved, 'operations', 1)[0]?.scenes).toHaveLength(1)
    expect(clearSequenceScenes(sequences, 'operations')[0]?.scenes).toEqual([])
  })

  it('preserves unexposed Callout configuration while editing focus and text', () => {
    const focused = toggleSequenceLit(sequences, 'operations', 'overview', 'card-b', false)
    const edited = editSequenceScene(focused, 'operations', 'overview', { description: 'Changed' })
    const scene = edited[0]?.scenes[0]

    expect(scene?.focus.artefacts).toEqual(['card-a', 'card-b'])
    expect(scene?.callout).toEqual({ body: 'Keep this', properties: { tone: 'quiet' }, renderer: 'aside' })
    expect(sequencesAsSource(edited)).toContain('"renderer": "aside"')
  })

  it('keeps empty and stale Sequences editable but ineligible for Present', () => {
    expect(sequenceCanActivate({ id: 'empty', scenes: [], title: 'Empty' })).toBe(false)
    expect(sequenceCanActivate(sequences[0] as SequenceDraft, new Set(['card-a']), new Set(['flow-a']))).toBe(true)
    expect(sequenceCanActivate(sequences[0] as SequenceDraft, new Set(), new Set(['flow-a']))).toBe(true)

    const allStale: SequenceDraft = {
      id: 'stale',
      scenes: [{ code: 'THM-10', focus: { artefacts: ['gone'] }, id: 'gone', label: 'Gone' }],
      title: 'Stale'
    }
    expect(sequenceCanActivate(allStale, new Set(), new Set())).toBe(false)
  })
})
