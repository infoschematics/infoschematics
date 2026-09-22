/**
 * Studio's own chrome, in both colour schemes.
 *
 * `ColourScheme.browser.test.tsx` proves the roles resolve and the switch behaves, but it does so against the Canvas
 * stylesheet. What a reader looks at is Studio, which loads its own — and a role only reaches them if that stylesheet
 * actually resolves it rather than shadowing it with something of its own. That is the gap `App.treatments.browser`
 * exists for on the drawing side, and it is the same gap here.
 *
 * So these cases assert painted colour on real Studio elements, not resolved custom properties: a variable that
 * resolves and is never painted from satisfies a property map and leaves the surface exactly as dark as it was.
 */
import { defineInfoschematic } from '@infoschematics/domain-core'
import { chromeFor } from '@infoschematics/view-model/tokens'
import { afterEach, expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { Studio } from './App.tsx'
import '../styles.css'

const config = defineInfoschematic({
  title: 'Studio schemes',
  infoschematic: {
    cards: [
      {
        code: 'CARD-A',
        detail: 'Source card',
        id: 'card-a',
        label: 'Card A',
        placement: { box: { height: 120, width: 200, x: 80, y: 120 } },
        scope: 'scope',
        scopes: ['scope']
      }
    ],
    scopes: [{ color: '#2463eb', description: 'Cards', fill: '#dbeafe', id: 'scope', label: 'Scope', prefix: 'CARD' }],
    viewBox: { height: 320, width: 640, x: 0, y: 0 }
  }
})

/**
 * A token as the browser writes it back.
 *
 * Several chrome roles carry alpha — hairlines are an ink at low opacity rather than a solid grey — so a hand-built
 * `rgb()` would be asserting this file's colour arithmetic and its rounding rather than the value Studio painted.
 * The browser is asked to parse the token instead, which is the same thing it did to the stylesheet.
 */
const rgb = (token: string) => {
  const probe = document.createElement('span')
  probe.style.color = token
  document.body.append(probe)
  const painted = getComputedStyle(probe).color
  probe.remove()
  return painted
}

const studio = async () => {
  window.localStorage.clear()
  const { container } = await render(<Studio config={config} />)
  const bar = container.querySelector('.title-bar')
  if (!bar) throw new Error('Studio rendered no title bar')
  return { bar, container }
}

afterEach(async () => {
  document.documentElement.removeAttribute('data-infoschematic-scheme')
  window.localStorage.clear()
  await commands.emulateColourScheme('no-preference')
})

test("paints Studio's own chrome from the scheme, not from colours of its own", async () => {
  await commands.emulateColourScheme('light')
  const { bar } = await studio()

  expect(getComputedStyle(bar).borderBottomColor).toBe(rgb(chromeFor('light').border))
  expect(getComputedStyle(document.documentElement).backgroundColor).toBe(rgb(chromeFor('light').page))

  await commands.emulateColourScheme('dark')
  expect(getComputedStyle(bar).borderBottomColor).toBe(rgb(chromeFor('dark').border))
  expect(getComputedStyle(document.documentElement).backgroundColor).toBe(rgb(chromeFor('dark').page))
})

test('carries the switch in the tool bank a reader already looks at', async () => {
  await commands.emulateColourScheme('light')
  const { bar } = await studio()

  const appearance = bar.querySelector('fieldset[aria-label="Appearance"]')
  if (!appearance) throw new Error('The title bar has no Appearance bank')

  const button = appearance.querySelector('button.colour-scheme-button')
  if (!button) throw new Error('The Appearance bank holds no scheme switch')
  expect(button.getAttribute('aria-label')).toBe('Switch to the dark colour scheme')
  expect(button.getAttribute('aria-pressed')).toBe('false')

  /* It has to be reachable, not merely mounted — the title bar collapses controls at narrow widths. */
  expect((button as HTMLElement).offsetParent).not.toBeNull()
})

test('repaints the whole surface when the switch is used, and remembers the choice', async () => {
  await commands.emulateColourScheme('light')
  const { bar } = await studio()
  const button = bar.querySelector<HTMLButtonElement>('button.colour-scheme-button')
  if (!button) throw new Error('The title bar holds no scheme switch')

  button.click()
  await expect.poll(() => getComputedStyle(bar).borderBottomColor).toBe(rgb(chromeFor('dark').border))
  expect(getComputedStyle(document.documentElement).backgroundColor).toBe(rgb(chromeFor('dark').page))
  expect(window.localStorage.getItem('infoschematics.colour-scheme')).toBe('dark')

  /* The reader asked for dark on a machine set to light, which is the only case a stylesheet alone cannot serve. */
  expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(false)
})

test('reads emphatic type against the selected wash rather than over it', async () => {
  await commands.emulateColourScheme('light')
  const { bar } = await studio()
  const button = bar.querySelector<HTMLButtonElement>('button.colour-scheme-button')
  if (!button) throw new Error('The title bar holds no scheme switch')

  button.click()
  await expect.poll(() => button.getAttribute('aria-pressed')).toBe('true')

  /*
   * A pressed control fills with the selected wash, which is pale in light and deep in dark. Its type was `white`
   * in both, which is legible over one and invisible over the other — the failure a scheme nobody could select also
   * hid. The assertion is that the two move together: emphatic ink against the wash it sits on.
   */
  document.documentElement.setAttribute('data-infoschematic-scheme', 'light')
  expect(getComputedStyle(button).color).toBe(rgb(chromeFor('light').textStrong))
  document.documentElement.setAttribute('data-infoschematic-scheme', 'dark')
  expect(getComputedStyle(button).color).toBe(rgb(chromeFor('dark').textStrong))
})
