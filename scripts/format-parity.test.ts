import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { defineInfoschematicModel, parseInfoschematic } from '@infoschematics/domain-core'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { describe, expect, it } from 'vitest'
import { formatParityDefinition } from './fixtures/format-parity.ts'
import { isDocumentSubject, loadRenderable } from './render-example.ts'

const fixture = (name: string) => fileURLToPath(new URL(`fixtures/${name}`, import.meta.url))
const siteSeed = fileURLToPath(new URL('../apps/site/src/playground/seeds/format-parity.yaml', import.meta.url))

const loadDocument = async (pathname: string) => {
  const parsed = parseInfoschematic(await readFile(pathname, 'utf8'), { pathname })
  if (!parsed.ok) throw new Error(parsed.issues.map((issue) => `${issue.path} ${issue.message}`).join('\n'))
  return parsed.model
}

describe('document format parity', () => {
  it('renders byte-identical SVG from typed data, YAML, and JSON syntax', async () => {
    const typed = renderInfoschematicSvg(defineInfoschematicModel(formatParityDefinition), { annotations: true })

    expect(renderInfoschematicSvg(await loadDocument(fixture('format-parity.yaml')), { annotations: true })).toBe(typed)
    expect(renderInfoschematicSvg(await loadDocument(fixture('format-parity.json')), { annotations: true })).toBe(typed)
    expect(typed).toContain('Source')
  })

  it('keeps the Playground YAML seed aligned with the canonical fixture', async () => {
    expect(await loadDocument(siteSeed)).toEqual(defineInfoschematicModel(formatParityDefinition))
  })
})

describe('loadRenderable', () => {
  it('still resolves a registered example by name', async () => {
    expect(isDocumentSubject('blank')).toBe(false)
    expect((await loadRenderable('blank')).title).toBeTypeOf('string')
  })

  it('loads YAML and JSON documents by pathname', async () => {
    expect(isDocumentSubject(fixture('format-parity.yaml'))).toBe(true)
    expect((await loadRenderable(fixture('format-parity.yaml'))).title).toBe('Format parity')
    expect((await loadRenderable(fixture('format-parity.json'))).title).toBe('Format parity')
  })

  it('refuses a name that is neither a registered example nor a document', async () => {
    await expect(loadRenderable('nonesuch')).rejects.toThrow(/Unknown example nonesuch/)
    await expect(loadRenderable('a.ts')).rejects.toThrow(/Unsupported document format/)
  })

  it('reports canonical paths in malformed documents', async () => {
    await expect(loadRenderable(fixture('malformed.yaml'))).rejects.toThrow(
      /is not a valid Infoschematic:[\s\S]*diagram\.bounds\.width/
    )
  })
})
