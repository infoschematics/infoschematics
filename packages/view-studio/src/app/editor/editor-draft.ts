import type { ArtefactOperation, AttachedEnd, CreatedComponent, CreatedFlow } from '@infoschematics/view-model/editable'
import type { Offset, Point } from '@infoschematics/view-model/geometry'
import type { PortCounts } from '@infoschematics/view-model/ports'
import type { SetStateAction } from 'react'

export type Creation = Omit<CreatedFlow, 'code'>
export type CardCreation = Omit<CreatedComponent, 'code'>
export type Removal = { because?: string }
export type TextDraft = { detail?: string; family?: string; group?: string; name?: string }
export type TextField = keyof TextDraft
export type Attachment = { source?: AttachedEnd; target?: AttachedEnd }
export type ComponentDraft = Offset & { from?: string }

export const editorDraftVersion = 1 as const

/**
 * One serialisable draft value for persistence, history and review output.
 *
 * `artefactOperations` is the additive seam for the five-kind editor. Existing
 * Card and Flow drafts retain their settled public hook API while later Region,
 * Fabric, Card, Flow and Graphic operations enter the same lifecycle.
 */
export type EditorDraft = {
  artefactOperations: readonly ArtefactOperation[]
  attachments: Record<string, Attachment>
  cards: Record<string, CardCreation>
  components: Record<string, ComponentDraft>
  creations: Record<string, Creation>
  labels: Record<string, number>
  portCounts: Record<string, PortCounts>
  removals: Record<string, Removal>
  routes: Record<string, readonly Point[]>
  text: Record<string, TextDraft>
  version: typeof editorDraftVersion
}

export const emptyEditorDraft = (): EditorDraft => ({
  artefactOperations: [],
  attachments: {},
  cards: {},
  components: {},
  creations: {},
  labels: {},
  portCounts: {},
  removals: {},
  routes: {},
  text: {},
  version: editorDraftVersion
})

const record = <T>(value: unknown): Record<string, T> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, T>) : {}

/** Accepts a current envelope or a partial earlier snapshot without losing known fields. */
export const normaliseEditorDraft = (value: unknown): EditorDraft => {
  const candidate = record<unknown>(value)
  return {
    artefactOperations: Array.isArray(candidate.artefactOperations)
      ? (candidate.artefactOperations as readonly ArtefactOperation[])
      : [],
    attachments: record<Attachment>(candidate.attachments),
    cards: record<CardCreation>(candidate.cards),
    components: record<ComponentDraft>(candidate.components ?? candidate.drafts),
    creations: record<Creation>(candidate.creations),
    labels: record<number>(candidate.labels),
    portCounts: record<PortCounts>(candidate.portCounts),
    removals: record<Removal>(candidate.removals),
    routes: record<readonly Point[]>(candidate.routes),
    text: record<TextDraft>(candidate.text),
    version: editorDraftVersion
  }
}

