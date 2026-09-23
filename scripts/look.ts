#!/usr/bin/env bun
/**
 * Drive a real browser at this repository's site and write what it saw to `reports/`.
 *
 * `AGENTS.md` requires a visual change to be looked at in a real browser, with the capture written to the
 * repository-root `reports/`, and until now it named no mechanism for doing that. The mechanism is not guessable: the
 * browser automation available to an agent session refuses `localhost`, `127.0.0.1` and private addresses, so it
 * cannot reach a dev server at all, and every look so far has been a throwaway Playwright script that rediscovered
 * the same constraints. This is that script, committed once.
 *
 * It serves the site itself on a port the operating system chooses, so a look never collides with a dev server or a
 * preview someone else in this checkout already has running.
 *
 * It fails rather than reporting a clean look when it captured nothing, when the page or its console reported an
 * error, or when a capture is too small to be a rendered page. A check whose failure mode is silence is read as
 * evidence.
 */
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium, type Page } from 'playwright'
import { createServer } from 'vite'
import { type CliSpec, CliUsageError, isDirectInvocation, runCli } from './cli.ts'

/** What a probe is handed: the page itself, plus the two things every look has to record. */
export type Look = Readonly<{
  /** Record a line of evidence in the log beside the captures. */
  note: (line: string) => void
  page: Page
  /** Capture the viewport as `<name>.png`, and record the capture. */
  shot: (name: string) => Promise<void>
  /** Resolve a site-relative route against the served origin. */
  url: (path: string) => string
}>

/** A probe module's export: `look`, or a default export. */
export type LookProbe = (look: Look) => Promise<void>

/** One capture, as the run's own coverage record rather than as a file on disk. */
export type Capture = Readonly<{ bytes: number; name: string }>

/**
 * The floor below which a capture is not a rendered page.
 *
 * A blank viewport is a valid PNG and a plausible-looking file, so file existence proves nothing. Measured at this
 * command's own default 1600×1000: an empty page weighs 6,989 bytes and the Studio playground weighs 319,146. The
 * floor sits between them, near enough to the blank case that a page which rendered nothing cannot clear it and far
 * enough below a real one that a sparse page never trips it.
 */
export const captureFloor = 16_384

/** Every reason this run cannot be called a look, in the order they are worth reading. */
export function lookFailures(captures: readonly Capture[], errors: readonly string[]): readonly string[] {
  return [
    ...(captures.length === 0 ? ['captured nothing, so there is no evidence of anything'] : []),
    ...captures
      .filter((capture) => capture.bytes < captureFloor)
      .map((capture) => `${capture.name}.png is ${capture.bytes} bytes, below the ${captureFloor}-byte rendered floor`),
    ...errors
  ]
}

const spec: CliSpec = {
  describe: "Look at this repository's site in a real browser, and write the captures to reports/.",
  flags: {
    height: { describe: 'Viewport height in pixels.', kind: 'number', value: 'pixels' },
    name: { describe: 'Capture directory under reports/.', kind: 'string', value: 'slug' },
    path: { describe: 'Site route to open.', kind: 'string', value: 'route' },
    probe: {
      describe: 'Module exporting look(), driving the page beyond the first capture.',
      kind: 'string',
      value: 'file'
    },
    width: { describe: 'Viewport width in pixels.', kind: 'number', value: 'pixels' }
  },
  run: 'self:browser:look',
  script: 'scripts/look.ts'
}

const loadProbe = async (probe: string): Promise<LookProbe> => {
  const loaded = (await import(pathToFileURL(resolve(probe)).href)) as {
    default?: LookProbe
    look?: LookProbe
  }
  const run = loaded.look ?? loaded.default
  if (!run) throw new CliUsageError(`${probe} exports neither look nor a default export.`)
  return run
}

/**
 * Run one look and report its failures.
 *
 * Captures land under the repository-root `reports/` because that is where `AGENTS.md` says to write them and because
 * `/tmp` is outside Vite's `server.fs` — a capture written there is not servable and a probe fixture read from there
 * is not loadable. For the same shape of reason this command lives under `scripts/`: a new directory under
 * `packages/` is read as a workspace package and fails config load on the `package.json` it has no reason to have.
 */
export async function look(options: {
  height: number
  name: string
  path: string
  probe?: string | undefined
  width: number
}): Promise<readonly string[]> {
  const run = options.probe ? await loadProbe(options.probe) : undefined
  const out = resolve('reports', options.name)
  // Cleared rather than added to: a capture left behind by an earlier run reads as this run's evidence.
  await rm(out, { force: true, recursive: true })
  await mkdir(out, { recursive: true })

  const server = await createServer({
    configFile: resolve('apps/site/vite.config.ts'),
    logLevel: 'warn',
    root: resolve('apps/site'),
    // Port 0 asks the operating system for a free one, so a look never fights a dev server or a preview for 4173.
    server: { port: 0, strictPort: false }
  })
  await server.listen()
  const origin = server.resolvedUrls?.local[0]?.replace(/\/$/, '')
  if (!origin) throw new Error('the site dev server started without resolving a local URL')

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { height: options.height, width: options.width } })
  const captures: Capture[] = []
  const errors: string[] = []
  const lines: string[] = [`served ${origin} from apps/site`]

  page.on('pageerror', (error) => errors.push(`page error: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console error: ${message.text()}`)
  })

  const api: Look = {
    note: (line) => {
      lines.push(line)
    },
    page,
    shot: async (name) => {
      const file = resolve(out, `${name}.png`)
      await page.screenshot({ path: file })
      const { size } = await stat(file)
      captures.push({ bytes: size, name })
      lines.push(`${name}: ${size} bytes`)
    },
    url: (path) => `${origin}${path.startsWith('/') ? path : `/${path}`}`
  }

  try {
    await page.goto(api.url(options.path), { waitUntil: 'networkidle' })
    if (run) await run(api)
    else await api.shot(options.path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'index')
  } finally {
    await browser.close()
    await server.close()
  }

  const failures = lookFailures(captures, errors)
  lines.push(...failures.map((failure) => `FAILED: ${failure}`))
  await writeFile(resolve(out, 'look-log.txt'), `${lines.join('\n')}\n`)
  console.log(lines.join('\n'))
  console.log(`\nwritten to reports/${options.name}/`)
  return failures
}

if (isDirectInvocation(import.meta.url)) {
  await runCli(spec, async (parsed) => {
    const path = parsed.string('path') ?? '/'
    const name = parsed.string('name')
    if (!name) throw new CliUsageError('--name says which directory under reports/ the captures belong in.')

    const failures = await look({
      height: parsed.number('height') ?? 1000,
      name,
      path,
      probe: parsed.string('probe'),
      width: parsed.number('width') ?? 1600
    })
    if (failures.length > 0) throw new Error(`this look is not evidence: ${failures.join('; ')}`)
  })
}
