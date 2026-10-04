/**
 * The chrome's scheme, and the control a reader changes it with — both settled by a browser.
 *
 * The chrome roles are declared twice under selectors of equal specificity, so nothing in the source says which
 * declaration a panel is painted from: `(prefers-color-scheme)`, the host attribute and source order decide it
 * together. Reading `tokens.generated.css` would assert the rule we hoped applied rather than the one that did.
 *
 * The control is tested for what a reader can actually reach — three choices named without a noun, a pressed state a
 * glyph cannot carry, the keyboard, and a choice that survives the page being rebuilt around it — rather than for
 * the class it puts on itself.
 */
import { type ChromeRole, chromeFor, chromeVariable } from '@infoschematics/view-model/tokens'
import { afterEach, expect, test } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { ColourSchemeButton } from './ColourSchemeButton.tsx'
import { colourSchemeAttribute, colourSchemeStorageKey, resolveColourScheme } from './colour-scheme.ts'
import './styles.css'

const roles = Object.keys(chromeFor('light')) as ChromeRole[]

/** What the inherited chrome palette resolves each role to, which is the answer an interface is painted from. */
const resolved = (element: Element) => {
  const style = getComputedStyle(element)
  return Object.fromEntries(
    roles.map((role) => [role, style.getPropertyValue(chromeVariable(role).slice(4, -1)).trim()])
  )
}

const expected = (scheme: 'dark' | 'light') => Object.fromEntries(roles.map((role) => [role, chromeFor(scheme)[role]]))

afterEach(async () => {
  document.documentElement.removeAttribute(colourSchemeAttribute)
  window.localStorage.removeItem(colourSchemeStorageKey)
  await commands.emulateColourScheme('no-preference')
})

test('paints the chrome in the scheme the reader prefers, with every role answered in both', async () => {
  await commands.emulateColourScheme('light')
  const { container } = await render(<ColourSchemeButton />)
  expect(resolved(container)).toEqual(expected('light'))

  await commands.emulateColourScheme('dark')
  expect(resolved(container)).toEqual(expected('dark'))

  /* The two palettes have to differ somewhere, or a single palette declared twice would satisfy both assertions. */
  expect(chromeFor('light').page).not.toBe(chromeFor('dark').page)
})

test('lets a host that resolved the scheme itself override the reader preference', async () => {
  await commands.emulateColourScheme('dark')
  const { container } = await render(<ColourSchemeButton />)

  document.documentElement.setAttribute(colourSchemeAttribute, 'light')
  expect(resolved(container)).toEqual(expected('light'))
  document.documentElement.setAttribute(colourSchemeAttribute, 'dark')
  expect(resolved(container)).toEqual(expected('dark'))
})

test('offers light, dark and system, named without a noun, with the one in force pressed', async () => {
  await commands.emulateColourScheme('light')
  const { getByRole } = await render(<ColourSchemeButton />)

  await expect.element(getByRole('group', { name: 'Colour scheme' })).toBeVisible()
  const [light, dark, system] = ['Light', 'Dark', 'System'].map((name) => getByRole('button', { name, exact: true }))
  if (!light || !dark || !system) throw new Error('the control offers fewer than three choices')

  /* Nothing chosen is following the machine, so that is what the control says it is doing. */
  await expect.element(system).toHaveAttribute('aria-pressed', 'true')
  await expect.element(dark).toHaveAttribute('aria-pressed', 'false')

  await dark.click()
  await expect.element(dark).toHaveAttribute('aria-pressed', 'true')
  await expect.element(system).toHaveAttribute('aria-pressed', 'false')
  expect(document.documentElement.getAttribute(colourSchemeAttribute)).toBe('dark')

  await light.click()
  await expect.element(light).toHaveAttribute('aria-pressed', 'true')
  expect(document.documentElement.getAttribute(colourSchemeAttribute)).toBe('light')
})

test('is operable from the keyboard alone', async () => {
  await commands.emulateColourScheme('light')
  const { getByRole } = await render(<ColourSchemeButton />)
  const dark = getByRole('button', { name: 'Dark', exact: true })

  const element = dark.element() as HTMLButtonElement
  element.focus()
  expect(document.activeElement).toBe(element)

  /* A native button is the reason this works; asserting it stops a later `div` with a click handler passing. */
  expect(element.tagName).toBe('BUTTON')
  await userEvent.keyboard('{Enter}')
  expect(document.documentElement.getAttribute(colourSchemeAttribute)).toBe('dark')
  await expect.element(dark).toHaveAttribute('aria-pressed', 'true')
})

/*
 * System is a choice a reader can return to, not only the state before they touched anything.
 *
 * A toggle could only ever store a ground, so a reader who pressed it once was frozen on that ground for good — their
 * machine going dark at dusk no longer reached the page. Pressing system withdraws the ground and follows the machine
 * again, live, and is remembered as itself so a document's own default does not take over from it.
 */
test('returns to following the machine when system is pressed, and keeps following it', async () => {
  await commands.emulateColourScheme('light')
  const { getByRole } = await render(<ColourSchemeButton />)

  await getByRole('button', { name: 'Dark', exact: true }).click()
  expect(resolveColourScheme()).toBe('dark')

  await getByRole('button', { name: 'System', exact: true }).click()
  expect(document.documentElement.hasAttribute(colourSchemeAttribute)).toBe(false)
  expect(window.localStorage.getItem(colourSchemeStorageKey)).toBe('system')
  expect(resolveColourScheme()).toBe('light')

  await commands.emulateColourScheme('dark')
  expect(resolveColourScheme()).toBe('dark')
  await expect.element(getByRole('button', { name: 'System', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('remembers a choice across a reload, and follows the system again once withdrawn', async () => {
  await commands.emulateColourScheme('light')
  const first = await render(<ColourSchemeButton />)
  await first.getByRole('button', { name: 'Dark', exact: true }).click()
  expect(window.localStorage.getItem(colourSchemeStorageKey)).toBe('dark')

  /* What a reload actually restores: the attribute is the page's, so drop it and let the stored choice speak. */
  document.documentElement.removeAttribute(colourSchemeAttribute)
  expect(resolveColourScheme()).toBe('dark')

  first.unmount()
  const again = await render(<ColourSchemeButton />)
  await expect.element(again.getByRole('button', { name: 'Dark', exact: true })).toHaveAttribute('aria-pressed', 'true')
  expect(document.documentElement.getAttribute(colourSchemeAttribute)).toBe('dark')

  window.localStorage.removeItem(colourSchemeStorageKey)
  document.documentElement.removeAttribute(colourSchemeAttribute)
  expect(resolveColourScheme()).toBe('light')
})
