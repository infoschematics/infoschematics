import { defineInfoschematic, defineInfoschematicModel } from '@infoschematics/domain-core'
import type { ArtefactDraftOperation } from '@infoschematics/view-model/artefact-draft'
import {
  type ArtefactSelection,
  type ArtefactSelectionSet,
  everyInteractionLayer,
  type InteractionLayers,
  toggleArtefactSelection,
  toggleInteractionLayer
} from '@infoschematics/view-model/editable'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from './Canvas.tsx'
// Hit testing is the subject below, and `pointer-events` is declared in the stylesheet rather than in the markup.
import './styles.css'

const config = defineInfoschematic({
  title: 'Editing interaction',
  infoschematic: {
    cards: [
      {
        code: 'CARD-A',
        detail: 'Source card',
        id: 'card-a',
        label: 'Card A',
        placement: {
          box: { height: 50, width: 100, x: 80, y: 170 },
          ports: { east: 1 }
        },
        scope: 'scope',
        scopes: ['scope']
      },
      {
        code: 'CARD-B',
        detail: 'Target card',
        id: 'card-b',
        label: 'Card B',
        placement: {
          box: { height: 50, width: 100, x: 360, y: 170 },
          ports: { west: 1 }
        },
        scope: 'scope',
        scopes: ['scope']
      },
      {
        code: 'ADAPTER-A',
        detail: 'Adapter around Card A',
        id: 'adapter-a',
        label: 'Adapter A',
        placement: {
          box: { height: 50, width: 100, x: 80, y: 170 },
          ports: { east: 1 }
        },
        scope: 'scope',
        scopes: ['scope'],
        wraps: 'card-a'
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
      },
      {
        code: 'FLOW-ADAPTER',
        family: 'request',
        id: 'flow-adapter',
        points: [
          { x: 200, y: 227.5 },
          { x: 280, y: 227.5 },
          { x: 280, y: 195 },
          { x: 360, y: 195 }
        ],
        source: 'adapter-a',
        sourcePort: 'E1',
        target: 'card-b',
        targetPort: 'W1'
      },
      /* A Flow between two Points and no Card, so what a dragged Point does to a route is read off this one alone. */
      {
        code: 'FLOW-POINTS',
        family: 'request',
        id: 'flow-points',
        points: [
          { x: 280, y: 100 },
          { x: 420, y: 100 }
        ],
        source: 'point-x',
        sourcePort: 'E1',
        target: 'point-y',
        targetPort: 'W1'
      }
    ],
    points: [
      { code: 'POINT-X', id: 'point-x', label: 'Point X', point: { x: 280, y: 100 }, scopes: ['scope'] },
      { code: 'POINT-Y', id: 'point-y', label: 'Point Y', point: { x: 420, y: 100 }, scopes: ['scope'] }
    ],
    /* One Region, wide enough that a press anywhere near its edge is a long way from its centre - which is the
       arrangement a press-to-select becomes a jump under, and the one every Card case above happens to avoid. */
    regions: [{ box: { height: 60, width: 200, x: 380, y: 250 }, id: 'region-a', label: 'Region A' }],
    scopes: [{ color: '#2463eb', description: 'Cards', fill: '#dbeafe', id: 'scope', label: 'Scope', prefix: 'CARD' }],
    viewBox: { height: 320, width: 640, x: 0, y: 0 }
  }
})

const cardA = {
  code: 'CARD-A',
  geometry: 'box',
  id: 'CARD-A',
  kind: 'card'
} as const satisfies ArtefactSelection

const flowA = {
  code: 'FLOW-A',
  geometry: 'route',
  id: 'FLOW-A',
  kind: 'flow'
} as const satisfies ArtefactSelection

const adapterFlow = {
  code: 'FLOW-ADAPTER',
  geometry: 'route',
  id: 'FLOW-ADAPTER',
  kind: 'flow'
} as const satisfies ArtefactSelection

function EditingHarness({ onMove, onRelease }: { onMove?: () => void; onRelease?: () => void } = {}) {
  const [operations, setOperations] = useState<readonly ArtefactDraftOperation[]>([])
  return (
    <Canvas
      artefactOperations={operations}
      config={config}
      mode="design"
      onArtefactMove={(selection, point) => {
        onMove?.()
        setOperations([
          {
            /* A Point is moved to where the pointer is rather than around it: it has no extent to centre. */
            geometry:
              selection.geometry === 'point'
                ? { at: point, role: 'point' }
                : { box: { height: 50, width: 100, x: point.x - 50, y: point.y - 25 }, role: 'box' },
            operation: 'move',
            target: selection
          }
        ])
      }}
      onArtefactRelease={onRelease}
      onArtefactSelect={() => undefined}
      selectedArtefact={cardA}
    />
  )
}

