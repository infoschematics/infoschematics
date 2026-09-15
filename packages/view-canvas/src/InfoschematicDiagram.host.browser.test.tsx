/**
 * Two inline Canvases, one document, deliberately colliding authored identity.
 *
 * Every fixture here authors the same codes as its sibling: an embedding host
 * has no say over what two independently authored Infoschematics call their
 * Cards, so `CARD-A` meaning two different things on one page is the ordinary
 * case rather than the awkward one. A suite that gave each fixture its own
 * codes would pass whether or not the instances were isolated.
 */
import { defineInfoschematic } from '@infoschematics/domain-core'
import type { InfoschematicInput } from '@infoschematics/domain-model'
import type { ArtefactSelection } from '@infoschematics/view-model/editable'
import { useState } from 'react'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from './Canvas.tsx'

const host = (title: string, cardLabel: string, flowColour: string): InfoschematicInput =>
  defineInfoschematic({
    title,
    infoschematic: {
      cards: [
        {
          code: 'CARD-A',
          detail: `${cardLabel} source`,
          id: 'card-a',
          label: cardLabel,
          placement: {
            box: { height: 50, width: 100, x: 80, y: 170 },
            ports: { east: 1 }
          },
          scope: 'scope',
          scopes: ['scope']
        },
        {
          code: 'CARD-B',
          detail: `${cardLabel} target`,
          id: 'card-b',
          label: `${cardLabel} target`,
          placement: {
            box: { height: 50, width: 100, x: 360, y: 170 },
            ports: { west: 1 }
          },
          scope: 'scope',
          scopes: ['scope']
        }
      ],
      flowFamilies: [{ color: flowColour, description: 'Requests', id: 'request', label: 'Request', prefix: 'REQ' }],
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
      scopes: [
        { color: '#2463eb', description: 'Cards', fill: '#dbeafe', id: 'scope', label: 'Scope', prefix: 'CARD' }
      ],
      viewBox: { height: 320, width: 640, x: 0, y: 0 }
    }
  })

const orders = host('Orders', 'Orders intake', '#7c3aed')
const billing = host('Billing', 'Billing ledger', '#b91c1c')

function Instance({ config, testid }: { config: InfoschematicInput; testid: string }) {
  const [selected, setSelected] = useState<ArtefactSelection | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [events, setEvents] = useState<string[]>([])
  const record = (event: string) => setEvents((current) => [...current, event])
  return (
    <div data-testid={testid}>
      <Canvas
        config={config}
        hovered={hovered}
        mode="design"
        onArtefactSelect={(selection) => {
          setSelected(selection)
          record(`select:${selection?.id ?? 'none'}`)
        }}
        onHover={(code) => {
          setHovered(code)
          record(`hover:${code ?? 'none'}`)
        }}
        selectedArtefact={selected}
      />
      <output data-testid={`${testid}-events`}>{events.join('|')}</output>
    </div>
  )
}

/** One host document embedding both Infoschematics, with each instance separately mountable. */
function HostDocument() {
  const [mounted, setMounted] = useState({ billing: true, orders: true })
  return (
    <main>
      <button onClick={() => setMounted((current) => ({ ...current, orders: !current.orders }))} type="button">
        Toggle orders
      </button>
      {mounted.orders ? <Instance config={orders} testid="orders" /> : null}
      {mounted.billing ? <Instance config={billing} testid="billing" /> : null}
    </main>
  )
}

const instance = (container: HTMLElement, testid: string) => {
  const root = container.querySelector<HTMLElement>(`[data-testid="${testid}"]`)
  if (!root) throw new Error(`instance ${testid} is not mounted`)
  const card = root.querySelector<SVGGElement>('[data-artefact-id="CARD-A"]')
  if (!card) throw new Error(`instance ${testid} rendered no CARD-A`)
  return {
    card,
    events: () => root.querySelector(`[data-testid="${testid}-events"]`)?.textContent ?? '',
    region: root.querySelector('section.infoschematic'),
    root
  }
}

/** React derives enter and leave from the bubbling over and out events, so drive those. */
const pointer = (target: Element, type: 'pointerdown' | 'pointerover') =>
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1 }))

test('an authored code addresses its own instance when both documents use it', async () => {
  const { container } = await render(<HostDocument />)

  expect(instance(container, 'orders').card.getAttribute('aria-label')).toContain('Orders intake')
  expect(instance(container, 'billing').card.getAttribute('aria-label')).toContain('Billing ledger')
  expect(container.querySelectorAll('[data-artefact-id="CARD-A"]')).toHaveLength(2)
})

test('each instance is named for the Infoschematic it renders', async () => {
  const { container } = await render(<HostDocument />)

  expect(instance(container, 'orders').region?.getAttribute('aria-label')).toBe('Orders Infoschematic')
  expect(instance(container, 'billing').region?.getAttribute('aria-label')).toBe('Billing Infoschematic')
})

test('hovering one instance leaves the other unpointed', async () => {
  const { container } = await render(<HostDocument />)
  const hovered = instance(container, 'orders')

  pointer(hovered.card, 'pointerover')

  await expect.poll(() => instance(container, 'orders').events()).toBe('hover:CARD-A')
  expect(instance(container, 'billing').events()).toBe('')
  expect(instance(container, 'orders').card.classList.contains('pointed')).toBe(true)
  expect(instance(container, 'billing').card.classList.contains('pointed')).toBe(false)
})

test('selecting in one instance leaves the other unselected', async () => {
  const { container } = await render(<HostDocument />)

  pointer(instance(container, 'orders').card, 'pointerdown')

  await expect.poll(() => instance(container, 'orders').card.classList.contains('selected')).toBe(true)
  expect(instance(container, 'billing').card.classList.contains('selected')).toBe(false)
  expect(instance(container, 'billing').events()).toBe('')
})

test('unmounting one instance leaves the survivor interactive, and a remount starts clean', async () => {
  const { container, getByRole } = await render(<HostDocument />)

  pointer(instance(container, 'orders').card, 'pointerdown')
  await expect.poll(() => instance(container, 'orders').events()).toBe('select:CARD-A')

  await getByRole('button', { name: 'Toggle orders' }).click()
  await expect.poll(() => container.querySelector('[data-testid="orders"]')).toBeNull()

  const survivor = instance(container, 'billing')
  pointer(survivor.card, 'pointerover')
  pointer(survivor.card, 'pointerdown')
  await expect.poll(() => instance(container, 'billing').events()).toBe('hover:CARD-A|select:CARD-A')

  await getByRole('button', { name: 'Toggle orders' }).click()
  await expect.poll(() => container.querySelector('[data-testid="orders"]')).not.toBeNull()

  const remounted = instance(container, 'orders')
  expect(remounted.events()).toBe('')
  expect(remounted.card.classList.contains('selected')).toBe(false)
  pointer(remounted.card, 'pointerover')
  await expect.poll(() => instance(container, 'orders').events()).toBe('hover:CARD-A')
  expect(instance(container, 'billing').events()).toBe('hover:CARD-A|select:CARD-A')
})
