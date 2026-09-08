import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseTypescriptDocument } from './typescript-document.ts'

// Read by path, not imported: `nothing-imports-repository-scripts` keeps packages free of script dependencies.
const fixture = (name: string) => fileURLToPath(new URL(`../../../scripts/fixtures/${name}`, import.meta.url))

const issueOf = (text: string) => {
  const parsed = parseTypescriptDocument(text)
  if (parsed.ok) throw new Error('expected the document to be rejected')
  expect(parsed.issues).toHaveLength(1)
  return parsed.issues[0] as { message: string; path: string }
}

const parsedValueOf = (text: string) => {
  const parsed = parseTypescriptDocument(text)
  if (!parsed.ok) throw new Error(parsed.issues.map((issue) => `${issue.path} ${issue.message}`).join('\n'))
  return parsed.value
}

describe('parseTypescriptDocument', () => {
  it('reads the format-parity fixture byte-for-byte to the same value as its JSON form', async () => {
    const parsed = parsedValueOf(await readFile(fixture('format-parity.ts'), 'utf8'))
    const { $schema: _editorSchema, ...json } = JSON.parse(await readFile(fixture('format-parity.json'), 'utf8'))
    expect(parsed).toEqual(json)
  })

  it('reads the literal grammar: strings, numbers, booleans, arrays, nesting, trailing commas', () => {
    expect(
      parsedValueOf(`
        // A leading comment.
        export default {
          title: "Both quote styles", 'quoted key': 'value',
          negative: -0.5, exponent: 1.2e3,
          flags: [true, false, null],
          nested: { deep: { list: [{ x: 1 }, { x: 2 },] } }, /* trailing comma above */
        };
      `)
    ).toEqual({
      title: 'Both quote styles',
      'quoted key': 'value',
      negative: -0.5,
      exponent: 1200,
      flags: [true, false, null],
      nested: { deep: { list: [{ x: 1 }, { x: 2 }] } }
    })
  })

  it('accepts an export const with a type annotation and discards import type lines', () => {
    expect(
      parsedValueOf(
        "import type { InfoschematicConfigInput } from '@infoschematics/domain-model'\n" +
          'export const definition: InfoschematicConfigInput = { title: "Typed" }\n'
      )
    ).toEqual({ title: 'Typed' })
  })

  it('rejects an identifier used as a value', () => {
    const issue = issueOf('export default { grid: dots }')
    expect(issue.path).toBe('grid')
    expect(issue.message).toMatch(/Identifiers such as dots are not values/)
  })

  it('rejects a call expression, defineInfoschematic included', () => {
    const issue = issueOf("export const d = defineInfoschematic({ title: 'Nope' })")
    expect(issue.message).toMatch(/Call expressions such as defineInfoschematic\(\.\.\.\)/)
  })

  it('rejects a template literal', () => {
    expect(issueOf('export default { title: `Nope` }').message).toMatch(/Template literals/)
  })

  it('rejects a spread', () => {
    expect(issueOf('export default { ...base }').message).toMatch(/Spreads/)
    expect(issueOf('export default { list: [...items] }').message).toMatch(/Spreads/)
  })

  it('rejects a computed key', () => {
    expect(issueOf("export default { ['title']: 'Nope' }").message).toMatch(/Computed keys/)
  })

  it('rejects a runtime import', () => {
    expect(issueOf("import { x } from 'y'\nexport default { }").message).toMatch(/Only `import type` lines/)
  })

  it('rejects a second export', () => {
    expect(issueOf('export const a = { }\nexport const b = { }').message).toMatch(/exactly one exported definition/)
  })

  it('rejects a module with no export', () => {
    expect(issueOf('const a = { }\n').message).toMatch(/Expected one exported definition/)
  })

  it('rejects satisfies and non-decimal numbers', () => {
    expect(issueOf('export default { } satisfies Record<string, never>').message).toMatch(/`satisfies`/)
    expect(issueOf('export default { n: 0x10 }').message).toMatch(/plain decimal numbers/)
  })

  it('addresses the diagnostic to the offending value with line and column', () => {
    const issue = issueOf('export default {\n  a: {\n    b: [1, oops]\n  }\n}')
    expect(issue.path).toBe('a.b.1')
    expect(issue.message).toMatch(/line 3/)
  })
})