/*
 * Where a drag asks the host to put an element, recorded rather than applied.
 *
 * What the gesture reports is the contract; placing the element from it would fold the offset under test into
 * whatever the harness chose to do with it, which is how every Card case above reads as correct either way.
 */
function MoveReportHarness() {
  const [reported, setReported] = useState('')
  return (
    <>
      <Canvas
        config={config}
        mode="design"
        onArtefactMove={(selection, point) => setReported(`${selection.id}:${point.x},${point.y}`)}
        onArtefactSelect={() => undefined}
      />
      <output data-testid="reported">{reported}</output>
    </>
  )
}

function InteractionHarness() {
  const [selected, setSelected] = useState<ArtefactSelection | null>(cardA)
  const [events, setEvents] = useState<string[]>([])
  const record = (event: string) => setEvents((current) => [...current, event])
  return (
    <>
      <Canvas
        config={config}
        mode="design"
        onArtefactRemove={(selection) => record(`remove:${selection.id}`)}
        onArtefactReorder={(selection, direction) => record(`reorder:${selection.id}:${direction}`)}
        onArtefactResize={(selection, size) =>
          record(`resize:${selection.id}:${size.width ?? ''}:${size.height ?? ''}`)
        }
        onArtefactSelect={(selection) => {
          setSelected(selection)
          record(`select:${selection?.id ?? 'none'}`)
        }}
        onHover={(code) => record(`hover:${code ?? 'none'}`)}
        removals={{ 'CARD-A': true, 'FLOW-A': true }}
        selectedArtefact={selected}
      />
      <output data-testid="events">{events.join('|')}</output>
    </>
  )
}

function RouteInteractionHarness({ initialSelection }: { initialSelection: ArtefactSelection }) {
  const [selected, setSelected] = useState<ArtefactSelection | null>(initialSelection)
  const [events, setEvents] = useState<string[]>([])
  const record = (event: string) => setEvents((current) => [...current, event])
  return (
    <>
      <Canvas
        config={config}
        mode="design"
        onAttach={(code, end, port, component) => record(`attach:${code}:${end}:${component}:${port}`)}
        onLabelMove={(code) => record(`label:${code}`)}
        onLabelRelease={() => record('label-release')}
        onMoveSegment={(code, _points, index) => record(`segment:${code}:${index}`)}
        onMoveWaypoint={(code, _points, index) => record(`waypoint:${code}:${index}`)}
        onRouteRelease={() => record('route-release')}
        onArtefactSelect={setSelected}
        selectedArtefact={selected}
      />
      <output data-testid="route-events">{events.join('|')}</output>
    </>
  )
}

function LayeredHarness({ layers }: { layers: InteractionLayers }) {
  const [selected, setSelected] = useState<ArtefactSelection | null>(null)
  const [events, setEvents] = useState<string[]>([])
  return (
    <>
      <Canvas
        config={config}
        layers={layers}
        mode="design"
        onArtefactSelect={(selection) => {
          setSelected(selection)
          setEvents((current) => [...current, `select:${selection?.id ?? 'none'}`])
        }}
        selectedArtefact={selected}
      />
      <output data-testid="layer-events">{events.join('|')}</output>
    </>
  )
}

const screenPoint = (svg: SVGSVGElement, x: number, y: number) => {
  const matrix = svg.getScreenCTM()
  if (!matrix) throw new Error('rendered SVG has no screen transform')
  const point = svg.createSVGPoint()
  point.x = x
  point.y = y
  const screen = point.matrixTransform(matrix)
  return { clientX: screen.x, clientY: screen.y }
}

test('pointer movement carries a Flow end with its Card port', async () => {
  const { container } = await render(<EditingHarness />)
  const svg = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  const card = container.querySelector<SVGGElement>('[data-artefact-id="CARD-A"]')
  if (!svg || !card) throw new Error('rendered fixture is incomplete')

  const matrix = svg.getScreenCTM()
  if (!matrix) throw new Error('rendered SVG has no screen transform')
  const at = (x: number, y: number) => {
    const point = svg.createSVGPoint()
    point.x = x
    point.y = y
    const screen = point.matrixTransform(matrix)
    return { clientX: screen.x, clientY: screen.y }
  }

  card.dispatchEvent(new PointerEvent('pointerdown', { ...at(130, 195), bubbles: true, pointerId: 1 }))
  window.dispatchEvent(new PointerEvent('pointermove', { ...at(170, 205), bubbles: true, pointerId: 1 }))
  window.dispatchEvent(new PointerEvent('pointerup', { ...at(170, 205), bubbles: true, pointerId: 1 }))

  await expect.poll(() => container.querySelector('.infoschematic-route')?.getAttribute('d')).toBe('M220 205 H360 V195')
})

/*
 * The one movement case a unit test cannot stand in for: a Point is dragged, and the route that names it as an end
 * is redrawn from where it was left. `DESIGN-014` states it, and every other proof of it works from an operation
 * already built rather than from a pointer.
 */
