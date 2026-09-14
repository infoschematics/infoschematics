import { defineInfoschematic } from '@infoschematics/domain-core'
import type { ArtefactDraftOperation } from '@infoschematics/view-model/artefact-draft'
import type { ArtefactSelection } from '@infoschematics/view-model/editable'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from './Canvas.tsx'

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
      }
    ],
    scopes: [{ color: '#2463eb', description: 'Cards', fill: '#dbeafe', id: 'scope', label: 'Scope', prefix: 'CARD' }],
    viewBox: { height: 320, width: 640, x: 0, y: 0 }
  }
})

const cardA = {
  code: 'CARD-A',
  geometry: 'box',
  id: 'card-a',
  kind: 'card'
} as const satisfies ArtefactSelection

const flowA = {
  code: 'FLOW-A',
  geometry: 'route',
  id: 'flow-a',
  kind: 'flow'
} as const satisfies ArtefactSelection

const adapterFlow = {
  code: 'FLOW-ADAPTER',
  geometry: 'route',
  id: 'flow-adapter',
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
            geometry: {
              box: { height: 50, width: 100, x: point.x - 50, y: point.y - 25 },
              role: 'box'
            },
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
  const card = container.querySelector<SVGGElement>('[data-artefact-id="card-a"]')
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

test('dragging an Adapter moves its held Card and the Flow attached to the Adapter', async () => {
  const { container } = await render(<EditingHarness />)
  const svg = container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  const adapter = container.querySelector<SVGGElement>('[data-artefact-id="adapter-a"]')
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
    .poll(() => container.querySelector('[data-artefact-id="card-a"]')?.getAttribute('transform'))
    .toBe('translate(120 180)')
  await expect
    .poll(() => container.querySelector('[data-artefact-id="flow-adapter"] .infoschematic-route')?.getAttribute('d'))
    .toBe('M240 237.5 H280 V195 H360')
})

test('pointer cancellation and unmount remove active drag listeners', async () => {
  const moved = vi.fn()
  const released = vi.fn()
  const first = await render(<EditingHarness onMove={moved} onRelease={released} />)
  const svg = first.container.querySelector<SVGSVGElement>('svg.infoschematic-svg')
  const card = first.container.querySelector<SVGGElement>('[data-artefact-id="card-a"]')
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
  const secondCard = second.container.querySelector<SVGGElement>('[data-artefact-id="card-a"]')
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
  const card = container.querySelector<SVGGElement>('[data-artefact-id="card-a"]')
  const flow = container.querySelector<SVGGElement>('[data-artefact-id="flow-a"]')
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
  expect(events()).toContain('reorder:card-a:-1')
  expect(events()).toContain('remove:card-a')

  const resize = container.querySelector<SVGGElement>('[aria-label="Resize Card A"]')
  if (!resize) throw new Error('selected Card has no rendered resize control')
  resize.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }))
  await expect.poll(events).toContain('resize:card-a:101:')

  backdrop.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 10 }))
  await expect.poll(events).toContain('select:none')
  expect(container.querySelector('[data-artefact-id="card-a"]')?.classList.contains('going')).toBe(true)
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

  const card = container.querySelector<SVGGElement>('[data-artefact-id="card-a"]')
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
    .poll(() => drafted.container.querySelector('[data-artefact-id="flow-a"] .infoschematic-route')?.getAttribute('d'))
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
    id: createdCard.id,
    kind: 'card'
  } as const satisfies ArtefactSelection
  const createdFlowSelection = {
    code: createdFlow.code,
    geometry: 'route',
    id: createdFlow.id,
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
    .poll(() => created.container.querySelector('[data-artefact-id="card-c"]')?.getAttribute('transform'))
    .toBe('translate(80 60)')
  await expect
    .poll(() => created.container.querySelector('[data-artefact-id="flow-c"] .infoschematic-route')?.getAttribute('d'))
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
  await expect.poll(events).toContain('attach:FLOW-A:source:card-a:N1')

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
