import type { Callout, Sequence, SequenceScene } from '@infoschematics/domain-model'
import { rendererReferenceOf } from '@infoschematics/domain-model/renderer'
import type { SequenceConfig } from '@infoschematics/domain-model/sequence'
import type { StoryConfig, StorySceneConfig } from '@infoschematics/domain-model/story'
import type { Scene as LibraryScene } from './scene-library.ts'
import { type Story, storyForEditing } from './scenes.ts'
import type { SequenceDraft, SequenceDraftScene } from './sequence-composition.ts'

const uniqueSorted = (values: readonly string[]): readonly string[] =>
  [...new Set(values)].sort((left, right) => left.localeCompare(right))

const focusOf = (
  focus: { artefacts?: readonly string[]; flows?: readonly string[]; graphics?: readonly string[] } | undefined,
  graphic?: string
): SequenceScene['focus'] => {
  const elements = uniqueSorted([
    ...(focus?.artefacts ?? []),
    ...(focus?.flows ?? []),
    ...(focus?.graphics ?? []),
    ...(graphic ? [graphic] : [])
  ])
  return elements.length > 0 ? { elements } : undefined
}

const calloutOf = (
  value: SequenceDraftScene['callout'] | StorySceneConfig['callout'],
  original?: Callout
): Callout | undefined => {
  if (!value) return undefined
  return {
    ...original,
    body: value.body,
    kind: value.renderer ? rendererReferenceOf(value.renderer) : original?.kind,
    placement: value.at ? { at: value.at } : original?.placement,
    properties: value.properties ?? original?.properties,
    takeaways: value.takeaways,
    title: value.title
  }
}

export const standaloneScenesForEditing = (sequences: readonly SequenceConfig[]): readonly LibraryScene[] =>
  (sequences.find((sequence) => sequence.id === 'OVERVIEW')?.scenes ?? []).map((scene) => ({
    code: scene.code,
    components: [...(scene.focus.artefacts ?? []), ...(scene.focus.graphics ?? [])],
    description: scene.description ?? '',
    flows: scene.focus.flows ?? [],
    id: scene.id,
    label: scene.label
  }))

export const expandedSequencesForEditing = (sequences: readonly SequenceConfig[]): readonly SequenceDraft[] =>
  sequences
    .filter((sequence) => sequence.presentation.display === 'expanded' && sequence.id !== 'OVERVIEW')
    .map((sequence) => ({
      description: sequence.description,
      id: sequence.id,
      scenes: sequence.scenes.map(
        (scene): SequenceDraftScene => ({
          callout: scene.callout,
          code: scene.code,
          description: scene.description,
          focus: scene.focus,
          id: scene.id,
          label: scene.label
        })
      ),
      title: sequence.label
    }))

const storyConfigForEditing = (sequence: SequenceConfig): StoryConfig => ({
  code: sequence.code,
  id: sequence.id,
  question: sequence.description,
  scenes: sequence.scenes.map(
    (scene): StorySceneConfig => ({
      anchor: scene.anchor,
      callout: scene.callout,
      duration: scene.duration,
      focus: scene.focus,
      graphic: scene.graphic,
      id: scene.id,
      title: scene.label
    })
  ),
  title: sequence.label
})

export const storiesForEditing = (sequences: readonly SequenceConfig[]): readonly Story[] =>
  sequences
    .filter((sequence) => sequence.presentation.display === 'collapsed')
    .map((sequence) => storyForEditing(storyConfigForEditing(sequence), []))

const sequenceSceneFromStandalone = (scene: LibraryScene, original?: SequenceScene): SequenceScene => ({
  ...original,
  description: scene.description || undefined,
  focus: focusOf({ artefacts: scene.components, flows: scene.flows }),
  id: scene.code,
  label: scene.label
})