test('dragging a Point carries the Flow that ends on it', async () => {
  const { container } = await render(<EditingHarness />)
  const svg = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  const point = container.querySelector<SVGGElement>('[data-artefact-id="POINT-X"]')
  if (!svg || !point) throw new Error('rendered Point fixture is incomplete')

  const route = () => container.querySelector('[data-artefact-id="FLOW-POINTS"] .infoschematic-route')
  point.dispatchEvent(new PointerEvent('pointerdown', { ...screenPoint(svg, 280, 100), bubbles: true, pointerId: 7 }))
  window.dispatchEvent(new PointerEvent('pointermove', { ...screenPoint(svg, 300, 140), bubbles: true, pointerId: 7 }))
  window.dispatchEvent(new PointerEvent('pointerup', { ...screenPoint(svg, 300, 140), bubbles: true, pointerId: 7 }))

  await expect
    .poll(() => container.querySelector('[data-artefact-id="POINT-X"] .point-mark')?.getAttribute('cx'))
    .toBe('300')
  expect(container.querySelector('[data-artefact-id="POINT-X"] .point-mark')?.getAttribute('cy')).toBe('140')
  expect(route()?.getAttribute('d')).toBe('M300 140 H420 V100')
})

test('dragging an Adapter moves its held Card and the Flow attached to the Adapter', async () => {
  const { container } = await render(<EditingHarness />)
  const svg = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  const adapter = container.querySelector<SVGGElement>('[data-artefact-id="ADAPTER-A"]')
  if (!svg || !adapter) throw new Error('rendered Adapter fixture is incomplete')

  const matrix = svg.getScreenCTM()
  if (!matrix) throw new Error('rendered SVG has no screen transform')
  const at = (x: number, y: number) => {
    const point = svg.createSVGPoint()
    point.x = x
    point.y = y
    const screen = point.matrixTransform(matrix)
    return { clientX: screen.x, clientY: screen.y }
  }

  adapter.dispatchEvent(new PointerEvent('pointerdown', { ...at(130, 195), bubbles: true, pointerId: 2 }))
  window.dispatchEvent(new PointerEvent('pointermove', { ...at(170, 205), bubbles: true, pointerId: 2 }))
  window.dispatchEvent(new PointerEvent('pointerup', { ...at(170, 205), bubbles: true, pointerId: 2 }))

  await expect
    .poll(() => container.querySelector('[data-artefact-id="CARD-A"]')?.getAttribute('transform'))
    .toBe('translate(120 180)')
  await expect
    .poll(() => container.querySelector('[data-artefact-id="FLOW-ADAPTER"] .infoschematic-route')?.getAttribute('d'))
    .toBe('M240 237.5 H280 V195 H360')
})

/*
 * Every drag case above presses exactly on the element's centre, so a gesture that reports the pointer and one that
 * reports the travel agree, and the difference between them only shows on a press held somewhere else. A Region is
 * where it shows worst: it is the widest thing on the surface, so a press meant to select one threw it half its own
 * width the moment the hand twitched past the drag threshold.
 */
test('a press held away from the centre travels as far as the hand, not onto the pointer', async () => {
  const { container } = await render(<MoveReportHarness />)
  const svg = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  const region = container.querySelector<SVGGElement>('[data-artefact-id="region-a"]')
  if (!svg || !region) throw new Error('rendered Region fixture is incomplete')

  // Pressed at the Region's top-left corner, 100 left of and 30 above its centre, then moved forty right and ten down.
  region.dispatchEvent(new PointerEvent('pointerdown', { ...screenPoint(svg, 380, 250), bubbles: true, pointerId: 21 }))
  window.dispatchEvent(new PointerEvent('pointermove', { ...screenPoint(svg, 420, 260), bubbles: true, pointerId: 21 }))
  window.dispatchEvent(new PointerEvent('pointerup', { ...screenPoint(svg, 420, 260), bubbles: true, pointerId: 21 }))

  await expect.poll(() => container.querySelector('[data-testid="reported"]')?.textContent).toBe('region-a:520,290')
})

