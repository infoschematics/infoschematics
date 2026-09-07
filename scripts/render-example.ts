#!/usr/bin/env bun
import { spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
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

/** Render one authored example to a standalone SVG file, optionally rasterising it. */
export async function renderExample(example: string, options: RenderExampleOptions = {}): Promise<RenderExampleResult> {
  const config = renderableExamples[example]
  if (!config) {
    throw new Error(`Unknown example ${example}. Choose one of: ${Object.keys(renderableExamples).join(', ')}.`)
  }

  const svgPath = resolve(options.out ?? `reports/${example}.svg`)
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
  describe:
    'Render an authored Infoschematic example to a standalone SVG, so a diagram can be reviewed without a browser.',
  flags: {
    all: { describe: 'Render every example.', kind: 'boolean' },
    annotations: { describe: "Emit each visible Flow's code chip.", kind: 'boolean' },
    json: { describe: 'Report results as JSON.', kind: 'boolean' },
    out: { describe: 'Output SVG pathname. Defaults to reports/<example>.svg.', kind: 'string', value: 'path' },
    png: { describe: 'Also rasterise beside the SVG (needs rsvg-convert).', kind: 'boolean' },
    width: { describe: 'Rasterised width in pixels. Defaults to 1400.', kind: 'number', value: 'n' }
  },
  operands: {
    describe: `example to render, one of ${Object.keys(renderableExamples).join(', ')}. Defaults to infoschematics.`,
    name: 'example'
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

    const unknown = parsed.operands.filter((example) => !(example in renderableExamples))
    if (unknown.length > 0) {
      throw new CliUsageError(
        `Unknown example ${unknown.join(', ')}. Choose one of: ${Object.keys(renderableExamples).join(', ')}.`
      )
    }

    const selected = parsed.boolean('all') ? Object.keys(renderableExamples) : parsed.operands
    const examples = selected.length > 0 ? selected : ['infoschematics']
    if (examples.length > 1 && options.out) {
      throw new CliUsageError('--out renders one example; drop it to render several.')
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
