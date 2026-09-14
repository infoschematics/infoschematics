import type { Sequence } from '@infoschematics/domain-model'
import type { SequenceConfig } from '@infoschematics/domain-model/sequence'
import { describe, expect, it } from 'vitest'
import {
  sequencesWithEditorDrafts,
  standaloneScenesForEditing,
  storiesForEditing,
  themesForEditing
} from './sequence-editing.ts'

const sequences: readonly Sequence[] = [
  {
    id: 'OVERVIEW',
    label: 'Overview',
    presentation: { callouts: false, display: 'expanded', timed: false },
    scenes: [{ focus: { elements: ['CARD-A', 'FLOW-A'] }, id: 'OV-01', label: 'Overview scene' }]
  },
  {
    id: 'THEME',
    label: 'Theme',
    presentation: { callouts: true, display: 'expanded', timed: true },
    scenes: [
      {
        callout: { body: 'Body', properties: { retained: true } },
        focus: { elements: ['CARD-A'] },
        id: 'THM-01',
        label: 'Theme scene',
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
    expect(themesForEditing(compatibilitySequences).map(({ id }) => id)).toEqual(['THEME'])
    expect(storiesForEditing(compatibilitySequences).map(({ id }) => id)).toEqual(['STORY'])
  })

  it('merges edited fields while retaining canonical presentation and unexposed scene properties', () => {
    const themes = themesForEditing(compatibilitySequences)
    const theme = themes[0]
    if (!theme) throw new Error('missing Theme fixture')
    const changedThemes = [
      {
        ...theme,
        scenes: theme.scenes.map((scene) => ({ ...scene, focus: { artefacts: ['CARD-B'], flows: [] } })),
        title: 'Changed theme'
      }
    ]

    const changed = sequencesWithEditorDrafts(sequences, { expanded: changedThemes })
    const result = changed.find(({ id }) => id === 'THEME')
    expect(result?.label).toBe('Changed theme')
    expect(result?.presentation).toEqual({ callouts: true, display: 'expanded', timed: true })
    expect(result?.scenes[0]?.focus?.elements).toEqual(['CARD-B'])
    expect(result?.scenes[0]?.visibility).toEqual({ hide: { elements: ['FLOW-A'] } })
    expect(result?.scenes[0]?.callout?.properties).toEqual({ retained: true })
  })
})
