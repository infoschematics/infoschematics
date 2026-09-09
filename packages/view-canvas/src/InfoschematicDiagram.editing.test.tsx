import { readFile } from 'node:fs/promises'
import { defineInfoschematic } from '@infoschematics/domain-core'
import type { ArtefactSelection } from '@infoschematics/view-model/editable'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
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
        prefix: 'SYS'
      }
    ],
    flowFamilies: [
      {
        color: '#7c3aed',
        description: 'Requests',
        id: 'request',
        label: 'Request',
        prefix: 'REQ'
      }
    ],
    regions: [
      { box: { height: 280, width: 620, x: 10, y: 20 }, fill: '#102638', id: 'live', label: 'Live' },
      {
        box: { height: 280, radius: 8, width: 620, x: 10, y: 20 },
        frame: { style: 'solid' },
        id: 'delivery',
        label: 'Delivery',
        labelMount: 'boundary'
      }
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
        scopes: ['system']
      }
    ],
    cards: [
      {
        code: 'SYS-002',
        detail: 'Card detail',
        id: 'card',
        label: 'Card',
        placement: { box: { height: 60, width: 120, x: 80, y: 160 }, ports: { east: 1, north: 1 } },
        scope: 'system',
        scopes: ['system']
      },
      {
        code: 'SYS-003',
        detail: 'Target detail',
        id: 'target',
        label: 'Target',
        placement: { box: { height: 60, width: 120, x: 420, y: 160 }, ports: { west: 1 } },
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
          { x: 200, y: 190 },
          { x: 420, y: 190 }
        ],
        source: 'card',
        sourcePort: 'E1',
        target: 'target',
        targetPort: 'W1'
      }
    ],
    graphics: [
      {
        id: 'annotation',
        label: 'Annotation',
        placement: { height: 40, width: 100, x: 260, y: 70 },
        properties: { caption: 'Authored' },
        renderer: 'graphic-renderer'
      }
    ]
  }
})

const selections = [
  { code: null, geometry: 'box', id: 'delivery', kind: 'region' },
  { code: 'SYS-001', geometry: 'box', id: 'fabric', kind: 'fabric' },
  { code: 'SYS-002', geometry: 'box', id: 'card', kind: 'card' },
  { code: 'REQ-001', geometry: 'route', id: 'request-flow', kind: 'flow' },
  { code: null, geometry: 'box', id: 'annotation', kind: 'graphic' }
] as const satisfies readonly ArtefactSelection[]

