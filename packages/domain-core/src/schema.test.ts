import { describe, expect, it } from 'vitest'
import { infoschematicJsonSchema, infoschematicSchema, type SchemaMirrorsContract } from './schema.ts'

const parity: SchemaMirrorsContract = true

const minimal = {
  id: 'MINIMAL',
  title: 'Minimal',
  diagram: { bounds: { x: 0, y: 0, width: 10, height: 10 }, gridSize: 10 }
}

describe('infoschematicSchema', () => {
  it('holds the schema to the canonical TypeScript contract', () => {
    expect(parity).toBe(true)
    expect(infoschematicSchema.safeParse(minimal).success).toBe(true)
  })

  it('requires a non-negative integer diagram grid size', () => {
    const { gridSize: _gridSize, ...diagram } = minimal.diagram
    expect(infoschematicSchema.safeParse({ ...minimal, diagram }).success).toBe(false)
    expect(infoschematicSchema.safeParse({ ...minimal, diagram: { ...diagram, gridSize: -1 } }).success).toBe(false)
    expect(infoschematicSchema.safeParse({ ...minimal, diagram: { ...diagram, gridSize: 0 } }).success).toBe(true)
    expect(infoschematicSchema.safeParse({ ...minimal, diagram: { ...diagram, gridSize: 1 } }).success).toBe(true)
  })

  it('admits a cue stage as an ordinal, and still refuses a cue that paces itself', () => {
    const cued = (cue: unknown) =>
      infoschematicSchema.safeParse({
        ...minimal,
        sequences: [
          {
            id: 'WALK',
            label: 'Walkthrough',
            presentation: { display: 'expanded', timed: true, callouts: true },
            scenes: [{ id: 'ARRIVAL', label: 'Arrival', cues: [cue] }]
          }
        ]
      }).success

    expect(cued({ dynamic: 'DELIVERY' })).toBe(true)
    expect(cued({ dynamic: 'DELIVERY', stage: 1 })).toBe(true)
    expect(cued({ dynamic: 'DELIVERY', stage: 4, playback: 'repeat' })).toBe(true)
    // A stage counts from one, in whole steps: nothing below the first one is a stage, and there is no half-stage.
    expect(cued({ dynamic: 'DELIVERY', stage: 0 })).toBe(false)
    expect(cued({ dynamic: 'DELIVERY', stage: -1 })).toBe(false)
    expect(cued({ dynamic: 'DELIVERY', stage: 1.5 })).toBe(false)
    // The Sequence paces a cascade and a declaration never does, per `ADR-INFOSCHEMATICS-035`.
    expect(cued({ dynamic: 'DELIVERY', stage: 1, duration: 400 })).toBe(false)
    expect(cued({ dynamic: 'DELIVERY', stage: 1, delay: 400 })).toBe(false)
  })

  it('rejects a misspelt key rather than dropping it', () => {
    const parsed = infoschematicSchema.safeParse({ ...minimal, subtitel: 'Typo' })
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues[0]?.code).toBe('unrecognized_keys')
  })

  it('folds composition into Cards and rejects the removed Diagram Assembly list', () => {
    expect(
      infoschematicSchema.safeParse({
        ...minimal,
        diagram: {
          ...minimal.diagram,
          cards: [
            { id: 'INTERFACE', label: 'Interface', bounds: '0 0 10 10' },
            { id: 'ADAPTER', label: 'Adapter', adapts: 'INTERFACE', bounds: '0 0 10 10' },
            { id: 'WRAPPER', label: 'Wrapper', wraps: 'ADAPTER', bounds: '0 0 10 10' }
          ]
        }
      }).success
    ).toBe(true)
    expect(infoschematicSchema.safeParse({ ...minimal, diagram: { ...minimal.diagram, assemblies: [] } }).success).toBe(
      false
    )
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

describe('document promises', () => {
  const promised = (promises: unknown) => infoschematicSchema.safeParse({ ...minimal, promises })

  it('leaves a document that declares nothing exactly as valid, and accepts one of every kind', () => {
    expect(infoschematicSchema.safeParse(minimal).success).toBe(true)
    expect(promised([]).success).toBe(true)
    expect(
      promised([
        { id: 'STARTS', kind: 'origin', label: 'Readings begin at the inlet', allowed: ['IN'] },
        { id: 'ENDS', kind: 'terminus', label: 'Readings end at the outlet', allowed: ['OUT'] },
        { id: 'SPEAKS', kind: 'relationship', label: 'One speaks to two', from: ['ONE'], to: ['TWO'] },
        { id: 'TRACES', kind: 'path', label: 'The document traces end to end', from: ['IN'], to: ['OUT'] }
      ]).success
    ).toBe(true)
  })

  it('normalises the artefacts a promise is written over as a sorted set', () => {
    const parsed = promised([{ id: 'STARTS', kind: 'origin', label: 'Begins', allowed: ['TWO', 'IN', 'TWO'] }])
    expect(parsed.success && parsed.data.promises?.[0]).toEqual({
      id: 'STARTS',
      kind: 'origin',
      label: 'Begins',
      allowed: ['IN', 'TWO']
    })
  })

  it('refuses a promise carrying the fields of a kind it is not', () => {
    expect(promised([{ id: 'STARTS', kind: 'origin', label: 'Begins', from: ['IN'], to: ['OUT'] }]).success).toBe(false)
    expect(
      promised([{ id: 'TRACES', kind: 'path', label: 'Traces', from: ['IN'], to: ['OUT'], allowed: ['IN'] }]).success
    ).toBe(false)
    expect(promised([{ id: 'GUESS', kind: 'somewhere', label: 'Guess', allowed: ['IN'] }]).success).toBe(false)
  })

  it('refuses a promise about nothing, because an empty end could never be checked', () => {
    expect(promised([{ id: 'STARTS', kind: 'origin', label: 'Begins', allowed: [] }]).success).toBe(false)
    expect(promised([{ id: 'TRACES', kind: 'path', label: 'Traces', from: ['IN'], to: [] }]).success).toBe(false)
  })

  it('requires a promise to say what it means, so a finding can read it back', () => {
    expect(promised([{ id: 'STARTS', kind: 'origin', allowed: ['IN'] }]).success).toBe(false)
    expect(promised([{ kind: 'origin', label: 'Begins', allowed: ['IN'] }]).success).toBe(false)
  })
})
