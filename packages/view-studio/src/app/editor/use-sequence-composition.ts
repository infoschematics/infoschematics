import { useInfoschematic } from '@infoschematics/view-canvas'
import { useMemo, useState } from 'react'
import { usePersistentState } from '../hooks/use-persistent-state.ts'
import {
  addSequence,
  addSequenceScene,
  clearSequenceScenes,
  editSequence,
  editSequenceScene,
  moveSequenceScene,
  removeSequence,
  removeSequenceScene,
  type SequenceCollection,
  type SequenceDraft,
  type SequenceDraftScene,
  sequenceCanActivate,
  sequencesAsSource,
  toggleSequenceLit
} from './sequence-composition.ts'
import { expandedSequencesForEditing } from './sequence-editing.ts'

/** Persistent Sequence drafts and transient Direct selection. */
export function useSequenceComposition() {
  const { compatibilityConfig: config } = useInfoschematic()
  const authoredSequences = useMemo(
    () => (config.sequences?.length ? expandedSequencesForEditing(config.sequences) : config.themes),
    [config.sequences, config.themes]
  )
  const [draft, setDraft] = usePersistentState<SequenceCollection | null>(
    config.id && `${config.id}.sequences.expanded`,
    null
  )
  const [chosenSequence, setChosenSequence] = useState(authoredSequences[0]?.id ?? '')
  const [chosenScene, setChosenScene] = useState(0)
  const sequences = draft ?? authoredSequences
  const sequence = sequences.find((candidate) => candidate.id === chosenSequence) ?? sequences[0]
  const at = Math.min(chosenScene, Math.max(0, (sequence?.scenes.length ?? 1) - 1))
  const scene = sequence?.scenes[at]

  const validArtefactIds = useMemo(
    () =>
      new Set([
        ...config.infoschematic.cards.map((entry) => entry.id),
        ...config.infoschematic.fabrics.map((entry) => entry.id),
        ...config.infoschematic.points.map((entry) => entry.id)
      ]),
    [config.infoschematic.cards, config.infoschematic.fabrics, config.infoschematic.points]
  )
  const validFlowIds = useMemo(
    () => new Set(config.infoschematic.flows.map((entry) => entry.id)),
    [config.infoschematic.flows]
  )

  const apply = (change: (current: SequenceCollection) => SequenceCollection) => setDraft(change(sequences))

  return {
    addScene: (label: string) => {
      if (!sequence) return
      const next = addSequenceScene(sequences, sequence.id, label)
      setDraft(next)
      setChosenScene(Math.max(0, (next.find((candidate) => candidate.id === sequence.id)?.scenes.length ?? 1) - 1))
    },
    addSequence: (title: string) => {
      const next = addSequence(sequences, title)
      setDraft(next)
      setChosenSequence(next.at(-1)?.id ?? chosenSequence)
      setChosenScene(0)
    },
    at,
    /** Empty or stale Sequence compositions remain drafts but cannot be shown in Present. */
    canActivate: sequence ? sequenceCanActivate(sequence, validArtefactIds, validFlowIds) : false,
    chooseScene: setChosenScene,
    chooseSequence: (id: string) => {
      setChosenSequence(id)
      setChosenScene(0)
    },
    chosenSequence: sequence?.id ?? '',
    clear: () => {
      if (!sequence) return
      apply((current) => clearSequenceScenes(current, sequence.id))
      setChosenScene(0)
    },
    editScene: (change: Partial<SequenceDraftScene>) => {
      if (!sequence || !scene) return
      apply((current) => editSequenceScene(current, sequence.id, scene.id, change))
    },
    editSequence: (change: Partial<SequenceDraft>) => {
      if (!sequence) return
      apply((current) => editSequence(current, sequence.id, change))
    },
    edited: draft !== null,
    lit: new Set<string>([...(scene?.focus.artefacts ?? []), ...(scene?.focus.flows ?? [])]),
    move: (delta: number) => {
      if (!sequence) return
      apply((current) => moveSequenceScene(current, sequence.id, at, delta))
      const to = at + delta
      if (to >= 0 && to < sequence.scenes.length) setChosenScene(to)
    },
    removeScene: () => {
      if (!sequence || !scene) return
      apply((current) => removeSequenceScene(current, sequence.id, at))
      setChosenScene(Math.max(0, at - 1))
    },
    removeSequence: () => {
      if (!sequence) return
      const next = removeSequence(sequences, sequence.id)
      setDraft(next)
      setChosenSequence(next[0]?.id ?? '')
      setChosenScene(0)
    },
    revert: () => {
      setDraft(null)
      setChosenSequence(authoredSequences[0]?.id ?? '')
      setChosenScene(0)
    },
    scene,
    scenes: sequence?.scenes ?? [],
    source: sequencesAsSource(sequences),
    sequence,
    sequences,
    toggle: (id: string, isFlow: boolean) => {
      if (!sequence || !scene) return
      apply((current) => toggleSequenceLit(current, sequence.id, scene.id, id, isFlow))
    }
  }
}

export type SequenceComposition = ReturnType<typeof useSequenceComposition>
