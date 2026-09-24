import { defineInfoschematicModel } from '@infoschematics/domain-core'
import {
  artefactDestination,
  type DestinationResolution,
  type InfoschematicDestination,
  scopeDestination
} from '@infoschematics/view-model/destination'
import { useState } from 'react'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from './Canvas.tsx'
import './styles.css'

/**
 * Arriving at one part of a document, proved in a browser rather than read out of the resolver.
 *
 * The unit cases settle what an address means. What they cannot settle is what a reader gets: that the viewport
 * actually moved, that the part the address named is the part that is lit, that nothing the author animated started
 * playing because a link was followed, and that a link written into prose years ago does not take the page down when
 * the part it named has gone.
 */
const config = defineInfoschematicModel({
  id: 'addressed',
  title: 'Addressed document',
  diagram: {
    bounds: { height: 500, width: 900, x: 0, y: 0 },
    gridSize: 10,
    cards: [
      { id: 'IN-01', label: 'Source', bounds: { height: 80, width: 160, x: 100, y: 100 } },
      { id: 'ED-01', label: 'Target', bounds: { height: 80, width: 160, x: 500, y: 200 } }
    ],
    points: [{ id: 'PT-01', label: 'Edge point', at: { x: 760, y: 420 } }],
    dynamics: [{ id: 'attention', label: 'Target needs attention', kind: 'emphasise-elements', elements: ['ED-01'] }]
  },
  scopes: [{ id: 'edge', label: 'Edge', elements: ['ED-01', 'PT-01'] }]
})

const surface = { height: 400, width: 720 }

const viewportOf = (container: HTMLElement) => {
  const box = container.querySelector('svg.infoschematic-svg')?.getAttribute('viewBox')
  if (!box) throw new Error('rendered Diagram has no viewBox')
  const [x, y, width, height] = box.split(' ').map(Number)
  return { centre: { x: (x ?? 0) + (width ?? 0) / 2, y: (y ?? 0) + (height ?? 0) / 2 }, height, width, x, y }
}

const idsOf = (container: HTMLElement, held: string) =>
  [...container.querySelectorAll(`.${held}[data-artefact-id]`)].map((element) =>
    element.getAttribute('data-artefact-id')
  )

/** The anchor, which is the element every single-selection control already reads. */
const selectedIds = (container: HTMLElement) => idsOf(container, 'selected')

/** The rest of a group, held behind the anchor in the order the author wrote them. */
const heldIds = (container: HTMLElement) => idsOf(container, 'group-held')

const arrivalText = (container: HTMLElement) =>
  container.querySelector('[data-arrival-announcement]')?.textContent ?? ''

/** A host that owns the address, as `ADR-INFOSCHEMATICS-005` requires, and can change it while the reader watches. */
function Host({ initial }: { initial: InfoschematicDestination | null }) {
  const [destination, setDestination] = useState(initial)
  const [reported, setReported] = useState<readonly DestinationResolution[]>([])
  return (
    <div style={surface}>
      <Canvas config={config} destination={destination} onDestination={(at) => setReported([...reported, at])} />
      <button onClick={() => setDestination(artefactDestination('ED-01'))} type="button">
        Go to Target
      </button>
      <button onClick={() => setDestination(scopeDestination('edge'))} type="button">
        Go to Edge
      </button>
      <p data-reported="true">
        {reported.map((at) => `${at.outcome}:${'reason' in at ? at.reason : at.label}`).join(' ')}
      </p>
    </div>
  )
}

test('arriving selects the part the address named and tells a reader who cannot see it', async () => {
  const screen = await render(<Host initial={artefactDestination('ED-01')} />)

  await expect.poll(() => selectedIds(screen.container)).toEqual(['ED-01'])
  expect(arrivalText(screen.container)).toBe(
    'Destination 1. Moved to Target, now selected. The document has not changed.'
  )
  expect(screen.container.querySelector('[data-reported]')?.textContent).toBe('resolved:Target')
})

test('arriving at a Scope holds every element it names, anchor first', async () => {
  const screen = await render(<Host initial={scopeDestination('edge')} />)

  await expect.poll(() => selectedIds(screen.container)).toEqual(['ED-01'])
  expect(heldIds(screen.container)).toEqual(['PT-01'])
  expect(arrivalText(screen.container)).toBe(
    'Destination 1. Moved to Edge, 2 elements now selected. The document has not changed.'
  )
})