const read = <T>(store: Storage, key: string, fallback: T): T => {
  try {
    const raw = store.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

/**
 * Reads the pre-envelope keys once as the fallback for the new canonical key.
 * Earlier keys are left intact: adopting the envelope is additive and recoverable.
 */
export const readPreviousEditorDraft = (storage: string | undefined, store: Storage | undefined): EditorDraft => {
  if (!storage || !store) return emptyEditorDraft()
  return normaliseEditorDraft({
    attachments: read(store, `${storage}.diagram.attachments`, {}),
    cards: read(store, `${storage}.diagram.cards`, {}),
    components: read(store, `${storage}.diagram.labels`, {}),
    creations: read(store, `${storage}.diagram.creations`, {}),
    labels: read(store, `${storage}.diagram.labels.along`, {}),
    portCounts: read(store, `${storage}.diagram.ports`, {}),
    removals: read(store, `${storage}.diagram.removals`, {}),
    routes: read(store, `${storage}.diagram.routes`, {}),
    text: read(store, `${storage}.diagram.text`, {})
  })
}

export const updateEditorDraft = <K extends Exclude<keyof EditorDraft, 'version'>>(
  draft: EditorDraft,
  field: K,
  update: SetStateAction<EditorDraft[K]>
): EditorDraft => {
  const next = typeof update === 'function' ? update(draft[field]) : update
  return Object.is(next, draft[field]) ? draft : { ...draft, [field]: next }
}

export const editorDraftHasChanges = (draft: EditorDraft): boolean =>
  draft.artefactOperations.length > 0 ||
  (
    [
      draft.attachments,
      draft.cards,
      draft.components,
      draft.creations,
      draft.labels,
      draft.portCounts,
      draft.removals,
      draft.routes,
      draft.text
    ] as const
  ).some((entries) => Object.keys(entries).length > 0)

export const editorDraftsEqual = (left: EditorDraft, right: EditorDraft): boolean =>
  left === right || JSON.stringify(left) === JSON.stringify(right)

export type DraftModel = Pick<
  import('@infoschematics/view-model/editable').EditableDiagram,
  'authored' | 'authors' | 'knows'
>

const textProperty: Readonly<Record<TextField, string>> = {
  detail: 'detail',
  family: 'family',
  group: 'group',
  name: 'label'
}

/** Drops stale, invalid and already-applied persisted values from every existing field. */
export const sweepEditorDraft = (draft: EditorDraft, model: DraftModel): EditorDraft => {
  const known = (key: string) => model.knows(key)
  const components = Object.fromEntries(
    Object.entries(draft.components).filter(
      ([key, component]) => known(key) && component.from === model.authored(key, 'card')
    )
  )
  const creations = Object.fromEntries(Object.entries(draft.creations).filter(([key]) => !model.authors(key)))
  const cards = Object.fromEntries(Object.entries(draft.cards).filter(([key]) => !model.authors(key)))
  const labels = Object.fromEntries(
    Object.entries(draft.labels).filter(
      ([key, along]) =>
        known(key) &&
        along >= 0 &&
        along <= 1 &&
        `${key}  ->  label: { along: ${along} },` !== model.authored(key, 'label')
    )
  )
  const routes = Object.fromEntries(
    Object.entries(draft.routes).filter(([key, points]) => {
      if (!known(key)) return false
      const list = points.map((point) => `{ x: ${point.x}, y: ${point.y} }`).join(', ')
      return `${key}  ->  points: [${list}],` !== model.authored(key, 'points')
    })
  )
  const portCounts = Object.fromEntries(
    Object.entries(draft.portCounts).filter(([key, counts]) => {
      if (!known(key)) return false
      const authored = model.authored(key, 'ports') ?? ''
      return (['north', 'east', 'south', 'west'] as const).some(
        (side) => counts[side] !== undefined && !authored.includes(`${side}: ${counts[side]}`)
      )
    })
  )
  const attachments = Object.fromEntries(
    Object.entries(draft.attachments)
      .filter(([key]) => known(key))
      .map(([key, ends]) => {
        const kept = Object.fromEntries(
          (['source', 'target'] as const)
            .filter((end) => ends[end] && ends[end]?.from === model.authored(key, end))
            .map((end) => [end, ends[end]])
        )
        return [key, kept]
      })
      .filter(([, ends]) => Object.keys(ends).length > 0)
  )
  const text = Object.fromEntries(
    Object.entries(draft.text)
      .filter(([key]) => known(key))
      .flatMap(([key, fields]) => {
        const kept = Object.fromEntries(
          (Object.keys(textProperty) as TextField[])
            .filter(
              (field) =>
                fields[field] !== undefined &&
                `${key}  ->  ${textProperty[field]}: '${fields[field]}',` !== model.authored(key, field)
            )
            .map((field) => [field, fields[field]])
        )
        return Object.keys(kept).length > 0 ? [[key, kept]] : []
      })
  )
  const removals = Object.fromEntries(Object.entries(draft.removals).filter(([key]) => known(key)))

  return {
    ...draft,
    attachments,
    cards,
    components,
    creations,
    labels,
    portCounts,
    removals,
    routes,
    text
  }
}

export type EditorDraftHistory = Readonly<{
  current: EditorDraft
  future: readonly EditorDraft[]
  gesture: EditorDraft | null
  past: readonly EditorDraft[]
}>

export const createEditorDraftHistory = (current: EditorDraft): EditorDraftHistory => ({
  current,
  future: [],
  gesture: null,
  past: []
})

export const applyDiscreteDraft = (history: EditorDraftHistory, next: EditorDraft): EditorDraftHistory =>
  editorDraftsEqual(history.current, next)
    ? history
    : { current: next, future: [], gesture: null, past: [...history.past, history.current] }

export const beginDraftGesture = (history: EditorDraftHistory): EditorDraftHistory =>
  history.gesture ? history : { ...history, future: [], gesture: history.current }

export const applyGestureDraft = (history: EditorDraftHistory, next: EditorDraft): EditorDraftHistory =>
  editorDraftsEqual(history.current, next) ? history : { ...beginDraftGesture(history), current: next, future: [] }

export const endDraftGesture = (history: EditorDraftHistory): EditorDraftHistory => {
  if (!history.gesture) return history
  return editorDraftsEqual(history.gesture, history.current)
    ? { ...history, gesture: null }
    : { ...history, gesture: null, past: [...history.past, history.gesture] }
}

export const undoEditorDraft = (history: EditorDraftHistory): EditorDraftHistory => {
  const previous = history.past.at(-1)
  return previous
    ? {
        current: previous,
        future: [...history.future, history.current],
        gesture: null,
        past: history.past.slice(0, -1)
      }
    : history
}

export const redoEditorDraft = (history: EditorDraftHistory): EditorDraftHistory => {
  const next = history.future.at(-1)
  return next
    ? {
        current: next,
        future: history.future.slice(0, -1),
        gesture: null,
        past: [...history.past, history.current]
      }
    : history
}
