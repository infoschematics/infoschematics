import { describe, expect, it } from 'vitest'
import { infoschematicJsonSchema, infoschematicSchema, type SchemaMirrorsContract } from './schema.ts'

const parity: SchemaMirrorsContract = true

const minimal = {
  id: 'MINIMAL',
  title: 'Minimal',
  diagram: { bounds: { x: 0, y: 0, width: 10, height: 10 } }
}

describe('infoschematicSchema', () => {
  it('holds the schema to the canonical TypeScript contract', () => {
    expect(parity).toBe(true)
    expect(infoschematicSchema.safeParse(minimal).success).toBe(true)
  })

  it('rejects a misspelt key rather than dropping it', () => {
    const parsed = infoschematicSchema.safeParse({ ...minimal, subtitel: 'Typo' })
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues[0]?.code).toBe('unrecognized_keys')
  })

  it('reports a nested canonical path', () => {
    const parsed = infoschematicSchema.safeParse({
      ...minimal,
      diagram: { ...minimal.diagram, cards: [{ id: 'A', label: 'A' }] }
    })
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues.map((issue) => issue.path.join('.'))).toContain('diagram.cards.0.bounds')
  })

  it('holds ports to the identifier shape the contract states', () => {
    const model = (port: string) => ({
      ...minimal,
      diagram: {
        ...minimal.diagram,
        flows: [
          {
            id: 'F',
            source: { element: 'A', port },
            target: { element: 'B', port: 'W1' }
          }
        ]
      }
    })
    expect(infoschematicSchema.safeParse(model('E1')).success).toBe(true)
    expect(infoschematicSchema.safeParse(model('Q1')).success).toBe(false)
    expect(infoschematicSchema.safeParse(model('east')).success).toBe(false)
  })
})

describe('infoschematicJsonSchema', () => {
  it('projects the canonical schema an editor consumes', () => {
    const emitted = infoschematicJsonSchema()
    expect(emitted.$id).toBe('https://infoschematics.info/schema/infoschematic.schema.json')
    expect(emitted.type).toBe('object')
    expect((emitted.required as readonly string[]) ?? []).toEqual(['id', 'title', 'diagram'])
    expect(JSON.stringify(emitted)).toContain('^(N|E|S|W)')
  })
})