test('pointer cancellation and unmount remove active drag listeners', async () => {
  const moved = vi.fn()
  const released = vi.fn()
  const first = await render(<EditingHarness onMove={moved} onRelease={released} />)
  const svg = first.container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  const card = first.container.querySelector<SVGGElement>('[data-artefact-id="CARD-A"]')
  if (!svg || !card) throw new Error('rendered cancellation fixture is incomplete')
  const matrix = svg.getScreenCTM()
  if (!matrix) throw new Error('rendered SVG has no screen transform')
  const at = (x: number, y: number) => {
    const point = svg.createSVGPoint()
    point.x = x
    point.y = y
    const screen = point.matrixTransform(matrix)
    return { clientX: screen.x, clientY: screen.y }
  }

  card.dispatchEvent(new PointerEvent('pointerdown', { ...at(130, 195), bubbles: true, pointerId: 3 }))
  window.dispatchEvent(new PointerEvent('pointermove', { ...at(170, 205), bubbles: true, pointerId: 3 }))
  window.dispatchEvent(new PointerEvent('pointercancel', { ...at(170, 205), bubbles: true, pointerId: 3 }))
  window.dispatchEvent(new PointerEvent('pointermove', { ...at(190, 215), bubbles: true, pointerId: 3 }))
  expect(moved).toHaveBeenCalledTimes(1)
  expect(released).toHaveBeenCalledTimes(1)
  await first.unmount()

  const movedAfterUnmount = vi.fn()
  const second = await render(<EditingHarness onMove={movedAfterUnmount} />)
  const secondSvg = second.container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  const secondCard = second.container.querySelector<SVGGElement>('[data-artefact-id="CARD-A"]')
  if (!secondSvg || !secondCard) throw new Error('rendered unmount fixture is incomplete')
  const secondMatrix = secondSvg.getScreenCTM()
  if (!secondMatrix) throw new Error('rendered SVG has no screen transform')
  const start = secondSvg.createSVGPoint()
  start.x = 130
  start.y = 195
  const screenStart = start.matrixTransform(secondMatrix)
  secondCard.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, clientX: screenStart.x, clientY: screenStart.y, pointerId: 4 })
  )
  await second.unmount()
  window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 300, clientY: 220, pointerId: 4 }))
  expect(movedAfterUnmount).not.toHaveBeenCalled()
})

test('keyboard, selection, hover, removal and resize controls share the rendered Design surface', async () => {
  const { container } = await render(<InteractionHarness />)
  const events = () => container.querySelector('[data-testid="events"]')?.textContent ?? ''
  const card = container.querySelector<SVGGElement>('[data-artefact-id="CARD-A"]')
  const flow = container.querySelector<SVGGElement>('[data-artefact-id="FLOW-A"]')
  const backdrop = container.querySelector<SVGRectElement>('.infoschematic-backdrop')
  if (!card || !flow || !backdrop) throw new Error('rendered interaction fixture is incomplete')

  expect(card.classList.contains('going')).toBe(true)
  expect(card.classList.contains('selected')).toBe(true)
  expect(flow.classList.contains('going')).toBe(true)

  card.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }))
  card.dispatchEvent(new PointerEvent('pointerout', { bubbles: true }))
  card.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, bubbles: true, key: 'ArrowUp' }))
  card.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Delete' }))
  await expect.poll(events).toContain('hover:CARD-A|hover:none')
  expect(events()).toContain('reorder:CARD-A:-1')
  expect(events()).toContain('remove:CARD-A')

  const resize = container.querySelector<SVGGElement>('[aria-label="Resize Card A"]')
  if (!resize) throw new Error('selected Card has no rendered resize control')
  resize.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }))
  await expect.poll(events).toContain('resize:CARD-A:101:')

  backdrop.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 10 }))
  await expect.poll(events).toContain('select:none')
  expect(container.querySelector('[data-artefact-id="CARD-A"]')?.classList.contains('going')).toBe(true)
})

test('a zoomed and panned pointer move keeps Card and connected Flow geometry together', async () => {
  const { container } = await render(<EditingHarness />)
  const svg = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  const backdrop = container.querySelector<SVGRectElement>('.infoschematic-backdrop')
  if (!svg || !backdrop) throw new Error('rendered viewport fixture is incomplete')

  const screenAt = (x: number, y: number) => {
    const matrix = svg.getScreenCTM()
    if (!matrix) throw new Error('rendered SVG has no screen transform')
    const point = svg.createSVGPoint()
    point.x = x
    point.y = y
    const screen = point.matrixTransform(matrix)
    return { clientX: screen.x, clientY: screen.y }
  }

  svg.dispatchEvent(new PointerEvent('pointerover', { ...screenAt(320, 160), bubbles: true, pointerId: 11 }))
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: '+' }))
  await expect.poll(() => svg.getAttribute('viewBox')).not.toBe('0 0 640 320')

  const panStart = screenAt(500, 250)
  // Programmatically dispatched PointerEvents have no browser-owned active
  // pointer, so Chromium cannot establish real capture for this one test.
  // Stub only capture ownership; coordinate conversion still uses the live SVG.
  svg.setPointerCapture = vi.fn()
  svg.hasPointerCapture = vi.fn(() => true)
  svg.releasePointerCapture = vi.fn()
  svg.dispatchEvent(new PointerEvent('pointerdown', { ...panStart, bubbles: true, button: 0, pointerId: 12 }))
  svg.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      buttons: 1,
      clientX: panStart.clientX - 40,
      clientY: panStart.clientY,
      pointerId: 12
    })
  )
  svg.dispatchEvent(
    new PointerEvent('pointerup', {
      bubbles: true,
      clientX: panStart.clientX - 40,
      clientY: panStart.clientY,
      pointerId: 12
    })
  )

  const card = container.querySelector<SVGGElement>('[data-artefact-id="CARD-A"]')
  if (!card) throw new Error('rendered Card fixture is incomplete')
  card.dispatchEvent(new PointerEvent('pointerdown', { ...screenAt(130, 195), bubbles: true, pointerId: 13 }))
  window.dispatchEvent(new PointerEvent('pointermove', { ...screenAt(170, 205), bubbles: true, pointerId: 13 }))
  window.dispatchEvent(new PointerEvent('pointerup', { ...screenAt(170, 205), bubbles: true, pointerId: 13 }))

  await expect.poll(() => card.getAttribute('transform')).toBe('translate(120 180)')
  await expect.poll(() => container.querySelector('.infoschematic-route')?.getAttribute('d')).toBe('M220 205 H360 V195')
})

