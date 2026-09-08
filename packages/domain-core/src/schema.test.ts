import { describe, expect, it } from 'vitest'
import { infoschematicConfigSchema, infoschematicJsonSchema, type SchemaMirrorsContract } from './schema.ts'

// The parity assertion lives in the type system, so this is what proves it is still wired to something. If the schema
// ever stopped mirroring the contract, `SchemaMirrorsContract` would fail to instantiate and this file would not
// type-check.
const parity: SchemaMirrorsContract = true

describe('infoschematicConfigSchema', () => {
  it('holds the schema to the hand-written contract at compile time', () => {
    expect(parity).toBe(true)
  })

  it('accepts a title-only definition, exactly as defineInfoschematic does', () => {
    expect(infoschematicConfigSchema.safeParse({ title: 'Minimal' }).success).toBe(true)
  })

  it('rejects a misspelt key rather than dropping it', () => {
    const parsed = infoschematicConfigSchema.safeParse({ title: 'Minimal', subtitel: 'Typo' })
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues[0]?.code).toBe('unrecognized_keys')
  })

  it('reports the dotted path of a value nested inside the definition', () => {
    const parsed = infoschematicConfigSchema.safeParse({
      title: 'Nested',
      infoschematic: { cards: [{ id: 'a', code: 'A', label: 'A', detail: 'A', scopes: [], scope: 'core' }] }
    })
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues.map((issue) => issue.path.join('.'))).toContain('infoschematic.cards.0.placement')
  })

  it('holds a port to the identifier shape the contract states', () => {
    const flow = (sourcePort: string) => ({
      title: 'Ports',
      infoschematic: {
        flows: [{ id: 'f', code: 'F', family: 'x', source: 'a', target: 'b', sourcePort, targetPort: 'W1', points: [] }]
      }
    })
    expect(infoschematicConfigSchema.safeParse(flow('E1')).success).toBe(true)
    expect(infoschematicConfigSchema.safeParse(flow('Q1')).success).toBe(false)
    expect(infoschematicConfigSchema.safeParse(flow('east')).success).toBe(false)
  })
})

describe('infoschematicJsonSchema', () => {
  it('projects the same schema an editor can consume, with a stable identity', () => {
    const emitted = infoschematicJsonSchema()
    expect(emitted.$id).toBe('https://infoschematics.info/schema/infoschematic.schema.json')
    expect(emitted.type).toBe('object')
    expect((emitted.required as readonly string[]) ?? []).toEqual(['title'])
    expect(JSON.stringify(emitted)).toContain('^(N|E|S|W)')
  })
})
