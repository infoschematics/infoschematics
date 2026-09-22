/**
 * Resolving a scheme where there is no browser to ask.
 *
 * Studio and Present are both rendered to static markup — by their own suites, and by any host that pre-renders a
 * page — and that environment is not "no browser" but half of one: a `window` exists, `matchMedia` does not, and a
 * `typeof window` guard walks straight past the difference into a `TypeError` thrown during render. It took the
 * whole Studio surface down rather than degrading, which is the wrong failure for a colour preference to have.
 *
 * Light is the only answer a render without a reader can give, and the stylesheet resolves the real one on arrival.
 */
import { afterEach, expect, test, vi } from 'vitest'
import { preferredColourScheme, resolveColourScheme, storedColourScheme } from './colour-scheme.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

test('answers light where the window has no media queries on it', () => {
  vi.stubGlobal('window', {})

  expect(preferredColourScheme()).toBe('light')
  expect(storedColourScheme()).toBeUndefined()
  expect(resolveColourScheme()).toBe('light')
})

test('answers light where storage is refused rather than absent', () => {
  vi.stubGlobal('window', {
    matchMedia: () => ({ matches: true }),
    localStorage: {
      getItem: () => {
        throw new Error('The user agent denied access to storage')
      }
    }
  })
  vi.stubGlobal('localStorage', {
    getItem: () => {
      throw new Error('The user agent denied access to storage')
    }
  })

  /* A refusal is not a choice, so the operating system's answer stands rather than the refusal becoming one. */
  expect(storedColourScheme()).toBeUndefined()
  expect(preferredColourScheme()).toBe('dark')
})
