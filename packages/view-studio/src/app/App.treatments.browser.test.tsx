/**
 * Canvas treatments, asserted on the Studio surface.
 *
 * Every other browser suite that checks a diagram treatment mounts a Canvas fixture and imports the Canvas stylesheet,
 * so a treatment written there always passes. What a reader looks at is Studio, which loads its own stylesheet — and a
 * Canvas rule only reaches them if that stylesheet actually pulls the Canvas one in and does not shadow it. That gap is
 * why a held-group treatment could be written, reach the element, pass the whole suite, and still not be drawn.
 *
 * These cases assert Canvas-owned treatments through Studio's stylesheet, so the shadowing is observable.
 */
import { defineInfoschematic } from '@infoschematics/domain-core'
import { resolveAuthoredColour } from '@infoschematics/view-model/colour'
import { paintFor } from '@infoschematics/view-model/tokens'
import { afterEach, expect, test } from 'vitest'
import { commands, page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { Studio } from './App.tsx'
import '../styles.css'

/**
 * Which workspace the Producer is working in, or `null` while the application is presenting.
 *
 * Both axes are read, because either one alone would pass a state nobody asked for: the workspace attribute is
 * retained across a visit to the Audience's view, so it says `design` while presenting too.
 */
const producingIn = (container: Element) => {
  const main = container.querySelector('main')
  return main?.getAttribute('data-producing') === 'true' ? main.getAttribute('data-workspace') : null
}

const config = defineInfoschematic({
  title: 'Studio treatments',
  infoschematic: {
    cards: [
      {
        code: 'CARD-A',
        detail: 'Source card',
        id: 'card-a',
        label: 'Card A',
        placement: { box: { height: 120, width: 200, x: 80, y: 120 }, ports: { east: 1 } },
        scope: 'scope',
        scopes: ['scope']
      }
    ],
    appearance: { card: { identity: true, stereotype: true }, grid: 'major-plus-minor' },
    scopes: [{ color: '#2463eb', description: 'Cards', fill: '#dbeafe', id: 'scope', label: 'Scope', prefix: 'CARD' }],
    viewBox: { height: 320, width: 640, x: 0, y: 0 }
  }
})

const designing = async () => {
  window.localStorage.clear()
  const { container } = await render(<Studio config={config} />)
  const showPanels = container.querySelector<HTMLButtonElement>('button[aria-label="Show panels"]')
  if (!showPanels) throw new Error('Studio did not render the panel visibility control')
  showPanels.click()
  await expect.poll(() => container.querySelector('button[aria-label="Collapse panels"]')).not.toBeNull()

  const design = container.querySelector<HTMLButtonElement>('button[aria-label^="Design"]')
  if (!design) throw new Error('Studio has no Design workspace control')
  design.click()
  await expect.poll(() => producingIn(container)).toBe('design')
  return container
}

const selectCardA = async (container: HTMLElement) => {
  const card = container.querySelector<SVGGElement>('[data-artefact-id="CARD-A"]')
  if (!card) throw new Error('Studio did not render Card A')
  card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 31 }))
  window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 31 }))
  await expect.poll(() => card.classList.contains('selected')).toBe(true)
  return card
}

test('paints a selected Card from the shared tokens, so a Canvas treatment reaches Studio uncopied', async () => {
  const container = await designing()
  const card = await selectCardA(container)

  // Studio carries no selection colour of its own. If it stops loading the Canvas stylesheet the token is undefined,
  // the stroke falls back, and this reads something other than the token's value.
  const token = getComputedStyle(document.documentElement)
    .getPropertyValue('--infoschematic-canvas-selection-selected')
    .trim()
  expect(token).toBe('#82b366')

  const shell = card.querySelector('rect')
  if (!shell) throw new Error('Card A has no shell')
  expect(getComputedStyle(shell).stroke).toBe('rgb(130, 179, 102)')
})

/** What the page currently resolves the shared backdrop role to, which is the only value Studio may be painting from. */
const backdropToken = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--infoschematic-canvas-paint-backdrop').trim()

/**
 * Whether an element's background is the panel's mix of a given colour.
 *
 * The mix is computed by the browser, so the expected value is produced the same way rather than written out: a
 * hand-converted `rgb()` would be asserting this suite's colour arithmetic instead of the rule Studio applied.
 */
const paintedFrom = (element: Element, colour: string) => {
  const probe = document.createElement('div')
  probe.style.backgroundColor = `color-mix(in srgb, ${colour} 72%, var(--infoschematic-chrome-paint-page))`
  document.body.append(probe)
  const expected = getComputedStyle(probe).backgroundColor
  probe.remove()
  return { actual: getComputedStyle(element).backgroundColor, expected }
}

/** The `rgb()` a browser normalises a colour to, so an expectation is spelled the way the drawing's is. */
const asPainted = (colour: string) => {
  const probe = document.createElement('div')
  probe.style.color = colour
  document.body.append(probe)
  const painted = getComputedStyle(probe).color
  probe.remove()
  return painted
}

