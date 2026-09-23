import { readFile } from 'node:fs/promises'
import { defineInfoschematic } from '@infoschematics/domain-core'
import type { ArtefactSelection } from '@infoschematics/view-model/editable'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import { annotationLabelWidth, visualTokens } from '@infoschematics/view-model/tokens'
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
    points: [
      {
        code: 'PT-001',
        id: 'junction',
        label: 'Junction',
        point: { x: 300, y: 250 },
        ports: { north: 1 },
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
  { code: 'SYS-001', geometry: 'box', id: 'SYS-001', kind: 'fabric' },
  { code: 'SYS-002', geometry: 'box', id: 'SYS-002', kind: 'card' },
  { code: 'PT-001', geometry: 'point', id: 'PT-001', kind: 'point' },
  { code: 'REQ-001', geometry: 'route', id: 'REQ-001', kind: 'flow' },
  { code: null, geometry: 'box', id: 'annotation', kind: 'graphic' }
] as const satisfies readonly ArtefactSelection[]

/** Codes the diagram draws because the document says the element carries one, keyed by the kind that carries it. */
const pinnedCodes = (markup: string) =>
  [
    ...markup.matchAll(
      /data-artefact-kind="([^"]+)"><rect class="audit-component-code-bg"[\s\S]*?class="audit-component-code"[^>]*>([^<]+)</g
    )
  ]
    .map(([, kind, code]) => `${kind}:${code}`)
    .toSorted()

