import { readFile, writeFile } from 'node:fs/promises'
import { formatInfoschematicIssue, infoschematicFormatOf, parseInfoschematic } from '@infoschematics/domain-core'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'

export const rendererCliExit = {
  success: 0,
  usage: 2,
  input: 3,
  validation: 4,
  output: 5
} as const

export type RendererCliIo = Readonly<{
  readFile: (pathname: string) => Promise<string>
  readStdin: () => Promise<string>
  writeFile: (pathname: string, contents: string) => Promise<void>
  writeStderr: (contents: string) => void
  writeStdout: (contents: string) => void
}>

const usage = `Render a canonical YAML or JSON Infoschematic as SVG.

Usage: infoschematics render <input> [--output <path>]

  input                 A .yaml, .yml, or .json document; use - for standard input.
  -o, --output <path>   Write SVG to a file instead of standard output.
  -h, --help            Show this message.

TypeScript modules are not executable input. Import the programmatic libraries instead.`

const defaultIo: RendererCliIo = {
  readFile: (pathname) => readFile(pathname, 'utf8'),
  readStdin: async () => {
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    return Buffer.concat(chunks).toString('utf8')
  },
  writeFile: (pathname, contents) => writeFile(pathname, contents, 'utf8'),
  writeStderr: (contents) => process.stderr.write(contents),
  writeStdout: (contents) => process.stdout.write(contents)
}

type ParsedArguments = Readonly<{ input: string; output?: string }> | Readonly<{ help: true }>

const parseArguments = (argv: readonly string[]): ParsedArguments => {
  if (argv.length === 1 && (argv[0] === '--help' || argv[0] === '-h')) return { help: true }
  if (argv[0] !== 'render') throw new Error('Expected the render command.')
  if (argv[1] === '--help' || argv[1] === '-h') return { help: true }

  const input = argv[1]
  if (!input || (input.startsWith('-') && input !== '-')) throw new Error('Expected one input document.')

  let output: string | undefined
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index]
    if (token !== '--output' && token !== '-o') throw new Error(`Unknown option ${token}.`)
    if (output !== undefined) throw new Error('The output option may be provided only once.')
    output = argv[index + 1]
    if (!output || output.startsWith('-')) throw new Error('The output option requires a path.')
    index += 1
  }

  return output ? { input, output } : { input }
}

const line = (contents: string) => (contents.endsWith('\n') ? contents : `${contents}\n`)

/** Execute the renderer command against injectable streams and filesystem operations. */
export async function runRendererCli(argv: readonly string[], io: RendererCliIo = defaultIo): Promise<number> {
  let parsed: ParsedArguments
  try {
    parsed = parseArguments(argv)
  } catch (error) {
    io.writeStderr(`${error instanceof Error ? error.message : String(error)}\n\n${usage}\n`)
    return rendererCliExit.usage
  }

  if ('help' in parsed) {
    io.writeStdout(`${usage}\n`)
    return rendererCliExit.success
  }

  if (parsed.input !== '-' && !infoschematicFormatOf(parsed.input)) {
    io.writeStderr(`Unsupported input ${parsed.input}. Expected .yaml, .yml, .json, or - for standard input.\n`)
    return rendererCliExit.usage
  }

  let authored: string
  try {
    authored = parsed.input === '-' ? await io.readStdin() : await io.readFile(parsed.input)
  } catch (error) {
    io.writeStderr(`Cannot read ${parsed.input}: ${error instanceof Error ? error.message : String(error)}\n`)
    return rendererCliExit.input
  }

  const result = parseInfoschematic(authored, parsed.input === '-' ? {} : { pathname: parsed.input })
  if (!result.ok) {
    io.writeStderr(line(result.issues.map(formatInfoschematicIssue).join('\n')))
    return rendererCliExit.validation
  }

  const svg = line(renderInfoschematicSvg(result.model))
  if (!parsed.output) {
    io.writeStdout(svg)
    return rendererCliExit.success
  }

  try {
    await io.writeFile(parsed.output, svg)
    return rendererCliExit.success
  } catch (error) {
    io.writeStderr(`Cannot write ${parsed.output}: ${error instanceof Error ? error.message : String(error)}\n`)
    return rendererCliExit.output
  }
}
