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
import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type ColourScheme = 'dark' | 'light'

/**
 * What a reader can pick: a ground, or `system`, which is declining to pick one and following the machine.
 *
 * `system` never reaches a palette. It is the absence of a choice given a name a reader can press, so it resolves to
 * whatever the machine says — and, for a document that authored its own mode, it is the reader saying "my machine"
 * rather than "whatever the document wanted", which is why it is remembered rather than only implied by silence.
 */
export type ColourSchemeChoice = ColourScheme | 'system'

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

const isChoice = (value: unknown): value is ColourSchemeChoice => isScheme(value) || value === 'system'

/** The reader's own choice, if they have made one. Storage can throw, and a refusal is not a choice. */
const storedChoice = (): ColourSchemeChoice | undefined => {
  try {
    const stored = globalThis.localStorage?.getItem(colourSchemeStorageKey)
    return isChoice(stored) ? stored : undefined
  } catch {
    return undefined
  }
}

/** The ground a reader stored, if they stored one rather than `system` or nothing. */
export const storedColourScheme = (): ColourScheme | undefined => {
  const stored = storedChoice()
  return isScheme(stored) ? stored : undefined
}

/**
 * Whatever has been asked of the page, if anything has: a host's attribute first, then the reader's stored choice.
 *
 * `undefined` is nobody having asked, which is different from a reader pressing `system`: a document that authored a
 * mode answers the first and not the second.
 */
const requestedChoice = (): ColourSchemeChoice | undefined => {
  if (typeof document !== 'undefined') {
    const declared = document.documentElement.getAttribute(colourSchemeAttribute)
    if (isScheme(declared)) return declared
  }
  return storedChoice()
}

/**
 * An explicit choice, then a stored one, then the operating system.
 *
 * The attribute comes first because a host may have resolved the scheme from something we cannot see — a URL
 * parameter, an account setting — and that answer outranks both our storage and the reader's system preference.
 */
export const resolveColourScheme = (): ColourScheme => {
  const requested = requestedChoice()
  return isScheme(requested) ? requested : preferredColourScheme()
}

/* Every hook on the page reads one answer. A switch in a title bar and the drawing beneath it used to keep a copy each,
   so pressing the switch repainted the chrome and left the drawing's authored colours realised for the old ground. */
const listeners = new Set<() => void>()
const notify = () => {
  for (const listener of listeners) listener()
}

/**
 * Write a choice, or withdraw one.
 *
 * Withdrawing removes the attribute rather than setting it to whatever the system currently says, so the page goes
 * back to following the operating system as it changes instead of freezing on the value it had at the time. `system`
 * withdraws the same way and is remembered as itself, because a reader who pressed it has answered and a reader who
 * never touched the control has not; `undefined` forgets the choice altogether.
 */
export const applyColourScheme = (choice: ColourSchemeChoice | undefined): void => {
  const root = document.documentElement
  if (isScheme(choice)) root.setAttribute(colourSchemeAttribute, choice)
  else root.removeAttribute(colourSchemeAttribute)

  try {
    if (choice === undefined) window.localStorage.removeItem(colourSchemeStorageKey)
    else window.localStorage.setItem(colourSchemeStorageKey, choice)
  } catch {
    /* A page that refuses storage still switches; it just does not remember. */
  }
  notify()
}

/* The machine, the host's attribute and another tab's storage can each change the answer without this module. */
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  const query = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : undefined
  query?.addEventListener('change', listener)
  const observer = typeof MutationObserver === 'function' ? new MutationObserver(listener) : undefined
  observer?.observe(document.documentElement, { attributeFilter: [colourSchemeAttribute], attributes: true })
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    query?.removeEventListener('change', listener)
    observer?.disconnect()
    window.removeEventListener('storage', listener)
  }
}

/* A string, so React compares two reads by value and a page that did not change does not render again. */
const snapshot = () => `${requestedChoice() ?? 'unasked'} ${preferredColourScheme()}`
const serverSnapshot = () => 'unasked light'

export type ColourSchemeState = Readonly<{
  /**
   * What has been asked of the page — a ground, or `system` pressed — and `undefined` where nothing has.
   *
   * The distinction is for a document that authored its own mode: silence lets the document's default stand, while a
   * reader who pressed `system` has said they want their machine's ground and not the document's.
   */
  asked: ColourSchemeChoice | undefined
  /** What a control shows as picked: the choice made, and `system` where none was. */
  choice: ColourSchemeChoice
  /** Pick a ground or `system`; `undefined` forgets the choice and leaves the page as if never asked. */
  choose: (choice: ColourSchemeChoice | undefined) => void
  /** What the operating system prefers, whatever was chosen. */
  preferred: ColourScheme
  /** The ground the page is on. */
  scheme: ColourScheme
}>

/**
 * The resolved scheme and a way to change it, for a control in a host's own chrome and for a drawing beneath it.
 *
 * It keeps following the system while nothing is stored, which is the behaviour a reader expects from a switch they
 * have never touched: the page tracks their machine going dark at dusk until they say otherwise.
 */
export const useColourScheme = (): ColourSchemeState => {
  const [read, preferred] = useSyncExternalStore(subscribe, snapshot, serverSnapshot).split(' ') as [
    ColourSchemeChoice | 'unasked',
    ColourScheme
  ]

  /* The attribute is restored on mount because a pre-paint step may not have run, and a stored ground is a choice. */
  useEffect(() => {
    const stored = storedColourScheme()
    if (stored !== undefined && document.documentElement.getAttribute(colourSchemeAttribute) === null) {
      applyColourScheme(stored)
    }
  }, [])

  const choose = useCallback((next: ColourSchemeChoice | undefined) => applyColourScheme(next), [])
  const asked = read === 'unasked' ? undefined : read

  return { asked, choice: asked ?? 'system', choose, preferred, scheme: isScheme(asked) ? asked : preferred }
}
