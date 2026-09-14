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
  const written = new Map<string, string>()
  const io: RendererCliIo = {
    readFile: async (pathname) => {
      const value = files[pathname]
      if (value === undefined) throw new Error('missing')
      return value
    },
    readStdin: async () => files['-'] ?? '',
    writeFile: async (pathname, contents) => {
      written.set(pathname, contents)
    },
    writeStderr: (contents) => {
      stderr += contents
    },
    writeStdout: (contents) => {
      stdout += contents
    }
  }
  return { io, output: () => ({ stderr, stdout, written }) }
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
})
