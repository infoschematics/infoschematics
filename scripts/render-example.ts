#!/usr/bin/env bun
import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, resolve } from 'node:path'
import {
  formatInfoschematicIssue,
  infoschematicFormatExtensions,
  infoschematicFormatOf,
  parseInfoschematic
} from '@infoschematics/domain-core'
import type { InfoschematicConfig } from '@infoschematics/domain-model'
import { blankInfoschematic } from '@infoschematics/is-blank'
import { infoschematicsExample } from '@infoschematics/is-infoschematics'
import { systemExample } from '@infoschematics/is-system'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { type CliSpec, CliUsageError, isDirectInvocation, runCli } from './cli.ts'

/** Authored examples this repository can render without a browser or dev server. */
export const renderableExamples: Readonly<Record<string, InfoschematicConfig>> = {
  blank: blankInfoschematic,
  infoschematics: infoschematicsExample,
  system: systemExample
}

const known = (subject: string) =>
  `Choose a registered example (${Object.keys(renderableExamples).join(', ')}) or a document pathname ending in ${infoschematicFormatExtensions.join(', ')}. Received ${subject}.`

/** True when an operand names a document to load rather than a registered example. */
export const isDocumentSubject = (subject: string): boolean =>
  !(subject in renderableExamples) && extname(subject).length > 0

/** Load one subject, whether it names a registered example or an authored JSON or YAML document. */
export async function loadRenderable(subject: string): Promise<InfoschematicConfig> {
  const registered = renderableExamples[subject]
  if (registered) return registered
  if (!isDocumentSubject(subject)) throw new Error(`Unknown example ${subject}. ${known(subject)}`)
  if (!infoschematicFormatOf(subject)) throw new Error(`Unsupported document format. ${known(subject)}`)

  const text = await readFile(resolve(subject), 'utf8')
  const parsed = parseInfoschematic(text, { pathname: subject })
  if (parsed.ok) return parsed.config
  throw new Error(
    [`${subject} is not a valid Infoschematic:`, ...parsed.issues.map(formatInfoschematicIssue)].join('\n')
  )
}

export type RenderExampleOptions = Readonly<{
  /** Emit each visible Flow's code chip. Defaults to off. */
  annotations?: boolean
  /** Output SVG pathname. Defaults to `reports/<example>.svg`. */
  out?: string
  /** Also rasterise the SVG beside itself using `rsvg-convert`. Defaults to off. */
  png?: boolean
  /** Rasterised width in pixels. Defaults to 1400. */
  width?: number
}>

export type RenderExampleResult = Readonly<{
  example: string
  png?: string
  svg: string
  viewBox: Readonly<{ height: number; width: number }>
}>

const rasterise = (svgPath: string, pngPath: string, width: number) => {
  const converted = spawnSync('rsvg-convert', ['-w', String(width), svgPath, '-o', pngPath], { encoding: 'utf8' })
  if (converted.error && 'code' in converted.error && converted.error.code === 'ENOENT') {
    throw new Error('Rasterising needs rsvg-convert on PATH. Install it with `brew install librsvg`, or drop --png.')
  }
  if (converted.status !== 0) {
    throw new Error(`rsvg-convert failed for ${svgPath}: ${converted.stderr.trim() || `exit ${converted.status}`}`)
  }
}

/** Render one authored example or document to a standalone SVG file, optionally rasterising it. */
export async function renderExample(example: string, options: RenderExampleOptions = {}): Promise<RenderExampleResult> {
  const config = await loadRenderable(example)
  const stem = isDocumentSubject(example) ? basename(example, extname(example)) : example

  const svgPath = resolve(options.out ?? `reports/${stem}.svg`)
  await mkdir(dirname(svgPath), { recursive: true })
  await writeFile(svgPath, renderInfoschematicSvg(config, { annotations: options.annotations ?? false }))

  const result: RenderExampleResult = {
    example,
    svg: svgPath,
    viewBox: { height: config.infoschematic.viewBox.height, width: config.infoschematic.viewBox.width }
  }
  if (!options.png) return result

  const pngPath = svgPath.replace(/\.svg$/, '.png')
  rasterise(svgPath, pngPath, options.width ?? 1400)
  return { ...result, png: pngPath }
}

export const spec: CliSpec = {
  describe: 'Render an authored Infoschematic to a standalone SVG, so a diagram can be reviewed without a browser.',
  flags: {
    all: { describe: 'Render every example.', kind: 'boolean' },
    annotations: { describe: "Emit each visible Flow's code chip.", kind: 'boolean' },
    json: { describe: 'Report results as JSON.', kind: 'boolean' },
    out: { describe: 'Output SVG pathname. Defaults to reports/<subject>.svg.', kind: 'string', value: 'path' },
    png: { describe: 'Also rasterise beside the SVG (needs rsvg-convert).', kind: 'boolean' },
    width: { describe: 'Rasterised width in pixels. Defaults to 1400.', kind: 'number', value: 'n' }
  },
  operands: {
    describe: `registered example (${Object.keys(renderableExamples).join(', ')}) or a document pathname ending in ${infoschematicFormatExtensions.join(', ')}. Defaults to infoschematics.`,
    name: 'subject'
  },
  run: 'self:examples:render',
  script: 'scripts/render-example.ts'
}

if (isDirectInvocation(import.meta.url)) {
  await runCli(spec, async (parsed) => {
    const options: RenderExampleOptions = {
      annotations: parsed.boolean('annotations'),
      out: parsed.string('out'),
      png: parsed.boolean('png'),
      width: parsed.number('width')
    }

    const unknown = parsed.operands.filter(
      (subject) => !(subject in renderableExamples) && !infoschematicFormatOf(subject)
    )
    if (unknown.length > 0) throw new CliUsageError(known(unknown.join(', ')))

    if (parsed.boolean('all') && parsed.operands.length > 0) {
      throw new CliUsageError('--all renders every registered example; drop the operands.')
    }

    const selected = parsed.boolean('all') ? Object.keys(renderableExamples) : parsed.operands
    const examples = selected.length > 0 ? selected : ['infoschematics']
    if (examples.length > 1 && options.out) {
      throw new CliUsageError('--out renders one subject; drop it to render several.')
    }

    const results: RenderExampleResult[] = []
    for (const example of examples) results.push(await renderExample(example, options))

    if (parsed.boolean('json')) {
      console.log(JSON.stringify(results, null, 2))
      return
    }
    for (const result of results) {
      const raster = result.png ? ` and ${result.png}` : ''
      console.log(`${result.example} (${result.viewBox.width}\u00d7${result.viewBox.height}) -> ${result.svg}${raster}`)
    }
  })
}
