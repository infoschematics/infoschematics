/**
 * Which colour scheme a surface is in, for the surfaces this repository hosts.
 *
 * The drawing needs none of this. Canvas references a role as a custom property and the browser resolves the
 * reader's preference through the generated stylesheet, so an embedded Diagram follows its page with no script at
 * all — which is what lets a host that has already resolved the scheme say so instead. `ADR-INFOSCHEMATICS-005`
 * keeps that ownership: reading a URL, storing a choice and listening to the operating system are a host's work.
 *
 * What is here is that host work, written once because three of our own surfaces need the same answer. Nothing in a
 * package calls it on its own behalf.
 */
import { useCallback, useEffect, useState } from 'react'

export type ColourScheme = 'dark' | 'light'

/** The attribute the generated stylesheet answers, set on the document element or any ancestor of a drawing. */
export const colourSchemeAttribute = 'data-infoschematic-scheme'

/** Where an explicit choice is remembered. Namespaced, because the page belongs to whoever embedded us. */
export const colourSchemeStorageKey = 'infoschematics.colour-scheme'

const isScheme = (value: unknown): value is ColourScheme => value === 'dark' || value === 'light'

/**
 * What the operating system says, which is the answer whenever the reader has not overridden it.
 *
 * The guard is on `matchMedia` rather than on `window`, because the case that breaks is not the absence of a browser
 * but a half-present one: rendering Studio to static markup gives a `window` with no media queries on it, and a
 * `typeof window` check sails straight past that into a `TypeError` during render. Light is the answer a server has
 * to give anyway — it cannot know the preference, and the stylesheet resolves it properly on the client.
 */
export const preferredColourScheme = (): ColourScheme =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    : 'light'

/** The reader's own choice, if they have made one. Storage can throw, and a refusal is not a choice. */
export const storedColourScheme = (): ColourScheme | undefined => {
  try {
    const stored = globalThis.localStorage?.getItem(colourSchemeStorageKey)
    return isScheme(stored) ? stored : undefined
  } catch {
    return undefined
  }
}

/**
 * An explicit choice, then a stored one, then the operating system.
 *
 * The attribute comes first because a host may have resolved the scheme from something we cannot see — a URL
 * parameter, an account setting — and that answer outranks both our storage and the reader's system preference.
 */
export const resolveColourScheme = (): ColourScheme => {
  if (typeof document !== 'undefined') {
    const declared = document.documentElement.getAttribute(colourSchemeAttribute)
    if (isScheme(declared)) return declared
  }
  return storedColourScheme() ?? preferredColourScheme()
}

/**
 * Write a choice, or withdraw one.
 *
 * Withdrawing removes the attribute rather than setting it to whatever the system currently says, so the page goes
 * back to following the operating system as it changes instead of freezing on the value it had at the time.
 */
export const applyColourScheme = (scheme: ColourScheme | undefined): void => {
  const root = document.documentElement
  if (scheme === undefined) {
    root.removeAttribute(colourSchemeAttribute)
  } else {
    root.setAttribute(colourSchemeAttribute, scheme)
  }

  try {
    if (scheme === undefined) window.localStorage.removeItem(colourSchemeStorageKey)
    else window.localStorage.setItem(colourSchemeStorageKey, scheme)
  } catch {
    /* A page that refuses storage still switches; it just does not remember. */
  }
}

/**
 * The resolved scheme and a way to change it, for a control in a host's own chrome.
 *
 * It keeps following the system while nothing is stored, which is the behaviour a reader expects from a switch they
 * have never touched: the page tracks their machine going dark at dusk until they say otherwise.
 */
export const useColourScheme = (): readonly [ColourScheme, (scheme: ColourScheme | undefined) => void] => {
  const [scheme, setScheme] = useState<ColourScheme>(resolveColourScheme)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const follow = () => {
      if (storedColourScheme() === undefined) setScheme(preferredColourScheme())
    }
    query.addEventListener('change', follow)
    return () => query.removeEventListener('change', follow)
  }, [])

  /* The attribute is reapplied on mount because a pre-paint step may have set it before React existed. */
  useEffect(() => {
    if (storedColourScheme() !== undefined) applyColourScheme(scheme)
  }, [scheme])

  const choose = useCallback((next: ColourScheme | undefined) => {
    applyColourScheme(next)
    setScheme(next ?? preferredColourScheme())
  }, [])

  return [scheme, choose]
}

/** The scheme a switch moves to, which is what its accessible name has to say. */
export const otherColourScheme = (scheme: ColourScheme): ColourScheme => (scheme === 'dark' ? 'light' : 'dark')
