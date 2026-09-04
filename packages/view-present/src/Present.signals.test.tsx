import { defineInfoschematic } from '@infoschematics/domain-core'
import type { FlowSignal } from '@infoschematics/view-model/signals'
import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createPresentationState, derivePresentation, reducePresentation } from './presentation.ts'

const mockUsePresentation = vi.hoisted(() => vi.fn())

vi.mock('./use-presentation.ts', () => ({
  usePresentation: mockUsePresentation
}))

vi.mock('@infoschematics/view-canvas', () => ({
  Canvas: ({
    children,
    signals = []
  }: Readonly<{
    children?: ReactNode
    signals?: readonly FlowSignal[]
  }>) =>
    createElement(
      'output',
      { 'data-testid': 'canvas-signals' },
      ...signals.map((signal) =>
        createElement('i', {
          'data-flow-id': signal.flowId,
          'data-occurrence-key': signal.occurrenceKey,
          key: JSON.stringify([signal.flowId, signal.occurrenceKey])
        })
      ),
      children
    )
}))

import { Present } from './Present.tsx'

describe('Present signal wiring', () => {
  it('passes derived Scene signal occurrences into Canvas', () => {
    const config = defineInfoschematic({
      title: 'Signal wiring',
      infoschematic: {
        scopes: [
          {
            id: 'scope',
            prefix: 'S',
            label: 'Scope',
            description: 'A scope',
            color: '#1199ff',
            fill: '#113355'
          }
        ],
        flowFamilies: [
          {
            id: 'delivery',
            prefix: 'D',
            label: 'Delivery',
            description: 'A delivery flow',
            color: '#44cc88'
          }
        ],
        cards: [
          {
            id: 'source',
            code: 'S-001',
            detail: 'Sends delivery',
            label: 'Source',
            scope: 'scope',
            scopes: ['scope'],
            placement: {
              box: { x: 0, y: 0, width: 100, height: 60 },
              ports: { east: 1 }
            }
          },
          {
            id: 'target',
            code: 'S-002',
            detail: 'Receives delivery',
            label: 'Target',
            scope: 'scope',
            scopes: ['scope'],
            placement: {
              box: { x: 200, y: 0, width: 100, height: 60 },
              ports: { west: 1 }
            }
          }
        ],
        flows: [
          {
            id: 'delivery-flow',
            code: 'D-001',
            family: 'delivery',
            source: 'source',
            sourcePort: 'E1',
            target: 'target',
            targetPort: 'W1',
            points: [
              { x: 100, y: 30 },
              { x: 200, y: 30 }
            ]
          }
        ]
      },
      standaloneScenes: [
        {
          id: 'scene',
          code: 'SCENE-001',
          label: 'Scene',
          description: 'Signals delivery',
          focus: { flows: ['delivery-flow'] }
        }
      ]
    })

    mockUsePresentation.mockImplementationOnce((runtime, signalPolicy) => {
      const entered = reducePresentation(createPresentationState(runtime), {
        type: 'toggle-standalone-scene',
        scene: runtime.standaloneScenes[0]!
      })

      return {
        derived: derivePresentation(runtime, entered, signalPolicy),
        dispatch: vi.fn(),
        state: entered
      }
    })

    const markup = renderToStaticMarkup(<Present config={config} />)

    expect(markup).toContain('data-testid="canvas-signals"')
    expect(markup).toContain('data-flow-id="delivery-flow"')
    expect(markup).toContain('data-occurrence-key="present-scene-1"')
  })
})
