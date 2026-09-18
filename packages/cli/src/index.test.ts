import { mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { networkInterfaces, tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { hostRendererCliIo, type RendererCliIo, rendererCliExit, runRendererCli, startPreviewServer } from './index.ts'

const yaml = `id: CLI
title: CLI smoke
diagram:
  bounds: 0 0 100 100
  gridSize: 10
`
/** Two Cards on different axes joined by their ports alone: what the contract accepts and geometry used to refuse. */
const unaligned = `id: CLI
title: Unaligned
diagram:
  bounds: 0 0 400 300
  gridSize: 10
  families:
    - id: link
      label: Link
      color: "#79c9ff"
  cards:
    - id: LEFT
      label: Left
      bounds: 40 20 100 60
      ports: 1
    - id: RIGHT
      label: Right
      bounds: 240 200 100 60
      ports: 1
  flows:
    - id: FLOW-01
      family: link
      link: LEFT E1 -> RIGHT W1
`

/** The same document with a diagonal run authored by hand: a geometry error no derivation can route away. */
const diagonal = unaligned.replace(
  'link: LEFT E1 -> RIGHT W1',
  'link: LEFT E1 -> RIGHT W1\n      waypoints: 180,90 220,160'
)

const json = JSON.stringify({ id: 'CLI', title: 'CLI smoke', diagram: { bounds: '0 0 100 100', gridSize: 10 } })

type Harness = Readonly<{
  /** Replace the document and deliver one change event, as a save does. */
  change: (contents: string) => void
  /** Deliver a change event without waiting for the render it starts, as a burst of writes does. */
  touch: () => void
  watching: () => number
}>

const harness = (files: Readonly<Record<string, string>> = {}) => {
  let stdout = ''
  let stderr = ''
  const bytes: Uint8Array[] = []
  const written = new Map<string, string | Uint8Array>()
  const documents = new Map(Object.entries(files))
  const listeners = new Map<string, () => void>()
  const interrupt = new AbortController()
  const io: RendererCliIo = {
    readFile: async (pathname) => {
      const value = documents.get(pathname)
      if (value === undefined) throw new Error('missing')
      return value
    },
    readBytes: async (pathname) => {
      const value = documents.get(pathname)
      if (value === undefined) throw new Error('missing')
      return new TextEncoder().encode(value)
    },
    readStdin: async () => documents.get('-') ?? '',
    serve: startPreviewServer,
    signal: interrupt.signal,
    // Settling is a real delay in the command and an immediate resolution here: a burst still coalesces, because the
    // events arrive before the pending render resumes, and the suite never waits on a timer.
    wait: async () => {},
    watch: (pathname, onChange) => {
      listeners.set(pathname, onChange)
      return { close: () => listeners.delete(pathname) }
    },
    writeFile: async (pathname, contents) => {
      written.set(pathname, contents)
    },
    writeStderr: (contents) => {
      stderr += contents
    },
    writeStdout: (contents) => {
      if (typeof contents === 'string') stdout += contents
      else bytes.push(contents)
    }
  }
  const notify = (pathname: string) => listeners.get(pathname)?.()

  const watch: Harness = {
    change: (contents) => {
      documents.set('model.yaml', contents)
      notify('model.yaml')
    },
    touch: () => notify('model.yaml'),
    watching: () => listeners.size
  }

  return { interrupt, io, output: () => ({ bytes, stderr, stdout, written }), watch }
}

/** Let every queued render settle, which takes one turn per queued render through the injected immediate wait. */
const settle = async () => {
  for (let turn = 0; turn < 8; turn += 1) await Promise.resolve()
}

describe('renderer CLI', () => {
  it('renders equivalent YAML and JSON documents byte-identically', async () => {
    const yamlRun = harness({ 'model.yaml': yaml })
    const jsonRun = harness({ 'model.json': json })

    expect(await runRendererCli(['render', 'model.yaml'], yamlRun.io)).toBe(rendererCliExit.success)
    expect(await runRendererCli(['render', 'model.json'], jsonRun.io)).toBe(rendererCliExit.success)
    expect(yamlRun.output().stdout).toBe(jsonRun.output().stdout)
    expect(yamlRun.output().stdout).toMatch(/^<svg/)
    expect(yamlRun.output().stderr).toBe('')
  })

  it('renders a document the contract accepts rather than refusing its geometry', async () => {
    const run = harness({ 'model.yaml': unaligned })
    expect(await runRendererCli(['render', 'model.yaml'], run.io)).toBe(rendererCliExit.success)
    expect(run.output().stderr).toBe('')

    // The route the command drew is the bend, so the document renders instead of throwing from inside geometry.
    const flow = run.output().stdout.split('data-artefact-kind="flow"')[1] ?? ''
    const drawn = /<path d="([^"]+)"/.exec(flow)?.[1]
    expect(drawn).toMatch(/^M-?\d+ -?\d+( [HV]-?\d+)+$/)
    expect(drawn?.split(' ').length).toBeGreaterThan(3)
  })

  it('hands a geometry error to the author as a sentence rather than a stack', async () => {
    const run = harness({ 'model.yaml': diagonal })
    expect(await runRendererCli(['render', 'model.yaml'], run.io)).toBe(rendererCliExit.validation)
    expect(run.output().stdout).toBe('')
    expect(run.output().stderr).toBe('Cannot render model.yaml: A route may not run diagonally: 140,50 to 180,90\n')
    expect(run.output().stderr).not.toContain(' at ')
  })

  it('reads standard input and writes an explicit output without contaminating stdout', async () => {
    const run = harness({ '-': yaml })
    expect(await runRendererCli(['render', '-', '--output', 'model.svg'], run.io)).toBe(rendererCliExit.success)
    expect(run.output().stdout).toBe('')
    expect(run.output().stderr).toBe('')
    expect(run.output().written.get('model.svg')).toMatch(/^<svg/)
  })

  it.each<Readonly<{ args: readonly string[]; code: number; files: Readonly<Record<string, string>> }>>([
    { args: ['render', 'model.ts'], code: rendererCliExit.usage, files: {} },
    { args: ['render', 'missing.yaml'], code: rendererCliExit.input, files: {} },
    { args: ['render', 'bad.yaml'], code: rendererCliExit.validation, files: { 'bad.yaml': 'id: [' } },
    { args: ['unknown'], code: rendererCliExit.usage, files: {} }
  ])('reports failures only on stderr', async ({ args, code, files }) => {
    const run = harness(files)
    expect(await runRendererCli(args, run.io)).toBe(code)
    expect(run.output().stdout).toBe('')
    expect(run.output().stderr).not.toBe('')
  })

  it('uses a stable output failure status', async () => {
    const run = harness({ 'model.yaml': yaml })
    const io: RendererCliIo = { ...run.io, writeFile: async () => Promise.reject(new Error('read only')) }
    expect(await runRendererCli(['render', 'model.yaml', '-o', 'model.svg'], io)).toBe(rendererCliExit.output)
    expect(run.output().stdout).toBe('')
    expect(run.output().stderr).toContain('read only')
  })

  it('rejects raster options when the output stays SVG', async () => {
    const run = harness({ 'model.yaml': yaml })
    expect(await runRendererCli(['render', 'model.yaml', '--scale', '2'], run.io)).toBe(rendererCliExit.usage)
    expect(run.output().stdout).toBe('')
    expect(run.output().stderr).toContain('--format png')
  })

  it.each([
    ['render', 'model.yaml', '--format', 'gif'],
    ['render', 'model.yaml', '--format', 'png', '--scale', 'wide'],
    ['render', 'model.yaml', '--format', 'png', '--scale', '0'],
    ['render', 'model.yaml', '-o', 'one.svg', '-o', 'two.svg'],
    ['render', 'model.yaml', '--format', 'png', '--background', '#ff0000']
  ])('rejects malformed options before reading anything', async (...args) => {
    const run = harness({ 'model.yaml': yaml })
    expect(await runRendererCli(args, run.io)).toBe(rendererCliExit.usage)
    expect(run.output().stdout).toBe('')
    expect(run.output().stderr).not.toBe('')
  })
})

