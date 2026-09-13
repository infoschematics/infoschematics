import { defineInfoschematic } from '@infoschematics/domain-core'
import type { ArtefactDraftOperation } from '@infoschematics/view-model/artefact-draft'
import type { ArtefactSelection } from '@infoschematics/view-model/editable'
import { useState } from 'react'
import { expect, test } from 'vitest'
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

function EditingHarness() {
  const [operations, setOperations] = useState<readonly ArtefactDraftOperation[]>([])
  return (
    <Canvas
      artefactOperations={operations}
      config={config}
      mode="design"
      onArtefactMove={(selection, point) =>
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
      }
      onArtefactSelect={() => undefined}
      selectedArtefact={cardA}
    />
  )
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
