/**
 * The public outlet's colour scheme, and the control that changes it.
 *
 * The website is the surface most readers of this product ever see, and it is the one that had no way to express a
 * preference: every other package's chrome is reached through a Studio or a Present shell that a host mounts, while
 * this one is the host. It is also the only surface whose stylesheet is assembled from an application's own file
 * plus the Canvas one, so the roles reaching it at all is a claim about an import chain rather than about a palette.
 *
 * The palette's values are asserted in `packages/view-canvas/src/ColourScheme.browser.test.tsx`, against the
 * manifest. Site consumes the published packages and does not reach into the view model — `.dependency-cruiser.ts`
 * enforces that — so what is asserted here is what the site can legitimately observe: that the roles resolve, that
 * they resolve differently under each scheme, and that the switch overrides the machine.
 */
import { afterEach, expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { SiteNav } from './SiteNav.tsx'
import './styles.css'

/** What the page resolved a chrome role to, which is the colour the site is actually painted from. */
const role = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(`--infoschematic-chrome-paint-${name}`).trim()

afterEach(async () => {
  document.documentElement.removeAttribute('data-infoschematic-scheme')
  window.localStorage.clear()
  await commands.emulateColourScheme('no-preference')
})

test('offers the switch in the header every reader of the public site sees', async () => {
  await commands.emulateColourScheme('light')
  const { container, getByRole } = await render(<SiteNav />)

  const header = container.querySelector('.site-nav')
  if (!header) throw new Error('The site rendered no header')

  const button = getByRole('button', { name: 'Switch to the dark colour scheme' })
  await expect.element(button).toHaveAttribute('aria-pressed', 'false')
  expect(header.contains(button.element())).toBe(true)

  /* The site has no icon dependency of its own, so the mark has to arrive with the control. */
  expect(button.element().querySelector('svg')).not.toBeNull()
})

test('reaches the chrome roles at all, and resolves them differently in each scheme', async () => {
  await commands.emulateColourScheme('light')
  const { container } = await render(<SiteNav />)
  const header = container.querySelector('.site-nav')
  if (!header) throw new Error('The site rendered no header')

  /* Site imports no stylesheet from the view model; the roles arrive through the Canvas one. A missing import shows
     up here as an empty string rather than as a wrong colour, which is why the presence assertion comes first. */
  const names = ['page', 'surface', 'text', 'accent', 'border']
  for (const name of names) expect(role(name), name).not.toBe('')

  const light = Object.fromEntries(names.map((name) => [name, role(name)]))

  /* Resolved is not painted: the page has to be taking the role, not merely declaring it. The probe is asked to
     parse the same token so the comparison is the browser's own, alpha and rounding included. */
  const probe = document.createElement('span')
  probe.style.color = 'var(--infoschematic-chrome-paint-page)'
  document.body.append(probe)
  expect(getComputedStyle(document.documentElement).backgroundColor).toBe(getComputedStyle(probe).color)
  probe.remove()

  await commands.emulateColourScheme('dark')
  for (const name of names) expect(role(name), name).not.toBe(light[name])
})

test('takes the reader at their word over the machine they are on', async () => {
  await commands.emulateColourScheme('light')
  const { getByRole } = await render(<SiteNav />)
  const light = role('page')

  await getByRole('button').click()
  await expect.poll(() => role('page')).not.toBe(light)

  /* The whole point of the control: the machine still says light, and the page is dark because the reader said so. */
  expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(false)
  expect(window.localStorage.getItem('infoschematics.colour-scheme')).toBe('dark')
  expect(document.documentElement.getAttribute('data-infoschematic-scheme')).toBe('dark')
})