test('materialised route drafts and newly created endpoints preserve dependent geometry', async () => {
  const baseFlow = config.infoschematic.flows[0]
  if (!baseFlow) throw new Error('dependent geometry fixture has no authored Flow')
  const draftedFlow = {
    ...baseFlow,
    points: [
      { x: 180, y: 195 },
      { x: 280, y: 195 },
      { x: 280, y: 235 },
      { x: 360, y: 235 }
    ]
  }
  const drafted = await render(
    <Canvas
      artefactOperations={[
        { operation: 'replace-properties', target: flowA, value: draftedFlow },
        {
          geometry: { box: { height: 50, width: 100, x: 120, y: 180 }, role: 'box' },
          operation: 'move',
          target: cardA
        }
      ]}
      config={config}
      mode="design"
    />
  )
  await expect
    .poll(() => drafted.container.querySelector('[data-artefact-id="FLOW-A"] .infoschematic-route')?.getAttribute('d'))
    .toBe('M220 205 H280 V235 H360')
  await drafted.unmount()

  const createdCard = {
    code: 'CARD-C',
    detail: 'Created source',
    id: 'card-c',
    label: 'Card C',
    placement: { box: { height: 50, width: 100, x: 40, y: 40 }, ports: { east: 1 } },
    scope: 'scope',
    scopes: ['scope']
  }
  const createdFlow = {
    code: 'FLOW-C',
    family: 'request',
    id: 'flow-c',
    points: [
      { x: 140, y: 65 },
      { x: 360, y: 195 }
    ],
    source: 'card-c',
    sourcePort: 'E1' as const,
    target: 'card-b',
    targetPort: 'W1' as const
  }
  const createdCardSelection = {
    code: createdCard.code,
    geometry: 'box',
    id: createdCard.code,
    kind: 'card'
  } as const satisfies ArtefactSelection
  const createdFlowSelection = {
    code: createdFlow.code,
    geometry: 'route',
    id: createdFlow.code,
    kind: 'flow'
  } as const satisfies ArtefactSelection
  const created = await render(
    <Canvas
      artefactOperations={[
        { at: 3, operation: 'create', target: createdCardSelection, value: createdCard },
        { at: 2, operation: 'create', target: createdFlowSelection, value: createdFlow },
        {
          geometry: { box: { height: 50, width: 100, x: 80, y: 60 }, role: 'box' },
          operation: 'move',
          target: createdCardSelection
        }
      ]}
      config={config}
      mode="design"
    />
  )
  await expect
    .poll(() => created.container.querySelector('[data-artefact-id="CARD-C"]')?.getAttribute('transform'))
    .toBe('translate(80 60)')
  await expect
    .poll(() => created.container.querySelector('[data-artefact-id="FLOW-C"] .infoschematic-route')?.getAttribute('d'))
    .toBe('M180 85 H360 V195')
})

