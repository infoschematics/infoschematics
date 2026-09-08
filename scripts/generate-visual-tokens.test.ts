import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'

import { cornerRadius, visualTokens } from '../packages/view-model/src/tokens.ts'
import { generateVisualTokenCss, generateVisualTokens, visualTokenEntries } from './generate-visual-tokens.ts'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })))
})

const temporaryOutput = async () => {
  const directory = await mkdtemp(join(tmpdir(), 'infoschematics-visual-tokens-'))
  temporaryDirectories.push(directory)
  return pathToFileURL(join(directory, 'tokens.css'))
}

describe('visual token generation', () => {
  it('emits identical TypeScript values as stable, sorted CSS names', () => {
    const entries = visualTokenEntries()
    const names = entries.map((entry) => entry.cssName)

    expect(names).toEqual([...names].sort())
    expect(entries).toContainEqual({
      cssName: '--infoschematic-canvas-geometry-corner-radius',
      path: 'canvas.geometry.cornerRadius',
      value: cornerRadius
    })
    expect(generateVisualTokenCss()).toContain(
      `--infoschematic-canvas-selection-pointed: ${visualTokens.canvas.selection.pointed};`
    )
  })

  it('rejects distinct semantic paths that collide after CSS normalisation', () => {
    expect(() =>
      visualTokenEntries({
        canvas: {
          focusRing: '#ffffff',
          'focus-ring': '#000000'
        }
      })
    ).toThrowError(
      'Visual token CSS name collision for --infoschematic-canvas-focus-ring: canvas.focusRing, canvas.focus-ring'
    )
  })

  it('writes deterministic output and fails check mode when that output is stale', async () => {
    const output = await temporaryOutput()

    await generateVisualTokens({ output })
    const generated = await readFile(output, 'utf8')
    expect(generated).toBe(generateVisualTokenCss())
    await expect(generateVisualTokens({ check: true, output })).resolves.toBeUndefined()

    await writeFile(output, `${generated}/* hand edited */\n`)
    await expect(generateVisualTokens({ check: true, output })).rejects.toThrowError(
      'Generated visual tokens are stale'
    )
  })
})
