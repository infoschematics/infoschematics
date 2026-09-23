import type { CalloutConfig, FocusConfig } from '@infoschematics/domain-model/scene'

/*
 * What Studio edits is a Sequence, so the editing shape is named after the concept rather than
 * after the retained compatibility input it happens to match. The shapes stay structurally
 * identical, so the `config.themes` fallback still assigns into a draft without conversion.
 */
export type SequenceDraftScene = {
  id: string
  code: string
  label: string
  short?: string
  description?: string
  focus: FocusConfig
  callout?: CalloutConfig
}

export type SequenceDraft = {
  id: string
  title: string
  description?: string
  scenes: readonly SequenceDraftScene[]
}

export type SequenceCollection = readonly SequenceDraft[]

const identifierFrom = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const uniqueIdentifier = (wanted: string, used: ReadonlySet<string>, fallback: string): string => {
  const base = identifierFrom(wanted) || fallback
  if (!used.has(base)) return base
  let serial = 2
  while (used.has(`${base}-${serial}`)) serial += 1
  return `${base}-${serial}`
}

export const nextSequenceSceneCode = (sequences: SequenceCollection): string => {
  const serials = sequences.flatMap((sequence) =>
    sequence.scenes.flatMap((scene) => /^THM-(\d+)$/.exec(scene.code)?.slice(1) ?? [])
  )
  const highest = serials.reduce((best, serial) => Math.max(best, Number(serial)), 0)
  const width = serials.reduce((widest, serial) => Math.max(widest, serial.length), 2)
  return `THM-${String(highest + 1).padStart(width, '0')}`
}

/** Create an empty Sequence which is editable in Direct but not activatable in Present. */
export const addSequence = (sequences: SequenceCollection, title: string): SequenceCollection => {
  const named = title.trim() || 'New Sequence'
  const used = new Set(sequences.map((sequence) => sequence.id))
  return [...sequences, { id: uniqueIdentifier(named, used, 'sequence'), scenes: [], title: named }]
}

export const editSequence = (
  sequences: SequenceCollection,
  id: string,
  change: Partial<SequenceDraft>
): SequenceCollection =>
  sequences.map((sequence) => (sequence.id === id ? { ...sequence, ...change, id: sequence.id } : sequence))

export const removeSequence = (sequences: SequenceCollection, id: string): SequenceCollection =>
  sequences.some((sequence) => sequence.id === id) ? sequences.filter((sequence) => sequence.id !== id) : sequences

export const addSequenceScene = (
  sequences: SequenceCollection,
  sequenceId: string,
  label: string
): SequenceCollection => {
  const sequence = sequences.find((candidate) => candidate.id === sequenceId)
  if (!sequence) return sequences

  const named = label.trim() || 'New Scene'
  const used = new Set(sequences.flatMap((candidate) => candidate.scenes.map((scene) => scene.id)))
  const scene: SequenceDraftScene = {
    code: nextSequenceSceneCode(sequences),
    description: '',
    focus: {},
    id: uniqueIdentifier(named, used, 'sequence-scene'),
    label: named
  }
  return sequences.map((candidate) =>
    candidate.id === sequenceId ? { ...candidate, scenes: [...candidate.scenes, scene] } : candidate
  )
}

export const editSequenceScene = (
  sequences: SequenceCollection,
  sequenceId: string,
  sceneId: string,
  change: Partial<SequenceDraftScene>
): SequenceCollection =>
  sequences.map((sequence) =>
    sequence.id === sequenceId
      ? {
          ...sequence,
          scenes: sequence.scenes.map((scene) =>
            scene.id === sceneId ? { ...scene, ...change, code: scene.code, id: scene.id } : scene
          )
        }
      : sequence
  )

export const moveSequenceScene = (
  sequences: SequenceCollection,
  sequenceId: string,
  at: number,
  delta: number
): SequenceCollection => {
  const sequence = sequences.find((candidate) => candidate.id === sequenceId)
  const to = at + delta
  if (!sequence || at < 0 || at >= sequence.scenes.length || to < 0 || to >= sequence.scenes.length) return sequences

  const scenes = [...sequence.scenes]
  const [moved] = scenes.splice(at, 1)
  scenes.splice(to, 0, moved)
  return sequences.map((candidate) => (candidate.id === sequenceId ? { ...candidate, scenes } : candidate))
}

export const removeSequenceScene = (
  sequences: SequenceCollection,
  sequenceId: string,
  at: number
): SequenceCollection => {
  const sequence = sequences.find((candidate) => candidate.id === sequenceId)
  if (!sequence || at < 0 || at >= sequence.scenes.length) return sequences
  return sequences.map((candidate) =>
    candidate.id === sequenceId
      ? { ...candidate, scenes: candidate.scenes.filter((_, index) => index !== at) }
      : candidate
  )
}

export const clearSequenceScenes = (sequences: SequenceCollection, sequenceId: string): SequenceCollection => {
  const sequence = sequences.find((candidate) => candidate.id === sequenceId)
  if (!sequence || sequence.scenes.length === 0) return sequences
  return sequences.map((candidate) => (candidate.id === sequenceId ? { ...candidate, scenes: [] } : candidate))
}

export const toggleSequenceLit = (
  sequences: SequenceCollection,
  sequenceId: string,
  sceneId: string,
  id: string,
  isFlow: boolean
): SequenceCollection => {
  const sequence = sequences.find((candidate) => candidate.id === sequenceId)
  const scene = sequence?.scenes.find((candidate) => candidate.id === sceneId)
  if (!sequence || !scene) return sequences

  const key = isFlow ? 'flows' : 'artefacts'
  const current = scene.focus[key] ?? []
  const next = current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
  return editSequenceScene(sequences, sequenceId, sceneId, { focus: { ...scene.focus, [key]: next } })
}

/** Empty and structurally stale Sequences stay editable, but Present must refuse them. */
export const sequenceCanActivate = (
  sequence: SequenceDraft,
  validArtefactIds?: ReadonlySet<string>,
  validFlowIds?: ReadonlySet<string>
): boolean =>
  sequence.scenes.some(
    (scene) =>
      scene.id.trim() !== '' &&
      scene.code.trim() !== '' &&
      scene.label.trim() !== '' &&
      (!validArtefactIds || (scene.focus.artefacts ?? []).every((id) => validArtefactIds.has(id))) &&
      (!validFlowIds || (scene.focus.flows ?? []).every((id) => validFlowIds.has(id)))
  )

/**
 * The complete authored collection, so fields not exposed by the panel survive.
 *
 * The emitted key stays `sequences` because that is the field an author pastes back into, and
 * `ADR-INFOSCHEMATICS-019` retains it as a compatibility input under that name.
 */
export const sequencesAsSource = (sequences: SequenceCollection): string =>
  `sequences  ->  ${JSON.stringify(sequences, null, 2)}`
