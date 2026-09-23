import type { DefinedInfoschematic, InfoschematicConfig } from '@infoschematics/domain-model'
import { emphasisPerimeterPath } from '@infoschematics/view-model/perimeter'
import {
  adaptivePaint,
  annotationLabelWidth,
  paintDeclarations,
  paintFor,
  visualTokens
} from '@infoschematics/view-model/tokens'
import { describe, expect, it } from 'vitest'
import { renderInfoschematicSvg } from './index.ts'

const blank = (title: string): InfoschematicConfig => ({
  title,
  infoschematic: {
    viewBox: { height: 80, width: 120, x: 0, y: 0 },
    scopes: [],
    flowFamilies: [],
    regions: [],
    cards: [],
    fabrics: [],
    points: [],
    flows: [],
    graphics: [],
    interfaces: [],
    specificationGroups: []
  },
  standaloneScenes: [],
  themes: [],
  stories: [],
  calloutPositions: []
})

const representative: InfoschematicConfig = {
  title: 'A & B <architecture>',
  subtitle: 'Static "view"',
  infoschematic: {
    viewBox: { height: 240, width: 400, x: 0, y: 0 },
    scopes: [
      {
        color: '#2463eb',
        description: 'One',
        fill: '#dbeafe',
        id: 'one',
        label: 'One',
        prefix: 'ONE'
      },
      {
        color: '#b45309',
        description: 'Two',
        fill: '#fef3c7',
        id: 'two',
        label: 'Two',
        prefix: 'TWO'
      }
    ],
    flowFamilies: [
      {
        color: '#7c3aed',
        description: 'Calls',
        id: 'calls',
        label: 'Calls',
        prefix: 'CALL'
      }
    ],
    regions: [
      {
        box: { height: 200, width: 380, x: 10, y: 20 },
        fill: '#f8fafc',
        id: 'runtime',
        label: 'Runtime'
      },
      {
        box: { height: 200, radius: 8, width: 380, x: 10, y: 20 },
        frame: { style: 'solid' },
        id: 'delivery',
        label: 'Delivery',
        labelMount: 'boundary'
      }
    ],
    cards: [
      {
        code: 'ONE-001',
        detail: 'Source <entry>',
        id: 'source',
        label: 'Source & gateway',
        placement: { box: { height: 60, width: 120, x: 40, y: 80 }, ports: {} },
        scope: 'one',
        scopes: ['one']
      },
      {
        code: 'TWO-001',
        detail: 'Target',
        id: 'target',
        label: 'Target',
        placement: {
          box: { height: 60, width: 120, x: 240, y: 80 },
          ports: {}
        },
        scope: 'two',
        scopes: ['two']
      }
    ],
    fabrics: [],
    points: [],
    flows: [
      {
        code: 'CALL-001',
        family: 'calls',
        id: 'call',
        points: [
          { x: 160, y: 110 },
          { x: 240, y: 110 }
        ],
        source: 'source',
        sourcePort: 'E1',
        target: 'target',
        targetPort: 'W1'
      }
    ],
    graphics: [
      {
        id: 'note',
        label: 'Note <safe>',
        placement: { height: 34, width: 90, x: 155, y: 170 },
        renderer: { key: 'note"renderer', version: 2 }
      }
    ],
    interfaces: [],
    specificationGroups: []
  },
  standaloneScenes: [
    {
      code: 'SCN-001',
      description: 'Source only',
      focus: { artefacts: ['source'], flows: [], graphics: ['note'] },
      id: 'source-only',
      label: 'Source only'
    }
  ],
  themes: [],
  stories: [],
  calloutPositions: []
}