test('Flow attachment and route-label gestures reach the rendered editing callbacks', async () => {
  const { container } = await render(<RouteInteractionHarness initialSelection={flowA} />)
  const svg = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  if (!svg) throw new Error('rendered Flow fixture is incomplete')
  const events = () => container.querySelector('[data-testid="route-events"]')?.textContent ?? ''
  const port = (name: string) =>
    [...container.querySelectorAll<SVGGElement>('.audit-port')].find((candidate) => candidate.textContent === name)
  const source = port('CARD-A:E1')
  const destination = port('CARD-A:N1')
  if (!source || !destination) throw new Error('rendered attachment ports are incomplete')

  source.dispatchEvent(new PointerEvent('pointerdown', { ...screenPoint(svg, 180, 195), bubbles: true, pointerId: 14 }))
  window.dispatchEvent(new PointerEvent('pointermove', { ...screenPoint(svg, 130, 170), bubbles: true, pointerId: 14 }))
  window.dispatchEvent(new PointerEvent('pointerup', { ...screenPoint(svg, 130, 170), bubbles: true, pointerId: 14 }))
  await expect.poll(events).toContain('attach:FLOW-A:source:CARD-A:N1')

  const label = container.querySelector<SVGGElement>('.audit-flow.selected')
  if (!label) throw new Error('selected Flow has no rendered route label')
  label.dispatchEvent(new PointerEvent('pointerdown', { ...screenPoint(svg, 270, 195), bubbles: true, pointerId: 15 }))
  window.dispatchEvent(new PointerEvent('pointermove', { ...screenPoint(svg, 300, 195), bubbles: true, pointerId: 15 }))
  window.dispatchEvent(new PointerEvent('pointerup', { ...screenPoint(svg, 300, 195), bubbles: true, pointerId: 15 }))
  await expect.poll(events).toContain('label:FLOW-A|label-release')
})

test('Waypoint and interior-segment gestures share one rendered route lifecycle', async () => {
  const { container } = await render(<RouteInteractionHarness initialSelection={adapterFlow} />)
  const svg = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  const waypoint = container.querySelector<SVGCircleElement>('.route-waypoint')
  const segment = container.querySelector<SVGRectElement>('.route-segment-grip')
  if (!svg || !waypoint || !segment) throw new Error('rendered routed Flow fixture is incomplete')
  const events = () => container.querySelector('[data-testid="route-events"]')?.textContent ?? ''

  waypoint.dispatchEvent(
    new PointerEvent('pointerdown', { ...screenPoint(svg, 280, 227.5), bubbles: true, pointerId: 16 })
  )
  window.dispatchEvent(new PointerEvent('pointermove', { ...screenPoint(svg, 300, 240), bubbles: true, pointerId: 16 }))
  window.dispatchEvent(new PointerEvent('pointerup', { ...screenPoint(svg, 300, 240), bubbles: true, pointerId: 16 }))
  await expect.poll(events).toContain('waypoint:FLOW-ADAPTER:1|route-release')

  segment.dispatchEvent(
    new PointerEvent('pointerdown', { ...screenPoint(svg, 280, 211), bubbles: true, pointerId: 17 })
  )
  window.dispatchEvent(new PointerEvent('pointermove', { ...screenPoint(svg, 300, 211), bubbles: true, pointerId: 17 }))
  window.dispatchEvent(new PointerEvent('pointerup', { ...screenPoint(svg, 300, 211), bubbles: true, pointerId: 17 }))
  await expect.poll(events).toContain('segment:FLOW-ADAPTER:1')
})

/*
 * Hit testing rather than markup, because that is the part a Producer feels.
 *
 * `elementFromPoint` answers with whatever the browser would have delivered the press to, so it sees `pointer-events`
 * exactly as a pointer does - which is the only way to show that a closed layer stops standing in the way, rather
 * than merely stops listening.
 */
const atPoint = (svg: SVGSVGElement, x: number, y: number) => {
  const { clientX, clientY } = screenPoint(svg, x, y)
  return document.elementFromPoint(clientX, clientY)
}

const artefactAt = (svg: SVGSVGElement, x: number, y: number) =>
  atPoint(svg, x, y)?.closest('[data-artefact-id]')?.getAttribute('data-artefact-id') ?? null

test('an open Flow layer offers a port over the Card edge beneath it', async () => {
  const { container } = await render(<LayeredHarness layers={everyInteractionLayer()} />)
  const svg = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  if (!svg) throw new Error('rendered fixture is incomplete')

  // CARD-A runs to x=180 and carries E1 there, so its own edge and the port's target circle share this point.
  expect(atPoint(svg, 176, 195)?.closest('.audit-port')).not.toBeNull()
  expect(artefactAt(svg, 176, 195)).toBeNull()
})

test('closing the Flow layer hands the Card edge back to the Card', async () => {
  const { container } = await render(
    <LayeredHarness layers={toggleInteractionLayer(everyInteractionLayer(), 'flow')} />
  )
  const svg = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  if (!svg) throw new Error('rendered fixture is incomplete')

  expect(artefactAt(svg, 176, 195)).toBe('CARD-A')
  expect(container.querySelector('.audit-port')).toBeNull()
  // The route itself is still drawn, and still no longer answers.
  expect(container.querySelector('[data-artefact-id="FLOW-A"]')?.getAttribute('class')).toContain('layer-inert')
  expect(atPoint(svg, 270, 195)?.closest('[data-artefact-id="FLOW-A"]')).toBeNull()
  // So is the code chip, which is read as well as dragged: it keeps its place and loses only the drag.
  const chip = container.querySelector<SVGGElement>('.audit-flow')
  expect(chip?.getAttribute('class')).toContain('layer-inert')
  const box = chip?.getBoundingClientRect()
  if (!box) throw new Error('the Flow code chip is not rendered')
  expect(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)?.closest('.audit-flow')).toBeNull()
})

