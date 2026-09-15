import { watch as watchPath } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, dirname } from 'node:path'
import { formatInfoschematicIssue, infoschematicFormatOf, parseInfoschematic } from '@infoschematics/domain-core'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { type ParsedArguments, parseArguments, type RenderArguments, usage } from './options.ts'
import { rasteriseInfoschematicSvg } from './raster.ts'

export const rendererCliExit = {
  success: 0,
  usage: 2,
  input: 3,
  validation: 4,
  output: 5,
  /** A watch session ended because the process was interrupted, which is not a rendering failure. */
  interrupted: 130
} as const

/** A live subscription to one document's changes, closed when watching stops. */
export type RendererCliWatcher = Readonly<{ close: () => void }>

export type RendererCliIo = Readonly<{
  readBytes: (pathname: string) => Promise<Uint8Array>
  readFile: (pathname: string) => Promise<string>
  readStdin: () => Promise<string>
  /** Aborts to end a watch session; absent means only an explicit process signal stops it. */
  signal?: AbortSignal
  /** Settle a burst of writes before re-rendering. Injectable so watch tests do not wait on real time. */
  wait: (milliseconds: number) => Promise<void>
  /** Observe one document, calling back on every change until the returned watcher is closed. */
  watch: (pathname: string, onChange: () => void) => RendererCliWatcher
  writeFile: (pathname: string, contents: string | Uint8Array) => Promise<void>
  writeStderr: (contents: string) => void
  writeStdout: (contents: string | Uint8Array) => void
}>

export { usage } from './options.ts'
export { rasteriseInfoschematicSvg } from './raster.ts'

/**
 * Editors commonly save by writing a temporary file and renaming it over the original, which replaces the inode a file
 * watch is bound to. Watching the containing directory and filtering by name survives that; watching the file directly
 * would go silent after the first save.
 */
const watchDocument = (pathname: string, onChange: () => void): RendererCliWatcher => {
  const name = basename(pathname)
  const watcher = watchPath(dirname(pathname) || '.', (_event, changed) => {
    if (changed === null || changed === name) onChange()
  })
  return { close: () => watcher.close() }
}

/** The real streams, filesystem, and clock, optionally cancellable by a host that traps interrupts. */
export const hostRendererCliIo = (signal?: AbortSignal): RendererCliIo => ({
  readBytes: async (pathname) => new Uint8Array(await readFile(pathname)),
  readFile: (pathname) => readFile(pathname, 'utf8'),
  readStdin: async () => {
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    return Buffer.concat(chunks).toString('utf8')
  },
  wait: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  watch: watchDocument,
  writeFile: (pathname, contents) => writeFile(pathname, contents),
  writeStderr: (contents) => process.stderr.write(contents),
  writeStdout: (contents) => process.stdout.write(contents),
  ...(signal ? { signal } : {})
})

/** One editor save can produce several filesystem events, so changes settle for this long before a render starts. */
const settleMilliseconds = 40

const line = (contents: string) => (contents.endsWith('\n') ? contents : `${contents}\n`)

const message = (error: unknown) => (error instanceof Error ? error.message : String(error))

/** Convert one document once, reporting every failure class through its own diagnostic and status. */
const renderOnce = async (parsed: RenderArguments, io: RendererCliIo): Promise<number> => {
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

/**
 * Render on start and after every change until the session is cancelled.
 *
 * A failed render is reported and then forgotten: the last good output stays on disk, so a document caught mid-edit
 * never destroys the file a preview or a build is reading, and the next document that validates simply replaces it.
 * Renders are serialised and coalesced, so a burst of writes produces one render and a slow render cannot overlap the
 * next one.
 */
const runWatch = async (parsed: RenderArguments, io: RendererCliIo): Promise<number> => {
  let changed = false
  let running = false
  let settled: (() => void) | undefined

  const drain = async () => {
    running = true
    while (changed) {
      await io.wait(settleMilliseconds)
      // Cleared after settling, so every write during the settle window belongs to the render about to start.
      changed = false
      await renderOnce(parsed, io)
    }
    running = false
    settled?.()
  }

  const onChange = () => {
    changed = true
    if (!running) void drain()
  }

  await renderOnce(parsed, io)

  const watcher = io.watch(parsed.input, onChange)
  await new Promise<void>((resolve) => {
    if (!io.signal) return
    if (io.signal.aborted) resolve()
    else io.signal.addEventListener('abort', () => resolve(), { once: true })
  })

  watcher.close()
  // An in-flight render owns the output file, so shutdown waits for it rather than leaving a half-written image.
  if (running) {
    await new Promise<void>((resolve) => {
      settled = resolve
    })
  }
  return rendererCliExit.interrupted
}

/** Execute the renderer command against injectable streams and filesystem operations. */
export async function runRendererCli(
  argv: readonly string[],
  io: RendererCliIo = hostRendererCliIo()
): Promise<number> {
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

  return parsed.watch ? runWatch(parsed, io) : renderOnce(parsed, io)
}
