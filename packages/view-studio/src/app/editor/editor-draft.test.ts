import { describe, expect, it, vi } from 'vitest'
import {
  applyDiscreteDraft,
  applyGestureDraft,
  beginDraftGesture,
  createEditorDraftHistory,
  editorDraftHasChanges,
  emptyEditorDraft,
  endDraftGesture,
  normaliseEditorDraft,
  readPreviousEditorDraft,
  redoEditorDraft,
  sweepEditorDraft,
  undoEditorDraft,
  updateEditorDraft,
} from './editor-draft.ts'

describe('the canonical editor draft', () => {
  it('normalises partial earlier snapshots and reserves the six-kind operation seam', () => {
    const draft = normaliseEditorDraft({
      drafts: { 'STD-01': { dx: 10, dy: 20, from: 'authored' } },
      labels: { 'TEL-01': 0.25 },
    })

    expect(draft.version).toBe(1)
    expect(draft.components['STD-01']).toEqual({ dx: 10, dy: 20, from: 'authored' })
    expect(draft.labels).toEqual({ 'TEL-01': 0.25 })
    expect(draft.artefactOperations).toEqual([])
    expect(draft.attachments).toEqual({})
  })

  it('reads every prior persistence key into one recoverable envelope', () => {
    const values = new Map([
      ['sample.diagram.labels', JSON.stringify({ 'STD-01': { dx: 10, dy: 0, from: 'card' } })],
      ['sample.diagram.removals', JSON.stringify({ 'TEL-01': {} })],
      ['sample.diagram.text', JSON.stringify({ 'STD-01': { name: 'Changed' } })],
    ])
    const store = { getItem: vi.fn((key: string) => values.get(key) ?? null) } as unknown as Storage

    const draft = readPreviousEditorDraft('sample', store)

    expect(draft.components).toHaveProperty('STD-01')
    expect(draft.removals).toHaveProperty('TEL-01')
    expect(draft.text['STD-01']).toEqual({ name: 'Changed' })
    expect(store.getItem).toHaveBeenCalledWith('sample.diagram.attachments')
    expect(store.getItem).toHaveBeenCalledWith('sample.diagram.routes')
  })

  it('sweeps stale and already-applied values from every existing field', () => {
    const draft = normaliseEditorDraft({
      attachments: {
        'TEL-01': { source: { component: 'card', from: 'old', port: 'E1' } },
      },
      cards: { 'STD-NEW': { detail: '', group: 'scope', id: 'new', label: 'New', ports: {}, scopes: ['scope'] } },
      creations: {
        'TEL-NEW': { family: 'family', source: 'a', sourcePort: 'E1', target: 'b', targetPort: 'W1' },
      },
      labels: { 'TEL-01': 0.5, stale: 2 },
      portCounts: { 'STD-01': { north: 3 } },
      removals: { gone: {}, 'STD-01': {} },
      routes: { 'TEL-01': [{ x: 0, y: 0 }, { x: 10, y: 0 }] },
      text: { gone: { name: 'Gone' }, 'STD-01': { detail: 'Same', name: 'Different' } },
    })
    const authored = (key: string, field: string) => {
      if (key === 'TEL-01' && field === 'label') return 'TEL-01  ->  label: { along: 0.5 },'
      if (key === 'TEL-01' && field === 'points') return 'TEL-01  ->  points: [{ x: 0, y: 0 }, { x: 10, y: 0 }],'
      if (key === 'STD-01' && field === 'ports') return 'STD-01  ->  ports: { north: 3 },'
      if (key === 'STD-01' && field === 'detail') return "STD-01  ->  detail: 'Same',"
      return undefined
    }

    const swept = sweepEditorDraft(draft, {
      authored,
      authors: (key) => key === 'STD-NEW' || key === 'TEL-NEW',
      knows: (key) => key === 'STD-01' || key === 'TEL-01',
    })

    expect(swept.attachments).toEqual({})
    expect(swept.cards).toEqual({})
    expect(swept.creations).toEqual({})
    expect(swept.labels).toEqual({})
    expect(swept.portCounts).toEqual({})
    expect(swept.removals).toEqual({ 'STD-01': {} })
    expect(swept.routes).toEqual({})
    expect(swept.text).toEqual({ 'STD-01': { name: 'Different' } })
    expect(editorDraftHasChanges(swept)).toBe(true)
  })
})

describe('editor draft history', () => {
  it('does not checkpoint an equal discrete edit and undoes a changed edit once', () => {
    const initial = emptyEditorDraft()
    const unchanged = applyDiscreteDraft(createEditorDraftHistory(initial), normaliseEditorDraft(initial))
    expect(unchanged.past).toHaveLength(0)

    const changed = updateEditorDraft(initial, 'labels', { 'TEL-01': 0.5 })
    const applied = applyDiscreteDraft(unchanged, changed)
    expect(applied.past).toHaveLength(1)
    expect(undoEditorDraft(applied).current).toEqual(initial)
    expect(redoEditorDraft(undoEditorDraft(applied)).current).toEqual(changed)
  })

  it('coalesces every pointer update in one gesture into one undo step', () => {
    const initial = emptyEditorDraft()
    let history = beginDraftGesture(createEditorDraftHistory(initial))
    history = applyGestureDraft(history, updateEditorDraft(history.current, 'labels', { 'TEL-01': 0.2 }))
    history = applyGestureDraft(history, updateEditorDraft(history.current, 'labels', { 'TEL-01': 0.4 }))
    history = applyGestureDraft(history, updateEditorDraft(history.current, 'labels', { 'TEL-01': 0.6 }))
    history = endDraftGesture(history)

    expect(history.past).toHaveLength(1)
    expect(undoEditorDraft(history).current).toEqual(initial)
  })
})
