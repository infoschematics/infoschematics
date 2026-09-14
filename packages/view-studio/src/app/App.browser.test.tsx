import { defineInfoschematic } from '@infoschematics/domain-core'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { Studio } from './App.tsx'

const config = defineInfoschematic({
  title: 'Studio interaction',
  infoschematic: {
    cards: [
      {
        code: 'CARD-A',
        detail: 'Source card',
        id: 'card-a',
        label: 'Card A',
        placement: { box: { height: 50, width: 100, x: 80, y: 170 }, ports: { east: 1 } },
        scope: 'scope',
        scopes: ['scope']
      },
      {
        code: 'CARD-B',
        detail: 'Target card',
        id: 'card-b',
        label: 'Card B',
        placement: { box: { height: 50, width: 100, x: 360, y: 170 }, ports: { west: 1 } },
        scope: 'scope',
        scopes: ['scope']
      }
    ],
    flowFamilies: [{ color: '#7c3aed', description: 'Requests', id: 'request', label: 'Request', prefix: 'REQ' }],
    flows: [
      {
        code: 'FLOW-A',
        family: 'request',
        id: 'flow-a',
        points: [
          { x: 180, y: 195 },
          { x: 360, y: 195 }
        ],
        source: 'card-a',
        sourcePort: 'E1',
        target: 'card-b',
        targetPort: 'W1'
      }
    ],
    scopes: [{ color: '#2463eb', description: 'Cards', fill: '#dbeafe', id: 'scope', label: 'Scope', prefix: 'CARD' }],
    viewBox: { height: 320, width: 640, x: 0, y: 0 }
  }
})

test('Studio keyboard edits render one reviewable change with undo, redo and reviewable removal', async () => {
  window.localStorage.clear()
  const { container } = await render(<Studio config={config} />)
  const design = container.querySelector<HTMLButtonElement>('button[aria-label^="Design"]')
  if (!design) throw new Error('Studio has no Design mode control')
  design.click()
  await expect.poll(() => container.querySelector('main')?.getAttribute('data-production-mode')).toBe('design')

  const card = container.querySelector<SVGGElement>('[data-artefact-id="CARD-A"]')
  if (!card) throw new Error('Studio did not render Card A')
  const currentCard = () => container.querySelector<SVGGElement>('[data-artefact-id="CARD-A"]')
  card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 21 }))
  window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 21 }))
  await expect.poll(() => card.classList.contains('selected')).toBe(true)

  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }))
  await expect.poll(() => card.getAttribute('transform')).toBe('translate(90 170)')
  await expect.poll(() => container.querySelector('.change-list')?.textContent ?? '').toContain('CARD-A')

  const undo = container.querySelector<HTMLButtonElement>('button[aria-label="Undo"]')
  const redo = container.querySelector<HTMLButtonElement>('button[aria-label="Redo"]')
  if (!undo || !redo) throw new Error('Studio did not render history controls')
  undo.click()
  await expect.poll(() => card.getAttribute('transform')).toBe('translate(80 170)')
  redo.click()
  await expect.poll(() => card.getAttribute('transform')).toBe('translate(90 170)')

  const x = container.querySelector<HTMLInputElement>('input[aria-label="CARD-A x"]')
  if (!x) throw new Error('Studio did not render numeric placement for Card A')
  const setInputValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (!setInputValue) throw new Error('browser has no native input value setter')
  setInputValue.call(x, '120')
  x.dispatchEvent(new Event('input', { bubbles: true }))
  await expect.poll(() => currentCard()?.getAttribute('transform')).toBe('translate(120 170)')

  const findMoreEast = () =>
    [...container.querySelectorAll<HTMLButtonElement>('button')]
      .filter((button) => button.getAttribute('aria-label')?.startsWith('More on'))
      .at(-1)
  await expect.poll(findMoreEast).toBeDefined()
  const moreEast = findMoreEast()
  if (!moreEast) throw new Error('Studio did not render Card port-count controls')
  moreEast.click()
  await expect.poll(() => container.querySelector('.change-list')?.textContent ?? '').toContain('ports')

  const dropOne = container.querySelector<HTMLButtonElement>('.change-drop')
  if (!dropOne) throw new Error('Studio did not render individual change removal')
  dropOne.click()
  await expect.poll(() => currentCard()?.getAttribute('transform')).toBe('translate(80 170)')

  const discard = container.querySelector<HTMLButtonElement>('button[aria-label="Discard every change"]')
  if (!discard) throw new Error('Studio did not render draft discard control')
  discard.click()
  await expect.poll(() => container.querySelector('.change-list')).toBeNull()

  currentCard()?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Delete' }))
  await expect.poll(() => container.querySelector('.change-list')?.textContent ?? '').toContain('CARD-A')
  await expect.poll(() => currentCard()?.classList.contains('going')).toBe(true)
  const changes = container.querySelector('.change-list')?.textContent ?? ''
  expect(changes).toContain('CARD-A')
  expect(changes).toContain('FLOW-A')

  currentCard()?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Delete' }))
  await expect.poll(() => currentCard()?.classList.contains('going')).toBe(false)
  await expect.poll(() => currentCard()?.getAttribute('transform')).toBe('translate(80 170)')
  expect(container.querySelector('.change-list')).toBeNull()
})

test('Studio creation and property clearing stay rendered and reviewable until discard', async () => {
  window.localStorage.clear()
  const { container } = await render(<Studio config={config} />)
  const design = container.querySelector<HTMLButtonElement>('button[aria-label^="Design"]')
  if (!design) throw new Error('Studio has no Design mode control')
  design.click()
  await expect.poll(() => container.querySelector('main')?.getAttribute('data-production-mode')).toBe('design')

  const createRegion = container.querySelector<HTMLButtonElement>('button[aria-label="Create Region"]')
  if (!createRegion) throw new Error('Studio has no Region creation control')
  createRegion.click()
  await expect.poll(() => container.querySelector('[data-artefact-kind="region"]')).not.toBeNull()
  await expect.poll(() => container.querySelector('.change-list')?.textContent ?? '').toContain('create region')

  const properties = container.querySelector<HTMLTextAreaElement>('textarea[aria-label="Edit region properties"]')
  const apply = [...container.querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => button.textContent?.trim() === 'Apply properties'
  )
  if (!properties || !apply) throw new Error('created Region has no property controls')
  const setTextAreaValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  if (!setTextAreaValue) throw new Error('browser has no native textarea value setter')
  setTextAreaValue.call(properties, '{"fill":"#abcdef","label":"Working area"}')
  properties.dispatchEvent(new Event('input', { bubbles: true }))
  apply.click()
  await expect
    .poll(() => container.querySelector('[data-artefact-kind="region"]')?.getAttribute('aria-label'))
    .toBe('Region Working area')
  await expect.poll(() => container.querySelector('.infoschematic-region-fill')?.getAttribute('fill')).toBe('#abcdef')

  setTextAreaValue.call(properties, '{"fill":null}')
  properties.dispatchEvent(new Event('input', { bubbles: true }))
  apply.click()
  await expect.poll(() => container.querySelector('.infoschematic-region-fill')).toBeNull()

  const discard = container.querySelector<HTMLButtonElement>('button[aria-label="Discard every change"]')
  if (!discard) throw new Error('Studio did not render draft discard control')
  discard.click()
  await expect.poll(() => container.querySelector('[data-artefact-kind="region"]')).toBeNull()
  expect(container.querySelector('.change-list')).toBeNull()
})
