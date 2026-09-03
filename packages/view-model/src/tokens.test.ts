import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'

import {
  generateVisualTokenCss,
  generateVisualTokens,
  visualTokenEntries,
} from '../../../scripts/generate-visual-tokens.ts'
import { cornerRadius, visualTokens } from './tokens.ts'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

const temporaryOutput = async () => {
  const directory = await mkdtemp(
    join(tmpdir(), 'infoschematics-visual-tokens-'),
  )
  temporaryDirectories.push(directory)
  return pathToFileURL(join(directory, 'tokens.css'))
}

describe('visual tokens', () => {
  it('keeps semantic names, representative values and the scalar compatibility export', () => {
    expect(visualTokens.canvas.geometry.gridSize).toBe(10)
    expect(visualTokens.canvas.geometry.gridMinorStrokeWidth).toBe(0.5)
    expect(visualTokens.canvas.geometry.gridMajorStrokeWidth).toBe(1)
    expect(visualTokens.canvas.surfaces.backdrop).toBe('#081725')
    expect(visualTokens.canvas.surfaces.regionDash).toBe('8 6')
    expect(visualTokens.canvas.surfaces.regionDot).toBe('1.5 5')
    expect(visualTokens.canvas.flows.routeWidth).toBe(4)
    expect(visualTokens.canvas.flows.lineCap).toBe('round')
    expect(visualTokens.canvas.flows.lineJoin).toBe('round')
    expect(visualTokens.canvas.focus.dimmedOpacity).toBe(0.14)
    expect(visualTokens.canvas.selection.selected).toBe('#82b366')
    expect(visualTokens.canvas.output.fontFamily).toBe('system-ui, sans-serif')
    expect(visualTokens.canvas.output.cardText).toBe('#18212a')
    expect(visualTokens.canvas.output.componentFontSize).toBe(13)
    expect(visualTokens.canvas.output.metadataFontSize).toBe(12)
    expect(visualTokens.canvas.output.unfocusedOpacity).toBe(0.2)
    expect(cornerRadius).toBe(visualTokens.canvas.geometry.cornerRadius)
  })

  it('emits identical TypeScript values as stable, sorted CSS names', () => {
    const entries = visualTokenEntries()
    const names = entries.map((entry) => entry.cssName)

    expect(names).toEqual([...names].sort())
    expect(entries).toContainEqual({
      cssName: '--infoschematic-canvas-geometry-corner-radius',
      path: 'canvas.geometry.cornerRadius',
      value: cornerRadius,
    })
    expect(generateVisualTokenCss()).toContain(
      `--infoschematic-canvas-selection-pointed: ${visualTokens.canvas.selection.pointed};`,
    )
  })

  it('rejects distinct semantic paths that collide after CSS normalisation', () => {
    expect(() =>
      visualTokenEntries({
        canvas: {
          focusRing: '#ffffff',
          'focus-ring': '#000000',
        },
      }),
    ).toThrowError(
      'Visual token CSS name collision for --infoschematic-canvas-focus-ring: canvas.focusRing, canvas.focus-ring',
    )
  })

  it('writes deterministic output and fails check mode when that output is stale', async () => {
    const output = await temporaryOutput()

    await generateVisualTokens({ output })
    const generated = await readFile(output, 'utf8')
    expect(generated).toBe(generateVisualTokenCss())
    await expect(
      generateVisualTokens({ check: true, output }),
    ).resolves.toBeUndefined()

    await writeFile(output, `${generated}/* hand edited */\n`)
    await expect(
      generateVisualTokens({ check: true, output }),
    ).rejects.toThrowError('Generated visual tokens are stale')
  })
})
