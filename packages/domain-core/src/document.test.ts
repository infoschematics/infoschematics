import { describe, expect, it } from 'vitest'
import {
  infoschematicDocumentModel,
  infoschematicDocumentPathname,
  infoschematicDocumentSource,
  parseInfoschematicDocument
} from './document.ts'
import { parseInfoschematic } from './parse.ts'

const source = `# Retained document comment
id: RETAINED
title: "Quoted title" # retained side comment
diagram:
  bounds: 0 0 100 60
  cards:
    # retained member comment
    - id: CARD-01
      label: |-
        Block
        label
      bounds: 10 10 30 20
`

describe('InfoschematicDocument', () => {
  it('retains exact source, pathname, and the validated canonical model', () => {
    const parsed = parseInfoschematicDocument(source, { pathname: 'authored/example.yaml' })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(infoschematicDocumentSource(parsed.document)).toBe(source)
    expect(infoschematicDocumentPathname(parsed.document)).toBe('authored/example.yaml')

    const compatible = parseInfoschematic(source)
    expect(compatible.ok).toBe(true)
    if (compatible.ok) expect(infoschematicDocumentModel(parsed.document)).toEqual(compatible.model)
  })

  it('keeps malformed-document diagnostics compatible with parseInfoschematic', () => {
    const malformed = 'id: BROKEN\ntitle: [\n'
    expect(parseInfoschematicDocument(malformed, { pathname: 'broken.yaml' })).toEqual(
      parseInfoschematic(malformed, { pathname: 'broken.yaml' })
    )
  })

  it('rejects values that were not created by the document parser', () => {
    expect(() => infoschematicDocumentSource({} as never)).toThrow(/Expected an InfoschematicDocument/)
  })
})
