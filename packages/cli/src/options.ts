/**
 * One declarative option table per command, shared by parsing and by the usage text.
 *
 * The command started with a single hand-rolled `--output` loop. Raster output adds four more options and watch mode
 * will add its own, so the table is the extension point: adding a row is what adds an option, and the usage text a user
 * reads cannot fall behind the options the command accepts because both are derived from the same declaration.
 *
 * A second verb made the table plural rather than longer. `check` accepts almost nothing `render` does, and one shared
 * table would have accepted `--scale` on a checker and printed it in the usage text: each command declares its own
 * options, and parsing is the same code reading whichever table the verb names.
 */

import { type DetailBand, detailBands } from '@infoschematics/view-model/detail'

/** Loopback only: a preview is for the person at the keyboard, and anything wider has to be asked for. */
export const loopbackHost = '127.0.0.1'

/** High, memorable, and clear of the ports the usual development servers take. */
export const defaultPort = 4680

export type OptionSpec = Readonly<{
  alias?: string
  describe: string
  /** `value` takes one argument, `values` may be repeated, `flag` takes none. */
  kind: 'flag' | 'value' | 'values'
  placeholder?: string
}>

export const renderOptionSpecs = {
  detail: {
    describe: 'Detail band: minimal, outline, identified, or full. Defaults to full.',
    kind: 'value',
    placeholder: '<band>'
  },
  font: {
    describe: 'Use a font file for text, repeatable. Without one, the host font stack is used.',
    kind: 'values',
    placeholder: '<path>'
  },
  format: { describe: 'Output format: svg or png. Defaults to svg.', kind: 'value', placeholder: '<format>' },
  help: { alias: 'h', describe: 'Show this message.', kind: 'flag' },
  host: {
    describe: 'Bind the preview to another interface. Defaults to loopback, which is not reachable from the network.',
    kind: 'value',
    placeholder: '<address>'
  },
  output: { alias: 'o', describe: 'Write to a file instead of standard output.', kind: 'value', placeholder: '<path>' },
  port: {
    describe: `Preview port. Defaults to ${defaultPort}; 0 lets the system choose.`,
    kind: 'value',
    placeholder: '<number>'
  },
  scheme: {
    describe: 'Colour scheme: light, dark, or adaptive. Defaults to light. An authored blueprint is unaffected.',
    kind: 'value',
    placeholder: '<scheme>'
  },
  serve: { alias: 's', describe: 'Preview the render in a browser and refresh it on every change.', kind: 'flag' },
  scale: { describe: 'Multiply the raster pixel size. Defaults to 1.', kind: 'value', placeholder: '<number>' },
  watch: { alias: 'w', describe: 'Re-render whenever the input document changes. Requires --output.', kind: 'flag' }
} as const satisfies Readonly<Record<string, OptionSpec>>

export const checkOptionSpecs = {
  help: { alias: 'h', describe: 'Show this message.', kind: 'flag' },
  json: { describe: 'Write the findings as JSON for a tool to read instead of a person.', kind: 'flag' }
} as const satisfies Readonly<Record<string, OptionSpec>>

export type RenderOptionName = keyof typeof renderOptionSpecs

export type CheckOptionName = keyof typeof checkOptionSpecs

export type RenderFormat = 'png' | 'svg'

/**
 * The schemes this command offers, which is not every scheme the manifest holds.
 *
 * `blueprint` is authored by the document, not chosen by whoever renders it, so offering it here would let a caller
 * contradict the drawing. A document that asks for a blueprint surface gets one whatever this option says.
 *
 * `adaptive` is not a palette but a refusal to pick one: the SVG carries both and whatever displays it decides. A
 * raster cannot take it, because the choice has to be made before the pixels exist.
 */
export type RenderScheme = 'adaptive' | 'dark' | 'light'

