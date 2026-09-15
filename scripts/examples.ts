#!/usr/bin/env bun
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'
import { formatInfoschematicIssue, parseInfoschematic } from '../packages/domain-core/src/index.ts'
import { type CliSpec, isDirectInvocation, runCli } from './cli.ts'

/**
 * Each example package authors its Infoschematic as YAML and ships a typed export for browser consumers.
 *
 * The export is generated here rather than hand-maintained beside the YAML, because two authored copies of one
 * diagram drift silently: the module embeds the exact YAML it was generated from and parses it, so the document a
 * reader edits and the model a consumer imports cannot disagree. `--check` is the gate that keeps that true.
 */
export const examplesRoot = resolve(import.meta.dirname, '../examples')

export type ExampleDocument = Readonly<{
  /** Exported constant name for the parsed model. */
  export: string
  /** Stable short name used by repository commands and Site discovery. */
  id: string
  /** Package-relative YAML pathname. */
  source: string
  title: string
}>

export type ExamplePackage = Readonly<{
  /** Package-relative generated module pathname, paired with each document. */
  documents: readonly (ExampleDocument & { module: string })[]
  description: string
  directory: string
  name: string
}>

type ExampleManifest = Readonly<{
  description?: string
  infoschematics?: Readonly<{ examples?: readonly ExampleDocument[] }>
  name?: string
}>

/** Generated module beside the package source, named for the document it carries. */
const moduleOf = (source: string) => join('src', `${basename(source, extname(source))}.ts`)

/** Read every example package that declares documents, in directory order. */
export async function examplePackages(): Promise<readonly ExamplePackage[]> {
  const directories = (await readdir(examplesRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort()

  const packages: ExamplePackage[] = []
  for (const directory of directories) {
    const manifestPath = join(examplesRoot, directory, 'package.json')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as ExampleManifest
    const documents = manifest.infoschematics?.examples ?? []
    if (documents.length === 0 || !manifest.name) continue
    packages.push({
      description: manifest.description ?? '',
      directory,
      documents: documents.map((document) => ({ ...document, module: moduleOf(document.source) })),
      name: manifest.name
    })
  }
  return packages
}

const embedded = (yaml: string) => yaml.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

const generatedModule = (document: ExampleDocument, yaml: string) => `/**
 * Generated from \`${document.source}\` by \`bun run self:examples:generate\`. Do not edit.
 *
 * The YAML in this package is the authored source. Edit it, then regenerate.
 */
import { formatInfoschematicIssue, parseInfoschematic } from '@infoschematics/domain-core'

const source = \`${embedded(yaml)}\`

const parsed = parseInfoschematic(source, { pathname: '${document.source}' })
if (!parsed.ok) {
  throw new Error(
    ['${document.source} is not a valid Infoschematic:', ...parsed.issues.map(formatInfoschematicIssue)].join('\\n')
  )
}

/** ${document.title} */
export const ${document.export} = parsed.model
`

export type GenerateExamplesOptions = Readonly<{
  /** Verify the committed modules match instead of writing them. */
  check?: boolean
}>

export type GeneratedExample = Readonly<{ module: string; package: string; written: boolean }>

/** Write, or verify, every example package's generated typed export. */
export async function generateExamples({ check = false }: GenerateExamplesOptions = {}) {
  const results: GeneratedExample[] = []
  const stale: string[] = []

  for (const example of await examplePackages()) {
    for (const document of example.documents) {
      const sourcePath = join(examplesRoot, example.directory, document.source)
      const yaml = await readFile(sourcePath, 'utf8')
      const parsed = parseInfoschematic(yaml, { pathname: document.source })
      if (!parsed.ok) {
        throw new Error(
          [
            `${example.directory}/${document.source} is not a valid Infoschematic:`,
            ...parsed.issues.map(formatInfoschematicIssue)
          ].join('\n')
        )
      }

      const modulePath = join(examplesRoot, example.directory, document.module)
      const expected = generatedModule(document, yaml)
      const actual = await readFile(modulePath, 'utf8').catch(() => undefined)
      if (check) {
        if (actual !== expected) stale.push(`${example.directory}/${document.module}`)
      } else if (actual !== expected) {
        await writeFile(modulePath, expected)
      }
      results.push({
        module: `${example.directory}/${document.module}`,
        package: example.name,
        written: actual !== expected
      })
    }
  }

  if (stale.length > 0) {
    throw new Error(
      [`Generated example exports are stale:`, ...stale.map((entry) => `- ${entry}`), 'Run scripts/examples.ts.'].join(
        '\n'
      )
    )
  }
  return results
}

export const spec: CliSpec = {
  describe: "Generate each example package's typed export from its authored YAML.",
  flags: {
    check: { describe: 'Verify the generated modules are current instead of writing them.', kind: 'boolean' }
  },
  run: 'self:examples:generate',
  script: 'scripts/examples.ts'
}

if (isDirectInvocation(import.meta.url)) {
  await runCli(spec, async (parsed) => {
    const check = parsed.boolean('check')
    const results = await generateExamples({ check })
    if (check) {
      console.log(`Generated example exports current: ${results.length}`)
      return
    }
    for (const result of results) console.log(`${result.module}${result.written ? ' (written)' : ''}`)
  })
}