describe('renderInfoschematicSvg', () => {
  it('renders the authored grid interval and disables appearance at zero', () => {
    const canonical = (gridSize: number): DefinedInfoschematic => ({
      id: `GRID-${gridSize}`,
      title: 'Grid sizing',
      diagram: {
        appearance: { grid: 'major-plus-minor' },
        bounds: { x: 0, y: 0, width: 120, height: 80 },
        calloutPositions: [],
        cards: [],
        collections: [],
        dynamics: [],
        fabrics: [],
        families: [],
        flows: [],
        gridSize,
        overlays: [],
        points: [],
        regions: []
      },
      scopes: [],
      sequences: [],
      specifications: []
    })

    const custom = renderInfoschematicSvg(canonical(4))
    expect(custom).toContain('data-grid-treatment="major-plus-minor"')
    expect(custom).toContain('height="4" id="infoschematic-grid-minor"')
    expect(custom).toContain('height="20" id="infoschematic-grid-major-plus-minor"')

    const disabled = renderInfoschematicSvg(canonical(0))
    expect(disabled).toContain('data-grid-treatment="none"')
    expect(disabled).not.toContain('grid-major-plus-minor')
  })

  it('renders a title-only Infoschematic as stable standalone SVG', () => {
    /* The palette block is spelled out from the manifest rather than pasted, because what this case is for is the
       shape around it: one `<style>`, then the title, then the drawing, in that order and no other. */
    const palette = [
      '  <style>',
      '    [data-infoschematic-paint="light"] {',
      ...paintDeclarations('light').map(([name, value]) => `      ${name}: ${value};`),
      '    }',
      '  </style>'
    ]
    expect(renderInfoschematicSvg(blank('A & <B> "quoted"'))).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" aria-label="A &amp; &lt;B&gt; &quot;quoted&quot; structural Infoschematic" data-infoschematic-paint="light" data-grid-treatment="none" data-surface-treatment="neutral" height="80" preserveAspectRatio="xMidYMid meet" role="img" viewBox="0 0 120 80" width="120">',
        ...palette,
        '  <title>A &amp; &lt;B&gt; "quoted"</title>',
        `  <rect class="infoschematic-backdrop" fill="${paintFor('light').backdrop}" height="80" width="120" x="0" y="0" />`,
        '</svg>'
      ].join('\n')
    )
  })

  it('renders representative configuration byte-for-byte deterministically and escapes authored values', () => {
    const options = { visibility: { graphics: 'all' as const } }
    const first = renderInfoschematicSvg(representative, options)
    const second = renderInfoschematicSvg(representative, options)

    expect(first).toBe(second)
    expect(first).toContain('<title>A &amp; B &lt;architecture&gt;</title>')
    expect(first).toContain('Source &amp; gateway')
    expect(first).toContain('Source &lt;entry&gt;')
    expect(first).toContain('data-renderer="note&quot;renderer"')
    expect(first).toContain('data-renderer-version="2"')
    expect(first).toContain('d="M160 110 H240"')
    expect(first).not.toContain('Source <entry>')
  })

  it('exposes authored identity for every canonical visual element kind', () => {
    const identified: InfoschematicConfig = {
      ...representative,
      infoschematic: {
        ...representative.infoschematic,
        fabrics: [
          {
            code: 'FAB-001',
            detail: 'Shared transport',
            id: 'fabric/shared',
            label: 'Shared fabric',
            placement: { box: { height: 24, width: 80, x: 20, y: 210 }, ports: {} },
            scope: 'one',
            scopes: ['one']
          }
        ],
        points: [
          {
            code: 'PNT-001',
            id: 'point/shared',
            label: 'Shared point',
            point: { x: 200, y: 210 },
            scopes: ['one']
          }
        ]
      }
    }

    const svg = renderInfoschematicSvg(identified, { visibility: { graphics: 'all' } })
    const expected = [
      ['region', 'runtime'],
      ['fabric', 'FAB-001'],
      ['flow', 'CALL-001'],
      ['card', 'ONE-001'],
      ['point', 'PNT-001'],
      ['overlay', 'note']
    ] as const

    for (const [kind, id] of expected) {
      expect(svg).toContain(`data-artefact-id="${id}" data-artefact-kind="${kind}"`)
      expect(svg).toContain(`data-id="${id}"`)
      expect(svg).not.toContain(` id="${id}"`)
    }
  })

  it('keeps inline resource references unique when the host supplies prefixes', () => {
    const first = renderInfoschematicSvg(representative, {
      resourceIdPrefix: 'diagram-one',
      visibility: { graphics: 'all' }
    })
    const second = renderInfoschematicSvg(representative, {
      resourceIdPrefix: 'diagram-two',
      visibility: { graphics: 'all' }
    })

    expect(first).toContain('id="diagram-one-arrow-0"')
    expect(first).toContain('marker-end="url(#diagram-one-arrow-0)"')
    expect(first).not.toContain('diagram-two-arrow-0')
    expect(second).toContain('id="diagram-two-arrow-0"')
    expect(second).toContain('marker-end="url(#diagram-two-arrow-0)"')
    expect(second).not.toContain('diagram-one-arrow-0')
    expect(() => renderInfoschematicSvg(representative, { resourceIdPrefix: 'unsafe prefix' })).toThrow(
      /SVG resource id prefixes/
    )
  })

  it('emits no executable markup when authored values resemble HTML handlers', () => {
    const hostile = blank('<script>alert(1)</script> onload="alert(2)"')
    hostile.subtitle = '<img src=x onerror="alert(3)">'
    const svg = renderInfoschematicSvg(hostile)

    expect(svg).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(svg).not.toMatch(/<script\b/i)
    for (const line of svg.split('\n')) {
      const openingTag = line.slice(0, line.indexOf('>') + 1)
      const attributeNames = [...openingTag.matchAll(/\s([A-Za-z_:][\w:.-]*)="[^"]*"/g)].map((match) => match[1])
      expect(attributeNames.some((name) => /^on/i.test(name))).toBe(false)
    }
  })

  it('renders canonical and established inputs identically', () => {
    const established = blank('Canonical boundary')
    const canonical: DefinedInfoschematic = {
      id: 'BLANK',
      title: 'Canonical boundary',
      diagram: {
        bounds: established.infoschematic.viewBox,
        gridSize: 10,
        calloutPositions: [],
        cards: [],
        collections: [],
        dynamics: [],
        fabrics: [],
        families: [],
        flows: [],
        overlays: [],
        points: [],
        regions: []
      },
      scopes: [],
      specifications: [],
      sequences: []
    }

    expect(renderInfoschematicSvg(canonical)).toBe(renderInfoschematicSvg(established))
  })

  it('uses shared static tokens while preserving authored colours', () => {
    const config: InfoschematicConfig = {
      ...representative,
      infoschematic: {
        ...representative.infoschematic,
        flows: representative.infoschematic.flows.map((flow) => ({
          ...flow,
          dashed: true
        }))
      }
    }
    const svg = renderInfoschematicSvg(config, {
      scene: { kind: 'standalone', sceneId: 'source-only' },
      visibility: { graphics: 'all' }
    })

    expect(svg).toContain(`fill="${paintFor('light').backdrop}"`)
    expect(svg).toContain(`rx="${visualTokens.canvas.geometry.cornerRadius}"`)
    expect(svg).toContain(`stroke-width="${visualTokens.canvas.flows.pipeWidth}"`)
    expect(svg).toContain(`stroke-width="${visualTokens.canvas.flows.routeWidth}"`)
    expect(svg).toContain(`stroke-dasharray="${visualTokens.canvas.flows.dash}"`)
    expect(svg).toContain(`stroke-linecap="${visualTokens.canvas.flows.lineCap}"`)
    expect(svg).toContain(`stroke-linejoin="${visualTokens.canvas.flows.lineJoin}"`)
    expect(svg).toContain(`opacity="${visualTokens.canvas.metrics.unfocusedOpacity}"`)
    expect(svg).toContain(`font-family="${visualTokens.canvas.typography.staticBodyFamily}"`)
    expect(svg).toContain(`font-size="${visualTokens.canvas.typography.metadataFontSize}"`)
    expect(svg).toContain(`fill="${visualTokens.canvas.ink.dark}"`)

    expect(svg).toContain('fill="#f8fafc"')
    expect(svg).toContain('fill="#dbeafe"')
    expect(svg).toContain('stroke="#2463eb"')
    expect(svg).toContain('fill="#7c3aed"')
  })

  it('renders authored treatments and output-only Card detail overrides', () => {
    const config: InfoschematicConfig = {
      ...representative,
      infoschematic: {
        ...representative.infoschematic,
        appearance: {
          card: {
            compact: true,
            description: true,
            identity: true,
            stereotype: true
          },
          grid: 'major-plus-minor',
          surface: 'blueprint'
        },
        domains: [
          {
            color: '#13579b',
            fill: '#dceeff',
            id: 'platform',
            label: 'Platform'
          }
        ],
        regions: representative.infoschematic.regions.map((region) =>
          region.id === 'delivery'
            ? {
                ...region,
                frame: { style: 'dashed' as const },
                labelPlacement: 'north' as const
              }
            : {
                ...region,
                frame: { style: 'dotted' as const },
                labelPlacement: 'south-east' as const
              }
        ),
        cards: representative.infoschematic.cards.map((card, index) =>
          index === 0 ? { ...card, domain: 'platform', stereotype: 'service' } : card
        )
      }
    }

    const svg = renderInfoschematicSvg(config)
    expect(svg).toContain('data-grid-treatment="major-plus-minor"')
    expect(svg).toContain('data-surface-treatment="blueprint"')
    expect(svg).toContain(`fill="${paintFor('blueprint').backdrop}"`)
    expect(svg).toContain('id="infoschematic-grid-major-plus-minor"')
    expect(svg).toContain('data-frame-treatment="dashed"')
    expect(svg).toContain('data-frame-treatment="dotted"')
    expect(svg).toContain('data-label-treatment="notched"')
    expect(svg).toContain('data-label-treatment="plain"')
    expect(svg).toContain(`stroke-dasharray="${visualTokens.canvas.metrics.regionDash}"`)
    expect(svg).toContain(`stroke-dasharray="${visualTokens.canvas.metrics.regionDot}"`)
    expect(svg).toContain('stroke-linecap="round"')
    expect(svg).toContain('data-label-placement="south-east"')
    expect(svg).toContain('data-collection="platform"')
    expect(svg).toContain('data-stereotype="service"')
    expect(svg).toContain('aria-label="ONE-001 · Source &amp; gateway · service · Source &lt;entry&gt;"')
    expect(svg).toContain('Cards: ONE-001 · Source &amp; gateway · service · Source &lt;entry&gt;')
    expect(svg).toContain('fill="#dceeff"')
    expect(svg).toContain('stroke="#13579b"')
    expect(svg).toContain('class="infoschematic-card-identity"')
    expect(svg).toContain('data-card-detail="identity"')
    expect(svg).toContain(`<rect fill="${paintFor('blueprint').annotationFill}" height="20" rx="4"`)
    expect(svg).toContain('class="infoschematic-card-stereotype"')
    expect(svg).toContain('>SERVICE<')
    expect(svg).toContain('class="infoschematic-card-description"')

    const overridden = renderInfoschematicSvg(config, {
      cardDetails: { description: false, identity: false, stereotype: false }
    })
    expect(overridden).not.toContain('class="infoschematic-card-identity"')
    expect(overridden).not.toContain('class="infoschematic-card-stereotype"')
    expect(overridden).not.toContain('class="infoschematic-card-description"')
    expect(overridden).toContain('data-compact="true"')

    const responsive = renderInfoschematicSvg(config, {
      responsiveCardDetails: { height: 144, width: 240 }
    })
    expect(responsive).toContain('height="144"')
    expect(responsive).toContain('width="240"')
    expect(responsive).toContain('class="infoschematic-card-identity"')
    expect(responsive).toContain('class="infoschematic-card-stereotype"')
    expect(responsive).not.toContain('class="infoschematic-card-description"')
    expect(responsive).toContain('aria-label="ONE-001 · Source &amp; gateway · service · Source &lt;entry&gt;"')

    const labelOnly = renderInfoschematicSvg(config, {
      responsiveCardDetails: { height: 72, width: 120 }
    })
    expect(labelOnly).not.toContain('data-card-detail=')
    expect(labelOnly).toContain('>Source &amp; gate…<')
    expect(labelOnly).toContain('Cards: ONE-001 · Source &amp; gateway · service · Source &lt;entry&gt;')
  })

  it('paints the midground from the palette the drawing resolved rather than one fixed set', () => {
    const light = paintFor('light')
    const blueprintPaint = paintFor('blueprint')
    const empty = blank('Midground palette')
    const withFabric: InfoschematicConfig = {
      ...empty,
      infoschematic: {
        ...empty.infoschematic,
        scopes: [
          {
            color: '#2463eb',
            description: 'One',
            fill: '#dbeafe',
            id: 'one',
            label: 'One',
            prefix: 'ONE'
          }
        ],
        fabrics: [
          {
            code: 'FAB-01',
            detail: 'Connectable midground',
            id: 'fabric',
            label: 'Event fabric',
            placement: {
              box: { height: 40, width: 100, x: 10, y: 10 },
              ports: {}
            },
            scope: 'one',
            scopes: ['one']
          }
        ],
        graphics: [
          {
            id: 'note',
            label: 'Note',
            placement: { height: 20, width: 60, x: 10, y: 55 },
            renderer: 'note'
          }
        ]
      }
    }
    const asBlueprint: InfoschematicConfig = {
      ...withFabric,
      infoschematic: {
        ...withFabric.infoschematic,
        appearance: { surface: 'blueprint' }
      }
    }

    const blueprint = renderInfoschematicSvg(asBlueprint, {
      visibility: { graphics: 'all' }
    })
    const neutral = renderInfoschematicSvg(withFabric, {
      visibility: { graphics: 'all' }
    })

    // A Fabric or Graphic left on the light palette while the drawing is a blueprint is a white slab on a dark
    // backdrop, which is the defect this case was opened for; the same mistake is now possible in either direction,
    // so both are asserted.
    expect(blueprint).toContain(`fill="${blueprintPaint.fabricFill}"`)
    expect(blueprint).toContain(`stroke="${blueprintPaint.fabricStroke}"`)
    expect(blueprint).toContain(`fill="${blueprintPaint.graphicFill}"`)
    expect(blueprint).toContain(`stroke="${blueprintPaint.graphicStroke}"`)
    expect(blueprint).not.toContain(`fill="${light.surface}"`)
    expect(blueprint).not.toContain(`fill="${light.graphicFill}"`)
    expect(neutral).toContain(`fill="${light.surface}"`)
    expect(neutral).toContain(`fill="${light.graphicFill}"`)
    expect(neutral).not.toContain(`fill="${blueprintPaint.fabricFill}"`)
  })

  /*
   * A still rendering resolves the scheme once and writes what it settled on.
   *
   * Nothing downstream can re-resolve it: a PNG has no preference to read and an `<img>` carries no stylesheet, so
   * asking for the dark scheme has to change the bytes rather than add a rule that something else might apply. An
   * authored blueprint is not a scheme, and a caller asking for dark must not be able to repaint it.
   */
  it('writes the scheme it was asked for, and lets an authored blueprint override it', () => {
    const dark = paintFor('dark')
    const light = paintFor('light')
    const document = blank('Scheme lock')

    const defaulted = renderInfoschematicSvg(document)
    const asLight = renderInfoschematicSvg(document, { scheme: 'light' })
    const asDark = renderInfoschematicSvg(document, { scheme: 'dark' })

    expect(defaulted).toBe(asLight)
    expect(asLight).toContain(`fill="${light.backdrop}"`)
    expect(asDark).toContain(`fill="${dark.backdrop}"`)
    expect(asDark).not.toContain(`fill="${light.backdrop}"`)
    // The resolved colours are literals, so nothing in the output defers the decision to a reader's preference.
    expect(asDark).not.toContain('prefers-color-scheme')
    expect(asDark).not.toContain('var(--infoschematic')

    const asBlueprintDocument: InfoschematicConfig = {
      ...document,
      infoschematic: { ...document.infoschematic, appearance: { surface: 'blueprint' } }
    }
    expect(renderInfoschematicSvg(asBlueprintDocument, { scheme: 'dark' })).toBe(
      renderInfoschematicSvg(asBlueprintDocument, { scheme: 'light' })
    )
    expect(renderInfoschematicSvg(asBlueprintDocument, { scheme: 'dark' })).toContain(
      `fill="${paintFor('blueprint').backdrop}"`
    )
    expect(renderInfoschematicSvg(asBlueprintDocument, { scheme: 'dark' })).toContain(
      'data-infoschematic-paint="blueprint"'
    )
  })

  /*
   * And the colours it wrote survive being inlined into a page that has colours of its own.
   *
   * Written as attributes they do not: a presentation attribute loses to every CSS declaration, so the Canvas
   * stylesheet's `fill: var(--infoschematic-canvas-paint-backdrop)` repainted each of these in the host page's
   * scheme, and the guide's own gallery showed a light drawing, a dark drawing, and a deferring drawing as three
   * identical pictures. The rendering therefore declares the palette it settled on, on itself, so that rule
   * resolves to the drawing's colours; the marker keeps a light and a dark drawing on one page out of each other's
   * block. This reads the bytes, because there is no browser here — the picture is what the gallery is for.
   */
  it("declares the palette it resolved, so a host stylesheet paints it in its own scheme rather than the page's", () => {
    const document = blank('Scheme lock')

    for (const scheme of ['light', 'dark'] as const) {
      const drawn = renderInfoschematicSvg(document, { scheme })
      expect(drawn, scheme).toContain(`data-infoschematic-paint="${scheme}"`)
      for (const [name, value] of paintDeclarations(scheme)) expect(drawn, name).toContain(`${name}: ${value};`)
      // Scoped to the marker, never to `:root` — inlined, `:root` is the host's `<html>`.
      expect(drawn, scheme).toContain(`[data-infoschematic-paint="${scheme}"] {`)
      expect(drawn, scheme).not.toContain(':root')
      // One palette, and no rule that would let anything re-resolve it.
      expect(drawn, scheme).not.toContain('@media')
      const other = scheme === 'light' ? 'dark' : 'light'
      expect(drawn, scheme).not.toContain(`[data-infoschematic-paint="${other}"]`)
    }
  })

  it('carries both palettes when it is asked to defer the scheme, and pins an authored blueprint anyway', () => {
    const document = blank('Self-theming')
    const adaptive = renderInfoschematicSvg(document, { scheme: 'adaptive' })

    /* Both palettes and the rule that chooses between them, so the file answers a preference it was never told. */
    expect(adaptive).toContain('data-infoschematic-paint="adaptive"')
    expect(adaptive).toContain('@media (prefers-color-scheme: dark)')
    /* And paper, last: a drawing that followed a dark-preference reader onto a page is a page of ink. */
    expect(adaptive.indexOf('@media print')).toBeGreaterThan(adaptive.indexOf('@media (prefers-color-scheme: dark)'))
    const printed = adaptive.slice(adaptive.indexOf('@media print'), adaptive.indexOf('</style>'))
    for (const [name, value] of paintDeclarations('light')) expect(printed, name).toContain(`${name}: ${value};`)
    for (const scheme of ['light', 'dark'] as const) {
      for (const [name, value] of paintDeclarations(scheme)) expect(adaptive, name).toContain(`${name}: ${value};`)
    }

    /* Referenced through inline style, never a presentation attribute: `fill="var(...)"` is a CSS value only where
       SVG 2 parsing is implemented, and this is the output that lands in a browser nobody chose. */
    expect(adaptive).toContain(`style="fill: ${adaptivePaint.backdrop}"`)
    expect(adaptive).not.toMatch(/(?:fill|stroke)="var\(/)
    /* Outside that stylesheet, no palette colour is written at all: a literal on a drawn element is a colour this
       rendering decided, which is the one thing an adaptive rendering does not do. A fallback would be such a
       colour, and buys nothing anyway: a consumer that does not resolve `var()` does not read its fallback. */
    const drawn = adaptive.slice(adaptive.indexOf('</style>'))
    for (const scheme of ['light', 'dark'] as const) {
      for (const [name, value] of paintDeclarations(scheme)) expect(drawn, name).not.toContain(value)
    }

    const asBlueprintDocument: InfoschematicConfig = {
      ...document,
      infoschematic: { ...document.infoschematic, appearance: { surface: 'blueprint' } }
    }
    // An authored blueprint has no scheme to defer: there is one palette, and a reader's preference is not about it.
    const blueprint = renderInfoschematicSvg(asBlueprintDocument, { scheme: 'adaptive' })
    expect(blueprint).toBe(renderInfoschematicSvg(asBlueprintDocument, { scheme: 'light' }))
    expect(blueprint).not.toContain('prefers-color-scheme')
    expect(blueprint).toContain(`fill="${paintFor('blueprint').backdrop}"`)
  })

  it('renders the dots grid treatment as a point pattern at each grid intersection', () => {
    const config: InfoschematicConfig = {
      ...representative,
      infoschematic: {
        ...representative.infoschematic,
        appearance: { grid: 'dots' }
      }
    }

    const svg = renderInfoschematicSvg(config)
    expect(svg).toContain('data-grid-treatment="dots"')
    expect(svg).toContain('id="infoschematic-grid-dots"')
    expect(svg).toContain('<circle')
    expect(svg).toContain('fill="url(#infoschematic-grid-dots)"')
    expect(svg).not.toContain('id="infoschematic-grid-major"')
    expect(svg).not.toContain('id="infoschematic-grid-minor"')
  })

  it('renders explicit Flow signals as deterministic still emphasis and ignores unknown ids', () => {
    const baseline = renderInfoschematicSvg(representative)
    const signalled = renderInfoschematicSvg(representative, {
      signals: ['call', 'call', 'missing']
    })

    expect(renderInfoschematicSvg(representative, { signals: ['call', 'missing'] })).toBe(signalled)
    expect(baseline).not.toContain('data-signalled=')
    expect(baseline).not.toContain('infoschematic-flow-signal')
    expect(signalled).toContain('data-id="CALL-001" data-signalled="true"')
    expect(signalled).toContain('class="infoschematic-flow-signal"')
    expect(signalled.match(/class="infoschematic-flow-signal"/g)).toHaveLength(1)
    expect(signalled).toContain(`stroke-width="${visualTokens.canvas.flows.signalStillWidth}"`)
    expect(signalled).not.toContain('<animate')
    expect(signalled).not.toContain('missing')
  })

  it('interprets Dynamic occurrences as a still treatment and changes nothing without one', () => {
    const authored: DefinedInfoschematic = {
      id: 'dynamics',
      title: 'Dynamics',
      diagram: {
        bounds: { height: 200, width: 400, x: 0, y: 0 },
        calloutPositions: [],
        cards: [
          { id: 'SRC', label: 'Source', bounds: { height: 60, width: 100, x: 40, y: 40 } },
          { id: 'SNK', label: 'Sink', bounds: { height: 60, width: 100, x: 260, y: 40 } }
        ],
        collections: [],
        dynamics: [
          { id: 'delivered', label: 'Record delivered', kind: 'signal-flow', flows: ['LOAD'] },
          { id: 'attention', label: 'Sink needs attention', kind: 'emphasise-elements', elements: ['SNK', 'ZONE'] },
          {
            id: 'on-this-stage',
            label: 'Sink needs attention',
            kind: 'emphasise-elements',
            elements: ['SNK', 'ZONE'],
            depicts: 'state'
          }
        ],
        fabrics: [],
        families: [{ id: 'calls', label: 'Calls', appearance: { color: '#79c9ff' } }],
        flows: [
          {
            id: 'LOAD',
            family: 'calls',
            source: { element: 'SRC', port: 'E1' },
            target: { element: 'SNK', port: 'W1' }
          }
        ],
        gridSize: 10,
        overlays: [],
        points: [],
        regions: [{ id: 'ZONE', label: 'Zone', bounds: { height: 120, width: 360, x: 20, y: 20 } }]
      },
      scopes: [],
      sequences: [],
      specifications: []
    }

    const baseline = renderInfoschematicSvg(authored)
    expect(baseline).not.toContain('infoschematic-element-emphasis')
    expect(baseline).not.toContain('data-signalled=')
    expect(baseline).not.toContain('Dynamics:')
    expect(renderInfoschematicSvg(authored, { dynamics: [] })).toBe(baseline)
    expect(renderInfoschematicSvg(authored, { dynamics: [{ dynamicId: 'absent', occurrenceKey: 'run-1' }] })).toBe(
      baseline
    )

    const emphasised = renderInfoschematicSvg(authored, {
      dynamics: [{ dynamicId: 'attention', occurrenceKey: 'run-1' }]
    })
    expect(emphasised).toContain('data-artefact-id="SNK" data-dynamic-id="attention" data-emphasised="true"')
    expect(emphasised).toContain('data-artefact-id="ZONE" data-dynamic-id="attention" data-emphasised="true"')
    expect(emphasised.match(/class="infoschematic-element-emphasis"/g)).toHaveLength(2)
    expect(emphasised).toContain(`stroke="${visualTokens.canvas.emphasis.stroke}"`)
    expect(emphasised).toContain('Dynamics: Sink needs attention')
    expect(emphasised).not.toContain('<animate')

    // The outline is the shared perimeter calculation and not a `rect` restated here, so the line this render draws
    // is the very line the interactive renderer sends a mark along. One box, one answer about where its edge runs.
    expect(emphasised).toContain(`<path d="${emphasisPerimeterPath({ height: 60, width: 100, x: 260, y: 40 })}"`)
    expect(emphasised).toContain(`<path d="${emphasisPerimeterPath({ height: 120, width: 360, x: 20, y: 20 })}"`)
    // Nothing travels in a still frame, and this output cannot tell a travelling emphasis from a finite one. That is
    // a recorded decision rather than an oversight: the direction a mark traces is chosen from the geometry, so there
    // is no authored direction for a still frame to record, and inventing one would show the reader a movement the
    // document never states. `ADR-INFOSCHEMATICS-027`.
    expect(emphasised).not.toContain('animateMotion')
    expect(emphasised).not.toContain('infoschematic-element-emphasis-mark')
    // The occurrence key is a host's identity for a replay, not part of deterministic output.
    expect(emphasised).not.toContain('run-1')
    expect(renderInfoschematicSvg(authored, { dynamics: [{ dynamicId: 'attention', occurrenceKey: 'run-2' }] })).toBe(
      emphasised
    )

    // A still image has no duration to express, so a state draws what an event draws. The two declarations differ
    // only by depiction and share a label, and the bytes agree: nothing here silently reads the authored depiction.
    const stillHeld = renderInfoschematicSvg(authored, {
      dynamics: [{ dynamicId: 'on-this-stage', occurrenceKey: 'hold-1' }]
    })
    expect(stillHeld).not.toContain('data-depicts')
    expect(stillHeld.replaceAll('on-this-stage', 'attention')).toBe(emphasised)

    const signalled = renderInfoschematicSvg(authored, {
      dynamics: [{ dynamicId: 'delivered', occurrenceKey: 'run-1' }]
    })
    expect(signalled).toContain('data-signalled="true"')
    expect(signalled).toContain('Dynamics: Record delivered')
    expect(signalled).not.toContain('infoschematic-element-emphasis')
    expect(signalled).toContain(`stroke-width="${visualTokens.canvas.flows.signalStillWidth}"`)
  })

  it('emphasises only elements the render drew', () => {
    const authored: DefinedInfoschematic = {
      id: 'hidden',
      title: 'Hidden',
      diagram: {
        bounds: { height: 200, width: 400, x: 0, y: 0 },
        calloutPositions: [],
        cards: [
          { id: 'SRC', label: 'Source', bounds: { height: 60, width: 100, x: 40, y: 40 } },
          { id: 'SNK', label: 'Sink', bounds: { height: 60, width: 100, x: 260, y: 40 } }
        ],
        collections: [],
        dynamics: [{ id: 'attention', label: 'Attention', kind: 'emphasise-elements', elements: ['SNK'] }],
        fabrics: [],
        families: [],
        flows: [],
        gridSize: 10,
        overlays: [],
        points: [],
        regions: []
      },
      scopes: [
        { id: 'shown', label: 'Shown', elements: ['SRC'] },
        { id: 'hidden', label: 'Hidden', elements: ['SNK'] }
      ],
      sequences: [],
      specifications: []
    }

    const filtered = renderInfoschematicSvg(authored, {
      dynamics: [{ dynamicId: 'attention', occurrenceKey: 'run-1' }],
      visibility: { scopes: ['shown'] }
    })

    expect(filtered).not.toContain('data-artefact-id="SNK"')
    expect(filtered).not.toContain('infoschematic-element-emphasis')
  })

  it('emits Flow code annotations only when requested, at the shared placement', () => {
    expect(renderInfoschematicSvg(representative)).not.toContain('infoschematic-flow-annotation')

    const annotated = renderInfoschematicSvg(representative, {
      annotations: { flows: true }
    })
    expect(renderInfoschematicSvg(representative, { annotations: { flows: true } })).toBe(annotated)
    expect(annotated).toContain('class="infoschematic-flow-annotation"')
    expect(annotated).toContain('>CALL-001</text>')
    expect(annotated).toContain(`fill="${paintFor('light').annotationFill}"`)
    expect(annotated).toContain(`font-family="${visualTokens.canvas.typography.staticCodeFamily}"`)
    expect(annotated).toContain(`width="${annotationLabelWidth('CALL-001')}"`)
    expect(annotated).toContain('x="200" y="114"')

    const placed = renderInfoschematicSvg(
      {
        ...representative,
        infoschematic: {
          ...representative.infoschematic,
          flows: representative.infoschematic.flows.map((flow) => ({
            ...flow,
            label: { along: 0.25 }
          }))
        }
      },
      { annotations: { flows: true } }
    )
    expect(placed).toContain('x="180" y="114"')

    const dimmed = renderInfoschematicSvg(representative, {
      annotations: { flows: true },
      scene: { kind: 'standalone', sceneId: 'source-only' }
    })
    expect(dimmed).toContain('class="infoschematic-flow-annotation is-unfocused"')
  })

  it('covers every kind the live view tags when asked for all of them, and only the named kinds otherwise', () => {
    const every = renderInfoschematicSvg(representative, { annotations: true })
    // A Card takes its code in the slot its own chip would occupy rather than a second rectangle beside it.
    expect(every).toContain('data-artefact-kind="card" data-code="ONE-001"')
    expect(every).toContain('data-artefact-kind="card" data-code="TWO-001"')
    expect(every).toContain('class="infoschematic-flow-annotation"')

    const flowsOnly = renderInfoschematicSvg(representative, { annotations: { flows: true } })
    expect(flowsOnly).not.toContain('class="infoschematic-code"')
    expect(flowsOnly).toContain('class="infoschematic-flow-annotation"')

    const componentsOnly = renderInfoschematicSvg(representative, { annotations: { components: true } })
    expect(componentsOnly).toContain('class="infoschematic-code"')
    expect(componentsOnly).not.toContain('infoschematic-flow-annotation')

    // A Point and a Region are not what the live view's tags cover, so asking for every tag does not reach them.
    expect(every).not.toContain('data-artefact-kind="region" data-code=')
    expect(renderInfoschematicSvg(representative, { annotations: false })).toBe(renderInfoschematicSvg(representative))
  })

  it('draws the code of every element whose author said it carries one, with nothing asked for', () => {
    const authored: InfoschematicConfig = {
      ...representative,
      infoschematic: {
        ...representative.infoschematic,
        cards: representative.infoschematic.cards.map((card) => ({ ...card, identity: card.id === 'target' })),
        flows: representative.infoschematic.flows.map((flow) => ({ ...flow, identity: true })),
        points: [
          { code: 'PNT-001', id: 'sink', identity: true, label: 'Sink', point: { x: 360, y: 200 }, scopes: ['two'] }
        ],
        regions: representative.infoschematic.regions.map((region) => ({
          ...region,
          identity: region.id === 'runtime'
        }))
      }
    }
    const drawn = renderInfoschematicSvg(authored)

    expect(drawn).toContain('data-artefact-kind="region" data-code="runtime"')
    expect(drawn).toContain('data-artefact-kind="point" data-code="PNT-001"')
    expect(drawn).toContain('class="infoschematic-flow-annotation"')
    // The Card that says it carries its code draws it in its own detail row; the one that says nothing draws none.
    expect(drawn).toContain('class="infoschematic-card-identity"')
    expect(drawn.match(/class="infoschematic-card-identity"/g)).toHaveLength(1)
    expect(drawn).toContain('>TWO-001</text>')
    expect(drawn).not.toContain('>ONE-001</text>')

    // The Diagram's own default says the same thing for everything that stated nothing.
    const wholeDiagram = renderInfoschematicSvg({
      ...representative,
      infoschematic: { ...representative.infoschematic, appearance: { identity: true } }
    })
    expect(wholeDiagram.match(/class="infoschematic-card-identity"/g)).toHaveLength(2)
    expect(wholeDiagram).toContain('data-artefact-kind="region" data-code="runtime"')
  })

  it('resolves readable ink from each fill and marks it for treatment parity', () => {
    const light = renderInfoschematicSvg(representative)
    expect(light).toContain('data-ink="dark"')
    expect(light).not.toContain('data-ink="light"')
    expect(light).toContain('class="infoschematic-region-label" data-ink="dark"')

    const dark = renderInfoschematicSvg({
      ...representative,
      infoschematic: {
        ...representative.infoschematic,
        appearance: {
          card: {
            compact: true,
            description: true,
            identity: true,
            stereotype: true
          },
          surface: 'blueprint'
        },
        domains: [
          {
            color: '#9673a6',
            fill: '#0d1b2a',
            id: 'observe',
            label: 'Observe'
          }
        ],
        cards: representative.infoschematic.cards.map((card, index) =>
          index === 0 ? { ...card, domain: 'observe', stereotype: 'stage' } : card
        ),
        regions: representative.infoschematic.regions.map((region) =>
          region.fill ? { ...region, fill: '#071e2d' } : region
        )
      }
    })
    expect(dark).toContain('data-ink="light"')
    expect(dark).toContain('data-ink="dark"')
    expect(dark).toContain('class="infoschematic-region-label" data-ink="light"')
    expect(dark).toContain(`fill="${visualTokens.canvas.ink.light}"`)
    expect(dark).toContain(`fill="${visualTokens.canvas.ink.lightMuted}"`)
    expect(dark).toContain(`fill="${paintFor('light').annotationFill}" height="20"`)
  })

  it('applies explicit Scope visibility and Scene focus without motion or browser state', () => {
    const focused = renderInfoschematicSvg(representative, {
      scene: { kind: 'standalone', sceneId: 'source-only' },
      visibility: { scopes: ['one', 'two'], unfocused: 'hide' }
    })

    expect(focused).toContain('data-id="ONE-001"')
    expect(focused).toContain('data-id="note"')
    expect(focused).not.toContain('data-id="TWO-001"')
    expect(focused).not.toContain('data-id="CALL-001"')

    const oneScope = renderInfoschematicSvg(representative, {
      visibility: { scopes: ['one'] }
    })
    expect(oneScope).toContain('data-id="ONE-001"')
    expect(oneScope).not.toContain('data-id="TWO-001"')
    expect(oneScope).not.toContain('data-id="CALL-001"')
  })

  it('draws every authored Overlay by default and narrows to a Scene only when asked', () => {
    /*
     * The default was `scene`, and no authored Scene can name a Graphic, so every authored Overlay was filtered
     * out of every still rendering — `ADR-INFOSCHEMATICS-033`. A caller that wants the scene-scoped set asks for it.
     */
    const everything = renderInfoschematicSvg(representative)
    expect(everything).toContain('data-artefact-kind="overlay"')
    expect(everything).toContain('data-id="note"')

    const sceneScoped = renderInfoschematicSvg(representative, {
      scene: { kind: 'standalone', sceneId: 'source-only' },
      visibility: { graphics: 'scene' }
    })
    expect(sceneScoped).toContain('data-id="note"')

    const unscened = renderInfoschematicSvg(representative, { visibility: { graphics: 'scene' } })
    expect(unscened).not.toContain('data-artefact-kind="overlay"')

    const suppressed = renderInfoschematicSvg(representative, { visibility: { graphics: 'none' } })
    expect(suppressed).not.toContain('data-artefact-kind="overlay"')
  })

  it('draws standard catalogue artwork from the shared description, once per piece', () => {
    const fabric = (id: string, box: { height: number; width: number; x: number; y: number }, renderer: unknown) => ({
      appearance: { renderer } as { renderer: string },
      code: id.toUpperCase(),
      detail: 'A substrate every stage can reach',
      id,
      label: id,
      placement: { box, ports: {} },
      scope: 'one',
      scopes: ['one']
    })
    const catalogue = (surface?: 'blueprint'): InfoschematicConfig => ({
      ...blank('Standard catalogue'),
      infoschematic: {
        ...blank('Standard catalogue').infoschematic,
        appearance: surface ? { surface } : undefined,
        scopes: [{ color: '#2463eb', description: 'One', fill: '#dbeafe', id: 'one', label: 'One', prefix: 'ONE' }],
        viewBox: { height: 400, width: 400, x: 0, y: 0 },
        fabrics: [
          fabric('wide', { height: 120, width: 300, x: 20, y: 20 }, 'internet-cloud'),
          fabric('narrow', { height: 80, width: 160, x: 20, y: 170 }, 'internet-cloud'),
          fabric('future', { height: 80, width: 160, x: 200, y: 170 }, { key: 'internet-cloud', version: 2 })
        ]
      }
    })

    const svg = renderInfoschematicSvg(catalogue())
    expect([...svg.matchAll(/data-artwork="internet-cloud"/g)]).toHaveLength(2)
    /* Each piece owns its resources: two Fabrics of one kind at different sizes must not share the first one's
       lattice, so the ids carry the piece's ordinal and each group references only its own. */
    expect(svg).toContain('id="infoschematic-artwork-0-grid"')
    expect(svg).toContain('id="infoschematic-artwork-1-grid"')
    expect(svg).toContain('url(#infoschematic-artwork-1-grid)')
    // A version the catalogue does not state leaves the generic plane, which is `EXTEND-001`'s fallback drawn.
    expect(svg).toContain('>FUTURE: future · A substrate every stage can reach<')
    expect(svg).toContain(`fill="${paintFor('light').surface}" height="80" rx=`)

    // Paint is the outlet's: the paper palette by default, the interactive ink where the document asks for blueprint.
    expect(svg).toContain(`fill="${paintFor('light').artwork.shell}"`)
    expect(svg).not.toContain(`fill="${paintFor('blueprint').artwork.shell}"`)
    const blueprint = renderInfoschematicSvg(catalogue('blueprint'))
    expect(blueprint).toContain(`fill="${paintFor('blueprint').artwork.shell}"`)
    expect(blueprint).not.toContain(`fill="${paintFor('light').artwork.shell}"`)
  })

  it('fails explicitly when a selected Scene does not exist', () => {
    expect(() =>
      renderInfoschematicSvg(representative, {
        scene: { kind: 'standalone', sceneId: 'missing' }
      })
    ).toThrow('Unknown Standalone Scene: missing')
  })
})
