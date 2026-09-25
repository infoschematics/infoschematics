import { describe, expect, it } from 'vitest'
import { colourIsPinned, parseAuthoredColour, resolveAuthoredColour, seedResolver } from './colour.ts'

const lightness = (hex: string) => parseAuthoredColour(hex)?.lightness ?? Number.NaN
const hue = (hex: string) => parseAuthoredColour(hex)?.hue ?? Number.NaN

describe('authored colours as seeds', () => {
  it('keeps the hue an author chose and moves only the band its lightness sits in', () => {
    const authored = '#6c8ebf'
    const onPaper = resolveAuthoredColour(authored, 'light', 'ink')
    const onNavy = resolveAuthoredColour(authored, 'dark', 'ink')

    expect(onPaper).not.toBe(authored)
    expect(onNavy).not.toBe(onPaper)
    // Within a degree: a hue survives the round trip through eight bits per channel, not exactly.
    for (const realised of [onPaper, onNavy]) expect(Math.abs(hue(realised) - hue(authored))).toBeLessThan(1.5)
    // Ink has to carry against its ground, so it sits away from it in opposite directions.
    expect(lightness(onPaper)).toBeLessThan(lightness(onNavy))
  })

  it('keeps the ordering between two colours the author chose to differ', () => {
    const [paler, darker] = ['#9ec5e8', '#1f3b57']
    for (const mode of ['dark', 'light'] as const) {
      expect(lightness(resolveAuthoredColour(paler, mode, 'ink')), mode).toBeGreaterThan(
        lightness(resolveAuthoredColour(darker, mode, 'ink'))
      )
    }
  })

  it('lets a ground through and leaves a body opaque, from the same band', () => {
    const ground = resolveAuthoredColour('#c1d2e3', 'light', 'ground')
    const body = resolveAuthoredColour('#c1d2e3', 'light', 'fill')

    expect(ground.startsWith(body)).toBe(true)
    expect(ground).toHaveLength(9)
    expect(body).toHaveLength(7)
  })

  it('leaves an author who set their own alpha alone', () => {
    expect(resolveAuthoredColour('#c1d2e380', 'light', 'ground')).toMatch(/80$/)
  })

  it('gives a pinned colour back exactly as written, minus its mark', () => {
    expect(resolveAuthoredColour('#a12345!', 'light', 'ink')).toBe('#a12345')
    expect(resolveAuthoredColour('#a12345!', 'dark', 'ground')).toBe('#a12345')
    expect(colourIsPinned('#a12345!')).toBe(true)
    expect(colourIsPinned('#a12345')).toBe(false)
  })

  it('refuses to interpret a value it cannot read rather than guessing at one', () => {
    for (const value of ['currentColor', 'transparent', 'url(#gradient)', 'rebeccapurple']) {
      expect(resolveAuthoredColour(value, 'dark', 'fill'), value).toBe(value)
    }
    // The mark still means what it says on a value this module does not otherwise touch.
    expect(resolveAuthoredColour('rebeccapurple!', 'dark', 'fill')).toBe('rebeccapurple')
  })

  it('reads the short and long hex forms an author may write', () => {
    expect(resolveAuthoredColour('#abc', 'light', 'ink')).toBe(resolveAuthoredColour('#aabbcc', 'light', 'ink'))
    expect(parseAuthoredColour('#aabbcc80')?.alpha).toBeCloseTo(0.502, 2)
    expect(parseAuthoredColour('#not-a-colour')).toBeUndefined()
  })
})

describe('seedResolver', () => {
  it('writes the colour it came to on a ground that was resolved, and declares nothing', () => {
    const seeds = seedResolver('dark')

    expect(seeds.resolve('#a12345', 'ink')).toBe(resolveAuthoredColour('#a12345', 'dark', 'ink'))
    expect(seeds.declarations()).toEqual([])
  })

  it('defers a seed into a custom property when it has both grounds to answer for', () => {
    const seeds = seedResolver('system')
    const reference = seeds.resolve('#a12345', 'ink')

    expect(reference).toBe('var(--infoschematic-seed-1)')
    expect(seeds.declarations()).toEqual([
      [
        '--infoschematic-seed-1',
        resolveAuthoredColour('#a12345', 'light', 'ink'),
        resolveAuthoredColour('#a12345', 'dark', 'ink')
      ]
    ])
  })

  it('pools seeds by what they resolve to, so four Flow families sharing a colour declare one property', () => {
    const seeds = seedResolver('system')
    const references = ['#a12345', '#a12345', '#123456', '#a12345'].map((value) => seeds.resolve(value, 'ink'))

    expect(references).toEqual([
      'var(--infoschematic-seed-1)',
      'var(--infoschematic-seed-1)',
      'var(--infoschematic-seed-2)',
      'var(--infoschematic-seed-1)'
    ])
    expect(seeds.declarations()).toHaveLength(2)
  })

  it('writes a pinned colour rather than deferring it, because both grounds answer the same', () => {
    const seeds = seedResolver('system')

    expect(seeds.resolve('#a12345!', 'ink')).toBe('#a12345')
    expect(seeds.resolve('currentColor', 'ink')).toBe('currentColor')
    expect(seeds.declarations()).toEqual([])
  })
})