/** PNG dimensions live in the IHDR chunk, which starts at byte 16. */
const pngSize = (image: Uint8Array) => {
  const view = new DataView(image.buffer, image.byteOffset, image.byteLength)
  return { height: view.getUint32(20), width: view.getUint32(16) }
}

const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/**
 * Rasterising initialises sharp's native library once per worker, which measured between 150 ms and 1.5 s on the same
 * quiet machine while the image work either side of it stayed near 400 ms. What puts these cases near a budget is the
 * variance of that one-off, not the rasterisation, so they get a deliberate budget that says so. Every other suite
 * keeps Vitest's 5000 ms default, which is what still catches a genuinely hung test.
 */
describe('renderer CLI raster output', { timeout: 20_000 }, () => {
  it('writes a binary-clean PNG to standard output', async () => {
    const run = harness({ 'model.yaml': yaml })

    expect(await runRendererCli(['render', 'model.yaml', '--format', 'png'], run.io)).toBe(rendererCliExit.success)

    const [image] = run.output().bytes
    expect(image).toBeDefined()
    expect([...(image ?? []).slice(0, 8)]).toEqual(pngSignature)
    expect(run.output().stdout).toBe('')
    expect(run.output().stderr).toBe('')
  })

  it('renders the same document to identical bytes on repeated runs', async () => {
    const first = harness({ 'model.yaml': yaml })
    const second = harness({ 'model.json': json })

    await runRendererCli(['render', 'model.yaml', '--format', 'png'], first.io)
    await runRendererCli(['render', 'model.json', '--format', 'png'], second.io)

    expect(first.output().bytes[0]).toEqual(second.output().bytes[0])
  })

  it('scales pixel size without changing the document', async () => {
    const plain = harness({ 'model.yaml': yaml })
    const scaled = harness({ 'model.yaml': yaml })

    await runRendererCli(['render', 'model.yaml', '--format', 'png'], plain.io)
    await runRendererCli(['render', 'model.yaml', '--format', 'png', '--scale', '2'], scaled.io)

    const before = pngSize(plain.output().bytes[0] ?? new Uint8Array())
    const after = pngSize(scaled.output().bytes[0] ?? new Uint8Array())
    expect(after.width).toBe(before.width * 2)
    expect(after.height).toBe(before.height * 2)
  })

  it('writes raster bytes to a file without touching standard output', async () => {
    const run = harness({ 'model.yaml': yaml })

    expect(await runRendererCli(['render', 'model.yaml', '--format', 'png', '-o', 'model.png'], run.io)).toBe(
      rendererCliExit.success
    )

    const written = run.output().written.get('model.png')
    expect(written).toBeInstanceOf(Uint8Array)
    expect(run.output().stdout).toBe('')
    expect(run.output().bytes).toEqual([])
    expect(run.output().stderr).toBe('')
  })

  it('reports an unreadable font before rasterising rather than silently dropping it', async () => {
    const run = harness({ 'model.yaml': yaml })

    const code = await runRendererCli(['render', 'model.yaml', '--format', 'png', '--font', 'missing.ttf'], run.io)

    expect(code).toBe(rendererCliExit.input)
    expect(run.output().stdout).toBe('')
    expect(run.output().bytes).toEqual([])
    expect(run.output().stderr).toContain('missing.ttf')
  })
})

