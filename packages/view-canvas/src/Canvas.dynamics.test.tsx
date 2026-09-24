import { readFile } from 'node:fs/promises'
import { defineInfoschematicModel } from '@infoschematics/domain-core'
import { emphasisPerimeterPath, emphasisPointRadius } from '@infoschematics/view-model/perimeter'
import { visualTokens } from '@infoschematics/view-model/tokens'
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
    fabrics: [{ id: 'MESH', label: 'Mesh', bounds: { height: 30, width: 200, x: 20, y: 120 } }],
    points: [{ id: 'EDGE', label: 'Edge', at: { x: 400, y: 100 } }],
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
      { id: 'mesh-attention', label: 'Mesh needs attention', kind: 'emphasise-elements', elements: ['MESH'] },
      { id: 'edge-attention', label: 'Edge needs attention', kind: 'emphasise-elements', elements: ['EDGE'] },
      { id: 'route-attention', label: 'Route needs attention', kind: 'emphasise-elements', elements: ['LOAD'] },
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

/** One emphasis group out of a rendering, so a treatment can be read for the element it names and not repo-wide. */
const emphasisGroup = (markup: string, elementId: string) =>
  markup.match(
    new RegExp(
      `<g aria-hidden="true" class="infoschematic-element-emphasis" data-artefact-id="${elementId}"[\\s\\S]*?</g>`
    )
  )?.[0] ?? null

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
    //
    // Two, still: the Diagram carries a third live region for its own detail band, and it is marked as one so that
    // this count stays a count of the host surface's regions rather than of every polite region on the page.
    expect(markup.match(/aria-live="polite" class="infoschematic-signal-announcement" role="status"/g)).toHaveLength(2)
    expect(markup.match(/data-detail-announcement="true"/g)).toHaveLength(1)
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

  // Read out of the stylesheet deliberately, and not made redundant by the browser cases that measure the same
  // promise in a page: this asks whether the rule is present, which catches a deleted one for the price of a file
  // read, while only a page can say whether the rule applies - a restatement that loses on specificity is present
  // here and absent there. Both questions are worth asking; neither answers the other.
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
    // The state is the only difference between the two renderings, and both places it shows are consequences of it:
    // the markup says which it is, and the travelling mark keeps going round instead of making one circuit and
    // stopping. Same layer, same geometry, same classes, same perimeter.
    expect(
      markup
        .replaceAll(' data-depicts="state"', '')
        .replaceAll(' repeatCount="indefinite"', '')
        .replaceAll('on-this-stage', 'attention')
    ).toBe(event.replaceAll('Sink needs attention', 'We are on this stage'))
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

  it('travels a mark along the very perimeter its own outline is drawn from', () => {
    const markup = renderToStaticMarkup(<Canvas config={config} dynamics={[occurrence]} />)

    for (const [elementId, box] of [
      ['SNK', { height: 60, width: 120, x: 260, y: 40 }],
      ['ZONE', { height: 140, width: 380, x: 10, y: 20 }]
    ] as const) {
      const group = emphasisGroup(markup, elementId)
      if (!group) throw new Error(`no emphasis was drawn for ${elementId}`)
      const outline = group.match(/<path[^>]*\bd="([^"]+)"/)?.[1]
      const travelled = group.match(/<animateMotion[^>]*\bpath="([^"]+)"/)?.[1]

      // One string and not two. This is the whole reason the perimeter moved into View Model: an outline stated as a
      // `rect` and a motion path stated separately can disagree, and a mark cutting a corner is what that looks like.
      expect(outline).toBe(emphasisPerimeterPath(box))
      expect(travelled).toBe(outline)
      // Outset from the element and rounded at the emphasis radius rather than the element's own.
      expect(outline).toContain(`A${visualTokens.canvas.emphasis.radius} ${visualTokens.canvas.emphasis.radius} 0 0 1`)
      // One circuit per token period for an event, so the mark and the outline's fade are the same length of time.
      expect(group).toContain(`dur="${visualTokens.canvas.emphasis.duration}"`)
      expect(group).not.toContain('repeatCount')
    }
  })

  it('keeps a held mark going round for as long as the hold lasts instead of making one circuit', () => {
    const group = emphasisGroup(renderToStaticMarkup(<Canvas config={config} dynamics={[held]} />), 'ZONE')

    // Held and travelling compose without either knowing about the other: one chose the span, the other the shape.
    expect(group).toContain('repeatCount="indefinite"')
    expect(group).toContain(`dur="${visualTokens.canvas.emphasis.duration}"`)
    expect(group).toContain(emphasisPerimeterPath({ height: 140, width: 380, x: 10, y: 20 }))
  })

  it('offers a travelling mark only where a perimeter exists, and leaves every other geometry its outline', () => {
    const played = (dynamicId: string) =>
      renderToStaticMarkup(<Canvas config={config} dynamics={[{ dynamicId, occurrenceKey: 'run-1' }]} />)

    // A Fabric is a box, so it travels exactly as a Card and a Region do.
    const fabric = emphasisGroup(played('mesh-attention'), 'MESH')
    expect(fabric).toContain('infoschematic-element-emphasis-mark')
    expect(fabric).toContain(emphasisPerimeterPath({ height: 30, width: 200, x: 20, y: 120 }))

    // A Flow may already be carrying a signal along its own length, so a second mark on the same line would be read
    // as one. It keeps the finite route outline: declining a geometry must not quietly mean drawing nothing.
    const flow = emphasisGroup(played('route-attention'), 'LOAD')
    expect(flow).toContain('infoschematic-element-emphasis-route')
    expect(flow).not.toContain('infoschematic-element-emphasis-mark')
    expect(flow).not.toContain('<animateMotion')

    /* A Point is drawn, so it is emphasised: a ring at the shared radius round the disc. What it declines is the
       travelling mark, and the reason is the size of the thing — a mark circling a six-unit disc is as big as the
       Point it marks, so it would read as the Point moving rather than as an emphasis on it. `ADR-INFOSCHEMATICS-027`
       asks that a declined geometry be recorded rather than degraded silently, which is the assertion below: the ring
       is there, and only the mark is absent. */
    const point = emphasisGroup(played('edge-attention'), 'EDGE')
    expect(point).toContain(`<circle cx="400" cy="100" r="${emphasisPointRadius}"`)
    expect(point).not.toContain('infoschematic-element-emphasis-mark')
    expect(point).not.toContain('<animateMotion')
  })

  it('removes the travelling mark under reduced motion, because no CSS property can still SVG motion', async () => {
    const styles = await readFile(new URL('./styles.css', import.meta.url), 'utf8')
    const reduced = styles.slice(styles.indexOf('@media (prefers-reduced-motion: reduce)'))

    // The mark travels on `animateMotion`. The two `animation: none` rules above reach the outline's fade and leave
    // the disc going round exactly as before, so nothing short of taking it out of the render stops it.
    expect(renderToStaticMarkup(<Canvas config={config} dynamics={[occurrence]} />)).toContain('<animateMotion')
    expect(styles).toContain(
      '.infoschematic-element-emphasis-mark {\n  fill: var(--infoschematic-canvas-emphasis-stroke);'
    )
    expect(reduced).toContain('.infoschematic-element-emphasis-mark {\n    display: none;\n  }')
    // Switched off by class, as the Flow signal pulse already is, and for the same reason.
    expect(reduced).toContain('.infoschematic-flow-signal-pulse {\n    display: none;\n  }')
    // And the steady outline is still painted, so a reduced-motion reader is left a treatment rather than nothing.
    expect(reduced).toContain('.infoschematic-element-emphasis > * {\n    animation: none;\n    opacity: 0.9;\n  }')
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
