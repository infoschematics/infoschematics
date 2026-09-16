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
      { id: 'attention', label: 'Sink needs attention', kind: 'emphasise-elements', elements: ['SNK', 'ZONE'] },
      {
        id: 'on-this-stage',
        label: 'We are on this stage',
        kind: 'emphasise-elements',
        elements: ['SNK', 'ZONE'],
        depicts: 'state'
      }
    ]
  },
  scopes: [
    { id: 'shown', label: 'Shown', elements: ['SRC'] },
    { id: 'hidden', label: 'Hidden', elements: ['SNK'] }
  ]
})

const occurrence = { dynamicId: 'attention', occurrenceKey: 'run-1' }
const held = { dynamicId: 'on-this-stage', occurrenceKey: 'run-1' }

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

  it('marks a state-depicting emphasis in the markup and leaves an event emitting exactly what it always did', () => {
    const event = renderToStaticMarkup(<Canvas config={config} dynamics={[occurrence]} />)
    const markup = renderToStaticMarkup(<Canvas config={config} dynamics={[held]} />)

    expect(event).not.toContain('data-depicts')
    expect(markup).toContain('data-artefact-id="SNK" data-depicts="state" data-dynamic-id="on-this-stage"')
    expect(markup).toContain('data-artefact-id="ZONE" data-depicts="state" data-dynamic-id="on-this-stage"')
    // The state is the only difference between the two renderings: same layer, same geometry, same class.
    expect(markup.replaceAll(' data-depicts="state"', '').replaceAll('on-this-stage', 'attention')).toBe(
      event.replaceAll('Sink needs attention', 'We are on this stage')
    )
  })

  it('ends a held occurrence by every route that ends an event, because a hold is still host-owned', () => {
    const scoped = renderToStaticMarkup(<Canvas config={config} dynamics={[held]} visibleScopes={new Set(['shown'])} />)
    // Scope filtering reaches a hold exactly as it reaches an event: the Card the Canvas did not draw is not held.
    expect(scoped).not.toContain('data-artefact-id="SNK" data-depicts="state"')
    expect(scoped).toContain('data-artefact-id="ZONE" data-depicts="state"')

    expect(renderToStaticMarkup(<Canvas config={config} dynamics={[]} />)).toBe(
      renderToStaticMarkup(<Canvas config={config} />)
    )

    const first = { depicts: 'state', dynamicId: 'on-this-stage', elementId: 'SNK', occurrenceKey: 'run-1' } as const
    const replay = { ...first, occurrenceKey: 'run-2' }
    const shown = new Set(['SNK', 'ZONE'])
    const seen = new Set<string>()

    const started = reconcileElementEmphasis([], [first], shown, seen)
    const replaced = reconcileElementEmphasis(started.activeEmphasis, [replay], shown, seen)
    const withdrawn = reconcileElementEmphasis(replaced.activeEmphasis, [], shown, seen)
    const hidden = reconcileElementEmphasis(replaced.activeEmphasis, [replay], new Set(), seen)

    expect(started.activeEmphasis).toEqual([first])
    expect(replaced.activeEmphasis).toEqual([replay])
    expect(withdrawn.activeEmphasis).toEqual([])
    expect(hidden.activeEmphasis).toEqual([])
  })

  it('sustains a held treatment on the shared token period and holds it steady under reduced motion', async () => {
    const styles = await readFile(new URL('./styles.css', import.meta.url), 'utf8')
    const reduced = styles.slice(styles.indexOf('@media (prefers-reduced-motion: reduce)'))

    expect(styles).toContain(
      'animation: infoschematic-element-emphasis-held var(--infoschematic-canvas-emphasis-duration) ease-in-out infinite\n    alternate;'
    )
    expect(styles).toContain('@keyframes infoschematic-element-emphasis-held')
    // A hold is painted at every moment of its life, so neither end of the sustained keyframes reaches transparency.
    const keyframes = styles.slice(styles.indexOf('@keyframes infoschematic-element-emphasis-held'))
    expect(keyframes.slice(0, keyframes.indexOf('}\n}'))).not.toContain('opacity: 0;')
    // Restated inside the media block, because a media query adds no specificity to beat a class plus an attribute.
    expect(reduced).toContain('.infoschematic-element-emphasis[data-depicts="state"] > * {\n    animation: none;')
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