export type RenderArguments = Readonly<{
  /** The detail band the still is drawn in, as an interactive view would have resolved it from magnification. */
  detail: DetailBand
  /** Font files pinned for text, in declaration order. Empty means the host font stack. */
  fonts: readonly string[]
  format: RenderFormat
  /** The interface the preview binds to; loopback unless deliberately widened. */
  host: string
  input: string
  output?: string
  port: number
  /** Serve the render to a browser instead of, or as well as, writing it. */
  serve: boolean
  scale: number
  /** The palette the output is painted in. A still cannot react to a preference, so it resolves one and writes it. */
  scheme: RenderScheme
  /** Keep rendering until the process is interrupted, rather than converting once and exiting. */
  watch: boolean
}>

/** What `check` was asked to review, and who is going to read the answer. */
export type CheckArguments = Readonly<{
  check: true
  input: string
  /** Machine-readable findings, for a repair loop or a pipeline rather than a terminal. */
  json: boolean
}>

export type ParsedArguments = Readonly<{ help: true }> | CheckArguments | RenderArguments

type OptionTable = Readonly<Record<string, OptionSpec>>

const named = (table: OptionTable, token: string): string | undefined =>
  Object.keys(table).find((option) => {
    const spec = table[option] as OptionSpec
    return token === `--${option}` || (spec.alias !== undefined && token === `-${spec.alias}`)
  })

const optionLine = (table: OptionTable, name: string) => {
  const spec = table[name] as OptionSpec
  const alias = spec.alias ? `-${spec.alias}, ` : '    '
  const invocation = `${alias}--${name}${spec.kind === 'flag' ? '' : ` ${spec.placeholder}`}`
  return `  ${invocation.padEnd(24)}${spec.describe}`
}

const optionLines = (table: OptionTable) =>
  Object.keys(table)
    .map((name) => optionLine(table, name))
    .join('\n')

export const usage = `Render a canonical YAML or JSON Infoschematic to SVG or PNG, or check the drawing one describes.

Usage: infoschematics render <input> [options]
       infoschematics check <input> [options]

  input                   A .yaml, .yml, or .json document; use - for standard input.

render options
${optionLines(renderOptionSpecs)}

check options
${optionLines(checkOptionSpecs)}

Rendering the same document twice on one machine produces identical bytes. Pass --font to pin text across machines.
--scheme dark writes a dark drawing rather than one that might become dark, because nothing downstream of a file
reports a reader's preference. --scheme adaptive instead writes one SVG carrying both palettes, which follows the
reader wherever CSS applies. It needs a consumer that resolves custom properties: one that does not paints those
roles black, so name a scheme for anything but a browser. A PNG cannot carry both at all.
Watch mode keeps the last good output while a document does not parse, and recovers when it parses again.

Checking reports what is wrong with the drawing a valid document describes, and changes nothing. It exits 0 when the
drawing reads, and 1 when a finding says it cannot be read as authored, so a pipeline can gate on it.

TypeScript modules are not executable input. Use the programmatic libraries instead.`

const collected = (table: OptionTable, argv: readonly string[]) => {
  const values = new Map<string, string[]>()
  const flags = new Set<string>()

  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index] ?? ''
    const name = named(table, token)
    if (!name) throw new Error(`Unknown option ${token}.`)
    const spec = table[name] as OptionSpec

    if (spec.kind === 'flag') {
      flags.add(name)
      continue
    }

    const value = argv[index + 1]
    if (!value || value.startsWith('-')) throw new Error(`The ${name} option requires a value.`)
    const existing = values.get(name) ?? []
    if (existing.length > 0 && spec.kind === 'value') {
      throw new Error(`The ${name} option may be provided only once.`)
    }
    values.set(name, [...existing, value])
    index += 1
  }

  return { flags, single: (name: string) => values.get(name)?.[0], values }
}

const formatOf = (value: string | undefined): RenderFormat => {
  if (value === undefined) return 'svg'
  if (value === 'png' || value === 'svg') return value
  throw new Error(`Unsupported format ${value}. Expected svg or png.`)
}