/* One browser context serves this whole file, so a preference outlives the case that asked for it. */
afterEach(async () => {
  await commands.emulateColourScheme('no-preference')
})

test('paints the diagram container from the backdrop token, not a literal Studio copy of it', async () => {
  const container = await designing()

  // Studio carried its own `.infoschematic`, identical but for a blueprint literal where Canvas writes the token — so
  // a backdrop change would have reached every surface except the editor. Reading the token and the painted colour
  // together is what says the container is taking Canvas's rule rather than a copy that happens to agree today. The
  // token is now per-scheme, so a literal would only be wrong under the other preference: both are read here, and the
  // expected value comes from the manifest rather than from a colour spelled out in this file. The container settles
  // toward the page it sits on rather than toward black, which in the light scheme is the difference between a frame
  // and a mid-grey slab; the probe therefore carries the same chrome role the rule does.
  const surface = container.querySelector('.infoschematic')
  if (!surface) throw new Error('Studio did not render the diagram container')

  for (const scheme of ['light', 'dark'] as const) {
    await commands.emulateColourScheme(scheme)
    expect(backdropToken(), scheme).toBe(paintFor('neutral', scheme).backdrop)
    const { actual, expected } = paintedFrom(surface, backdropToken())
    expect(actual, scheme).toBe(expected)
  }

  // Studio's panel override is the one thing it does say about the container, and it has to keep saying it.
  expect(getComputedStyle(surface).aspectRatio).toBe('auto')
  expect(getComputedStyle(surface).placeItems).toBe('center')
})

test("keeps a Card's identity chip out of the Card's own selection treatment", async () => {
  const container = await designing()
  const card = await selectCardA(container)

  // Canvas scopes the Card treatment to the Card's own shell with a child combinator. A looser copy in Studio would
  // paint the nested chip as though it were a second selected Card.
  const chip = card.querySelector('.infoschematic-card-identity rect')
  if (!chip) throw new Error('Card A has no identity chip')
  /* Its own Scope colour, not the Card's selection: asserting the positive catches a chip left unstyled as well.
     The Scope's colour is a hue seed, so the expected value is its realisation on the ground this page is on. */
  expect(getComputedStyle(chip).stroke).toBe(asPainted(resolveAuthoredColour('#2463eb', 'light', 'ink')))
})

test('lets the split seam show that a pane continues past it, rather than cutting whatever lies on the clip edge', async () => {
  await page.viewport(1440, 900)
  const container = await designing()
  await selectCardA(container)

  const panes = container.querySelector<HTMLElement>('.editor-panes')
  const handle = container.querySelector('.split-handle')
  if (!panes || !handle) throw new Error('Studio did not render the split editor panes')

  // None of the rest means anything unless the pane is actually clipping its contents at this size.
  expect(panes.scrollHeight).toBeGreaterThan(panes.clientHeight)

  /*
   * A label is put across the clip edge rather than found there.
   *
   * The first version of this case looked for one already lying on the seam, which is how the defect was seen - but
   * which label that is depends on the scroll offset, on where the Producer dragged the divider, and on how the panel
   * text happens to wrap, so a reflow of the library descriptions left the case measuring nothing and passing. Placing
   * a label on the edge deliberately asserts the same property and does not depend on any of that.
   */
  const labels = [...panes.querySelectorAll('.pane-heading, legend')]
  const target = labels.at(-1)
  if (!target) throw new Error('The editor panes rendered no labels to place on the seam')
  const within = target.getBoundingClientRect().top - panes.getBoundingClientRect().top + panes.scrollTop
  panes.scrollTop = Math.min(
    Math.max(within + target.getBoundingClientRect().height / 2 - panes.clientHeight, 0),
    panes.scrollHeight - panes.clientHeight
  )
  await expect.poll(() => panes.scrollTop).toBeGreaterThan(0)

  const seam = handle.getBoundingClientRect()
  const box = target.getBoundingClientRect()
  expect(box.top, 'the label could not be placed across the seam, so this case measures nothing').toBeLessThan(
    seam.bottom
  )
  expect(box.bottom).toBeGreaterThan(seam.top)

  /*
   * And a presence assertion cannot see what is wrong with that: the label is in the tree, displayed, and has a box,
   * and it is still painted half-height under a line whose meaning is that the pane ends here. Something in the pane's
   * own treatment has to distinguish a clipped label from a deleted one.
   */
  expect(getComputedStyle(panes).maskImage).not.toBe('none')

  /*
   * The fade also has to fall on empty space once there is nothing more to show, or the end of the scroll dims the
   * pane's real last line instead. The pane keeps at least the faded depth past its final child.
   */
  panes.scrollTop = panes.scrollHeight
  await expect.poll(() => panes.scrollTop).toBeGreaterThan(0)
  const last = panes.lastElementChild
  if (!last) throw new Error('The editor panes rendered nothing to scroll')
  const clipped = panes.getBoundingClientRect().top + panes.clientTop + panes.clientHeight
  expect(clipped - last.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(12)
})
