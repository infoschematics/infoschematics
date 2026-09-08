#!/usr/bin/env bun
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { infoschematicJsonSchema } from '../packages/domain-core/src/schema.ts'
import { type CliSpec, isDirectInvocation, runCli } from './cli.ts'

/**
 * Committed so an editor can validate an authored document straight from the repository or the published package,
 * without a build step. It is emitted from the same schema the loader validates with, so the two cannot disagree.
 */
export const generatedSchemaUrl = new URL('../packages/domain-core/schema/infoschematic.schema.json', import.meta.url)

/** The committed file's exact bytes: two-space JSON with a trailing newline, so a diff is reviewable. */
const serialised = () => `${JSON.stringify(infoschematicJsonSchema(), null, 2)}\n`

export type GenerateSchemaOptions = Readonly<{
  /** Verify the committed file matches instead of writing it. */
  check?: boolean
  output?: URL
}>

/** Write, or verify, the committed JSON Schema. */
export async function generateSchema(options: GenerateSchemaOptions = {}): Promise<void> {
  const output = options.output ?? generatedSchemaUrl
  const expected = serialised()

  if (options.check) {
    const actual = await readFile(output, 'utf8').catch(() => undefined)
    if (actual !== expected) {
      throw new Error(`Generated JSON Schema is stale: ${fileURLToPath(output)}. Run scripts/generate-schema.ts.`)
    }
    return
  }

  await writeFile(output, expected)
}

export const spec: CliSpec = {
  describe: 'Generate the JSON Schema an editor validates an authored Infoschematic document against.',
  flags: {
    check: { describe: 'Verify the generated file is current instead of writing it.', kind: 'boolean' },
    out: { describe: "Generated schema pathname. Defaults to Domain Core's schema.", kind: 'string', value: 'path' }
  },
  run: 'self:schema:generate',
  script: 'scripts/generate-schema.ts'
}

if (isDirectInvocation(import.meta.url)) {
  await runCli(spec, async (parsed) => {
    const out = parsed.string('out')
    const output = out ? pathToFileURL(resolve(out)) : generatedSchemaUrl
    const check = parsed.boolean('check')

    await generateSchema({ check, output })
    console.log(
      check ? `JSON Schema current: ${fileURLToPath(output)}` : `JSON Schema written: ${fileURLToPath(output)}`
    )
  })
}