const scaleOf = (value: string | undefined) => {
  if (value === undefined) return 1
  const scale = Number(value)
  if (!Number.isFinite(scale) || scale <= 0)
    throw new Error(`The scale option requires a positive number, received ${value}.`)
  return scale
}

const schemeOf = (value: string | undefined): RenderScheme => {
  if (value === undefined) return 'light'
  if (value === 'adaptive' || value === 'dark' || value === 'light') return value
  throw new Error(`Unsupported scheme ${value}. Expected light, dark, or adaptive.`)
}

/**
 * The band a still is drawn in, which is what a reader's magnification resolves to in an interactive view.
 *
 * `full` is the default because it is what this command always rendered: everything the document and the caller asked
 * for. A narrower band is for a still that has to match a live view a reader has zoomed out of, or for an export made
 * deliberately sparse; a band only withholds, so none of them can add a row the document did not author.
 */
const detailOf = (value: string | undefined): DetailBand => {
  if (value === undefined) return 'full'
  if (detailBands.includes(value as DetailBand)) return value as DetailBand
  throw new Error(`Unsupported detail band ${value}. Expected ${detailBands.join(', ')}.`)
}

const portOf = (value: string | undefined) => {
  if (value === undefined) return defaultPort
  const port = Number(value)
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`The port option requires a number from 0 to 65535, received ${value}.`)
  }
  return port
}

/** Read one `render` or `check` invocation, or report that the caller asked for help. */
export function parseArguments(argv: readonly string[]): ParsedArguments {
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') return { help: true }
  if (argv[0] !== 'render' && argv[0] !== 'check') throw new Error(`Unknown command ${argv[0]}.`)
  if (argv.length === 1 || argv[1] === '--help' || argv[1] === '-h') return { help: true }

  const input = argv[1] ?? ''
  if (input.startsWith('-') && input !== '-') throw new Error('The input document must be named before any option.')

  if (argv[0] === 'check') {
    const asked = collected(checkOptionSpecs, argv.slice(1))
    if (asked.flags.has('help')) return { help: true }
    return { check: true, input, json: asked.flags.has('json') }
  }

  const parsed = collected(renderOptionSpecs, argv.slice(1))
  if (parsed.flags.has('help')) return { help: true }

  const detail = detailOf(parsed.single('detail'))
  const format = formatOf(parsed.single('format'))
  const fonts = parsed.values.get('font') ?? []
  const output = parsed.single('output')
  const scale = scaleOf(parsed.single('scale'))
  const scheme = schemeOf(parsed.single('scheme'))

  /* A PNG is pixels, and a pixel cannot hold two colours pending a preference. The refusal is here rather than in
     the encoder so the caller is told which of the two options to change. */
  if (format === 'png' && scheme === 'adaptive') {
    throw new Error('The adaptive scheme applies to SVG output. A raster cannot carry both palettes.')
  }

  if (format === 'svg') {
    for (const option of ['font', 'scale'] as const) {
      if (parsed.values.has(option))
        throw new Error(`The ${option} option applies to raster output. Pass --format png.`)
    }
  }

  const serve = parsed.flags.has('serve')
  const host = parsed.single('host') ?? loopbackHost
  const port = portOf(parsed.single('port'))
  if (!serve) {
    for (const option of ['host', 'port'] as const) {
      if (parsed.values.has(option))
        throw new Error(`The ${option} option applies to the preview server. Pass --serve.`)
    }
  }
  if (serve && input === '-') throw new Error('The serve option requires a file to watch, not standard input.')

  const watch = parsed.flags.has('watch')
  // Rewriting a stream nobody re-reads is not a useful loop, and standard input is consumed once and never changes.
  if (watch && !output)
    throw new Error('The watch option requires --output, because standard output cannot be rewritten.')
  if (watch && input === '-') throw new Error('The watch option requires a file to watch, not standard input.')

  return { detail, fonts, format, host, input, ...(output ? { output } : {}), port, scale, scheme, serve, watch }
}
