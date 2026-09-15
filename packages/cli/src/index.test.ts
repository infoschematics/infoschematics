import { describe, expect, it } from 'vitest'
import { type RendererCliIo, rendererCliExit, runRendererCli } from './index.ts'

const yaml = `id: CLI
title: CLI smoke
diagram:
  bounds: 0 0 100 100
  gridSize: 10
`
const json = JSON.stringify({ id: 'CLI', title: 'CLI smoke', diagram: { bounds: '0 0 100 100', gridSize: 10 } })

const harness = (files: Readonly<Record<string, string>> = {}) => {
  let stdout = ''
  let stderr = ''
  const bytes: Uint8Array[] = []
  const written = new Map<string, string | Uint8Array>()
  const io: RendererCliIo = {
    readFile: async (pathname) => {
      const value = files[pathname]
      if (value === undefined) throw new Error('missing')
      return value
    },
    readBytes: async (pathname) => {
      const value = files[pathname]
      if (value === undefined) throw new Error('missing')
      return new TextEncoder().encode(value)
    },
    readStdin: async () => files['-'] ?? '',
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
  return { io, output: () => ({ bytes, stderr, stdout, written }) }
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

describe('renderer CLI raster output', () => {
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
