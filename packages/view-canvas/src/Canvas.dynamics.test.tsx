import { readFile } from 'node:fs/promises'
import { defineInfoschematicModel } from '@infoschematics/domain-core'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Canvas } from './Canvas.tsx'
import {
  advanceElementEmphasisAnnouncement,
  elementEmphasisDuration,
  elementEmphasisKey,
  reconcileElementEmphasis,
  retireElementEmphasis
} from './element-emphasis.ts'

const config = defineInfoschematicModel({
  id: 'dynamics-reference',
  title: 'Dynamics reference',
  diagram: {
    bounds: { height: 200, width: 420, x: 0, y: 0 },
    gridSize: 10,
    regions: [{ id: 'ZONE', label: 'Zone', bounds: { height: 140, width: 380, x: 10, y: 20 } }],
    families: [{ id: 'request', label: 'Request', description: 'Requests', appearance: { color: '#7c3aed' } }],
    cards: [
      { id: 'SRC', label: 'Source', bounds: { height: 60, width: 120, x: 20, y: 40 } },
      { id: 'SNK', label: 'Sink', bounds: { height: 60, width: 120, x: 260, y: 40 } }
    ],
    flows: [
      {
        id: 'LOAD',
        family: 'request',
        source: { element: 'SRC', port: 'E1' },
        target: { element: 'SNK', port: 'W1' }
      }
    ],
    dynamics: [
      { id: 'delivered', label: 'Record delivered', kind: 'signal-flow', flows: ['LOAD'] },
      { id: 'attention', label: 'Sink needs attention', kind: 'emphasise-elements', elements: ['SNK', 'ZONE'] }
    ]
  },
  scopes: [
    { id: 'shown', label: 'Shown', elements: ['SRC'] },
    { id: 'hidden', label: 'Hidden', elements: ['SNK'] }
  ]
})

const occurrence = { dynamicId: 'attention', occurrenceKey: 'run-1' }

