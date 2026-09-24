import { defineInfoschematic } from '@infoschematics/domain-core'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from './Canvas.tsx'
import './styles.css'

/**
 * What magnification reveals, proved in a browser rather than read out of the resolver.
 *
 * The unit cases settle the band function and the hysteresis margin. What they cannot settle is that the number the
 * Canvas feeds them is the scale the drawing is actually painted at: a Diagram that resolved its band from the fitted
 * view box instead of from the live viewport passes every unit case and reveals nothing when a reader zooms in.
 */
const config = defineInfoschematic({
  title: 'Magnified detail',
  infoschematic: {
    appearance: {
      card: { compact: true, description: true, identity: true, stereotype: true }
    },
    cards: [
      {
        code: 'CARD-001',
        detail: 'Optional explanatory detail',
        id: 'card',
        label: 'Magnified Card',
        placement: { box: { height: 100, width: 240, x: 180, y: 150 }, ports: {} },
        scope: 'scope',
        scopes: ['scope'],
        stereotype: 'service'
      }
    ],
    scopes: [{ color: '#2463eb', description: 'Cards', fill: '#dbeafe', id: 'scope', label: 'Scope', prefix: 'CARD' }],
    viewBox: { height: 400, width: 600, x: 0, y: 0 }
  }
})

/* Half the authored size, so the drawing starts in a band that has something left to reveal. */
const narrow = { height: 200, width: 300 }

test('magnifying a Diagram reveals detail the small rendering withheld', async () => {
  const screen = await render(
    <div style={narrow}>
      <Canvas config={config} responsiveCardDetails />
    </div>
  )

  // Fitted at half size the Card keeps its stereotype and loses its code and its description.
  await expect.poll(() => screen.container.querySelector('[data-card-detail="stereotype"]')).not.toBeNull()
  expect(screen.container.querySelector('[data-card-detail="identity"]')).toBeNull()
  expect(screen.container.querySelector('[data-card-detail="description"]')).toBeNull()

  const zoomIn = screen.getByRole('button', { name: 'Zoom in' })

  // One step of 1.25 takes the drawn scale from 0.5 to 0.625, which is across the code's threshold and not the
  // description's: the reveal is graded rather than all-or-nothing.
  await zoomIn.click()
  await expect.poll(() => screen.container.querySelector('[data-card-detail="identity"]')).not.toBeNull()
  expect(screen.container.querySelector('[data-card-detail="description"]')).toBeNull()

  // Two more steps reach 0.977, past the description's threshold, and the Card is whole.
  await zoomIn.click()
  await zoomIn.click()
  await expect.poll(() => screen.container.querySelector('[data-card-detail="description"]')).not.toBeNull()
  expect(screen.container.querySelectorAll('[data-card-detail]').length).toBe(3)

  // The accessible identity never depended on the band, so a reader who is not looking at it heard the same
  // sentence throughout.
  expect(screen.container.querySelector('g.infoschematic-service')?.getAttribute('aria-label')).toBe(
    'CARD-001 · Magnified Card · service · Optional explanatory detail'
  )

  // Zooming back out withdraws it again, so the policy is a function of where the reader is rather than a latch.
  const fit = screen.getByRole('button', { name: 'Fit whole diagram' })
  await fit.click()
  await expect.poll(() => screen.container.querySelector('[data-card-detail="identity"]')).toBeNull()
})

test('announces a detail change without implying the document changed', async () => {
  const screen = await render(
    <div style={narrow}>
      <Canvas config={config} responsiveCardDetails />
    </div>
  )

  const region = () => screen.container.querySelector('[data-detail-announcement]')

  // Silent on arrival: nothing has changed yet, and a region that speaks on mount reads the drawing aloud for no
  // reason at all.
  await expect.poll(() => region()).not.toBeNull()
  expect(region()?.textContent).toBe('')

  await screen.getByRole('button', { name: 'Zoom in' }).click()

  await expect
    .poll(() => region()?.textContent ?? '')
    .toBe('Detail update 1. Card names, stereotypes and codes. The document has not changed.')

  // It is a live region rather than a label, so it keeps the polite role the other two announcements use.
  expect(region()?.getAttribute('aria-live')).toBe('polite')
  expect(region()?.getAttribute('role')).toBe('status')

  // A revision distinguishes a second change from the first, so returning to a band already announced is heard.
  await screen.getByRole('button', { name: 'Fit whole diagram' }).click()
  await expect
    .poll(() => region()?.textContent ?? '')
    .toBe('Detail update 2. Card names and stereotypes. The document has not changed.')
})

test('leaves a Diagram that did not opt in exactly as it was drawn at every magnification', async () => {
  const screen = await render(
    <div style={narrow}>
      <Canvas config={config} />
    </div>
  )

  await expect.poll(() => screen.container.querySelectorAll('[data-card-detail]').length).toBe(3)
  await screen.getByRole('button', { name: 'Zoom in' }).click()
  await expect.poll(() => screen.container.querySelectorAll('[data-card-detail]').length).toBe(3)
  expect(screen.container.querySelector('[data-detail-announcement]')?.textContent).toBe('')
})
