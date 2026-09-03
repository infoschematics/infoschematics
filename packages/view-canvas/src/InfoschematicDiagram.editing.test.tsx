import { readFile } from 'node:fs/promises'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { defineInfoschematic } from '@infoschematics/domain-core'
import type { ArtefactSelection } from '@infoschematics/view-model/editable'
import { Canvas } from './Canvas.tsx'

const config = defineInfoschematic({
  title: 'Editing surface',
  infoschematic: {
    viewBox: { height: 320, width: 640, x: 0, y: 0 },
    scopes: [
      {
        color: '#2463eb',
        description: 'System scope',
        fill: '#dbeafe',
        id: 'system',
        label: 'System',
        prefix: 'SYS',
      },
    ],
    flowFamilies: [
      {
        color: '#7c3aed',
        description: 'Requests',
        id: 'request',
        label: 'Request',
        prefix: 'REQ',
      },
    ],
    lanes: [
      {
        height: 280,
        id: 'delivery',
        label: 'Delivery',
        labelY: 20,
        panel: { height: 280, radius: 8, width: 620, x: 10, y: 20 },
        y: 20,
        zones: [{ fill: '#102638', id: 'live', label: 'Live', width: 620, x: 10 }],
      },
    ],
    fabrics: [
      {
        appearance: { properties: { tone: 'quiet' }, renderer: 'fabric-renderer' },
        code: 'SYS-001',
        detail: 'Fabric detail',
        id: 'fabric',
        label: 'Fabric',
        placement: { box: { height: 60, width: 180, x: 40, y: 60 } },
        scope: 'system',
        scopes: ['system'],
      },
    ],
    cards: [
      {
        code: 'SYS-002',
        detail: 'Card detail',
        id: 'card',
        label: 'Card',
        placement: { box: { height: 60, width: 120, x: 80, y: 160 }, ports: { east: 1 } },
        scope: 'system',
        scopes: ['system'],
      },
      {
        code: 'SYS-003',
        detail: 'Target detail',
        id: 'target',
        label: 'Target',
        placement: { box: { height: 60, width: 120, x: 420, y: 160 }, ports: { west: 1 } },
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
          { x: 200, y: 190 },
          { x: 420, y: 190 },
        ],
        source: 'card',
        sourcePort: 'E1',
        target: 'target',
        targetPort: 'W1',
      },
    ],
    graphics: [
      {
        id: 'annotation',
        label: 'Annotation',
        placement: { height: 40, width: 100, x: 260, y: 70 },
        properties: { caption: 'Authored' },
        renderer: 'graphic-renderer',
      },
    ],
  },
})

const selections = [
  { code: null, geometry: 'lane', id: 'delivery', kind: 'lane' },
  { code: null, geometry: 'zone', id: 'live', kind: 'zone', laneId: 'delivery' },
  { code: 'SYS-001', geometry: 'box', id: 'fabric', kind: 'fabric' },
  { code: 'SYS-002', geometry: 'box', id: 'card', kind: 'card' },
  { code: 'REQ-001', geometry: 'route', id: 'request-flow', kind: 'flow' },
  { code: null, geometry: 'box', id: 'annotation', kind: 'graphic' },
] as const satisfies readonly ArtefactSelection[]

describe('InfoschematicDiagram Design editing', () => {
  it('renders every artefact kind as a labelled keyboard-selectable SVG target', () => {
    const markup = renderToStaticMarkup(<Canvas config={config} mode="design" onArtefactSelect={() => undefined} />)

    for (const selection of selections) {
      expect(markup).toContain(`data-artefact-kind="${selection.kind}"`)
      expect(markup).toContain(`data-artefact-id="${selection.id}"`)
    }
    expect(markup.match(/tabindex="0"/g)?.length).toBeGreaterThanOrEqual(selections.length)
    expect(markup).toContain('aria-label="Lane Delivery"')
    expect(markup).toContain('aria-label="Zone Live"')
    expect(markup).toContain('aria-label="Card Card"')
    expect(markup).toContain('aria-label="Flow REQ-001"')
    expect(markup).toContain('aria-label="Annotation"')
  })

  it.each(selections.filter((selection) => selection.kind !== 'flow'))(
    'offers resize and within-kind actions for selected $kind',
    (selection) => {
      const markup = renderToStaticMarkup(
        <Canvas
          config={config}
          mode="design"
          onArtefactRemove={() => undefined}
          onArtefactReorder={() => undefined}
          onArtefactResize={() => undefined}
          onArtefactSelect={() => undefined}
          selectedArtefact={selection}
        />,
      )
      const label =
        selection.kind === 'lane'
          ? 'Delivery'
          : selection.kind === 'zone'
            ? 'Live'
            : selection.kind === 'fabric'
              ? 'Fabric'
              : selection.kind === 'card'
                ? 'Card'
                : 'Annotation'

      expect(markup).toContain(`aria-label="Resize ${label}"`)
      expect(markup).toContain(`aria-label="Move ${label} earlier"`)
      expect(markup).toContain(`aria-label="Move ${label} later"`)
      expect(markup).toContain(`aria-label="Remove ${label}"`)
    },
  )

  it('keeps Flow movement and resizing on the existing route-specific controls', () => {
    const flow = selections.find((selection) => selection.kind === 'flow')
    const markup = renderToStaticMarkup(
      <Canvas
        config={config}
        mode="design"
        onArtefactRemove={() => undefined}
        onArtefactReorder={() => undefined}
        onArtefactResize={() => undefined}
        onArtefactSelect={() => undefined}
        selectedArtefact={flow}
      />,
    )

    expect(markup).toContain('aria-label="Move REQ-001 earlier"')
    expect(markup).not.toContain('aria-label="Resize REQ-001"')
  })

  it('encodes axis restrictions, keyboard intents, and adapter redirection in the Canvas interaction layer', async () => {
    const source = await readFile(new URL('./InfoschematicDiagram.tsx', import.meta.url), 'utf8')
    const flowSection = source.slice(source.indexOf('const renderFlow'), source.indexOf('return (\n    <svg'))
    const adapterStart = source.indexOf('const heldSelection')
    const adapterSection = source.slice(
      adapterStart,
      source.indexOf('{/* Geometry from the placeables', adapterStart),
    )

    expect(source).toContain('{ x: false, y: true }')
    expect(source).toContain('{ x: true, y: false }')
    expect(source).toContain('axes={{ height: true, width: false }}')
    expect(source).toContain('axes={{ height: false, width: true }}')
    expect(source).toContain("event.key === 'Enter' || event.key === ' '")
    expect(source).toContain("event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')")
    expect(flowSection).not.toContain('ResizeHandle')
    expect(flowSection).not.toContain('dragArtefact(')
    expect(adapterSection).toContain('dragArtefact(\n                          heldSelection')
    expect(adapterSection).not.toContain('ResizeHandle')
  })
})
