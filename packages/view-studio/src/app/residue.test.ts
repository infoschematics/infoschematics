import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const sourceRoot = fileURLToPath(new URL('..', import.meta.url))

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) return sourceFiles(path)
      return /\.(css|ts|tsx)$/.test(entry.name) && !entry.name.includes('.test.') ? [path] : []
    }),
  )
  return nested.flat()
}

describe('reusable Studio source', () => {
  it('contains no renderer or narrative residue from the first realisation', async () => {
    const banned = [
      ['internet', 'cloud'].join('-'),
      ['satcom', 'block'].join('-'),
      ['mobile', 'cloud'].join('-'),
      ['telemetry', 'plane'].join('-'),
      ['FAB', '03'].join('-'),
      ['lane', 'media', 'streaming'].join('-'),
      ['lane', 'supply', 'demand', 'control'].join('-'),
      ['Transmission', 'Management'].join(' '),
      ['HLS/DASH', 'Content', 'Steering'].join(' '),
      ['Exposure', 'Gateway'].join(' '),
      ['5G', 'EMERGE'].join('-'),
    ]
    const findings: string[] = []

    for (const path of await sourceFiles(sourceRoot)) {
      const content = await readFile(path, 'utf8')
      for (const phrase of banned) {
        if (content.includes(phrase)) findings.push(`${path.slice(sourceRoot.length + 1)}: ${phrase}`)
      }
    }

    expect(findings).toEqual([])
  })
})
