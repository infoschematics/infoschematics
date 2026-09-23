import { describe, expect, it } from 'vitest'
import { type Capture, captureFloor, lookFailures } from './look.ts'

/**
 * What the look command refuses to call evidence.
 *
 * The whole value of a committed look is that it fails where a throwaway script quietly succeeded: a probe that
 * clicked nothing still exits 0, and a page that threw on mount still screenshots. These are the cases that would
 * otherwise be reported as a clean look, so they are the cases worth holding in a test rather than in the run.
 */

const capture = (name: string, bytes: number): Capture => ({ bytes, name })

describe('a look that is not evidence', () => {
  it('fails when nothing was captured', () => {
    expect(lookFailures([], [])).toEqual(['captured nothing, so there is no evidence of anything'])
  })

  it('fails a capture too small to be a rendered page', () => {
    const failures = lookFailures([capture('01-studio', 4_200)], [])
    expect(failures).toHaveLength(1)
    expect(failures[0]).toContain('01-studio.png is 4200 bytes')
    expect(failures[0]).toContain(`${captureFloor}`)
  })

  it('fails on a page or console error even when every capture rendered', () => {
    expect(lookFailures([capture('01-studio', 90_000)], ['page error: x is not a function'])).toEqual([
      'page error: x is not a function'
    ])
  })

  it('passes a run that rendered and reported nothing', () => {
    expect(lookFailures([capture('01-studio', 90_000), capture('02-direct', 120_000)], [])).toEqual([])
  })
})
