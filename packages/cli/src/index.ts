import { readFile, writeFile } from 'node:fs/promises'
import { formatInfoschematicIssue, infoschematicFormatOf, parseInfoschematic } from '@infoschematics/domain-core'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { type ParsedArguments, parseArguments, usage } from './options.ts'
import { rasteriseInfoschematicSvg } from './raster.ts'

export const rendererCliExit = {
  success: 0,
  usage: 2,
  input: 3,
  validation: 4,
  output: 5
} as const

export type RendererCliIo = Readonly<{
  readBytes: (pathname: string) => Promise<Uint8Array>
  readFile: (pathname: string) => Promise<string>
  readStdin: () => Promise<string>
  writeFile: (pathname: string, contents: string | Uint8Array) => Promise<void>
  writeStderr: (contents: string) => void
  writeStdout: (contents: string | Uint8Array) => void
}>

export { usage } from './options.ts'
export { rasteriseInfoschematicSvg } from './raster.ts'

const defaultIo: RendererCliIo = {
  readBytes: async (pathname) => new Uint8Array(await readFile(pathname)),
  readFile: (pathname) => readFile(pathname, 'utf8'),
  readStdin: async () => {
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    return Buffer.concat(chunks).toString('utf8')
  },
  writeFile: (pathname, contents) => writeFile(pathname, contents),
  writeStderr: (contents) => process.stderr.write(contents),
  writeStdout: (contents) => process.stdout.write(contents)
}

const line = (contents: string) => (contents.endsWith('\n') ? contents : `${contents}\n`)

const message = (error: unknown) => (error instanceof Error ? error.message : String(error))

/** Execute the renderer command against injectable streams and filesystem operations. */
export async function runRendererCli(argv: readonly string[], io: RendererCliIo = defaultIo): Promise<number> {
  let parsed: ParsedArguments
  try {
    parsed = parseArguments(argv)
  } catch (error) {
    io.writeStderr(`${message(error)}\n\n${usage}\n`)
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
    io.writeStderr(`Cannot read ${parsed.input}: ${message(error)}\n`)
    return rendererCliExit.input
  }

  const result = parseInfoschematic(authored, parsed.input === '-' ? {} : { pathname: parsed.input })
  if (!result.ok) {
    io.writeStderr(line(result.issues.map(formatInfoschematicIssue).join('\n')))
    return rendererCliExit.validation
  }

  const svg = renderInfoschematicSvg(result.model)

  // A raster image is bytes, so it never gains the trailing newline that keeps SVG pleasant in a shell.
  let rendered: string | Uint8Array
  if (parsed.format === 'svg') rendered = line(svg)
  else {
    // resvg ignores a font file it cannot open, so an unreadable --font would silently fall back to the host stack and
    // produce output that looks right here and different elsewhere. Read each one first and fail loudly instead.
    for (const font of parsed.fonts) {
      try {
        await io.readBytes(font)
      } catch (error) {
        io.writeStderr(`Cannot read font ${font}: ${message(error)}\n`)
        return rendererCliExit.input
      }
    }

    try {
      rendered = rasteriseInfoschematicSvg(svg, { fonts: parsed.fonts, scale: parsed.scale })
    } catch (error) {
      io.writeStderr(`Cannot rasterise ${parsed.input}: ${message(error)}\n`)
      return rendererCliExit.output
    }
  }

  if (!parsed.output) {
    io.writeStdout(rendered)
    return rendererCliExit.success
  }

  try {
    await io.writeFile(parsed.output, rendered)
    return rendererCliExit.success
  } catch (error) {
    io.writeStderr(`Cannot write ${parsed.output}: ${message(error)}\n`)
    return rendererCliExit.output
  }
}
