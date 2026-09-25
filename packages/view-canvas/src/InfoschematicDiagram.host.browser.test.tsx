/**
 * Two inline Canvases, one document, deliberately colliding authored identity.
 *
 * Every fixture here authors the same codes as its sibling: an embedding host
 * has no say over what two independently authored Infoschematics call their
 * Cards, so `CARD-A` meaning two different things on one page is the ordinary
 * case rather than the awkward one. A suite that gave each fixture its own
 * codes would pass whether or not the instances were isolated.
 */
import { defineInfoschematic, defineInfoschematicModel } from '@infoschematics/domain-core'
import type { InfoschematicInput } from '@infoschematics/domain-model'
import { resolveAuthoredColour } from '@infoschematics/view-model/colour'
import type { ArtefactSelection } from '@infoschematics/view-model/editable'
import { visualTokens } from '@infoschematics/view-model/tokens'
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
        editor="design"
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

/**
 * Resolve a `url(#…)` reference the way a browser does: the first matching element in *document* order.
 *
 * That rule is the whole defect. It is not "the nearest definition" or "the one in my subtree", so an
 * instance whose sibling emitted the same identifier first silently draws the sibling's definition. The
 * lookup is scoped to the rendered container rather than run against `document`, which keeps the same
 * ordering semantics without letting a stray earlier fixture decide the result.
 */
const resolve = (container: HTMLElement, reference: string | null) => {
  const id = reference?.match(/^url\(#(.+)\)$/)?.[1]
  return id ? container.querySelector(`[id="${CSS.escape(id)}"]`) : null
}

/** Two Diagrams whose authored grids differ, which is what makes one painting the other's grid visible. */
const gridded = (id: string, gridSize: number) =>
  defineInfoschematicModel({
    id,
    title: id,
    diagram: {
      appearance: { grid: 'major-plus-minor' },
      bounds: { height: 160, width: 240, x: 0, y: 0 },
      gridSize
    }
  })

function GridDocument() {
  return (
    <main>
      <div data-testid="coarse">
        <Canvas config={gridded('COARSE', 12)} />
      </div>
      <div data-testid="fine">
        <Canvas config={gridded('FINE', 4)} />
      </div>
    </main>
  )
}

const majorFor = (authored: number) =>
  authored * (visualTokens.canvas.geometry.gridMajorSize / visualTokens.canvas.geometry.gridSize)

const rootOf = (container: HTMLElement, testid: string) => {
  const root = container.querySelector<HTMLElement>(`[data-testid="${testid}"]`)
  if (!root) throw new Error(`instance ${testid} is not mounted`)
  return root
}

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

test('each instance draws the arrowhead it defined, not the one that reached the document first', async () => {
  const { container } = await render(<HostDocument />)

  /* An authored family colour is a hue seed, so the value on the head is its realisation on the ground the page
     settled on rather than the string the fixture wrote. Two families still have to reach two different heads. */
  for (const [testid, colour] of [
    ['orders', resolveAuthoredColour('#7c3aed', 'light', 'ink')],
    ['billing', resolveAuthoredColour('#b91c1c', 'light', 'ink')]
  ] as const) {
    const root = rootOf(container, testid)
    const route = root.querySelector<SVGPathElement>('path.infoschematic-route')
    const marker = resolve(container, route?.getAttribute('marker-end') ?? null)

    // Resolution has to land inside the instance that authored the reference. This is the assertion the
    // fixture was missing: it already proved both instances *emit* the right marker, which was true while
    // both still *drew* the first one.
    expect({ ownMarker: marker ? root.contains(marker) : false, testid }).toEqual({ ownMarker: true, testid })

    // The family colour on the head is what the collision actually corrupts. `.arrow-head` asks for
    // `context-stroke`, so where that is understood the head borrows the referencing line's stroke and a
    // wrongly-resolved marker still comes out the right colour — the computed fill cannot see this bug.
    // The `fill` attribute underneath is per-family and is what gets drawn wherever `context-stroke` is
    // not understood, which includes the raster engine the command line renders PNGs through.
    const head = marker?.querySelector('path.arrow-head')
    expect({ fill: head?.getAttribute('fill'), testid }).toEqual({ fill: colour, testid })
  }
})

test('each instance paints its own authored grid when two Diagrams size it differently', async () => {
  const { container } = await render(<GridDocument />)

  for (const [testid, authored] of [
    ['coarse', 12],
    ['fine', 4]
  ] as const) {
    const root = rootOf(container, testid)
    const grid = root.querySelector<SVGRectElement>('rect.infoschematic-authored-grid')
    const pattern = resolve(container, grid?.getAttribute('fill') ?? null)

    expect({ ownPattern: pattern ? root.contains(pattern) : false, testid }).toEqual({ ownPattern: true, testid })

    // Read as a tile size rather than an identifier: the grid a Producer sees is the pitch, and borrowing a
    // sibling's pattern changes it. A coarse Diagram next to a fine one is the visible form of this defect.
    expect({ pitch: pattern?.getAttribute('height'), testid }).toEqual({
      pitch: String(majorFor(authored)),
      testid
    })
  }
})
