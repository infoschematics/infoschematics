import { readFile } from 'node:fs/promises'
import { defineInfoschematic } from '@infoschematics/domain-core'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Canvas } from './Canvas.tsx'
import { advanceFlowSignalAnnouncement, flowSignalKey, reconcileFlowSignals } from './flow-signals.ts'

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
        prefix: 'SYS'
      }
    ],
    flowFamilies: [{ color: '#7c3aed', description: 'Requests', id: 'request', label: 'Request', prefix: 'REQ' }],
    cards: [
      {
        code: 'SYS-001',
        detail: 'Source',
        id: 'source',
        label: 'Source',
        placement: { box: { height: 60, width: 120, x: 20, y: 40 }, ports: {} },
        scope: 'system',
        scopes: ['system']
      },
      {
        code: 'SYS-002',
        detail: 'Target',
        id: 'target',
        label: 'Target',
        placement: { box: { height: 60, width: 120, x: 260, y: 40 }, ports: {} },
        scope: 'system',
        scopes: ['system']
      }
    ],
    flows: [
      {
        code: 'REQ-001',
        family: 'request',
        id: 'request-flow',
        points: [
          { x: 140, y: 70 },
          { x: 260, y: 70 }
        ],
        source: 'source',
        sourcePort: 'E1',
        target: 'target',
        targetPort: 'W1'
      }
    ]
  }
})

describe('Canvas Flow signals', () => {
  it('renders a finite decorative pulse while preserving route geometry', () => {
    const signals = [{ flowId: 'request-flow', occurrenceKey: 'scene:1' }]
    const markup = renderToStaticMarkup(<Canvas config={config} signals={signals} />)

    expect(renderToStaticMarkup(<Canvas config={config} signals={signals} />)).toBe(markup)
    expect(markup).toContain('data-occurrence-key="scene:1"')
    expect(markup).toContain('class="infoschematic-flow-signal"')
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).toContain('class="infoschematic-flow-signal-pulse" opacity="0" r="5"')
    expect(markup).toContain('<animate attributeName="opacity" dur="900ms" fill="freeze" values="0;1;1;0"></animate>')
    expect(markup).toContain('<animateMotion dur="900ms" fill="freeze" path="M140 70 H260"></animateMotion>')
    expect(markup).toContain('class="infoschematic-route" d="M140 70 H260"')
    expect(markup).toContain('class="infoschematic-route-hit" d="M140 70 H260"')
    expect(markup).toContain('aria-live="polite"')
    expect(markup).not.toContain('signalled.')
  })

  it('ignores unknown Flow ids without changing the stable route', () => {
    const markup = renderToStaticMarkup(
      <Canvas config={config} signals={[{ flowId: 'missing', occurrenceKey: 'external:1' }]} />
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
    const seen = new Set([flowSignalKey(first)])

    const hidden = reconcileFlowSignals([first], [first], new Set(), seen)
    const restored = reconcileFlowSignals(hidden.activeSignals, [first], new Set(['request-flow']), seen)
    const newOccurrence = reconcileFlowSignals(restored.activeSignals, [replay], new Set(['request-flow']), seen)

    expect(hidden).toEqual({ acceptedSignals: [], activeSignals: [] })
    expect(restored).toEqual({ acceptedSignals: [], activeSignals: [] })
    expect(newOccurrence).toEqual({ acceptedSignals: [replay], activeSignals: [replay] })
  })

  it('deduplicates occurrences and distinguishes identifier pairs that contain separators', () => {
    const left = { flowId: 'request-flow:scene', occurrenceKey: '1' }
    const right = { flowId: 'request-flow', occurrenceKey: 'scene:1' }
    const seen = new Set<string>()
    const result = reconcileFlowSignals(
      [],
      [left, left, right, right],
      new Set(['request-flow:scene', 'request-flow']),
      seen
    )

    expect(flowSignalKey(left)).not.toBe(flowSignalKey(right))
    expect(result).toEqual({ acceptedSignals: [left, right], activeSignals: [left, right] })
  })

  it('accepts each occurrence once while supporting replay, simultaneous signals, and cancellation', () => {
    const first = { flowId: 'request-flow', occurrenceKey: 'scene:1' }
    const replay = { flowId: 'request-flow', occurrenceKey: 'scene:2' }
    const simultaneous = { flowId: 'secondary-flow', occurrenceKey: 'scene:2' }
    const shown = new Set(['request-flow', 'secondary-flow'])
    const seen = new Set<string>()

    const started = reconcileFlowSignals([], [first, first], shown, seen)
    const unchanged = reconcileFlowSignals(started.activeSignals, [first], shown, seen)
    const replayed = reconcileFlowSignals(unchanged.activeSignals, [replay, simultaneous], shown, seen)
    const cancelled = reconcileFlowSignals(replayed.activeSignals, [], shown, seen)

    expect(started).toEqual({ acceptedSignals: [first], activeSignals: [first] })
    expect(unchanged).toEqual({ acceptedSignals: [], activeSignals: [first] })
    expect(replayed).toEqual({
      acceptedSignals: [replay, simultaneous],
      activeSignals: [replay, simultaneous]
    })
    expect(cancelled).toEqual({ acceptedSignals: [], activeSignals: [] })
  })

  it('announces only newly accepted occurrences and revises same-Flow replay messages', () => {
    const first = { flowId: 'request-flow', occurrenceKey: 'scene:1' }
    const replay = { flowId: 'request-flow', occurrenceKey: 'scene:2' }
    const added = { flowId: 'secondary-flow', occurrenceKey: 'scene:2' }

    const initial = advanceFlowSignalAnnouncement(undefined, [first], [first])
    const retained = advanceFlowSignalAnnouncement(initial, [], [first])
    const replayed = advanceFlowSignalAnnouncement(retained, [replay], [replay])
    const extended = advanceFlowSignalAnnouncement(replayed, [added], [replay, added])
    const cancelled = advanceFlowSignalAnnouncement(extended, [], [])

    expect(initial).toEqual({ revision: 1, signals: [first] })
    expect(retained).toBe(initial)
    expect(replayed).toEqual({ revision: 2, signals: [replay] })
    expect(replayed).not.toEqual(initial)
    expect(extended).toEqual({ revision: 3, signals: [added] })
    expect(cancelled).toBeUndefined()
  })

  it('preserves Flow highlighting, hover, and selection while signalling', () => {
    const markup = renderToStaticMarkup(
      <Canvas
        config={config}
        highlight={{ endpoints: new Set(), flows: new Set(['request-flow']) }}
        hovered="REQ-001"
        selected="REQ-001"
        signals={[{ flowId: 'request-flow', occurrenceKey: 'scene:1' }]}
      />
    )

    expect(markup).toContain('class="flow-family-request highlighted selected pointed"')
    expect(markup).toContain('class="infoschematic-flow-signal"')
    expect(markup).toContain('class="infoschematic-route-hit"')
  })
})
