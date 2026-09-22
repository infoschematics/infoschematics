import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const generatedSchemaPath = 'packages/domain-core/schema/infoschematic.schema.json'
const viteConfigPath = 'apps/site/vite.config.ts'
const editorSettingsPath = '.vscode/settings.json'
const examplesRoot = 'examples'

const readJson = async (path: string): Promise<Record<string, unknown>> =>
  JSON.parse((await readFile(path, 'utf8')).replaceAll(/^\s*"\/\/[^"]*":.*$/gm, '')) as Record<string, unknown>

const authoredDocuments = async (): Promise<string[]> => {
  const entries = await readdir(examplesRoot, { withFileTypes: true, recursive: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.yaml'))
    .map((entry) => join(entry.parentPath, entry.name))
}

type SchemaNode = Record<string, unknown>

/**
 * Walk every property the schema declares, resolving `$ref` so a shared shape is judged by what it says.
 *
 * The visited set is load-bearing: `jsonValue` refers to itself, so an unguarded walk never returns.
 */
const properties = (schema: SchemaNode): { path: string; described: boolean }[] => {
  const found: { path: string; described: boolean }[] = []
  const visited = new Set<unknown>()

  const resolve = (node: unknown): unknown => {
    let target = node
    while (typeof target === 'object' && target !== null && typeof (target as SchemaNode).$ref === 'string') {
      target = ((target as SchemaNode).$ref as string)
        .replace('#/', '')
        .split('/')
        .reduce<unknown>((carry, part) => (carry as SchemaNode)[part], schema)
    }
    return target
  }

  const describes = (node: unknown) =>
    typeof node === 'object' && node !== null && typeof (node as SchemaNode).description === 'string'

  const walk = (node: unknown, path: string) => {
    if (typeof node !== 'object' || node === null || visited.has(node)) return
    visited.add(node)
    const shape = node as SchemaNode
    for (const [name, child] of Object.entries((shape.properties ?? {}) as SchemaNode)) {
      const here = path ? `${path}.${name}` : name
      found.push({ path: here, described: describes(child) || describes(resolve(child)) })
      walk(child, here)
    }
    for (const [name, child] of Object.entries((shape.$defs ?? {}) as SchemaNode)) walk(child, name)
    for (const key of ['items', 'additionalProperties']) walk(shape[key], `${path}[]`)
    for (const key of ['anyOf', 'oneOf', 'allOf'])
      for (const child of (shape[key] ?? []) as unknown[]) walk(child, path)
  }

  walk(schema, '')
  return found
}

describe('schema publication', () => {
  it('serves the schema from the site at the address its own $id declares', async () => {
    const { $id } = await readJson(generatedSchemaPath)
    const config = await readFile(viteConfigPath, 'utf8')

    // An editor resolves $id literally. If the site publishes it anywhere else, every authored modeline 404s
    // and the author loses completion with no error to explain why.
    expect(typeof $id).toBe('string')
    expect(config).toContain(`const schemaPath = '${new URL(String($id)).pathname}'`)
    expect(new URL(String($id)).origin).toBe('https://infoschematics.info')
  })

  it('gives every authored example document the published modeline', async () => {
    const documents = await authoredDocuments()
    const { $id } = await readJson(generatedSchemaPath)

    expect(documents.length).toBeGreaterThan(4)
    for (const document of documents) {
      const first = (await readFile(document, 'utf8')).split('\n')[0]
      expect(first, `${document} lacks a schema modeline`).toBe(`# yaml-language-server: $schema=${$id}`)
    }
  })

  it('says what every property is for, not only which properties exist', async () => {
    const found = properties(await readJson(generatedSchemaPath))
    const bare = found.filter(({ described }) => !described).map(({ path }) => path)

    // A walk that resolves nothing describes nothing and would otherwise pass: the floor is the check's own
    // coverage assertion, so a schema that stopped being generated cannot read as complete.
    expect(found.length).toBeGreaterThan(100)
    expect(bare).toEqual([])
  })

  it('completes a contributor against the working copy rather than the published schema', async () => {
    const settings = (await readJson(editorSettingsPath))['yaml.schemas'] as Record<string, string[]>

    expect(Object.keys(settings)).toEqual([`./${generatedSchemaPath}`])
    expect(settings[`./${generatedSchemaPath}`]).toContain('infoschematic.yaml')
  })
})
