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
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { Studio } from './App.tsx'
import '../styles.css'

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
  if (!design) throw new Error('Studio has no Design mode control')
  design.click()
  await expect.poll(() => container.querySelector('main')?.getAttribute('data-production-mode')).toBe('design')
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

test('paints the diagram container from the backdrop token, not a literal Studio copy of it', async () => {
  const container = await designing()

  // Studio carried its own `.infoschematic`, identical but for `#081725` where Canvas writes the token — so a backdrop
  // change would have reached every surface except the editor. Reading the token and the painted colour together is
  // what says the container is taking Canvas's rule rather than a copy that happens to agree today.
  const backdrop = getComputedStyle(document.documentElement)
    .getPropertyValue('--infoschematic-canvas-surfaces-backdrop')
    .trim()
  expect(backdrop).toBe('#081725')

  const surface = container.querySelector('.infoschematic')
  if (!surface) throw new Error('Studio did not render the diagram container')
  const probe = document.createElement('div')
  probe.style.backgroundColor = `color-mix(in srgb, ${backdrop} 72%, #000)`
  document.body.append(probe)
  expect(getComputedStyle(surface).backgroundColor).toBe(getComputedStyle(probe).backgroundColor)
  probe.remove()

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
  // Its own Scope colour, not the Card's selection: asserting the positive catches a chip left unstyled as well.
  expect(getComputedStyle(chip).stroke).toBe('rgb(36, 99, 235)')
})
