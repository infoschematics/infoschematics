import {
  type InfoschematicDocument,
  type InfoschematicIssue,
  infoschematicDocumentModel,
  infoschematicDocumentPathname,
  infoschematicDocumentSource,
  parseInfoschematicDocument
} from '@infoschematics/domain-core'
import type { DefinedInfoschematic } from '@infoschematics/domain-model/model'
import { useCallback, useEffect, useMemo, useState } from 'react'

export type StudioDocumentReplacement = Readonly<{
  document: InfoschematicDocument
  model: DefinedInfoschematic
  source: string
}>

export type StudioDocumentReplacementHandler = (replacement: StudioDocumentReplacement) => void

type DocumentEntry = Readonly<{
  document: InfoschematicDocument
  source: string
}>

export type DocumentTimeline = Readonly<{
  at: number
  dirty: boolean
  draft: string
  entries: readonly DocumentEntry[]
  issues: readonly InfoschematicIssue[]
}>

const entryOf = (document: InfoschematicDocument): DocumentEntry => ({
  document,
  source: infoschematicDocumentSource(document)
})

export const documentTimelineOf = (document: InfoschematicDocument): DocumentTimeline => {
  const entry = entryOf(document)
  return { at: 0, dirty: false, draft: entry.source, entries: [entry], issues: [] }
}

export const appendDocumentTimeline = (
  timeline: DocumentTimeline,
  document: InfoschematicDocument
): DocumentTimeline => {
  const entry = entryOf(document)
  if (timeline.entries[timeline.at]?.source === entry.source) {
    const entries = [...timeline.entries]
    entries[timeline.at] = entry
    return { ...timeline, dirty: false, draft: entry.source, entries, issues: [] }
  }
  const entries = [...timeline.entries.slice(0, timeline.at + 1), entry]
  return { at: entries.length - 1, dirty: false, draft: entry.source, entries, issues: [] }
}

export const synchroniseDocumentTimeline = (
  timeline: DocumentTimeline,
  document: InfoschematicDocument
): DocumentTimeline => {
  const entry = entryOf(document)
  const known = timeline.entries.findIndex((candidate) => candidate.source === entry.source)
  if (known < 0) return appendDocumentTimeline(timeline, document)
  const entries = [...timeline.entries]
  entries[known] = entry
  return timeline.dirty
    ? { ...timeline, at: known, entries }
    : { ...timeline, at: known, draft: entry.source, entries, issues: [] }
}

const replacementOf = (document: InfoschematicDocument): StudioDocumentReplacement => ({
  document,
  model: infoschematicDocumentModel(document),
  source: infoschematicDocumentSource(document)
})

export type StudioSourcePanelController = Readonly<{
  canRedo: boolean
  canReplace: boolean
  canUndo: boolean
  dirty: boolean
  draft: string
  issues: readonly InfoschematicIssue[]
  redo: () => void
  replace: () => void
  reset: () => void
  setDraft: (source: string) => void
  source: string
  undo: () => void
}>

export const useDocumentTimeline = (
  authoredDocument: InfoschematicDocument | undefined,
  onReplace: StudioDocumentReplacementHandler | undefined
): Readonly<{ panel?: StudioSourcePanelController; record: (document: InfoschematicDocument) => void }> => {
  const [timeline, setTimeline] = useState<DocumentTimeline | undefined>(() =>
    authoredDocument ? documentTimelineOf(authoredDocument) : undefined
  )

  useEffect(() => {
    if (!authoredDocument) {
      setTimeline(undefined)
      return
    }
    setTimeline((current) =>
      current ? synchroniseDocumentTimeline(current, authoredDocument) : documentTimelineOf(authoredDocument)
    )
  }, [authoredDocument])

  const record = useCallback((document: InfoschematicDocument) => {
    setTimeline((current) => (current ? appendDocumentTimeline(current, document) : documentTimelineOf(document)))
  }, [])

  const move = useCallback(
    (offset: -1 | 1) => {
      if (!timeline) return
      const at = timeline.at + offset
      const entry = timeline.entries[at]
      if (!entry) return
      setTimeline({ ...timeline, at, dirty: false, draft: entry.source, issues: [] })
      onReplace?.(replacementOf(entry.document))
    },
    [onReplace, timeline]
  )

  const panel = useMemo<StudioSourcePanelController | undefined>(() => {
    if (!timeline) return undefined
    const current = timeline.entries[timeline.at]
    if (!current) return undefined
    return {
      canRedo: Boolean(onReplace && timeline.entries[timeline.at + 1]),
      canReplace: Boolean(onReplace),
      canUndo: Boolean(onReplace && timeline.entries[timeline.at - 1]),
      dirty: timeline.dirty,
      draft: timeline.draft,
      issues: timeline.issues,
      redo: () => move(1),
      replace: () => {
        const parsed = parseInfoschematicDocument(timeline.draft, {
          pathname: infoschematicDocumentPathname(current.document)
        })
        if (!parsed.ok) {
          setTimeline((value) => (value ? { ...value, issues: parsed.issues } : value))
          return
        }
        record(parsed.document)
        onReplace?.(replacementOf(parsed.document))
      },
      reset: () =>
        setTimeline((value) => (value ? { ...value, dirty: false, draft: current.source, issues: [] } : value)),
      setDraft: (source) =>
        setTimeline((value) =>
          value ? { ...value, dirty: source !== current.source, draft: source, issues: [] } : value
        ),
      source: current.source,
      undo: () => move(-1)
    }
  }, [move, onReplace, record, timeline])

  return useMemo(() => ({ panel, record }), [panel, record])
}
