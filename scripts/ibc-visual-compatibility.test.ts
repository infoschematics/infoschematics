import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { compareIbcVisualManifests, type IbcVisualManifest } from './ibc-visual-compatibility.ts'

const baseline = JSON.parse(
  await readFile(new URL('./fixtures/ibc-2026-visual-baseline.json', import.meta.url), 'utf8')
) as IbcVisualManifest

const firstState = (manifest: IbcVisualManifest) => {
  const state = manifest.states[0]
  if (!state) throw new Error('Expected at least one visual state.')
  return state
}

describe('IBC visual compatibility evidence', () => {
  it('covers the default and every authored presentation state', () => {
    expect(baseline.states).toHaveLength(39)
    expect(baseline.states.filter(({ key }) => key === 'default')).toHaveLength(1)
    expect(baseline.states.filter(({ key }) => key.startsWith('standalone--'))).toHaveLength(7)
    expect(baseline.states.filter(({ key }) => key.startsWith('theme--'))).toHaveLength(9)
    expect(baseline.states.filter(({ key }) => key.startsWith('story--'))).toHaveLength(22)
    expect(new Set(baseline.states.map(({ key }) => key)).size).toBe(39)
  })

  it('requires semantics and grid topology while tolerating harmless raster differences', () => {
    expect(() => compareIbcVisualManifests(baseline, baseline)).not.toThrow()

    for (const [field, message] of [
      ['semanticSha256', 'semantic projection changed'],
      ['gridSha256', 'grid topology changed']
    ] as const) {
      const changed = structuredClone(baseline)
      firstState(changed)[field] = 'changed'
      expect(() => compareIbcVisualManifests(baseline, changed)).toThrow(message)
    }

    const harmless = structuredClone(baseline)
    firstState(harmless).svgSha256 = 'different SVG serialization'
    firstState(harmless).pixelSha256 = 'different exact pixels'
    expect(() => compareIbcVisualManifests(baseline, harmless)).not.toThrow()

    const visuallyDifferent = structuredClone(baseline)
    const visualState = firstState(visuallyDifferent)
    visualState.visualSample = Buffer.alloc(Buffer.from(visualState.visualSample, 'base64').length, 0).toString(
      'base64'
    )
    expect(() => compareIbcVisualManifests(baseline, visuallyDifferent)).toThrow('perceptual')
  })

  it('records the vocabulary-aligned model projection', () => {
    expect(baseline.modelSha256).toMatch(/^[0-9a-f]{64}$/)
  })
})