test('arriving does not start anything the author animated', async () => {
  const screen = await render(<Host initial={artefactDestination('ED-01')} />)

  await expect.poll(() => selectedIds(screen.container)).toEqual(['ED-01'])
  /* `ED-01` is the target of an authored `emphasise-elements` Dynamic, so this is the case where an arrival
     emphasis would collide with the author's. Nothing is emphasised, because arriving is a selection. */
  expect(screen.container.querySelector('.infoschematic-element-emphasis')).toBeNull()
  expect(screen.container.querySelector('[data-emphasised]')).toBeNull()
  expect(screen.container.querySelector('.infoschematic-flow-signal')).toBeNull()
})

test('the emphasis this document can produce is produced when its Dynamic actually occurs', async () => {
  /* The assertion above is only worth anything if an emphasis could have appeared. Occurring the same Dynamic by
     hand proves the negative was measured rather than merely absent. */
  const screen = await render(
    <div style={surface}>
      <Canvas
        config={config}
        destination={artefactDestination('ED-01')}
        dynamics={[{ dynamicId: 'attention', occurrenceKey: 'once' }]}
      />
    </div>
  )

  await expect
    .poll(() => screen.container.querySelector('.infoschematic-element-emphasis[data-artefact-id="ED-01"]'))
    .not.toBeNull()
})

test('a magnified reader is taken to the part rather than left where they were', async () => {
  const screen = await render(<Host initial={null} />)

  const zoomIn = screen.getByRole('button', { name: 'Zoom in' })
  await zoomIn.click()
  await zoomIn.click()
  await expect.poll(() => viewportOf(screen.container).width).toBeCloseTo(576, 3)
  const before = viewportOf(screen.container).centre

  await screen.getByRole('button', { name: 'Go to Target' }).click()

  // The Card's own centre: 500 + 160 / 2, 200 + 80 / 2.
  await expect.poll(() => viewportOf(screen.container).centre.x).toBeCloseTo(580, 3)
  expect(viewportOf(screen.container).centre.y).toBeCloseTo(240, 3)
  expect(before).not.toEqual(viewportOf(screen.container).centre)

  /* Centred, not framed: the magnification the reader chose is exactly the magnification they keep, so following a
     link cannot silently change how much of the document they are shown or what detail band it is drawn in. */
  expect(viewportOf(screen.container).width).toBeCloseTo(576, 3)
  expect(viewportOf(screen.container).height).toBeCloseTo(320, 3)
})

test('arriving while the whole document is in view moves nothing, because there is nowhere to move to', async () => {
  const screen = await render(<Host initial={artefactDestination('ED-01')} />)

  await expect.poll(() => selectedIds(screen.container)).toEqual(['ED-01'])
  expect(viewportOf(screen.container)).toMatchObject({ height: 500, width: 900, x: 0, y: 0 })
})

test('an address that leads nowhere still mounts, still draws, and says nothing to the reader', async () => {
  const screen = await render(<Host initial={artefactDestination('CARD-99')} />)

  /* The whole document, exactly as it would be with no address at all. */
  await expect.poll(() => screen.container.querySelectorAll('[data-artefact-kind="card"]').length).toBe(2)
  expect(viewportOf(screen.container)).toMatchObject({ height: 500, width: 900, x: 0, y: 0 })
  expect(selectedIds(screen.container)).toEqual([])
  expect(arrivalText(screen.container)).toBe('')

  /* Quiet for the reader, reported to the host: it is the host that knows which page wrote the link. */
  expect(screen.container.querySelector('[data-reported]')?.textContent).toBe('refused:unknown-artefact')
})

test('a second address is a second arrival, heard as one', async () => {
  const screen = await render(<Host initial={artefactDestination('ED-01')} />)

  await expect.poll(() => selectedIds(screen.container)).toEqual(['ED-01'])

  await screen.getByRole('button', { name: 'Go to Edge' }).click()
  await expect.poll(() => heldIds(screen.container)).toEqual(['PT-01'])
  expect(arrivalText(screen.container)).toBe(
    'Destination 2. Moved to Edge, 2 elements now selected. The document has not changed.'
  )
})
