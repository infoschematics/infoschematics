import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { defineInfoschematic, parseInfoschematic } from '@infoschematics/domain-core'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { describe, expect, it } from 'vitest'
import { formatParityDefinition } from './fixtures/format-parity.ts'
import { isDocumentSubject, loadRenderable } from './render-example.ts'

const fixture = (name: string) => fileURLToPath(new URL(`fixtures/${name}`, import.meta.url))
const siteSeed = (name: string) => fileURLToPath(new URL(`../apps/site/src/playground/seeds/${name}`, import.meta.url))

const renderDocument = async (name: string) => {
  const parsed = parseInfoschematic(await readFile(fixture(name), 'utf8'), { pathname: fixture(name) })
  if (!parsed.ok) throw new Error(parsed.issues.map((issue) => `${issue.path} ${issue.message}`).join('\n'))
  return renderInfoschematicSvg(parsed.config, { annotations: true })
}

describe('document format parity', () => {
  it('renders byte-identical SVG from TypeScript, JSON, and YAML', async () => {
    const typescript = renderInfoschematicSvg(defineInfoschematic(formatParityDefinition), { annotations: true })

    expect(await renderDocument('format-parity.json')).toBe(typescript)
    expect(await renderDocument('format-parity.yaml')).toBe(typescript)
    expect(typescript).toContain('Source')
  })

  it('parses the TypeScript fixture as a document, not an import, to the same SVG', async () => {
    const imported = renderInfoschematicSvg(defineInfoschematic(formatParityDefinition), { annotations: true })
    expect(await renderDocument('format-parity.ts')).toBe(imported)
  })

  it('keeps the playground seed copies in step with the fixtures', async () => {
    const expected = defineInfoschematic(formatParityDefinition)
    const seeds = [
      { format: 'typescript', name: 'format-parity.ts.txt' },
      { format: 'json', name: 'format-parity.json' },
      { format: 'yaml', name: 'format-parity.yaml' }
    ] as const

    for (const { format, name } of seeds) {
      const parsed = parseInfoschematic(await readFile(siteSeed(name), 'utf8'), { format })
      if (!parsed.ok) throw new Error(parsed.issues.map((issue) => `${issue.path} ${issue.message}`).join('\n'))
      expect(parsed.config, name).toEqual(expected)
    }
  })
})

describe('loadRenderable', () => {
  it('still resolves a registered example by name', async () => {
    expect(isDocumentSubject('blank')).toBe(false)
    expect((await loadRenderable('blank')).title).toBeTypeOf('string')
  })

  it('loads an authored document by pathname', async () => {
    expect(isDocumentSubject(fixture('format-parity.yaml'))).toBe(true)
    expect((await loadRenderable(fixture('format-parity.yaml'))).title).toBe('Format parity')
  })

  it('refuses a name that is neither a registered example nor a document', async () => {
    await expect(loadRenderable('nonesuch')).rejects.toThrow(/Unknown example nonesuch/)
    await expect(loadRenderable('a.toml')).rejects.toThrow(/Unsupported document format/)
  })

  it('reports every fault in a malformed document rather than throwing a parser error', async () => {
    await expect(loadRenderable(fixture('malformed.yaml'))).rejects.toThrow(
      /is not a valid Infoschematic:[\s\S]*infoschematic\.viewBox\.width/
    )
  })
})
