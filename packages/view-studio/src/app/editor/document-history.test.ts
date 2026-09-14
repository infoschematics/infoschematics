import { parseInfoschematicDocument } from '@infoschematics/domain-core'
import { describe, expect, it } from 'vitest'
import { appendDocumentTimeline, documentTimelineOf, synchroniseDocumentTimeline } from './document-history.ts'

const documentOf = (source: string) => {
  const parsed = parseInfoschematicDocument(source, { pathname: 'infoschematic.yaml' })
  if (!parsed.ok) throw new Error('timeline fixture should parse')
  return parsed.document
}

const initial = documentOf(`id: TIMELINE
title: Initial
diagram:
  bounds: 0 0 320 200
`)

const changed = documentOf(`id: TIMELINE
title: Changed
diagram:
  bounds: 0 0 320 200
`)

describe('Studio document timeline', () => {
  it('appends validated documents and truncates redo history after an undo', () => {
    const started = documentTimelineOf(initial)
    const appended = appendDocumentTimeline(started, changed)
    const undone = { ...appended, at: 0 }
    const replacement = documentOf(`id: TIMELINE
title: Replacement
diagram:
  bounds: 0 0 320 200
`)

    const branched = appendDocumentTimeline(undone, replacement)

    expect(branched.entries.map(({ source }) => source)).toEqual([
      started.entries[0]?.source,
      `id: TIMELINE\ntitle: Replacement\ndiagram:\n  bounds: 0 0 320 200\n`
    ])
    expect(branched.at).toBe(1)
    expect(branched.dirty).toBe(false)
  })

  it('recognises a host acknowledgement without duplicating history', () => {
    const appended = appendDocumentTimeline(documentTimelineOf(initial), changed)
    const acknowledged = synchroniseDocumentTimeline(appended, changed)

    expect(acknowledged.entries).toHaveLength(2)
    expect(acknowledged.at).toBe(1)
    expect(acknowledged.draft).toContain('title: Changed')
  })
})
