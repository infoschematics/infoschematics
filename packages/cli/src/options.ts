/**
 * One declarative option table for the render command, shared by parsing and by the usage text.
 *
 * The command started with a single hand-rolled `--output` loop. Raster output adds four more options and watch mode
 * will add its own, so the table is the extension point: adding a row is what adds an option, and the usage text a user
 * reads cannot fall behind the options the command accepts because both are derived from the same declaration.
 */

export type OptionSpec = Readonly<{
  alias?: string
  describe: string
  /** `value` takes one argument, `values` may be repeated, `flag` takes none. */
  kind: 'flag' | 'value' | 'values'
  placeholder?: string
}>

export const renderOptionSpecs = {
  font: {
    describe: 'Use a font file for text, repeatable. Without one, the host font stack is used.',
    kind: 'values',
    placeholder: '<path>'
  },
  format: { describe: 'Output format: svg or png. Defaults to svg.', kind: 'value', placeholder: '<format>' },
  help: { alias: 'h', describe: 'Show this message.', kind: 'flag' },
  output: { alias: 'o', describe: 'Write to a file instead of standard output.', kind: 'value', placeholder: '<path>' },
  scale: { describe: 'Multiply the raster pixel size. Defaults to 1.', kind: 'value', placeholder: '<number>' }
} as const satisfies Readonly<Record<string, OptionSpec>>

export type RenderOptionName = keyof typeof renderOptionSpecs

export type RenderFormat = 'png' | 'svg'

export type RenderArguments = Readonly<{
  /** Font files pinned for text, in declaration order. Empty means the host font stack. */
  fonts: readonly string[]
  format: RenderFormat
  input: string
  output?: string
  scale: number
}>

export type ParsedArguments = Readonly<{ help: true }> | RenderArguments

const named = (token: string): RenderOptionName | undefined => {
  const name = Object.keys(renderOptionSpecs).find((option) => {
    const spec = renderOptionSpecs[option as RenderOptionName]
    return token === `--${option}` || ('alias' in spec && token === `-${spec.alias}`)
  })
  return name as RenderOptionName | undefined
}

const optionLine = (name: RenderOptionName) => {
  const spec: OptionSpec = renderOptionSpecs[name]
  const alias = spec.alias ? `-${spec.alias}, ` : '    '
  const invocation = `${alias}--${name}${spec.kind === 'flag' ? '' : ` ${spec.placeholder}`}`
  return `  ${invocation.padEnd(24)}${spec.describe}`
}

export const usage = `Render a canonical YAML or JSON Infoschematic to SVG or PNG.

Usage: infoschematics render <input> [options]

  input                   A .yaml, .yml, or .json document; use - for standard input.
${(Object.keys(renderOptionSpecs) as RenderOptionName[]).map(optionLine).join('\n')}

Rendering the same document twice on one machine produces identical bytes. Pass --font to pin text across machines.

TypeScript modules are not executable input. Use the programmatic libraries instead.`

const collected = (argv: readonly string[]) => {
  const values = new Map<RenderOptionName, string[]>()
  const flags = new Set<RenderOptionName>()

  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index] ?? ''
    const name = named(token)
    if (!name) throw new Error(`Unknown option ${token}.`)
    const spec: OptionSpec = renderOptionSpecs[name]

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

  return { flags, single: (name: RenderOptionName) => values.get(name)?.[0], values }
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

/** Read one `render` invocation, or report that the caller asked for help. */
export function parseArguments(argv: readonly string[]): ParsedArguments {
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') return { help: true }
  if (argv[0] !== 'render') throw new Error(`Unknown command ${argv[0]}.`)
  if (argv.length === 1 || argv[1] === '--help' || argv[1] === '-h') return { help: true }

  const input = argv[1] ?? ''
  if (input.startsWith('-') && input !== '-') throw new Error('The input document must be named before any option.')

  const parsed = collected(argv.slice(1))
  if (parsed.flags.has('help')) return { help: true }

  const format = formatOf(parsed.single('format'))
  const fonts = parsed.values.get('font') ?? []
  const output = parsed.single('output')
  const scale = scaleOf(parsed.single('scale'))

  if (format === 'svg') {
    for (const option of ['font', 'scale'] as const) {
      if (parsed.values.has(option))
        throw new Error(`The ${option} option applies to raster output. Pass --format png.`)
    }
  }

  return { fonts, format, input, ...(output ? { output } : {}), scale }
}
