import { spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { InfoschematicConfig } from '@infoschematics/domain-model'
import { blankInfoschematic } from '@infoschematics/is-blank'
import { infoschematicsExample } from '@infoschematics/is-infoschematics'
import { systemExample } from '@infoschematics/is-system'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'

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

const usage = `Render an authored Infoschematic example to a standalone SVG.

Usage: bun run ki:examples:render [example] [options]

Examples: ${Object.keys(renderableExamples).join(', ')}

Options:
  --all            Render every example.
  --annotations    Emit each visible Flow's code chip.
  --out <path>     Output SVG pathname. Defaults to reports/<example>.svg.
  --png            Also rasterise beside the SVG (needs rsvg-convert).
  --width <n>      Rasterised width in pixels. Defaults to 1400.
  --json           Report results as JSON.
  --help           Show this message.`

const flagValue = (argv: readonly string[], flag: string) => {
  const at = argv.indexOf(flag)
  return at >= 0 ? argv[at + 1] : undefined
}

const invokedDirectly = process.argv[1] ? resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false

if (invokedDirectly) {
  const argv = process.argv.slice(2)
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(usage)
  } else {
    try {
      const width = flagValue(argv, '--width')
      const options: RenderExampleOptions = {
        annotations: argv.includes('--annotations'),
        out: flagValue(argv, '--out'),
        png: argv.includes('--png'),
        width: width ? Number(width) : undefined
      }
      if (options.width !== undefined && !Number.isFinite(options.width)) {
        throw new Error(`--width needs a number, received ${width}.`)
      }

      const selected = argv.includes('--all')
        ? Object.keys(renderableExamples)
        : argv.filter((argument) => !argument.startsWith('--') && argument !== width)
      const examples = selected.length > 0 ? selected : ['infoschematics']
      if (examples.length > 1 && options.out) throw new Error('--out renders one example; drop it to render several.')

      const results: RenderExampleResult[] = []
      for (const example of examples) results.push(await renderExample(example, options))

      if (argv.includes('--json')) console.log(JSON.stringify(results, null, 2))
      else
        for (const result of results) {
          const raster = result.png ? ` and ${result.png}` : ''
          console.log(`${result.example} (${result.viewBox.width}×${result.viewBox.height}) -> ${result.svg}${raster}`)
        }
    } catch (error) {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    }
  }
}
