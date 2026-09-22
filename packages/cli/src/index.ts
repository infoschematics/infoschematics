import { watch as watchPath } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, dirname } from 'node:path'
import { formatInfoschematicIssue, infoschematicFormatOf, parseInfoschematic } from '@infoschematics/domain-core'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import {
  type DrawingFinding,
  drawingIsUnreadable,
  reviewInfoschematicDrawing
} from '@infoschematics/view-model/diagnostics'
import {
  type CheckArguments,
  loopbackHost,
  type ParsedArguments,
  parseArguments,
  type RenderArguments,
  usage
} from './options.ts'
import { rasteriseInfoschematicSvg } from './raster.ts'
import { type PreviewServer, type PreviewServerOptions, type PreviewState, startPreviewServer } from './serve.ts'

export const rendererCliExit = {
  success: 0,
  /** `check` found something that says the drawing cannot be read as authored. The document itself is valid. */
  drawing: 1,
  usage: 2,
  input: 3,
  validation: 4,
  output: 5,
  /** A listening socket could not be opened, which is neither the document's fault nor the output path's. */
  network: 6,
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
  /** Open a preview server for the current render, rejecting when the socket cannot be bound. */
  serve: (options: PreviewServerOptions) => Promise<PreviewServer>
  /** Observe one document, calling back on every change until the returned watcher is closed. */
  watch: (pathname: string, onChange: () => void) => RendererCliWatcher
  writeFile: (pathname: string, contents: string | Uint8Array) => Promise<void>
  writeStderr: (contents: string) => void
  writeStdout: (contents: string | Uint8Array) => void
}>

export { usage } from './options.ts'
export { rasteriseInfoschematicSvg } from './raster.ts'
export { type PreviewServer, type PreviewServerOptions, type PreviewState, startPreviewServer } from './serve.ts'

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
  serve: startPreviewServer,
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

/** The model a document parsed to, or the diagnostic and status explaining why it produced none. */
type ParsedDocument = Extract<ReturnType<typeof parseInfoschematic>, { ok: true }>['model']

/**
 * Read one document and parse it, in the one shape `CLI-003` requires of every failure: the document named, the
 * reason in one sentence, on standard error, under a documented status. Both verbs start here, so a checker cannot
 * report an unreadable file differently from a renderer.
 */
const readDocument = async (
  input: string,
  io: RendererCliIo
): Promise<Readonly<{ diagnostic: string; status: number }> | Readonly<{ model: ParsedDocument }>> => {
  let authored: string
  try {
    authored = input === '-' ? await io.readStdin() : await io.readFile(input)
  } catch (error) {
    return { diagnostic: `Cannot read ${input}: ${message(error)}\n`, status: rendererCliExit.input }
  }

  const result = parseInfoschematic(authored, input === '-' ? {} : { pathname: input })
  if (!result.ok) {
    return {
      diagnostic: line(result.issues.map(formatInfoschematicIssue).join('\n')),
      status: rendererCliExit.validation
    }
  }
  return { model: result.model }
}

/** One conversion attempt: the bytes it produced, or the diagnostic and status explaining why it produced none. */
type RenderOutcome = Readonly<{ diagnostic?: string; rendered?: string | Uint8Array; status: number }>

/** Convert one document once, without deciding where the result or the diagnostic goes. */
const renderDocument = async (parsed: RenderArguments, io: RendererCliIo): Promise<RenderOutcome> => {
  const document = await readDocument(parsed.input, io)
  if ('diagnostic' in document) return document

  // Geometry the renderer cannot express is refused after parsing, so a construction error is about the document
  // rather than the process. Hand the author that sentence, never the interpreter's stack.
  let svg: string
  try {
    svg = renderInfoschematicSvg(document.model, { scheme: parsed.scheme })
  } catch (error) {
    return { diagnostic: `Cannot render ${parsed.input}: ${message(error)}\n`, status: rendererCliExit.validation }
  }

  // A raster image is bytes, so it never gains the trailing newline that keeps SVG pleasant in a shell.
  if (parsed.format === 'svg') return { rendered: line(svg), status: rendererCliExit.success }

  // resvg ignores a font file it cannot open, so an unreadable --font would silently fall back to the host stack and
  // produce output that looks right here and different elsewhere. Read each one first and fail loudly instead.
  for (const font of parsed.fonts) {
    try {
      await io.readBytes(font)
    } catch (error) {
      return { diagnostic: `Cannot read font ${font}: ${message(error)}\n`, status: rendererCliExit.input }
    }
  }

  try {
    return {
      rendered: rasteriseInfoschematicSvg(svg, { fonts: parsed.fonts, scale: parsed.scale }),
      status: rendererCliExit.success
    }
  } catch (error) {
    return { diagnostic: `Cannot rasterise ${parsed.input}: ${message(error)}\n`, status: rendererCliExit.output }
  }
}

/** Convert one document once and deliver it to standard output or the named file. */
const renderOnce = async (parsed: RenderArguments, io: RendererCliIo): Promise<number> => {
  const outcome = await renderDocument(parsed, io)
  if (outcome.rendered === undefined) {
    io.writeStderr(outcome.diagnostic ?? '')
    return outcome.status
  }

  if (!parsed.output) {
    io.writeStdout(outcome.rendered)
    return rendererCliExit.success
  }

  try {
    await io.writeFile(parsed.output, outcome.rendered)
    return rendererCliExit.success
  } catch (error) {
    io.writeStderr(`Cannot write ${parsed.output}: ${message(error)}\n`)
    return rendererCliExit.output
  }
}

/**
 * Render on start and after every change until the session is cancelled.
 *
 * Renders are serialised and coalesced, so a burst of writes produces one render and a slow render cannot overlap the
 * next one. What a render does with its result is the caller's business: writing a file and refreshing a page share
 * this loop rather than each growing one.
 */