describe('InfoschematicDiagram Design editing', () => {
  it('renders every artefact kind as a labelled keyboard-selectable SVG target', () => {
    const markup = renderToStaticMarkup(<Canvas config={config} mode="design" onArtefactSelect={() => undefined} />)

    for (const selection of selections) {
      expect(markup).toContain(`data-artefact-kind="${selection.kind}"`)
      expect(markup).toContain(`data-artefact-id="${selection.id}"`)
    }
    expect(markup.match(/tabindex="0"/g)?.length).toBeGreaterThanOrEqual(selections.length)
    expect(markup).toContain('aria-label="Region Delivery"')
    expect(markup).toContain('aria-label="Region Live"')
    expect(markup).toContain('aria-label="SYS-002 · Card · Card detail"')
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
        />
      )
      const label =
        selection.kind === 'region'
          ? 'Delivery'
          : selection.kind === 'fabric'
            ? 'Fabric'
            : selection.kind === 'card'
              ? 'Card'
              : 'Annotation'

      expect(markup).toContain(`aria-label="Resize ${label}"`)
      expect(markup).toContain(`aria-label="Move ${label} earlier"`)
      expect(markup).toContain(`aria-label="Move ${label} later"`)
      expect(markup).toContain(`aria-label="Remove ${label}"`)
    }
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
      />
    )

    expect(markup).toContain('aria-label="Move REQ-001 earlier"')
    expect(markup).not.toContain('aria-label="Resize REQ-001"')
  })

  it('encodes axis restrictions, keyboard intents, and adapter redirection in the Canvas interaction layer', async () => {
    const source = await readFile(new URL('./InfoschematicDiagram.tsx', import.meta.url), 'utf8')
    const flowSection = source.slice(source.indexOf('const renderFlow'), source.indexOf('const graphicLayer'))
    const adapterStart = source.indexOf('const heldSelection')
    const adapterSection = source.slice(adapterStart, source.indexOf('{/* Geometry from the placeables', adapterStart))

    expect(source).toContain('{ x: true, y: true }')
    expect(source).toContain('axes={{ height: true, width: true }}')
    expect(source).not.toContain('{ x: false, y: true }')
    expect(source).not.toContain('{ x: true, y: false }')
    expect(source).toContain("event.key === 'Enter' || event.key === ' '")
    expect(source).toContain("event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')")
    expect(flowSection).not.toContain('ResizeHandle')
    expect(flowSection).not.toContain('dragArtefact(')
    expect(adapterSection).toMatch(/dragArtefact\(\s+heldSelection/)
    expect(adapterSection).not.toContain('ResizeHandle')
  })

  it('draws Graphics behind the working diagram while editing and above it while presenting', () => {
    const design = renderToStaticMarkup(<Canvas config={config} mode="design" onArtefactSelect={() => undefined} />)
    // Present mode draws a Graphic only while a Scene calls for one, so the
    // comparison hands it the same entry the editor renders unconditionally.
    const present = renderToStaticMarkup(<Canvas config={config} graphic={config.infoschematic.graphics?.[0]} />)
    const card = 'aria-label="SYS-002 · Card · Card detail"'

    // One layer rendered in one of two positions, so an overlay Graphic
    // annotates the surface being worked on instead of covering it.
    expect(design.indexOf('aria-label="Annotation"')).toBeLessThan(design.indexOf(card))
    expect(present.indexOf('aria-label="Annotation"')).toBeGreaterThan(present.indexOf(card))
  })

  it('keeps in-use ports visible and holds the rest back until they are asked for', () => {
    const ports = (markup: string) => markup.split('<g class="audit-port').slice(1)
    const dormant = (markup: string) => ports(markup).filter((port) => port.startsWith(' dormant')).length
    const idle = renderToStaticMarkup(<Canvas config={config} mode="design" onArtefactSelect={() => undefined} />)
    const anchors = ports(idle).filter((port) => /SYS-002:E1|SYS-003:W1/.test(port))

    // Both ends of the one route keep their dot — they are what the diagram is
    // read by — while the rest of a full port complement steps out of the way.
    expect(anchors).toHaveLength(2)
    expect(anchors.some((port) => port.startsWith(' dormant'))).toBe(false)
    expect(dormant(idle)).toBeGreaterThan(50)

    const design = (props: Record<string, string>) =>
      dormant(
        renderToStaticMarkup(<Canvas config={config} mode="design" onArtefactSelect={() => undefined} {...props} />)
      )

    // Asking about a placeable wakes its whole complement; pointing at one port
    // wakes that port alone, so neither answer is louder than its question.
    expect(design({ hovered: 'SYS-002' })).toBe(design({ selected: 'SYS-002' }))
    expect(dormant(idle) - design({ hovered: 'SYS-002' })).toBeGreaterThan(10)
    expect(dormant(idle) - design({ hovered: 'port:SYS-002:N1' })).toBe(1)
  })

  it('dims editing affordances rather than removing the diagram they sit on', async () => {
    const styles = await readFile(new URL('./styles.css', import.meta.url), 'utf8')

    // Chips are drag handles and dormant ports are drop targets, so both stay in
    // the tree: the declutter is opacity, and it is recoverable by pointing.
    expect(styles).toContain('.infoschematic-svg.editing .audit-flow.editable:not(.selected):not(.pointed)')
    expect(styles).toContain('.infoschematic-svg.editing .audit-port.dormant')
    expect(styles).toContain('.infoschematic-svg.editing .infoschematic-graphic:hover')
  })
})