const sequenceFromStandalone = (scenes: readonly LibraryScene[], original?: Sequence): Sequence | undefined => {
  if (!original && scenes.length === 0) return undefined
  return {
    description: original?.description,
    id: original?.id ?? 'OVERVIEW',
    label: original?.label ?? 'Overview',
    presentation: original?.presentation ?? { callouts: false, display: 'expanded', timed: false },
    scenes: scenes.map((scene) =>
      sequenceSceneFromStandalone(
        scene,
        original?.scenes.find((candidate) => candidate.id === scene.code || candidate.id === scene.id)
      )
    )
  }
}

const sequenceSceneFromDraft = (scene: SequenceDraftScene, original?: SequenceScene): SequenceScene => ({
  ...original,
  callout: calloutOf(scene.callout, original?.callout),
  description: scene.description,
  focus: focusOf(scene.focus),
  id: scene.code,
  label: scene.label
})

const sequenceFromDraft = (sequence: SequenceDraft, original?: Sequence): Sequence => ({
  description: sequence.description,
  id: sequence.id,
  label: sequence.title,
  presentation: original?.presentation ?? { callouts: true, display: 'expanded', timed: false },
  scenes: sequence.scenes.map((scene) =>
    sequenceSceneFromDraft(
      scene,
      original?.scenes.find((candidate) => candidate.id === scene.code || candidate.id === scene.id)
    )
  )
})

const sequenceSceneFromStory = (scene: Story['steps'][number], original?: SequenceScene): SequenceScene => ({
  ...original,
  callout: calloutOf(scene.authored.callout, original?.callout),
  duration: scene.hold || undefined,
  focus: focusOf(scene.authored.focus, scene.authored.graphic),
  id: scene.authored.id ?? original?.id ?? '',
  label: scene.title ?? original?.label ?? 'Scene'
})

const sequenceFromStory = (story: Story, original: Sequence): Sequence => ({
  ...original,
  description: story.question || undefined,
  label: story.label,
  scenes: story.steps.map((scene, index) =>
    sequenceSceneFromStory(
      scene,
      original.scenes.find((candidate) => candidate.id === scene.authored.id) ?? original.scenes[index]
    )
  )
})

export type SequenceEditorDrafts = Readonly<{
  collapsed?: readonly Story[]
  expanded?: readonly SequenceDraft[]
  overview?: readonly LibraryScene[]
}>

/** Rebuilds only edited presentation categories while preserving every unexposed canonical field. */
export const sequencesWithEditorDrafts = (
  original: readonly Sequence[],
  drafts: SequenceEditorDrafts
): readonly Sequence[] => {
  const byId = new Map(original.map((sequence) => [sequence.id, sequence]))
  const overview = drafts.overview ? sequenceFromStandalone(drafts.overview, byId.get('OVERVIEW')) : undefined
  const expanded = drafts.expanded?.map((sequence) => sequenceFromDraft(sequence, byId.get(sequence.id)))
  const expandedById = expanded ? new Map(expanded.map((sequence) => [sequence.id, sequence])) : undefined
  const collapsed = drafts.collapsed?.flatMap((story) => {
    const authored = byId.get(story.id)
    return authored ? [sequenceFromStory(story, authored)] : []
  })
  const collapsedById = collapsed ? new Map(collapsed.map((sequence) => [sequence.id, sequence])) : undefined

  const retained = original.flatMap((sequence) => {
    if (sequence.id === 'OVERVIEW' && drafts.overview) return overview ? [overview] : []
    if (sequence.presentation.display === 'expanded' && sequence.id !== 'OVERVIEW' && expandedById) {
      const changed = expandedById.get(sequence.id)
      return changed ? [changed] : []
    }
    if (sequence.presentation.display === 'collapsed' && collapsedById) {
      const changed = collapsedById.get(sequence.id)
      return changed ? [changed] : []
    }
    return [sequence]
  })

  const existing = new Set(retained.map((sequence) => sequence.id))
  const addedExpanded = expanded?.filter((sequence) => !existing.has(sequence.id)) ?? []
  if (overview && !existing.has(overview.id)) return [overview, ...retained, ...addedExpanded]
  return [...retained, ...addedExpanded]
}