const watchUntilCancelled = async (
  parsed: RenderArguments,
  io: RendererCliIo,
  render: () => Promise<void>
): Promise<number> => {
  let changed = false
  let running = false
  let settled: (() => void) | undefined

  const drain = async () => {
    running = true
    while (changed) {
      await io.wait(settleMilliseconds)
      // Cleared after settling, so every write during the settle window belongs to the render about to start.
      changed = false
      await render()
    }
    running = false
    settled?.()
  }

  const onChange = () => {
    changed = true
    if (!running) void drain()
  }

  await render()

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

/**
 * Watch a document and keep its output current.
 *
 * A failed render is reported and then forgotten: the last good output stays on disk, so a document caught mid-edit
 * never destroys the file a preview or a build is reading, and the next document that validates simply replaces it.
 */
const runWatch = (parsed: RenderArguments, io: RendererCliIo): Promise<number> =>
  watchUntilCancelled(parsed, io, async () => {
    await renderOnce(parsed, io)
  })

/**
 * Serve the current render to a browser, re-rendering and refreshing on every change.
 *
 * The retained-render contract is the same as watch mode's, and visible here: a document that stops validating puts its
 * diagnostic on the page above the last render that worked, rather than replacing a preview with an error.
 */
const runServe = async (parsed: RenderArguments, io: RendererCliIo): Promise<number> => {
  const contentType = parsed.format === 'png' ? 'image/png' : 'image/svg+xml'
  let state: PreviewState = {}

  const attempt = async (): Promise<PreviewState> => {
    const outcome = await renderDocument(parsed, io)
    if (outcome.diagnostic) io.writeStderr(outcome.diagnostic)
    if (outcome.rendered === undefined) {
      return {
        ...(outcome.diagnostic ? { diagnostic: outcome.diagnostic } : {}),
        ...(state.rendered === undefined ? {} : { rendered: state.rendered })
      }
    }
    if (parsed.output) {
      try {
        await io.writeFile(parsed.output, outcome.rendered)
      } catch (error) {
        io.writeStderr(`Cannot write ${parsed.output}: ${message(error)}\n`)
      }
    }
    return { rendered: outcome.rendered }
  }

  state = await attempt()

  let server: PreviewServer
  try {
    server = await io.serve({ contentType, host: parsed.host, port: parsed.port, state })
  } catch (error) {
    io.writeStderr(`Cannot serve on ${parsed.host}:${parsed.port}: ${message(error)}\n`)
    return rendererCliExit.network
  }

  // Informational, but still standard error: standard output carries rendered documents and nothing else.
  io.writeStderr(`Previewing ${parsed.input} at http://${parsed.host}:${server.port}/\n`)
  if (parsed.host !== loopbackHost) {
    io.writeStderr(
      `This preview is reachable from the network on ${parsed.host}. It is a development server, not a host.\n`
    )
  }

  const status = await watchUntilCancelled(parsed, io, async () => {
    state = await attempt()
    server.update(state)
  })

  await server.close()
  return status
}

/** Findings as a person reads them: what is wrong, where, and what would clear it. */
const readable = (input: string, findings: readonly DrawingFinding[]) => {
  if (findings.length === 0) return `${input}: the drawing reads.\n`
  const errors = findings.filter((finding) => finding.severity === 'error').length
  const counted = [
    `${errors} ${errors === 1 ? 'error' : 'errors'}`,
    `${findings.length - errors} ${findings.length - errors === 1 ? 'observation' : 'observations'}`
  ].join(', ')
  return [
    `${input}: ${findings.length} ${findings.length === 1 ? 'finding' : 'findings'} (${counted})`,
    ...findings.flatMap((finding) => [
      '',
      `${finding.severity} ${finding.rule}: ${finding.concerns.join(', ')}`,
      `  ${finding.reads}`,
      ...finding.repairs.map((repair) => `  - ${repair}`)
    ]),
    ''
  ].join('\n')
}

/** One diagnostic on standard error under one status, which is the only way this command reports a failure. */
const report = (io: RendererCliIo, diagnostic: string, status: number) => {
  io.writeStderr(diagnostic)
  return status
}

/**
 * Review the drawing one document describes and report the findings, changing nothing.
 *
 * The geometry is View Model's, per `ADR-INFOSCHEMATICS-018`: this decides who reads the answer and what the exit
 * status says about it, and nothing else. `--json` exists because the two readers want different things - a person
 * wants the sentence and what to try, a repair loop wants the rule code and the measurement - and a checker that
 * offers only prose forces an agent to parse English.
 */
const runCheck = async (parsed: CheckArguments, io: RendererCliIo): Promise<number> => {
  const document = await readDocument(parsed.input, io)
  if ('diagnostic' in document) {
    io.writeStderr(document.diagnostic)
    return document.status
  }

  let findings: readonly DrawingFinding[]
  try {
    findings = reviewInfoschematicDrawing(document.model)
  } catch (error) {
    return report(io, `Cannot check ${parsed.input}: ${message(error)}\n`, rendererCliExit.validation)
  }

  if (parsed.json) {
    io.writeStdout(
      `${JSON.stringify({ document: parsed.input, findings, unreadable: drawingIsUnreadable(findings) }, undefined, 2)}\n`
    )
  } else {
    io.writeStdout(readable(parsed.input, findings))
  }

  return drawingIsUnreadable(findings) ? rendererCliExit.drawing : rendererCliExit.success
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

  if ('check' in parsed) return runCheck(parsed, io)

  if (parsed.serve) return runServe(parsed, io)
  return parsed.watch ? runWatch(parsed, io) : renderOnce(parsed, io)
}