describe('InfoschematicDiagram Design editing', () => {
  it('sizes annotation badges to contain long element and Flow codes', () => {
    const longCode = 'MSF-SC-TM-ASSEMBLY'
    const longConfig = {
      ...config,
      infoschematic: {
        ...config.infoschematic,
        cards: config.infoschematic.cards.map((card, index) => (index === 0 ? { ...card, code: longCode } : card)),
        flows: config.infoschematic.flows.map((flow) => ({ ...flow, code: `${longCode}-FLOW` }))
      }
    }
    const markup = renderToStaticMarkup(<Canvas annotated config={longConfig} />)

    expect(markup).toContain(`width="${annotationLabelWidth(longCode, 56)}"`)
    expect(markup).toContain(`width="${annotationLabelWidth(`${longCode}-FLOW`)}"`)
  })

  it('puts a code a reader turns on where the authored chip would have drawn it', () => {
    /* A code turned on by an author and a code turned on by a reader are the same code. They were placed by two
       different rules - the chip 8px in from the right at y=8, the badge 4px in at y=5, on different widths - so
       switching between them shifted the code by a few pixels for no reason a reader could see. */
    const roomy = {
      ...config,
      infoschematic: {
        ...config.infoschematic,
        cards: config.infoschematic.cards.map((card) => ({
          ...card,
          placement: { ...card.placement, box: { ...card.placement.box, width: 220 } }
        }))
      }
    }
    const authoredChip = {
      ...roomy,
      infoschematic: { ...roomy.infoschematic, appearance: { card: { identity: true } } }
    }

    const chip =
      /class="infoschematic-card-identity"[\s\S]*?<rect[^>]*width="([\d.]+)"[^>]*x="([\d.]+)" y="([\d.]+)"/.exec(
        renderToStaticMarkup(<Canvas config={authoredChip} />)
      )
    const badge = /class="audit-component-code-bg"[^>]*width="([\d.]+)" x="([\d.]+)" y="([\d.]+)"/.exec(
      renderToStaticMarkup(<Canvas annotated config={roomy} />)
    )

    expect(chip).not.toBeNull()
    expect(badge).not.toBeNull()
    // The chip is drawn inside the Card's own translated group; the badge is drawn in absolute diagram space.
    const card = roomy.infoschematic.cards[0].placement.box
    expect(Number(badge?.[1])).toBe(Number(chip?.[1]))
    expect(Number(badge?.[2])).toBe(card.x + Number(chip?.[2]))
    expect(Number(badge?.[3])).toBe(card.y + Number(chip?.[3]))
  })

  it('leaves a code alone when the element it names already draws it', () => {
    /* The audit badge and the Card identity chip are two independent renderings of the same string. With
       identity authored they landed within a few pixels of each other, so a reader who turned tags on saw the
       code twice with the lower chip peeking out behind the badge. */
    const auditedCodes = (markup: string) =>
      [...markup.matchAll(/class="audit-component-code"[^>]*>([^<]+)</g)].map(([, code]) => code)

    const carrying = {
      ...config,
      infoschematic: { ...config.infoschematic, appearance: { card: { identity: true } } }
    }
    const withIdentity = renderToStaticMarkup(<Canvas annotated config={carrying} />)
    const withoutIdentity = renderToStaticMarkup(<Canvas annotated config={config} />)

    expect(withIdentity).toContain('class="infoschematic-card-identity"')
    // Both Cards draw their own code, so the annotation layer leaves them. The Fabric draws none and still gets one.
    expect(auditedCodes(withIdentity)).toEqual(['SYS-001'])
    // Without the authored chip there is nothing to duplicate and every element is annotated as before.
    expect(withoutIdentity).not.toContain('class="infoschematic-card-identity"')
    expect(auditedCodes(withoutIdentity).toSorted()).toEqual(['SYS-001', 'SYS-002', 'SYS-003'])
  })

  it('draws a code the author pinned to an element whether or not a reader asked for tags', () => {
    /* `ROUTE-021` gave the Card a permanent chip; an author who says a Fabric, Point, Region or Flow carries its
       code is saying the same thing about elements that never had a detail row to say it in. */
    const pinned = {
      ...config,
      infoschematic: {
        ...config.infoschematic,
        fabrics: config.infoschematic.fabrics.map((fabric) => ({ ...fabric, identity: true })),
        flows: config.infoschematic.flows.map((flow) => ({ ...flow, identity: true })),
        points: config.infoschematic.points.map((point) => ({ ...point, identity: true })),
        regions: config.infoschematic.regions.map((region) =>
          region.id === 'live' ? { ...region, identity: true } : region
        )
      }
    }
    const quiet = renderToStaticMarkup(<Canvas config={pinned} />)

    expect(pinnedCodes(quiet)).toEqual(['fabric:SYS-001', 'flow:REQ-001', 'point:PT-001', 'region:live'])
    // Nothing else came with them: the annotation layer is still the reader's, and it is still off.
    expect(quiet).not.toContain('class="infoschematic-audit"')
    expect(pinnedCodes(renderToStaticMarkup(<Canvas config={config} />))).toEqual([])
  })

  it('withholds a reader tag from every element already carrying its own code, not only from a Card', () => {
    const pinned = {
      ...config,
      infoschematic: {
        ...config.infoschematic,
        appearance: { identity: true },
        cards: config.infoschematic.cards.map((card) => ({ ...card, identity: true }))
      }
    }
    const annotatedMarkup = renderToStaticMarkup(<Canvas annotated config={pinned} />)
    const drawn = [...annotatedMarkup.matchAll(/class="audit-component-code"[^>]*>([^<]+)</g)].map(([, code]) => code)

    // Every code here came from the pinned layer: the reader's layer found nothing left to name.
    expect(drawn.toSorted()).toEqual(['PT-001', 'SYS-001', 'delivery', 'live'])
    // The Cards draw theirs in their own chips, the Fabric in the pinned layer, and the Flow keeps the one chip
    // the annotation layer already draws rather than gaining a second beside it.
    expect(annotatedMarkup).toContain('class="infoschematic-card-identity"')
    expect(pinnedCodes(annotatedMarkup)).toEqual(['fabric:SYS-001', 'point:PT-001', 'region:delivery', 'region:live'])
    expect([...annotatedMarkup.matchAll(/>REQ-001</g)]).toHaveLength(1)
  })

  it('renders every artefact kind as a labelled keyboard-selectable SVG target', () => {
    const markup = renderToStaticMarkup(<Canvas config={config} editor="design" onArtefactSelect={() => undefined} />)

    for (const selection of selections) {
      const renderedKind = selection.kind === 'graphic' ? 'overlay' : selection.kind
      expect(markup).toContain(`data-artefact-kind="${renderedKind}"`)
      expect(markup).toContain(`data-artefact-id="${selection.id}"`)
      expect(markup).not.toContain(` id="${selection.id}"`)
    }
    expect(markup.match(/tabindex="0"/g)?.length).toBeGreaterThanOrEqual(selections.length)
    expect(markup).toContain('aria-label="Region Delivery"')
    expect(markup).toContain('aria-label="Region Live"')
    expect(markup).toContain('aria-label="SYS-002 · Card · Card detail"')
    expect(markup).toContain('aria-label="Flow REQ-001"')
    expect(markup).toContain('aria-label="Annotation"')
    expect(markup).toContain('aria-label="Point Junction"')
  })

  it.each(selections.filter((selection) => selection.kind !== 'flow' && selection.kind !== 'point'))(
    'offers resize and within-kind actions for selected $kind',
    (selection) => {
      const markup = renderToStaticMarkup(
        <Canvas
          config={config}
          editor="design"
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
        editor="design"
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
    // One resolver decides a selection's controls, so a box kind's handle is described once and in one place.
    expect(source).toContain('axes: resizable ? { height: true, width: true } : null')
    expect(source.match(/<ResizeHandle/g)).toHaveLength(1)
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
    const design = renderToStaticMarkup(<Canvas config={config} editor="design" onArtefactSelect={() => undefined} />)
    // With no editor open a Graphic is drawn only while a Scene calls for one, so the
    // comparison hands it the same entry the editor renders unconditionally.
    const present = renderToStaticMarkup(
      <Canvas config={config} graphic={createInfoschematicRuntime(config).infoschematicOverlays[0]} />
    )
    const card = 'aria-label="SYS-002 · Card · Card detail"'

    // One layer rendered in one of two positions, so an overlay Graphic
    // annotates the surface being worked on instead of covering it.
    expect(design.indexOf('aria-label="Annotation"')).toBeLessThan(design.indexOf(card))
    expect(present.indexOf('aria-label="Annotation"')).toBeGreaterThan(present.indexOf(card))
  })

  it('keeps in-use ports visible and holds the rest back until they are asked for', () => {
    const ports = (markup: string) => markup.split('<g class="audit-port').slice(1)
    const dormant = (markup: string) => ports(markup).filter((port) => port.startsWith(' dormant')).length
    const idle = renderToStaticMarkup(<Canvas config={config} editor="design" onArtefactSelect={() => undefined} />)
    const anchors = ports(idle).filter((port) => /SYS-002:E1|SYS-003:W1/.test(port))

    // Both ends of the one route keep their dot — they are what the diagram is
    // read by — while the rest of a full port complement steps out of the way.
    expect(anchors).toHaveLength(2)
    expect(anchors.some((port) => port.startsWith(' dormant'))).toBe(false)
    expect(dormant(idle)).toBeGreaterThan(50)

    const design = (props: Record<string, string>) =>
      dormant(
        renderToStaticMarkup(<Canvas config={config} editor="design" onArtefactSelect={() => undefined} {...props} />)
      )

    // Asking about a placeable wakes its whole complement; pointing at one port
    // wakes that port alone, so neither answer is louder than its question.
    expect(design({ hovered: 'SYS-002' })).toBe(design({ selected: 'SYS-002' }))
    expect(dormant(idle) - design({ hovered: 'SYS-002' })).toBeGreaterThan(10)
    expect(dormant(idle) - design({ hovered: 'port:SYS-002:N1' })).toBe(1)
  })

  it('leaves a closed interaction layer drawn, unreachable, and unchanged in the document', () => {
    const open = renderToStaticMarkup(<Canvas config={config} editor="design" onArtefactSelect={() => undefined} />)
    const closed = renderToStaticMarkup(
      <Canvas config={config} layers={new Set(['card'] as const)} editor="design" onArtefactSelect={() => undefined} />
    )

    // Every kind still renders, in the same order, with the same identity: a layer filters interaction, not the diagram.
    for (const selection of selections) expect(closed).toContain(`data-artefact-id="${selection.id}"`)
    expect(closed.match(/data-artefact-kind="[a-z]+"/g)).toEqual(open.match(/data-artefact-kind="[a-z]+"/g))
    expect(closed).toContain('class="infoschematic-region layer-inert"')
    expect(closed).not.toContain('artefact-selectable')

    // Only the open kind keeps its keyboard reach, because pointer-events leaves the tab order alone.
    // Two Cards remain reachable and nothing else does; the adapter-free config has no sixth target to account for.
    expect(closed.match(/tabindex="0"/g)?.length).toBe(2)
    expect(open.match(/tabindex="0"/g)?.length).toBeGreaterThan(2)
    // The accessible name stays either way: a group a Producer cannot select is still a group a reader can be told about.
    expect(closed).toContain('aria-label="Region Delivery"')
    expect(closed.match(/role="button"/g)?.length).toBe(2)
    expect(closed).toContain('data-artefact-kind="card" data-collection="system" data-ink="dark" role="button"')
  })

  it("withholds a selection's controls once its own layer closes", () => {
    const region = selections.find((selection) => selection.kind === 'region')
    const withoutRegions = renderToStaticMarkup(
      <Canvas
        config={config}
        layers={new Set(['card'] as const)}
        editor="design"
        onArtefactRemove={() => undefined}
        onArtefactReorder={() => undefined}
        onArtefactResize={() => undefined}
        onArtefactSelect={() => undefined}
        selectedArtefact={region}
      />
    )

    expect(withoutRegions).not.toContain('infoschematic-foreground')
    expect(withoutRegions).not.toContain('aria-label="Resize Delivery"')
  })

  it.each(selections.filter((selection) => selection.kind !== 'flow' && selection.kind !== 'point'))(
    'draws the controls for a selected $kind above every element the diagram places',
    (selection) => {
      const markup = renderToStaticMarkup(
        <Canvas
          config={config}
          editor="design"
          onArtefactRemove={() => undefined}
          onArtefactReorder={() => undefined}
          onArtefactResize={() => undefined}
          onArtefactSelect={() => undefined}
          selectedArtefact={selection}
        />
      )

      /*
       * SVG has no stacking property, so a control drawn inside the element it operates sits wherever that element
       * sits - a Region's corner under a Card that overlaps it. One late layer carries every selection's controls,
       * and it is temporary: nothing is authored, so the moment the selection goes the layer goes with it.
       */
      const foreground = markup.indexOf('infoschematic-foreground')
      expect(foreground).toBeGreaterThan(-1)
      expect(foreground).toBeGreaterThan(markup.lastIndexOf('data-artefact-id='))
      expect(markup.indexOf('artefact-resize-handle')).toBeGreaterThan(foreground)
      expect(markup.indexOf('artefact-action')).toBeGreaterThan(foreground)
    }
  )

  /*
   * A Point is the one selectable kind with no extent, so the two halves of this have to be asserted separately: it
   * takes the same late control layer and the same within-kind actions as everything else, and it must never be
   * offered a resize handle. `EDIT-008` requires that a Point move as a coordinate without acquiring box geometry,
   * and a resize handle on screen is how that rule would be broken in practice rather than in the type system.
   */
  /*
   * Six units of radius is about four screen pixels at a Playground fit, which is smaller than the grid a Point
   * snaps to. The mark therefore states where a Point is and a wider transparent disc states what may be pressed to
   * take it. The disc is drawn only while the layer is open: a rendering nobody can press should carry no target.
   */
  it('gives a Point a press target wider than the mark it paints', () => {
    const { pointRadius, pointTargetRadius } = visualTokens.canvas.geometry
    const open = renderToStaticMarkup(<Canvas config={config} editor="design" onArtefactSelect={() => undefined} />)
    const closed = renderToStaticMarkup(
      <Canvas config={config} layers={new Set([])} editor="design" onArtefactSelect={() => undefined} />
    )

    expect(pointTargetRadius).toBeGreaterThan(pointRadius * 2)
    expect(open).toContain(`class="point-target" cx="300" cy="250" r="${pointTargetRadius}"`)
    expect(open).toContain(`class="point-mark" cx="300" cy="250"`)
    expect(closed).toContain('class="point-mark" cx="300" cy="250"')
    expect(closed).not.toContain('point-target')
  })

  it('offers a selected Point its actions in the foreground layer and no resize handle', () => {
    const markup = renderToStaticMarkup(
      <Canvas
        config={config}
        editor="design"
        onArtefactRemove={() => undefined}
        onArtefactReorder={() => undefined}
        onArtefactResize={() => undefined}
        onArtefactSelect={() => undefined}
        selectedArtefact={{ code: 'PT-001', geometry: 'point', id: 'PT-001', kind: 'point' }}
      />
    )
    const foreground = markup.indexOf('infoschematic-foreground')

    expect(foreground).toBeGreaterThan(-1)
    expect(markup.indexOf('artefact-action')).toBeGreaterThan(foreground)
    expect(markup).toContain('aria-label="Move Junction earlier"')
    expect(markup).toContain('aria-label="Move Junction later"')
    expect(markup).toContain('aria-label="Remove Junction"')
    expect(markup).not.toContain('artefact-resize-handle')
    expect(markup).not.toContain('aria-label="Resize Junction"')
  })

  it('dims editing affordances rather than removing the diagram they sit on', async () => {
    const styles = await readFile(new URL('./styles.css', import.meta.url), 'utf8')

    // Chips are drag handles and dormant ports are drop targets, so both stay in
    // the tree: the declutter is opacity, and it is recoverable by pointing.
    expect(styles).toContain('.infoschematic-svg.editing .audit-flow.editable:not(.selected):not(.pointed)')
    expect(styles).toContain('.infoschematic-svg.editing .audit-port.dormant')
    expect(styles).toContain('.infoschematic-svg.editing .infoschematic-graphic:hover')

    // A closed layer is the one case where the element does leave hit testing, because a press has to reach past it.
    expect(styles).toContain('.infoschematic-svg.editing .layer-inert *')
    expect(styles).not.toContain('!important')
  })
})