describe('renderer CLI watch mode', () => {
  const watched = ['render', 'model.yaml', '--output', 'model.svg', '--watch']

  const session = (files: Readonly<Record<string, string>>) => {
    const run = harness(files)
    return { ...run, finished: runRendererCli(watched, run.io) }
  }

  it('renders once on start and again on every change', async () => {
    const run = session({ 'model.yaml': yaml })
    await settle()
    const initial = run.output().written.get('model.svg')
    expect(initial).toMatch(/^<svg/)

    run.watch.change(yaml.replace('CLI smoke', 'Edited'))
    await settle()
    expect(run.output().written.get('model.svg')).toContain('Edited')

    run.interrupt.abort()
    expect(await run.finished).toBe(rendererCliExit.interrupted)
    expect(run.watch.watching()).toBe(0)
    expect(run.output().stderr).toBe('')
  })

  it('keeps the last good output when the document stops validating, then recovers', async () => {
    const run = session({ 'model.yaml': yaml })
    await settle()
    const good = run.output().written.get('model.svg')

    run.watch.change('id: [\n')
    await settle()
    expect(run.output().written.get('model.svg')).toBe(good)
    expect(run.output().stderr).not.toBe('')

    run.watch.change(yaml.replace('CLI smoke', 'Recovered'))
    await settle()
    expect(run.output().written.get('model.svg')).toContain('Recovered')

    run.interrupt.abort()
    expect(await run.finished).toBe(rendererCliExit.interrupted)
  })

  it('coalesces a burst of writes into one render', async () => {
    const run = harness({ 'model.yaml': yaml })
    let renders = 0
    const io: RendererCliIo = {
      ...run.io,
      writeFile: async (pathname, contents) => {
        renders += 1
        await run.io.writeFile(pathname, contents)
      }
    }
    const finished = runRendererCli(watched, io)
    await settle()
    expect(renders).toBe(1)

    run.watch.touch()
    run.watch.touch()
    run.watch.change(yaml.replace('CLI smoke', 'Coalesced'))
    await settle()

    expect(renders).toBe(2)
    expect(run.output().written.get('model.svg')).toContain('Coalesced')
    run.interrupt.abort()
    expect(await finished).toBe(rendererCliExit.interrupted)
  })

  it('refuses to watch what it cannot rewrite', async () => {
    const run = harness({ 'model.yaml': yaml })
    expect(await runRendererCli(['render', 'model.yaml', '--watch'], run.io)).toBe(rendererCliExit.usage)
    expect(run.output().stderr).toContain('--output')

    const piped = harness({ '-': yaml })
    expect(await runRendererCli(['render', '-', '--output', 'model.svg', '--watch'], piped.io)).toBe(
      rendererCliExit.usage
    )
    expect(piped.output().stderr).toContain('standard input')
  })

  it('is unchanged for a single non-watching invocation', async () => {
    const once = harness({ 'model.yaml': yaml })
    const watching = harness({ 'model.yaml': yaml })

    expect(await runRendererCli(['render', 'model.yaml', '--output', 'model.svg'], once.io)).toBe(
      rendererCliExit.success
    )
    const finished = runRendererCli(watched, watching.io)
    await settle()
    watching.interrupt.abort()
    await finished

    expect(watching.output().written.get('model.svg')).toBe(once.output().written.get('model.svg'))
  })
})

