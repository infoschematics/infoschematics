import { readFile } from 'node:fs/promises'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { defineInfoschematic } from '@infoschematics/domain-core'
import { Canvas, reconcileFlowSignals } from './Canvas.tsx'

const config = defineInfoschematic({
  title: 'Signal reference',
  infoschematic: {
    scopes: [
      {
        color: '#2463eb',
        description: 'Visible',
        fill: '#dbeafe',
        id: 'system',
        label: 'System',
        prefix: 'SYS',
      },
    ],
    flowFamilies: [
      { color: '#7c3aed', description: 'Requests', id: 'request', label: 'Request', prefix: 'REQ' },
    ],
    cards: [
      {
        code: 'SYS-001',
        detail: 'Source',
        id: 'source',
        label: 'Source',
        placement: { box: { height: 60, width: 120, x: 20, y: 40 }, ports: {} },
        scope: 'system',
        scopes: ['system'],
      },
      {
        code: 'SYS-002',
        detail: 'Target',
        id: 'target',
        label: 'Target',
        placement: { box: { height: 60, width: 120, x: 260, y: 40 }, ports: {} },
        scope: 'system',
        scopes: ['system'],
      },
    ],
    flows: [
      {
        code: 'REQ-001',
        family: 'request',
        id: 'request-flow',
        points: [
          { x: 140, y: 70 },
          { x: 260, y: 70 },
        ],
        source: 'source',
        sourcePort: 'E1',
        target: 'target',
        targetPort: 'W1',
      },
    ],
  },
})

describe('Canvas Flow signals', () => {
  it('renders a finite decorative pulse while preserving route geometry and announcing meaning', () => {
    const signals = [{ flowId: 'request-flow', occurrenceKey: 'scene:1' }]
    const markup = renderToStaticMarkup(<Canvas config={config} signals={signals} />)

    expect(renderToStaticMarkup(<Canvas config={config} signals={signals} />)).toBe(markup)
    expect(markup).toContain('data-occurrence-key="scene:1"')
    expect(markup).toContain('class="infoschematic-flow-signal"')
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).toContain('<animateMotion dur="900ms" fill="freeze" path="M140 70 H260"></animateMotion>')
    expect(markup).toContain('class="infoschematic-route" d="M140 70 H260"')
    expect(markup).toContain('class="infoschematic-route-hit" d="M140 70 H260"')
    expect(markup).toContain('aria-live="polite"')
    expect(markup).toContain('Flow REQ-001, Source to Target, signalled.')
  })

  it('ignores unknown Flow ids without changing the stable route', () => {
    const markup = renderToStaticMarkup(
      <Canvas config={config} signals={[{ flowId: 'missing', occurrenceKey: 'external:1' }]} />,
    )

    expect(markup).not.toContain('data-occurrence-key=')
    expect(markup).not.toContain('signalled.</p>')
    expect(markup).toContain('class="infoschematic-route" d="M140 70 H260"')
  })

  it('provides an in-place reduced-motion treatment', async () => {
    const styles = await readFile(new URL('./styles.css', import.meta.url), 'utf8')

    expect(styles).toContain('@media (prefers-reduced-motion: reduce)')
    expect(styles).toContain('.infoschematic-flow-signal-pulse')
    expect(styles).toContain('display: none;')
    expect(styles).toContain('animation: infoschematic-signal-emphasis 900ms ease-out both;')
  })

  it('does not replay a consumed occurrence when filtering hides then restores its Flow', () => {
    const first = { flowId: 'request-flow', occurrenceKey: 'scene:1' }
    const replay = { flowId: 'request-flow', occurrenceKey: 'scene:2' }
    const seen = new Set(['request-flow:scene:1'])

    const hidden = reconcileFlowSignals([first], [first], new Set(), seen)
    const restored = reconcileFlowSignals(hidden, [first], new Set(['request-flow']), seen)
    const newOccurrence = reconcileFlowSignals(restored, [replay], new Set(['request-flow']), seen)

    expect(hidden).toEqual([])
    expect(restored).toEqual([])
    expect(newOccurrence).toEqual([replay])
  })
})