describe('Canvas Diagram Dynamics', () => {
  it('draws an emphasis layer for each element the occurrence names, leaving their own output alone', () => {
    const quiet = renderToStaticMarkup(<Canvas config={config} />)
    const markup = renderToStaticMarkup(<Canvas config={config} dynamics={[occurrence]} />)

    expect(quiet).not.toContain('infoschematic-element-emphasis')
    expect(markup).toContain('data-dynamic-id="attention"')
    expect(markup).toContain('data-artefact-id="SNK" data-dynamic-id="attention" data-emphasised="true"')
    expect(markup).toContain('data-artefact-id="ZONE" data-dynamic-id="attention" data-emphasised="true"')
    expect(markup.match(/data-occurrence-key="run-1"/g)).toHaveLength(2)
    expect(markup.match(/class="infoschematic-element-emphasis"/g)).toHaveLength(2)
    expect(markup).toContain('aria-hidden="true"')
    // The Card and the Region still draw exactly what they drew without the occurrence.
    expect(markup).toContain('aria-label="Region Zone"')
    for (const fragment of quiet.split('<g ').slice(1)) {
      if (fragment.startsWith('aria-label="Region Zone"')) expect(markup).toContain(fragment.slice(0, 200))
    }
  })

  it('carries a polite status region for the Dynamic, kept out of the decorative graphics', () => {
    const markup = renderToStaticMarkup(<Canvas config={config} dynamics={[occurrence]} />)

    // Server markup holds no announcement for a Dynamic any more than it does for a Flow signal: the text is written
    // when the occurrence is accepted, which is a mounted effect. The live region it is written into is here.
    expect(markup.match(/aria-live="polite" class="infoschematic-signal-announcement" role="status"/g)).toHaveLength(2)
    expect(markup).not.toContain('Sink needs attention')
  })

  it('resolves a signal-flow Dynamic into the Flow signal a host could have supplied directly', () => {
    const viaDynamic = renderToStaticMarkup(
      <Canvas config={config} dynamics={[{ dynamicId: 'delivered', occurrenceKey: 'run-1' }]} />
    )
    const viaSignal = renderToStaticMarkup(
      <Canvas config={config} signals={[{ flowId: 'LOAD', occurrenceKey: 'run-1' }]} />
    )

    expect(viaDynamic).toContain('class="infoschematic-flow-signal"')
    expect(viaDynamic).toContain('data-occurrence-key="run-1"')
    expect(viaDynamic).not.toContain('infoschematic-element-emphasis')
    expect(viaDynamic).toBe(viaSignal)
  })

  it('ignores an occurrence of a Dynamic the document does not declare', () => {
    const markup = renderToStaticMarkup(
      <Canvas config={config} dynamics={[{ dynamicId: 'absent', occurrenceKey: 'run-1' }]} />
    )

    expect(markup).toBe(renderToStaticMarkup(<Canvas config={config} />))
  })

  it('emphasises nothing the visible scopes hid, so an occurrence cannot reveal filtered content', () => {
    const markup = renderToStaticMarkup(
      <Canvas config={config} dynamics={[occurrence]} visibleScopes={new Set(['shown'])} />
    )

    expect(markup).not.toContain('data-artefact-id="SNK" data-dynamic-id="attention"')
    expect(markup).toContain('data-artefact-id="ZONE" data-dynamic-id="attention"')
  })

  it('provides a full-motion treatment and a still reduced-motion treatment from the shared tokens', async () => {
    const styles = await readFile(new URL('./styles.css', import.meta.url), 'utf8')

    expect(elementEmphasisDuration).toBe(900)
    expect(styles).toContain(
      'animation: infoschematic-element-emphasis var(--infoschematic-canvas-emphasis-duration) ease-out both;'
    )
    expect(styles).toContain('stroke: var(--infoschematic-canvas-emphasis-stroke);')
    expect(styles).toContain('@keyframes infoschematic-element-emphasis')
    expect(styles.slice(styles.indexOf('@media (prefers-reduced-motion: reduce)'))).toContain(
      '.infoschematic-element-emphasis > * {\n    animation: none;'
    )
  })

  it('accepts each emphasis once while supporting replay, cancellation, and hidden elements', () => {
    const first = { dynamicId: 'attention', elementId: 'SNK', occurrenceKey: 'run-1' }
    const replay = { dynamicId: 'attention', elementId: 'SNK', occurrenceKey: 'run-2' }
    const shown = new Set(['SNK', 'ZONE'])
    const seen = new Set<string>()

    const started = reconcileElementEmphasis([], [first, first], shown, seen)
    const unchanged = reconcileElementEmphasis(started.activeEmphasis, [first], shown, seen)
    const replayed = reconcileElementEmphasis(unchanged.activeEmphasis, [replay], shown, seen)
    const cancelled = reconcileElementEmphasis(replayed.activeEmphasis, [], shown, seen)
    const hidden = reconcileElementEmphasis([], [first], new Set(), seen)

    expect(started).toEqual({ acceptedEmphasis: [first], activeEmphasis: [first] })
    expect(unchanged).toEqual({ acceptedEmphasis: [], activeEmphasis: [first] })
    expect(replayed).toEqual({ acceptedEmphasis: [replay], activeEmphasis: [replay] })
    expect(cancelled).toEqual({ acceptedEmphasis: [], activeEmphasis: [] })
    expect(hidden).toEqual({ acceptedEmphasis: [], activeEmphasis: [] })
    expect(retireElementEmphasis([first, replay], [first])).toEqual([replay])
    expect(elementEmphasisKey(first)).not.toBe(elementEmphasisKey(replay))
  })

  it('announces only newly accepted emphasis and revises a replay of the same element', () => {
    const first = { dynamicId: 'attention', elementId: 'SNK', occurrenceKey: 'run-1' }
    const replay = { dynamicId: 'attention', elementId: 'SNK', occurrenceKey: 'run-2' }

    const initial = advanceElementEmphasisAnnouncement(undefined, [first], [first])
    const retained = advanceElementEmphasisAnnouncement(initial, [], [first])
    const replayed = advanceElementEmphasisAnnouncement(retained, [replay], [replay])
    const cancelled = advanceElementEmphasisAnnouncement(replayed, [], [])

    expect(initial).toEqual({ emphasis: [first], revision: 1 })
    expect(retained).toBe(initial)
    expect(replayed).toEqual({ emphasis: [replay], revision: 2 })
    expect(cancelled).toBeUndefined()
  })
})