/** Poll until a real filesystem event arrives, rather than guessing how long the platform takes to deliver one. */
const arrives = async (reached: () => boolean) => {
  for (let attempt = 0; attempt < 200 && !reached(); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  return reached()
}

describe('renderer CLI host watcher', () => {
  it('survives the atomic rename an editor saves with, and ignores its neighbours', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'infoschematics-watch-'))
    const document = join(directory, 'model.yaml')
    const replacement = join(directory, 'model.yaml.tmp')
    await writeFile(document, yaml)

    let changes = 0
    const watcher = hostRendererCliIo().watch(document, () => {
      changes += 1
    })

    try {
      // A fresh directory watch can replay recent activity, so the filter is measured from a settled baseline.
      await new Promise((resolve) => setTimeout(resolve, 150))
      changes = 0

      // Writing a sibling is not a change to the watched document, even though the directory is what is observed.
      await writeFile(join(directory, 'other.yaml'), yaml)
      await new Promise((resolve) => setTimeout(resolve, 150))
      expect(changes).toBe(0)

      // A save that replaces the file would leave a watch bound to the original inode silent from here on.
      await writeFile(replacement, yaml.replace('CLI smoke', 'Renamed into place'))
      await rename(replacement, document)
      expect(await arrives(() => changes > 0)).toBe(true)
    } finally {
      watcher.close()
      await rm(directory, { force: true, recursive: true })
    }
  })
})

