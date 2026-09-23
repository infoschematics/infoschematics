import type { Sequence } from '@infoschematics/domain-model'
import type { SequenceConfig } from '@infoschematics/domain-model/sequence'
import { describe, expect, it } from 'vitest'
import {
  expandedSequencesForEditing,
  sequencesWithEditorDrafts,
  standaloneScenesForEditing,
  storiesForEditing
} from './sequence-editing.ts'

const sequences: readonly Sequence[] = [
  {
    id: 'OVERVIEW',
    label: 'Overview',
    presentation: { callouts: false, display: 'expanded', timed: false },
    scenes: [{ focus: { elements: ['CARD-A', 'FLOW-A'] }, id: 'OV-01', label: 'Overview scene' }]
  },
  {
    id: 'SEQUENCE',
    label: 'Sequence',
    presentation: { callouts: true, display: 'expanded', timed: true },
    scenes: [
      {
        callout: { body: 'Body', properties: { retained: true } },
        focus: { elements: ['CARD-A'] },
        id: 'THM-01',
        label: 'Sequence scene',
        visibility: { hide: { elements: ['FLOW-A'] } }
      }
    ]
  },
  {
    description: 'Walkthrough description',
    id: 'STORY',
    label: 'Story',
    presentation: { callouts: true, display: 'collapsed', timed: false },
    scenes: [{ duration: 4200, focus: { elements: ['FLOW-A'] }, id: 'STORY-01', label: 'Story scene' }]
  }
]

const compatibilitySequences: readonly SequenceConfig[] = sequences.map((sequence) => ({
  code: sequence.id,
  description: sequence.description,
  id: sequence.id,
  label: sequence.label,
  presentation: sequence.presentation,
  scenes: sequence.scenes.map((scene) => ({
    callout: scene.callout ? { body: scene.callout.body } : undefined,
    code: scene.id,
    description: scene.description,
    duration: scene.duration,
    focus: {
      artefacts: scene.focus?.elements?.filter((id) => id.startsWith('CARD')),
      flows: scene.focus?.elements?.filter((id) => id.startsWith('FLOW'))
    },
    id: scene.id,
    label: scene.label
  }))
}))

describe('canonical Sequence editing adapters', () => {
  it('opens all four presentation combinations through the existing editor panels', () => {
    expect(standaloneScenesForEditing(compatibilitySequences).map(({ code }) => code)).toEqual(['OV-01'])
    expect(expandedSequencesForEditing(compatibilitySequences).map(({ id }) => id)).toEqual(['SEQUENCE'])
    expect(storiesForEditing(compatibilitySequences).map(({ id }) => id)).toEqual(['STORY'])
  })

  it('merges edited fields while retaining canonical presentation and unexposed scene properties', () => {
    const drafts = expandedSequencesForEditing(compatibilitySequences)
    const sequence = drafts[0]
    if (!sequence) throw new Error('missing Sequence fixture')
    const changedSequences = [
      {
        ...sequence,
        scenes: sequence.scenes.map((scene) => ({ ...scene, focus: { artefacts: ['CARD-B'], flows: [] } })),
        title: 'Changed sequence'
      }
    ]

    const changed = sequencesWithEditorDrafts(sequences, { expanded: changedSequences })
    const result = changed.find(({ id }) => id === 'SEQUENCE')
    expect(result?.label).toBe('Changed sequence')
    expect(result?.presentation).toEqual({ callouts: true, display: 'expanded', timed: true })
    expect(result?.scenes[0]?.focus?.elements).toEqual(['CARD-B'])
    expect(result?.scenes[0]?.visibility).toEqual({ hide: { elements: ['FLOW-A'] } })
    expect(result?.scenes[0]?.callout?.properties).toEqual({ retained: true })
  })
})