test('a closed Card layer leaves the Card drawn, unreachable, and unselectable', async () => {
  const { container } = await render(
    <LayeredHarness layers={toggleInteractionLayer(everyInteractionLayer(), 'card')} />
  )
  const svg = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  const card = container.querySelector<SVGGElement>('[data-artefact-id="CARD-A"]')
  if (!svg || !card) throw new Error('rendered fixture is incomplete')

  expect(card.getAttribute('class')).toContain('layer-inert')
  expect(card.getAttribute('tabindex')).toBeNull()
  expect(artefactAt(svg, 130, 195)).toBeNull()

  const { clientX, clientY } = screenPoint(svg, 130, 195)
  card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX, clientY, pointerId: 40 }))
  await expect.poll(() => container.querySelector('[data-testid="layer-events"]')?.textContent).toBe('')
})

/*
 * Several elements held at once, where the three things that could go wrong are all about a press.
 *
 * Shift has to add without dragging, an ordinary press on something already held has to move the group rather than
 * reduce the selection to the one element pressed, and a sweep has to find what it covered from the geometry the
 * diagram drew rather than from what happens to be on top.
 */
function GroupHarness({ initial }: { initial: ArtefactSelectionSet }) {
  const [held, setHeld] = useState<ArtefactSelectionSet>(initial)
  const [events, setEvents] = useState<string[]>([])
  const record = (event: string) => setEvents((current) => [...current, event])
  return (
    <>
      <Canvas
        config={config}
        mode="design"
        onArtefactExtend={(selection) => {
          setHeld((current) => toggleArtefactSelection(current, selection))
          record(`extend:${selection.id}`)
        }}
        // Rounded here rather than asserted to the unit: the offset is a real screen-to-diagram conversion, and the
        // subject is how far the group was asked to move.
        onArtefactGroupMove={(offset) => record(`group:${Math.round(offset.dx)}:${Math.round(offset.dy)}`)}
        onArtefactMove={(selection) => record(`move:${selection.id}`)}
        onArtefactRange={(selections) => record(`range:${selections.map((selection) => selection.id).join('+')}`)}
        onArtefactSelect={(selection) => {
          setHeld(selection ? [selection] : [])
          record(`select:${selection?.id ?? 'none'}`)
        }}
        selectedArtefact={held[0] ?? null}
        selectionSet={held}
      />
      <output data-testid="group-events">{events.join('|')}</output>
    </>
  )
}

const cardB = {
  code: 'CARD-B',
  geometry: 'box',
  id: 'CARD-B',
  kind: 'card'
} as const satisfies ArtefactSelection

test('Shift adds an element to the held group by pointer and by keyboard, and takes it back out', async () => {
  const { container } = await render(<GroupHarness initial={[cardA]} />)
  const svg = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  const second = container.querySelector<SVGGElement>('[data-artefact-id="CARD-B"]')
  if (!svg || !second) throw new Error('rendered group fixture is incomplete')
  const events = () => container.querySelector('[data-testid="group-events"]')?.textContent ?? ''
  const classOf = (id: string) => container.querySelector(`[data-artefact-id="${id}"]`)?.getAttribute('class') ?? ''

  second.dispatchEvent(
    new PointerEvent('pointerdown', { ...screenPoint(svg, 410, 195), bubbles: true, pointerId: 50, shiftKey: true })
  )
  await expect.poll(events).toBe('extend:CARD-B')
  // The anchor keeps the ordinary selected treatment, because it is what an alignment brings the others onto.
  await expect.poll(() => classOf('CARD-B')).toContain('group-held')
  expect(classOf('CARD-A')).toContain('selected')
  expect(classOf('CARD-A')).not.toContain('group-held')

  second.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', shiftKey: true }))
  await expect.poll(events).toBe('extend:CARD-B|extend:CARD-B')
  await expect.poll(() => classOf('CARD-B')).not.toContain('group-held')
})

test('a press on a held element moves the whole group and does not reduce the selection to it', async () => {
  const { container } = await render(<GroupHarness initial={[cardA, cardB]} />)
  const svg = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  const second = container.querySelector<SVGGElement>('[data-artefact-id="CARD-B"]')
  if (!svg || !second) throw new Error('rendered group fixture is incomplete')
  const events = () => container.querySelector('[data-testid="group-events"]')?.textContent ?? ''

  second.dispatchEvent(new PointerEvent('pointerdown', { ...screenPoint(svg, 410, 195), bubbles: true, pointerId: 51 }))
  window.dispatchEvent(new PointerEvent('pointermove', { ...screenPoint(svg, 460, 215), bubbles: true, pointerId: 51 }))
  window.dispatchEvent(new PointerEvent('pointerup', { ...screenPoint(svg, 460, 215), bubbles: true, pointerId: 51 }))

  // One group offset, and neither a single move nor a selection change: the group survived the press it was made for.
  await expect.poll(events).toBe('group:50:20')
})

