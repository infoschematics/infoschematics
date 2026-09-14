import { describe, expect, it } from 'vitest'
import { infoschematicDocumentSource, parseInfoschematicDocument } from './document.ts'
import { applyInfoschematicDocumentEdit, type InfoschematicDocumentEdit } from './document-edit.ts'

const source = `# document comment
id: EDITS
title: "Original title" # title comment
diagram:
  bounds: &diagram-bounds 0 0 200 100
  cards:
    # Alpha member comment
    - id: A
      label: 'Alpha' # label comment
      description: |-
        Alpha block
        second line
      bounds: 10 10 40 20
    # Beta member comment
    - id: B
      label: Beta
      bounds: 80 10 40 20
scopes:
  - id: SCOPE
    label: Scope
    elements: [B, A, A]
`

const parsedDocument = () => {
  const parsed = parseInfoschematicDocument(source, { pathname: 'edits.yaml' })
  if (!parsed.ok) throw new Error('fixture should parse')
  return parsed.document
}

const field = (name: string) => ({ field: name }) as const
const id = (value: string) => ({ id: value }) as const

describe('applyInfoschematicDocumentEdit', () => {
  it('applies stable-ID edits, anchors ordering, and reports sorted changed IDs', () => {
    const edit: InfoschematicDocumentEdit = {
      operations: [
        {
          op: 'replace',
          path: [field('diagram'), field('cards'), id('A'), field('label')],
          value: 'Alpha changed'
        },
        {
          op: 'replace',
          path: [field('diagram'), field('cards'), id('A'), field('description')],
          value: 'Changed block\nsecond line'
        },
        {
          before: 'A',
          op: 'move',
          path: [field('diagram'), field('cards'), id('B')]
        },
        {
          after: 'A',
          op: 'add',
          path: [field('diagram'), field('cards'), id('C')],
          value: { bounds: '140 10 40 20', id: 'C', label: 'Gamma' }
        }
      ],
      version: 1
    }

    const result = applyInfoschematicDocumentEdit(parsedDocument(), edit)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.changedElements).toEqual(['A', 'B', 'C'])
    expect(result.model.diagram.cards.map((card) => card.id)).toEqual(['B', 'A', 'C'])
    expect(result.model.scopes[0]?.elements).toEqual(['A', 'B'])
    expect(result.source).toContain("label: 'Alpha changed' # label comment")
    expect(result.source).toContain('description: |-\n        Changed block\n        second line')
    expect(result.source).toContain('# Alpha member comment')
    expect(result.source).toContain('# Beta member comment')
    expect(result.source).toContain('bounds: &diagram-bounds 0 0 200 100')
  })

  it('generates an inverse that restores exact semantic and concrete source', () => {
    const original = parsedDocument()
    const changed = applyInfoschematicDocumentEdit(original, {
      operations: [
        {
          op: 'replace',
          path: [field('diagram'), field('cards'), id('A'), field('label')],
          value: 'Replaced'
        },
        { before: 'A', op: 'move', path: [field('diagram'), field('cards'), id('B')] },
        { op: 'remove', path: [field('diagram'), field('cards'), id('A'), field('description')] }
      ],
      version: 1
    })
    expect(changed.ok).toBe(true)
    if (!changed.ok) return

    const restored = applyInfoschematicDocumentEdit(changed.document, changed.inverse)
    expect(restored.ok).toBe(true)
    if (!restored.ok) return
    expect(restored.source).toBe(source)
    expect(infoschematicDocumentSource(restored.document)).toBe(source)

    const redone = applyInfoschematicDocumentEdit(restored.document, restored.inverse)
    expect(redone.ok).toBe(true)
    if (redone.ok) expect(redone.source).toBe(changed.source)
  })

  it('rolls back the whole batch when a reference or path is invalid', () => {
    const original = parsedDocument()
    const invalidReference = applyInfoschematicDocumentEdit(original, {
      operations: [{ op: 'remove', path: [field('diagram'), field('cards'), id('B')] }],
      version: 1
    })
    expect(invalidReference.ok).toBe(false)
    expect(infoschematicDocumentSource(original)).toBe(source)

    const invalidPath = applyInfoschematicDocumentEdit(original, {
      operations: [
        { op: 'replace', path: [field('title')], value: 'Would otherwise change' },
        { op: 'replace', path: [field('diagram'), field('cards'), id('MISSING'), field('label')], value: 'x' }
      ],
      version: 1
    })
    expect(invalidPath.ok).toBe(false)
    expect(invalidPath.ok ? [] : invalidPath.issues[0]?.message).toMatch(/does not exist/)
    expect(infoschematicDocumentSource(original)).toBe(source)
  })

  it('removes members after updating references and normalises changed element sets', () => {
    const result = applyInfoschematicDocumentEdit(parsedDocument(), {
      operations: [
        {
          op: 'replace',
          path: [field('scopes'), id('SCOPE'), field('elements')],
          value: ['A', 'A']
        },
        { op: 'remove', path: [field('diagram'), field('cards'), id('B')] }
      ],
      version: 1
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.model.scopes[0]?.elements).toEqual(['A'])
    expect(result.source).toContain('elements:\n      - A')
    expect(result.model.diagram.cards.map((card) => card.id)).toEqual(['A'])
    expect(result.changedElements).toEqual(['B', 'SCOPE'])
  })

  it('normalises element sets nested in added Sequences without touching unrelated sets', () => {
    const withSequence = applyInfoschematicDocumentEdit(parsedDocument(), {
      operations: [
        {
          op: 'add',
          path: [field('sequences'), id('SEQ')],
          value: {
            id: 'SEQ',
            label: 'Sequence',
            presentation: { callouts: true, display: 'expanded', timed: false },
            scenes: [
              {
                focus: { elements: ['B', 'A', 'B'] },
                id: 'SCENE',
                label: 'Scene',
                visibility: { hide: { elements: ['B', 'A', 'B'] } }
              }
            ]
          }
        }
      ],
      version: 1
    })
    expect(withSequence.ok).toBe(true)
    if (!withSequence.ok) return
    expect(withSequence.model.sequences[0]?.scenes[0]?.focus?.elements).toEqual(['A', 'B'])
    expect(withSequence.model.sequences[0]?.scenes[0]?.visibility?.hide?.elements).toEqual(['A', 'B'])
    expect(withSequence.source).toContain('elements: [ B, A, A ]')
    expect(withSequence.source.match(/elements:\n\s+- A\n\s+- B/g)).toHaveLength(2)
  })

  it('addresses Sequence presentation and Scenes through the generic protocol', () => {
    const added = applyInfoschematicDocumentEdit(parsedDocument(), {
      operations: [
        {
          op: 'add',
          path: [field('sequences'), id('SEQ')],
          value: {
            id: 'SEQ',
            label: 'Sequence',
            presentation: { callouts: true, display: 'expanded', timed: false },
            scenes: [
              { id: 'FIRST', label: 'First' },
              { id: 'SECOND', label: 'Second' }
            ]
          }
        }
      ],
      version: 1
    })
    expect(added.ok).toBe(true)
    if (!added.ok) return

    const edited = applyInfoschematicDocumentEdit(added.document, {
      operations: [
        {
          op: 'replace',
          path: [field('sequences'), id('SEQ'), field('presentation'), field('timed')],
          value: true
        },
        {
          before: 'FIRST',
          op: 'move',
          path: [field('sequences'), id('SEQ'), field('scenes'), id('SECOND')]
        }
      ],
      version: 1
    })
    expect(edited.ok).toBe(true)
    if (!edited.ok) return
    expect(edited.model.sequences[0]?.presentation.timed).toBe(true)
    expect(edited.model.sequences[0]?.scenes.map((scene) => scene.id)).toEqual(['SECOND', 'FIRST'])
  })

  it('inserts new fields at house-order positions without disturbing existing fields', () => {
    const result = applyInfoschematicDocumentEdit(parsedDocument(), {
      operations: [
        { op: 'add', path: [field('subtitle')], value: 'Inserted subtitle' },
        {
          op: 'add',
          path: [field('diagram'), field('collections'), id('COLLECTION')],
          value: { id: 'COLLECTION', label: 'Inserted collection' }
        },
        {
          op: 'add',
          path: [field('diagram'), field('cards'), id('B'), field('description')],
          value: 'Inserted description'
        }
      ],
      version: 1
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.source.indexOf('title:')).toBeLessThan(result.source.indexOf('subtitle:'))
    expect(result.source.indexOf('subtitle:')).toBeLessThan(result.source.indexOf('diagram:'))
    expect(result.source.indexOf('bounds: &diagram-bounds')).toBeLessThan(result.source.indexOf('collections:'))
    expect(result.source.indexOf('collections:')).toBeLessThan(result.source.indexOf('cards:'))
    const beta = result.source.slice(result.source.indexOf('- id: B'))
    expect(beta.indexOf('label: Beta')).toBeLessThan(beta.indexOf('description: Inserted description'))
    expect(beta.indexOf('description: Inserted description')).toBeLessThan(beta.indexOf('bounds: 80'))
  })

  it('rejects numeric-style paths, invalid anchors, and dishonest syntax snapshots', () => {
    const original = parsedDocument()
    const numeric = applyInfoschematicDocumentEdit(original, {
      operations: [{ op: 'remove', path: [field('diagram'), field('cards'), 0 as never] }],
      version: 1
    })
    expect(numeric.ok).toBe(false)

    const anchored = applyInfoschematicDocumentEdit(original, {
      operations: [{ after: 'A', before: 'B', op: 'move', path: [field('diagram'), field('cards'), id('A')] }],
      version: 1
    })
    expect(anchored.ok).toBe(false)

    const dishonest = applyInfoschematicDocumentEdit(original, {
      operations: [{ op: 'replace', path: [field('title')], value: 'Changed' }],
      syntax: { source },
      version: 1
    })
    expect(dishonest.ok).toBe(false)
    expect(dishonest.ok ? [] : dishonest.issues[0]?.path).toBe('edit.syntax')

    const executable = applyInfoschematicDocumentEdit(original, {
      operations: [{ op: 'replace', path: [field('title')], value: (() => 'not inert') as never }],
      version: 1
    })
    expect(executable.ok).toBe(false)
    expect(executable.ok ? [] : executable.issues[0]?.message).toMatch(/inert JSON data/)
  })

  it('returns the same opaque document and exact source for a no-op envelope', () => {
    const original = parsedDocument()
    const result = applyInfoschematicDocumentEdit(original, { operations: [], version: 1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.document).toBe(original)
    expect(result.source).toBe(source)
    expect(result.inverse).toEqual({ operations: [], version: 1 })
  })
})