describe('renderer CLI preview server', () => {
  const served = ['render', 'model.yaml', '--serve', '--port', '0']

  /** Start a preview session and wait for the address it reports, which is how an ephemeral port becomes knowable. */
  const preview = async (files: Readonly<Record<string, string>> = { 'model.yaml': yaml }) => {
    const run = harness(files)
    const finished = runRendererCli(served, run.io)
    expect(await arrives(() => /http:\/\/[^\s]+/.test(run.output().stderr))).toBe(true)
    const origin = /http:\/\/[^\s/]+/.exec(run.output().stderr)?.[0] ?? ''
    return {
      ...run,
      origin,
      stop: async () => {
        run.interrupt.abort()
        return finished
      }
    }
  }

  it('serves the render a file invocation would have written, and nothing else', async () => {
    const session = await preview()
    const written = harness({ 'model.yaml': yaml })
    await runRendererCli(['render', 'model.yaml', '--output', 'model.svg'], written.io)

    const rendered = await fetch(`${session.origin}/render`)
    expect(rendered.status).toBe(200)
    expect(rendered.headers.get('content-type')).toBe('image/svg+xml')
    expect(await rendered.text()).toBe(written.output().written.get('model.svg'))

    const document = await fetch(`${session.origin}/`)
    expect(document.status).toBe(200)
    expect(await document.text()).toContain('/render?revision=')

    // The preview holds one render in memory and never consults the filesystem, so a pathname reaches nothing.
    for (const pathname of ['/model.yaml', '/index.html', '/../package.json', '/src/index.ts']) {
      expect((await fetch(`${session.origin}${pathname}`)).status).toBe(404)
    }

    expect(await session.stop()).toBe(rendererCliExit.interrupted)
  })

  it('never caches, so a reload cannot show a stale render', async () => {
    const session = await preview()

    for (const pathname of ['/', '/render']) {
      expect((await fetch(`${session.origin}${pathname}`)).headers.get('cache-control')).toBe('no-store')
    }

    await session.stop()
  })

  it('keeps serving the last good render and shows why the document stopped', async () => {
    const session = await preview()
    const good = await (await fetch(`${session.origin}/render`)).text()

    session.watch.change('id: [\n')
    await settle()

    expect(await (await fetch(`${session.origin}/render`)).text()).toBe(good)
    const page = await (await fetch(`${session.origin}/`)).text()
    expect(page).toContain('Malformed YAML')
    // The diagnostic is text, not markup: what it says about the document cannot become part of the page.
    expect(page).toContain('&lt;document&gt;')

    session.watch.change(yaml.replace('CLI smoke', 'Recovered'))
    await settle()
    expect(await (await fetch(`${session.origin}/render`)).text()).toContain('Recovered')

    await session.stop()
  })

  it('pushes a refresh to an open page when the document changes', async () => {
    const session = await preview()
    const events = await fetch(`${session.origin}/events`)
    const reader = events.body?.getReader()
    expect(reader).toBeDefined()

    const message = (async () => {
      const decoder = new TextDecoder()
      let received = ''
      while (!received.includes('data:')) {
        const chunk = await reader?.read()
        if (!chunk || chunk.done) break
        received += decoder.decode(chunk.value)
      }
      return received
    })()

    session.watch.change(yaml.replace('CLI smoke', 'Pushed'))
    await settle()
    expect(await message).toContain('data:')

    await reader?.cancel()
    await session.stop()
  })

  it('refuses an occupied port instead of quietly choosing another', async () => {
    const taken = await startPreviewServer({ contentType: 'image/svg+xml', host: '127.0.0.1', port: 0, state: {} })
    const run = harness({ 'model.yaml': yaml })

    const code = await runRendererCli(['render', 'model.yaml', '--serve', '--port', String(taken.port)], run.io)

    expect(code).toBe(rendererCliExit.network)
    expect(run.output().stderr).toContain(String(taken.port))
    expect(run.output().stdout).toBe('')
    await taken.close()
  })

  it('binds loopback only unless another interface is named', async () => {
    const session = await preview()
    const external = Object.values(networkInterfaces())
      .flatMap((entries) => entries ?? [])
      .find((entry) => entry.family === 'IPv4' && !entry.internal)

    if (external) {
      const port = Number(new URL(session.origin).port)
      await expect(fetch(`http://${external.address}:${port}/render`)).rejects.toThrow()
    }

    await session.stop()
  })

  it('releases the socket on shutdown', async () => {
    const session = await preview()
    expect((await fetch(`${session.origin}/render`)).status).toBe(200)

    expect(await session.stop()).toBe(rendererCliExit.interrupted)
    await expect(fetch(`${session.origin}/render`)).rejects.toThrow()
  })

  it('rejects preview options that have no preview, and a stream it cannot watch', async () => {
    const run = harness({ 'model.yaml': yaml })
    expect(await runRendererCli(['render', 'model.yaml', '--port', '8080'], run.io)).toBe(rendererCliExit.usage)
    expect(run.output().stderr).toContain('--serve')

    const piped = harness({ '-': yaml })
    expect(await runRendererCli(['render', '-', '--serve'], piped.io)).toBe(rendererCliExit.usage)
    expect(piped.output().stderr).toContain('standard input')
  })
})