test('a Shift sweep gathers what it crossed and leaves an Adapter to the Card it holds', async () => {
  const { container } = await render(<GroupHarness initial={[]} />)
  const svg = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  const backdrop = container.querySelector<SVGRectElement>('.infoschematic-backdrop')
  if (!svg || !backdrop) throw new Error('rendered group fixture is incomplete')
  const events = () => container.querySelector('[data-testid="group-events"]')?.textContent ?? ''

  backdrop.dispatchEvent(
    new PointerEvent('pointerdown', { ...screenPoint(svg, 20, 150), bubbles: true, pointerId: 52, shiftKey: true })
  )
  window.dispatchEvent(
    new PointerEvent('pointermove', { ...screenPoint(svg, 500, 240), bubbles: true, pointerId: 52, shiftKey: true })
  )
  await expect.poll(() => container.querySelector('.infoschematic-range-band')).not.toBeNull()

  window.dispatchEvent(
    new PointerEvent('pointerup', { ...screenPoint(svg, 500, 240), bubbles: true, pointerId: 52, shiftKey: true })
  )
  // ADAPTER-A covers the same ground and is absent: it moves through the Card it holds, which the sweep already took.
  await expect.poll(events).toBe('range:CARD-A+CARD-B')
  await expect.poll(() => container.querySelector('.infoschematic-range-band')).toBeNull()
})

/*
 * A Card emphasised while a neighbour overlaps the line the emphasis runs on.
 *
 * `CARD-A`'s perimeter is outset six, which puts its right edge at x=186 — inside `CARD-B`, which the Dynamic says
 * nothing about. The emphasis layer is drawn last, so at that point the travelling mark is the topmost thing in the
 * document, and the state depiction keeps it there for as long as the test needs rather than retiring mid-assertion.
 */
const emphasisPointerConfig = defineInfoschematicModel({
  id: 'emphasis-pointer',
  title: 'Emphasis pointer safety',
  diagram: {
    bounds: { height: 320, width: 640, x: 0, y: 0 },
    gridSize: 10,
    cards: [
      { id: 'CARD-A', label: 'Card A', bounds: { height: 50, width: 100, x: 80, y: 170 } },
      { id: 'CARD-B', label: 'Card B', bounds: { height: 50, width: 100, x: 176, y: 170 } }
    ],
    dynamics: [
      {
        id: 'attention',
        label: 'Card A needs attention',
        kind: 'emphasise-elements',
        elements: ['CARD-A'],
        depicts: 'state'
      }
    ]
  }
})

function EmphasisPointerHarness() {
  const [selected, setSelected] = useState<ArtefactSelection | null>(null)
  const [events, setEvents] = useState<string[]>([])
  return (
    <>
      <Canvas
        config={emphasisPointerConfig}
        dynamics={[{ dynamicId: 'attention', occurrenceKey: 'hold-1' }]}
        mode="design"
        onArtefactSelect={(selection) => {
          setSelected(selection)
          setEvents((current) => [...current, `select:${selection?.id ?? 'none'}`])
        }}
        selectedArtefact={selected}
      />
      <output data-testid="emphasis-events">{events.join('|')}</output>
    </>
  )
}

test('a travelling emphasis answers no pointer, so the element under its line still takes the press', async () => {
  const { container } = await render(<EmphasisPointerHarness />)
  const svg = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  if (!svg) throw new Error('rendered fixture is incomplete')
  const emphasis = container.querySelector<SVGGElement>('.infoschematic-element-emphasis[data-artefact-id="CARD-A"]')
  const mark = emphasis?.querySelector<SVGCircleElement>('.infoschematic-element-emphasis-mark')
  if (!emphasis || !mark) throw new Error('the emphasised Card has no travelling mark')

  // Inherited from the group rather than stated on the mark, which is why the mark is asked separately: a moving
  // element that answered the pointer would make a Card intermittently unclickable, once per circuit.
  expect(getComputedStyle(emphasis).pointerEvents).toBe('none')
  expect(getComputedStyle(mark).pointerEvents).toBe('none')

  expect(atPoint(svg, 186, 195)?.closest('.infoschematic-element-emphasis')).toBeNull()
  expect(artefactAt(svg, 186, 195)).toBe('CARD-B')

  const beneath = atPoint(svg, 186, 195)
  const { clientX, clientY } = screenPoint(svg, 186, 195)
  beneath?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX, clientY, pointerId: 60 }))
  await expect.poll(() => container.querySelector('[data-testid="emphasis-events"]')?.textContent).toBe('select:CARD-B')
})
