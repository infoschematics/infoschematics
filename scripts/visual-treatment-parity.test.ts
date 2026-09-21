import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { defineInfoschematic, defineInfoschematicModel } from '../packages/domain-core/src/index.ts'
import { renderInfoschematicSvg } from '../packages/render-svg/src/index.ts'
import { Canvas } from '../packages/view-canvas/src/index.ts'
import { adapterBoundsFor, adapterClaspOutline, adapterLabelBaseline } from '../packages/view-model/src/assembly.ts'
import { emphasisPerimeterPath } from '../packages/view-model/src/perimeter.ts'
import { createInfoschematicRuntime } from '../packages/view-model/src/runtime.ts'
import { standardFabricKeys, standardGraphicKeys } from '../packages/view-model/src/standard-artwork.ts'
import { visualTokens } from '../packages/view-model/src/tokens.ts'

/**
 * Every `url(#…)` reference in one rendering, paired with whether that same rendering defines it.
 *
 * Both renderers now name the SVG resources they own per rendering — the static one from a host-owned
 * prefix, Canvas from a per-mount value — so parity can no longer be a shared literal identifier, and
 * asserting one would only pin the default generator. What must still hold in both is the closed loop:
 * a reference resolves to a definition in the same document. A reference to an identifier the rendering
 * never defines is the defect that shipped once already, and it survives every structural assertion.
 */
const resolvedReferences = (markup: string) => {
  const defined = new Set([...markup.matchAll(/<(?:marker|pattern)\b[^>]*\bid="([^"]+)"/g)].map((found) => found[1]))
  return [...markup.matchAll(/url\(#([^)"]+)\)/g)].map((found) => ({
    defined: defined.has(found[1]),
    reference: found[1]
  }))
}

const config = defineInfoschematic({
  title: 'Cross-renderer treatment reference',
  infoschematic: {
    appearance: {
      card: { compact: true, description: true, identity: true, stereotype: true },
      grid: 'major-plus-minor',
      surface: 'blueprint'
    },
    domains: [
      {
        color: '#22c3a6',
        fill: '#063b35',
        id: 'platform',
        label: 'Platform'
      }
    ],
    scopes: [
      {
        color: '#ff0055',
        description: 'Controls applicability only',
        fill: '#330011',
        id: 'delivery-scope',
        label: 'Delivery scope',
        prefix: 'DEL'
      }
    ],
    regions: [
      {
        box: { height: 180, width: 380, x: 10, y: 20 },
        fill: '#071e2d',
        frame: { style: 'dotted' },
        id: 'runtime',
        label: 'Runtime',
        labelPlacement: 'south-east'
      },
      {
        box: { height: 180, radius: 8, width: 380, x: 10, y: 20 },
        frame: { style: 'dashed' },
        id: 'delivery',
        label: 'Delivery',
        labelMount: 'boundary',
        labelPlacement: 'north'
      }
    ],
    cards: [
      {
        code: 'PLT-001',
        detail: 'Accepts work',
        domain: 'platform',
        id: 'gateway',
        label: 'Gateway',
        placement: { box: { height: 80, width: 180, x: 110, y: 70 }, ports: {} },
        scope: 'delivery-scope',
        scopes: ['delivery-scope'],
        stereotype: 'service'
      }
    ]
  }
})

const values = (output: string, attribute: string) =>
  [...output.matchAll(new RegExp(`${attribute}="([^"]+)"`, 'g'))].map((match) => match[1]).sort()

const regionPaths = (output: string) =>
  [...output.matchAll(/<path class="infoschematic-region-frame" d="([^"]+)"/g)].map((match) => match[1])

const at = (output: string, pattern: RegExp) => [...output.matchAll(pattern)].map((match) => `${match[1]},${match[2]}`)

/**
 * Where each Card's text was placed. Both renderers take their positions from
 * one calculation over the Card's own box, so the geometry is comparable and
 * not only the treatment flags that used to be all this suite could compare.
 */
const cardText = (output: string) => ({
  description: at(output, /class="infoschematic-card-description"[^>]*?x="([\d.-]+)" y="([\d.-]+)"/g),
  identity: at(output, /class="infoschematic-card-identity"[\s\S]*?<rect[^>]*?x="([\d.-]+)" y="([\d.-]+)"/g),
  label: at(output, /class="infoschematic-(?:service|card)-label"[^>]*?x="([\d.-]+)" y="([\d.-]+)"/g),
  stereotype: at(output, /class="infoschematic-card-stereotype"[^>]*?x="([\d.-]+)" y="([\d.-]+)"/g)
})

const strings = (output: string, pattern: RegExp) => [...output.matchAll(pattern)].map((match) => match[1] ?? '')

/** What each Card actually says, line by line, as opposed to where it says it. */
const cardStrings = (output: string) => ({
  description: strings(output, /class="infoschematic-card-description"[^>]*>([^<]*)</g),
  label: [...output.matchAll(/class="infoschematic-(?:service|card)-label"[^>]*>([\s\S]*?)<\/text>/g)].map((match) =>
    [...(match[1] ?? '').matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].map((line) => line[1]).join(' | ')
  ),
  stereotype: strings(output, /class="infoschematic-card-stereotype"[^>]*>([^<]*)</g)
})

/**
 * The line each renderer draws round an emphasised element, keyed by the element it names.
 *
 * Both renderers take it from one calculation over the element's own box, so the two paths are comparable as
 * strings. Attribute order differs between them, but the element's identity precedes its geometry in both.
 */
const emphasisOutlines = (output: string) =>
  Object.fromEntries(
    [
      ...output.matchAll(
        /<g[^>]*class="infoschematic-element-emphasis"[^>]*data-artefact-id="([^"]+)"[\s\S]*?<path[^>]*\bd="([^"]+)"/g
      )
    ].map((match) => [match[1] as string, match[2] as string])
  )

/**
 * Every code a rendering draws because the document pinned it to the element, keyed by the element that carries it.
 *
 * The two renderers name the drawing differently - Canvas reuses the annotation layer's classes, the static one
 * names the code layer - so the comparable thing is the element, its kind, and the rectangle its code was given.
 */
const pinnedCodes = (output: string) =>
  Object.fromEntries(
    [
      ...output.matchAll(
        /data-artefact-id="([^"]+)" data-artefact-kind="([^"]+)"><rect class="audit-component-code-bg"[^>]*?width="([\d.]+)" x="([\d.-]+)" y="([\d.-]+)"|<g class="infoschematic-(?:code|flow-annotation)" data-artefact-id="([^"]+)" data-artefact-kind="([^"]+)"[^>]*>\s*<rect[^>]*?width="([\d.]+)" x="([\d.-]+)" y="([\d.-]+)"/g
      )
    ].map((match) => {
      const [id, kind, width, x, y] = match[1] ? match.slice(1, 6) : match.slice(6, 11)
      return [`${kind}:${id}`, `${width}@${x},${y}`]
    })
  )

const semantics = (output: string, compactAttribute: 'data-card-compact' | 'data-compact') => ({
  compact: output.includes(`${compactAttribute}="true"`),
  dataInks: values(output, 'data-ink'),
  description: output.includes('class="infoschematic-card-description"'),
  domainColour: output.includes('fill="#063b35"') && output.includes('stroke="#22c3a6"'),
  domains: values(output, 'data-collection'),
  frames: values(output, 'data-frame-treatment'),
  grid: values(output, 'data-grid-treatment'),
  identity: output.includes('class="infoschematic-card-identity"'),
  labels: values(output, 'data-label-placement'),
  labelTreatments: values(output, 'data-label-treatment'),
  stereotype: output.includes('class="infoschematic-card-stereotype"'),
  surface: values(output, 'data-surface-treatment')
})

/**
 * The band each renderer draws beneath a Region label, as geometry rather than as markup.
 *
 * `ROUTE-019` requires both to derive it from the same resolved label geometry, and the two write the same rectangle
 * with different attributes around it - Canvas omits a fill it takes from the stylesheet, the static renderer always
 * states one - so the comparable thing is the rectangle, read attribute by attribute rather than as a string.
 */
const labelBackings = (output: string) =>
  [...output.matchAll(/<rect class="infoschematic-region-label-backing"[^>]*>/g)].map((match) => {
    const attributes = Object.fromEntries(
      [...match[0].matchAll(/([a-z-]+)="([^"]*)"/g)].map((attribute) => [
        attribute[1] as string,
        attribute[2] as string
      ])
    )
    return `${attributes.width}x${attributes.height}@${attributes.x},${attributes.y}`
  })

const labelBackingBoxes = (output: string) =>
  labelBackings(output).map((band) => {
    const [width, height, x, y] = (band.match(/([\d.-]+)x([\d.-]+)@([\d.-]+),([\d.-]+)/) as RegExpMatchArray)
      .slice(1)
      .map(Number)
    return { height: height as number, width: width as number, x: x as number, y: y as number }
  })

describe('visual treatment renderer parity', () => {
  it('keeps authored visual decisions byte-stable and equivalent across Canvas and static SVG', () => {
    const canvas = renderToStaticMarkup(createElement(Canvas, { config }))
    const svg = renderInfoschematicSvg(config)

    expect(renderToStaticMarkup(createElement(Canvas, { config }))).toBe(canvas)
    expect(renderInfoschematicSvg(config)).toBe(svg)
    expect(semantics(canvas, 'data-card-compact')).toEqual(semantics(svg, 'data-compact'))
    expect(regionPaths(canvas)).toEqual(regionPaths(svg))
  })

  it('applies the same output-only Card detail overrides without removing accessible authored text', () => {
    const cardDetails = { description: false, identity: false, stereotype: false }
    const canvas = renderToStaticMarkup(createElement(Canvas, { cardDetails, config }))
    const svg = renderInfoschematicSvg(config, { cardDetails })

    expect(semantics(canvas, 'data-card-compact')).toEqual(semantics(svg, 'data-compact'))
    expect(canvas).toContain('PLT-001 · Gateway · service · Accepts work')
    expect(svg).toContain('PLT-001 · Gateway · service · Accepts work')
  })

  it('resolves the same readable ink from the same fills in both renderers', () => {
    const inks = defineInfoschematic({
      title: 'Readable ink reference',
      infoschematic: {
        appearance: {
          card: { compact: true, description: true, identity: true, stereotype: true },
          surface: 'blueprint'
        },
        domains: [
          { color: '#22c3a6', fill: '#063b35', id: 'dark', label: 'Dark' },
          { color: '#13579b', fill: '#dceeff', id: 'light', label: 'Light' }
        ],
        scopes: [
          {
            color: '#ff0055',
            description: 'Controls applicability only',
            fill: '#330011',
            id: 'delivery-scope',
            label: 'Delivery scope',
            prefix: 'DEL'
          }
        ],
        regions: [
          {
            box: { height: 180, radius: 8, width: 380, x: 10, y: 20 },
            fill: '#071e2d',
            id: 'runtime',
            label: 'Runtime'
          }
        ],
        cards: [
          {
            code: 'DRK-001',
            detail: 'Dark fill takes light ink',
            domain: 'dark',
            id: 'dark-card',
            label: 'Dark card',
            placement: { box: { height: 60, width: 150, x: 30, y: 70 }, ports: {} },
            scope: 'delivery-scope',
            scopes: ['delivery-scope']
          },
          {
            code: 'LGT-001',
            detail: 'Light fill takes dark ink',
            domain: 'light',
            id: 'light-card',
            label: 'Light card',
            placement: { box: { height: 60, width: 150, x: 220, y: 70 }, ports: {} },
            scope: 'delivery-scope',
            scopes: ['delivery-scope']
          }
        ]
      }
    })
    const canvas = renderToStaticMarkup(createElement(Canvas, { config: inks }))
    const svg = renderInfoschematicSvg(inks)

    expect(semantics(canvas, 'data-card-compact')).toEqual(semantics(svg, 'data-compact'))
    expect(values(canvas, 'data-ink')).toEqual(['dark', 'light', 'light'])
  })

  it('keeps omitted and hidden region treatments equivalent across renderers', () => {
    const legacy = defineInfoschematic({
      title: 'Quiet region treatment',
      infoschematic: {
        regions: [
          {
            box: { height: 80, width: 300, x: 10, y: 10 },
            fill: '#eeeeee',
            id: 'legacy-fill',
            label: 'Legacy fill',
            labelPlacement: 'north-east'
          },
          {
            box: { height: 80, radius: 2, width: 300, x: 10, y: 10 },
            frame: { style: 'solid' },
            id: 'legacy',
            label: 'Legacy frame',
            labelMount: 'boundary'
          },
          {
            box: { height: 80, radius: 30, width: 300, x: 10, y: 150 },
            frame: { style: 'dashed' },
            id: 'hidden',
            label: 'Hidden frame',
            labelMount: 'boundary',
            labelPlacement: 'none'
          }
        ]
      }
    })
    const canvas = renderToStaticMarkup(createElement(Canvas, { config: legacy }))
    const svg = renderInfoschematicSvg(legacy)

    expect(semantics(canvas, 'data-card-compact')).toEqual(semantics(svg, 'data-compact'))
    expect(regionPaths(canvas)).toEqual(regionPaths(svg))
    expect(values(canvas, 'data-label-placement')).toEqual(['none', 'north-east', 'north-west'])
    expect(values(canvas, 'data-label-treatment')).toEqual(['notched', 'plain', 'plain'])
    expect(canvas).not.toContain('>HIDDEN FRAME</text>')
    expect(svg).not.toContain('>HIDDEN FRAME</text>')
  })

  it('fits Card text to the Card, identically in both renderers, without losing the authored text', () => {
    const wordy = defineInfoschematic({
      title: 'Card text reference',
      infoschematic: {
        appearance: { card: { compact: true, description: true, identity: true, stereotype: true } },
        scopes: [
          {
            color: '#ff0055',
            description: 'Controls applicability only',
            fill: '#330011',
            id: 'delivery-scope',
            label: 'Delivery scope',
            prefix: 'DEL'
          }
        ],
        cards: (
          [
            ['LND-001', 'Payments and settlement ledger', { height: 80, width: 160, x: 20, y: 20 }],
            ['SQR-001', 'Reconciliation', { height: 120, width: 120, x: 220, y: 20 }],
            ['TAL-001', 'Orchestration', { height: 240, width: 90, x: 380, y: 20 }]
          ] as const
        ).map(([code, label, box]) => ({
          code,
          detail: 'Settles card payments across the ledger',
          id: code.toLowerCase(),
          label,
          placement: { box, ports: {} },
          scope: 'delivery-scope',
          scopes: ['delivery-scope'],
          stereotype: 'orchestration service'
        }))
      }
    })
    const canvas = renderToStaticMarkup(createElement(Canvas, { config: wordy }))
    const svg = renderInfoschematicSvg(wordy)

    expect(cardStrings(canvas)).toEqual(cardStrings(svg))
    expect(cardStrings(svg)).toEqual({
      // Each string is cut to the band it is drawn in, so a wider Card says more.
      description: ['Settles card payments acros\u2026', 'Settles card paymen\u2026', 'Settles card\u2026'],
      label: ['Payments and settle\u2026', 'Reconciliation', 'Orchestra\u2026'],
      stereotype: ['ORCHESTRATION SERVICE', 'ORCHESTRATION SE\u2026', 'ORCHESTRATI\u2026']
    })
    // Fitting is a drawing decision: the authored text stays in the accessible name.
    expect(canvas).toContain('LND-001 \u00b7 Payments and settlement ledger \u00b7 orchestration service')
    expect(svg).toContain('LND-001 \u00b7 Payments and settlement ledger \u00b7 orchestration service')
  })

  it("places Card internals from each Card's own box, identically in both renderers", () => {
    const proportions = defineInfoschematic({
      title: 'Card proportion reference',
      infoschematic: {
        appearance: { card: { compact: true, description: true, identity: true, stereotype: true } },
        scopes: [
          {
            color: '#ff0055',
            description: 'Controls applicability only',
            fill: '#330011',
            id: 'delivery-scope',
            label: 'Delivery scope',
            prefix: 'DEL'
          }
        ],
        cards: (
          [
            ['LND-001', 'Landscape', { height: 80, width: 160, x: 20, y: 20 }],
            ['SQR-001', 'Square', { height: 120, width: 120, x: 220, y: 20 }],
            ['TAL-001', 'Tall', { height: 240, width: 90, x: 380, y: 20 }],
            ['SML-001', 'Small', { height: 40, width: 40, x: 500, y: 20 }]
          ] as const
        ).map(([code, label, box]) => ({
          code,
          detail: `${label} proportions`,
          id: code.toLowerCase(),
          label,
          placement: { box, ports: {} },
          scope: 'delivery-scope',
          scopes: ['delivery-scope'],
          stereotype: 'service'
        }))
      }
    })
    const canvas = renderToStaticMarkup(createElement(Canvas, { config: proportions }))
    const svg = renderInfoschematicSvg(proportions)

    expect(cardText(canvas)).toEqual(cardText(svg))
    expect(cardText(svg)).toEqual({
      // The narrow Card drops the identity chip it would otherwise draw over its
      // stereotype, and the smallest drops the whole band and its description.
      description: ['10,56', '10,56', '10,56'],
      identity: ['92.5,8', '52.5,8'],
      label: ['10,38', '10,38', '10,38', '10,28'],
      stereotype: ['10,18', '10,18', '10,18']
    })
  })

  it('keeps a Region label legible under a route that crosses its band, in both renderers', () => {
    /*
     * A route driven deliberately through the glyphs.
     *
     * `ROUTE-019` lets a Flow occupy a Region label's band - a Card inside a Region talking to one outside it has to
     * cross the frame the label is mounted on - and requires the label to survive the crossing rather than the band
     * to be reserved. The example the requirement used to cite no longer demonstrates it: its crossing routes pass
     * to the left of the glyphs. This document puts one straight down the middle of two labels, a boundary-mounted
     * one over the backdrop the notch exposes and a plain one set down on its Region's own fill.
     */
    const crossed = defineInfoschematic({
      title: 'Crossed label reference',
      infoschematic: {
        appearance: { surface: 'blueprint' },
        scopes: [{ color: '#79c9ff', description: 'One', fill: '#0d1b2a', id: 'one', label: 'One', prefix: 'ONE' }],
        flowFamilies: [{ color: '#79c9ff', description: 'Calls', id: 'calls', label: 'Calls', prefix: 'CALL' }],
        regions: [
          {
            box: { height: 200, radius: 8, width: 360, x: 20, y: 120 },
            frame: { style: 'solid' },
            id: 'runtime',
            label: 'Runtime',
            labelMount: 'boundary',
            labelPlacement: 'north'
          },
          {
            box: { height: 60, width: 280, x: 60, y: 130 },
            fill: '#0b2a3a',
            id: 'inner',
            label: 'Inner band',
            labelPlacement: 'north'
          }
        ],
        cards: [
          {
            code: 'ONE-001',
            detail: 'Inside the region',
            id: 'inside',
            label: 'Inside',
            placement: { box: { height: 60, width: 120, x: 140, y: 200 }, ports: { north: 1 } },
            scope: 'one',
            scopes: ['one']
          },
          {
            code: 'ONE-002',
            detail: 'Outside the region',
            id: 'outside',
            label: 'Outside',
            placement: { box: { height: 60, width: 120, x: 140, y: 20 }, ports: { south: 1 } },
            scope: 'one',
            scopes: ['one']
          }
        ],
        flows: [
          {
            code: 'CALL-001',
            family: 'calls',
            id: 'call',
            points: [
              { x: 200, y: 200 },
              { x: 200, y: 80 }
            ],
            source: 'inside',
            sourcePort: 'N1',
            target: 'outside',
            targetPort: 'S1'
          }
        ]
      }
    })
    const canvas = renderToStaticMarkup(createElement(Canvas, { config: crossed }))
    const svg = renderInfoschematicSvg(crossed)

    // One rectangle per label, identical in both, because both take it from the resolved label geometry rather than
    // measuring their own. Two labels are drawn, so two bands are.
    expect(labelBackings(canvas)).toEqual(labelBackings(svg))
    expect(labelBackings(canvas)).toHaveLength(2)

    // The route is what the band exists for, so the case asserts the crossing rather than assuming it: the line runs
    // down x=200 from y=200 to y=80, and each band has to contain that column over its own run of the line.
    for (const band of labelBackingBoxes(svg)) {
      expect(band.x).toBeLessThan(200)
      expect(band.x + band.width).toBeGreaterThan(200)
      expect(band.y).toBeGreaterThan(80)
      expect(band.y + band.height).toBeLessThan(200)
    }

    // Each band is filled with the surface its label sits on: the Region's own fill under a plain label, the
    // backdrop under a boundary-mounted one, which is the same reading the label's ink takes.
    expect(svg).toContain(`<rect class="infoschematic-region-label-backing" fill="#0b2a3a"`)
    expect(svg).toContain(
      `<rect class="infoschematic-region-label-backing" fill="${visualTokens.canvas.surfaces.backdrop}"`
    )
    // Canvas states the fill where it beats the class rule that gives every other band its surface colour: a
    // presentation attribute loses to a stylesheet, so the Region's own fill is inline style or it is not applied.
    expect(canvas).toContain('class="infoschematic-region-label-backing" style="fill:#0b2a3a"')

    // Paint order, which is the half of the requirement geometry cannot show: the glyphs are drawn after the routes
    // in both outlets, so the backing covers stroke rather than being covered by it.
    expect(canvas.indexOf('infoschematic-region-label-layer')).toBeGreaterThan(canvas.lastIndexOf('flow-family-calls'))
    expect(svg.indexOf('infoschematic-region-label-layer')).toBeGreaterThan(
      svg.lastIndexOf('class="infoschematic-flow"')
    )
  })

  it('arms a Flow with the same arrowhead in both renderers', () => {
    const routed = defineInfoschematic({
      title: 'Arrowhead reference',
      infoschematic: {
        scopes: [{ color: '#79c9ff', description: 'One', fill: '#0d1b2a', id: 'one', label: 'One', prefix: 'ONE' }],
        flowFamilies: [{ color: '#79c9ff', description: 'Calls', id: 'calls', label: 'Calls', prefix: 'CALL' }],
        cards: [
          {
            code: 'ONE-001',
            detail: 'Source node',
            id: 'source',
            label: 'Source',
            placement: { box: { height: 60, width: 120, x: 20, y: 20 }, ports: { east: 1 } },
            scope: 'one',
            scopes: ['one']
          },
          {
            code: 'ONE-002',
            detail: 'Target node',
            id: 'target',
            label: 'Target',
            placement: { box: { height: 60, width: 120, x: 220, y: 20 }, ports: { west: 1 } },
            scope: 'one',
            scopes: ['one']
          }
        ],
        flows: [
          {
            code: 'CALL-001',
            family: 'calls',
            id: 'call',
            points: [
              { x: 140, y: 50 },
              { x: 220, y: 50 }
            ],
            source: 'source',
            sourcePort: 'E1',
            target: 'target',
            targetPort: 'W1'
          }
        ]
      }
    })
    const canvas = renderToStaticMarkup(createElement(Canvas, { config: routed }))
    const svg = renderInfoschematicSvg(routed)

    // `marker-end` resolves a `marker` element and nothing else, so emitting a
    // `g` here defines an arrowhead that is referenced and never drawn — a Flow
    // that arrives blunt while every structural assertion still passes. Both
    // renderers state the same user-space triangle on the same four-unit route.
    for (const markup of [canvas, svg]) {
      expect(markup).toContain('<marker')
      expect(markup).toContain('markerUnits="userSpaceOnUse"')
      expect(markup).toContain('markerWidth="32"')
      expect(markup).toContain('markerHeight="32"')
      expect(markup).toContain('refX="24"')
      expect(markup).toContain('refY="12"')
      expect(markup).toMatch(/M0[ ,]0 L0[ ,]24 L24[ ,]12 z/)

      // The Flow must reference an arrowhead, and it must be one this rendering defines. The two
      // renderers name an arrowhead differently — the static one by the family's index, Canvas by its
      // id — so what parity compares is that each resolves its own, not that they agree on a string.
      expect(markup).toMatch(/marker-(?:end|start)="url\(#[^)"]+\)"/)
      expect(resolvedReferences(markup).filter((entry) => !entry.defined)).toEqual([])
    }
  })

  /*
   * A Point is the one element whose whole appearance is its geometry, so the two renderings have nothing else to
   * agree about: same centre, same radius, same authored stroke. Canvas adds a press target the static renderer has
   * no use for, and paints its fallback from the dark surface palette rather than the light one, exactly as a Card
   * already does - so what is compared here is the mark, not the layer around it.
   */
  it('paints a Point at the same place and size in both renderers', () => {
    const pointed = defineInfoschematic({
      title: 'Point reference',
      infoschematic: {
        points: [{ code: 'PT-001', id: 'junction', label: 'Junction', point: { x: 120, y: 90 }, scopes: ['one'] }],
        scopes: [{ color: '#79c9ff', description: 'One', fill: '#0d1b2a', id: 'one', label: 'One', prefix: 'ONE' }]
      }
    })
    const canvas = renderToStaticMarkup(createElement(Canvas, { config: pointed }))
    const svg = renderInfoschematicSvg(pointed)
    const { pointLabelGap, pointLabelHeight, pointRadius } = visualTokens.canvas.geometry

    for (const markup of [canvas, svg]) {
      expect(markup).toContain('data-artefact-kind="point"')
      expect(markup).toContain('cx="120"')
      expect(markup).toContain('cy="90"')
      expect(markup).toContain(`r="${pointRadius}"`)
      expect(markup).toContain('stroke="#79c9ff"')
    }

    // The authored label is drawn, in both renderings, at the one place `resolvePointLabel` puts it. A Point with no
    // Flow leaving it takes the first preferred side, so the text is centred below the mark, clear of its radius.
    const below = 90 + pointRadius + pointLabelGap + pointLabelHeight / 2
    for (const markup of [canvas, svg]) {
      expect(markup).toContain('class="infoschematic-point-label"')
      expect(markup).toContain('text-anchor="middle"')
      expect(markup).toContain(`x="120" y="${below}"`)
      expect(markup).toContain('>Junction</text>')
    }
  })

  it('draws a code the author pinned to an element in the same place in both renderers', () => {
    const pinned = defineInfoschematic({
      title: 'Pinned code reference',
      infoschematic: {
        scopes: [{ color: '#79c9ff', description: 'One', fill: '#0d1b2a', id: 'one', label: 'One', prefix: 'ONE' }],
        flowFamilies: [{ color: '#79c9ff', description: 'Calls', id: 'calls', label: 'Calls', prefix: 'CALL' }],
        regions: [{ box: { height: 200, width: 400, x: 10, y: 10 }, id: 'runtime', identity: true, label: 'Runtime' }],
        fabrics: [
          {
            code: 'FAB-001',
            detail: 'Fabric detail',
            id: 'fabric',
            identity: true,
            label: 'Fabric',
            placement: { box: { height: 60, width: 180, x: 30, y: 30 } },
            scope: 'one',
            scopes: ['one']
          }
        ],
        cards: [
          {
            code: 'ONE-001',
            detail: 'Source node',
            id: 'source',
            identity: true,
            label: 'Source',
            placement: { box: { height: 60, width: 160, x: 30, y: 120 }, ports: { east: 1 } },
            scope: 'one',
            scopes: ['one']
          },
          {
            code: 'ONE-002',
            detail: 'Target node',
            id: 'target',
            label: 'Target',
            placement: { box: { height: 60, width: 160, x: 250, y: 120 }, ports: { west: 1 } },
            scope: 'one',
            scopes: ['one']
          }
        ],
        points: [
          {
            code: 'PT-001',
            id: 'junction',
            identity: true,
            label: 'Junction',
            point: { x: 200, y: 220 },
            scopes: ['one']
          }
        ],
        flows: [
          {
            code: 'CALL-001',
            family: 'calls',
            id: 'call',
            identity: true,
            points: [],
            source: 'source',
            sourcePort: 'E1',
            target: 'target',
            targetPort: 'W1'
          }
        ]
      }
    })
    const canvas = renderToStaticMarkup(createElement(Canvas, { config: pinned }))
    const svg = renderInfoschematicSvg(pinned)

    // `ROUTE-021` requires one rectangle wherever a code came from, and a pinned code is drawn with no reader
    // request at all, so the two renderers have no shared toggle to agree through: they agree or they differ.
    expect(pinnedCodes(canvas)).toEqual(pinnedCodes(svg))
    expect(pinnedCodes(svg)).toEqual({
      'fabric:FAB-001': '56@150,35',
      'flow:CALL-001': '61@189.5,140',
      'point:PT-001': '56@172,186',
      'region:runtime': '56@350,15'
    })
    // The Card that carries its code draws it in its own identity chip, in the same slot in both, and the Card
    // that says nothing draws none: a diagram that never mentioned Cards is not making them all speak.
    expect(cardText(canvas)).toEqual(cardText(svg))
    expect(cardText(svg).identity).toEqual(['92.5,8'])
    for (const markup of [canvas, svg]) expect(markup).toContain('>ONE-001</text>')
    for (const markup of [canvas, svg]) expect(markup).not.toContain('>ONE-002</text>')
  })

  it('claps an Adapter Card round the Card it holds, identically in both renderers', () => {
    const composed = defineInfoschematicModel({
      id: 'adapter-parity',
      title: 'Adapter parity reference',
      diagram: {
        appearance: { surface: 'blueprint' },
        bounds: { height: 240, width: 420, x: 0, y: 0 },
        gridSize: 10,
        cards: [
          { id: 'LEG', label: 'Legacy encoder', bounds: { height: 160, width: 220, x: 100, y: 40 } },
          // Authored away from the Card it holds on purpose: an Adapter Card's box is derived from that Card, so
          // both renderers must ignore this one. One renderer reading it was how the same adapter came to be drawn
          // in two places.
          { id: 'ADPT', label: 'Encoder adapter', adapts: 'LEG', bounds: { height: 10, width: 10, x: 0, y: 0 } }
        ]
      }
    })
    const canvas = renderToStaticMarkup(createElement(Canvas, { config: composed }))
    const svg = renderInfoschematicSvg(composed)
    const held = { height: 160, width: 220, x: 100, y: 40 }
    const clasp = adapterBoundsFor(held)
    const outline = adapterClaspOutline(held, visualTokens.canvas.geometry.cornerRadius)

    // One notched outline, not a rectangle: the still renderer painted a `<rect>` over the lower half of the Card
    // the adapter holds until it drew this shape, and a suite comparing treatment flags could not see it.
    for (const markup of [canvas, svg]) {
      expect(markup).toContain('class="infoschematic-adapter"')
      expect(markup).toContain(`<path class="adapter-socket" d="${outline}"`)
    }

    // The adapter's own label goes in the footer band below the notch. Centred in the clasp box it lands on the held
    // Card's label, which is why the showcase authored `compact: true` before this.
    for (const markup of [canvas, svg]) {
      expect(markup).toContain(`x="${clasp.x + clasp.width / 2}" y="${adapterLabelBaseline(held)}"`)
      expect(markup).toContain('>Encoder adapter</text>')
    }

    // The derived box, in both: the authored 10×10 at the origin positions nothing.
    for (const markup of [canvas, svg]) {
      expect(markup).not.toContain('d="M0 0')
      expect(outline).toContain(`${clasp.x + clasp.width}`)
    }
  })

  it('keeps the dots grid treatment equivalent across renderers', () => {
    const dotted = defineInfoschematic({
      title: 'Dotted grid reference',
      infoschematic: { appearance: { grid: 'dots' } }
    })
    const canvas = renderToStaticMarkup(createElement(Canvas, { config: dotted }))
    const svg = renderInfoschematicSvg(dotted)

    expect(semantics(canvas, 'data-card-compact')).toEqual(semantics(svg, 'data-compact'))
    expect(values(canvas, 'data-grid-treatment')).toEqual(['dots'])

    // Each renderer must fill its grid from a dots pattern it defines itself. The prefix is per-rendering;
    // the treatment the identifier names is the part parity is about, so the suffix is what is compared.
    for (const markup of [canvas, svg]) {
      const grids = resolvedReferences(markup).filter((entry) => entry.reference.includes('-grid-'))
      expect(grids.length).toBeGreaterThan(0)
      expect(grids.filter((entry) => !entry.defined)).toEqual([])
      expect(grids.some((entry) => entry.reference.endsWith('-grid-dots'))).toBe(true)
    }

    // Both renderers must tile the dots on the major pitch, and centre each dot
    // in its tile so the edge does not clip it to a quarter. Either renderer
    // drifting to the minor pitch turns a lattice of marks into a dense screen.
    const { gridMajorSize } = visualTokens.canvas.geometry
    for (const markup of [canvas, svg]) {
      expect(markup).toContain(`height="${gridMajorSize}"`)
      expect(markup).toContain(`x="${-gridMajorSize / 2}"`)
      expect(markup).toContain(`y="${-gridMajorSize / 2}"`)
      expect(markup).toContain(`cx="${gridMajorSize / 2}"`)
      expect(markup).toContain(`cy="${gridMajorSize / 2}"`)
    }
  })

  it('draws the same emphasis perimeter round the same element in both renderers', () => {
    const emphasised = defineInfoschematicModel({
      id: 'emphasis-parity',
      title: 'Emphasis parity reference',
      diagram: {
        bounds: { height: 200, width: 420, x: 0, y: 0 },
        gridSize: 10,
        regions: [{ id: 'ZONE', label: 'Zone', bounds: { height: 140, width: 380, x: 10, y: 20 } }],
        cards: [{ id: 'SNK', label: 'Sink', bounds: { height: 60, width: 120, x: 260, y: 40 } }],
        dynamics: [
          { id: 'attention', label: 'Sink needs attention', kind: 'emphasise-elements', elements: ['SNK', 'ZONE'] }
        ]
      }
    })
    const dynamics = [{ dynamicId: 'attention', occurrenceKey: 'run-1' }]
    const canvas = renderToStaticMarkup(createElement(Canvas, { config: emphasised, dynamics }))
    const svg = renderInfoschematicSvg(emphasised, { dynamics })

    const outlines = emphasisOutlines(canvas)
    expect(Object.keys(outlines).sort()).toEqual(['SNK', 'ZONE'])
    expect(outlines).toEqual(emphasisOutlines(svg))
    expect(outlines.SNK).toBe(emphasisPerimeterPath({ height: 60, width: 120, x: 260, y: 40 }))

    // Parity says the two renderers agree; it cannot say either is right, and looking at the output is what
    // settles that. What the agreement is worth here is that the mark Canvas sends round the element travels the
    // very string the still renderer draws as its outline, so a corner the outline rounds is not one the mark
    // cuts — and that the still frame states no direction, because the document does not state one either.
    expect(canvas).toContain(`<animateMotion dur="${visualTokens.canvas.emphasis.duration}" path="${outlines.SNK}"`)
    expect(svg).not.toContain('animateMotion')
  })
})

/**
 * One standard piece's own markup, from the group that names it to that group's close.
 *
 * A piece nests groups of its own, so the end is found by depth rather than by the next `</g>`. Isolating the piece
 * is what makes the comparison below about the drawing: the two renderings around it share almost nothing, and a
 * count taken over a whole page would be dominated by chrome neither renderer draws for the other.
 */
const artworkPiece = (markup: string, key: string) => {
  const opening = markup.indexOf(`data-artwork="${key}"`)
  if (opening < 0) throw new Error(`Nothing in this rendering drew the \`${key}\` artwork`)
  const start = markup.indexOf('>', opening) + 1
  let cursor = start
  let closed = start
  let depth = 1
  while (depth > 0) {
    const next = /<(\/?)g\b/.exec(markup.slice(cursor))
    if (!next) throw new Error(`The \`${key}\` artwork group never closes`)
    depth += next[1] === '/' ? -1 : 1
    closed = cursor + next.index
    cursor = closed + next[0].length
  }
  return markup.slice(start, closed)
}

/**
 * What one piece draws, in the terms both renderers are meant to agree on.
 *
 * Shape counts and geometry are the agreement: a piece that draws six arrows in Canvas and five here is the defect
 * this check exists for. Resource references are reduced to a placeholder because each rendering names its own ids
 * — `resolvedReferences` is what asserts those resolve — and `font-family` is left out because the two surfaces
 * deliberately set their own, exactly as a Card's already does.
 */
const artworkDrawing = (markup: string, key: string) => {
  const piece = artworkPiece(markup, key)
  const attribute = (name: string) =>
    [...piece.matchAll(new RegExp(`\\b${name}="([^"]*)"`, 'g'))]
      .map((match) => match[1].replace(/url\(#[^)]*\)/g, 'url(#resource)'))
      .sort()
  return {
    counts: Object.fromEntries(
      (['circle', 'g', 'path', 'rect', 'text'] as const).map((name) => [
        name,
        [...piece.matchAll(new RegExp(`<${name}\\b`, 'g'))].length
      ])
    ),
    d: attribute('d'),
    fill: attribute('fill'),
    height: attribute('height'),
    markerEnd: attribute('marker-end'),
    r: attribute('r'),
    stroke: attribute('stroke'),
    strokeDash: attribute('stroke-dasharray'),
    strokeWidth: attribute('stroke-width'),
    text: [...piece.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((match) => match[1]).sort(),
    transform: attribute('transform'),
    width: attribute('width'),
    x: attribute('x'),
    y: attribute('y')
  }
}

/*
 * The standard renderer catalogue is nine pieces the product offers rather than a host does, and each one is drawn
 * twice: once as React elements and once as SVG strings. Nothing but this check says the two walks of the one
 * description arrive at the same drawing. The documents ask for `blueprint`, because that is the surface on which
 * the static renderer resolves the interactive palette, so paint is comparable here too rather than only geometry.
 */
describe('standard renderer catalogue parity', () => {
  const box = (index: number) => ({ height: 140, width: 320, x: 40, y: 40 + index * 200 })

  it('draws every standard Fabric treatment the same way in both renderers', () => {
    const catalogue = defineInfoschematic({
      title: 'Standard Fabric catalogue',
      infoschematic: {
        appearance: { surface: 'blueprint' },
        scopes: [{ color: '#79c9ff', description: 'One', fill: '#0d1b2a', id: 'one', label: 'One', prefix: 'ONE' }],
        fabrics: standardFabricKeys.map((key, index) => ({
          appearance: { renderer: key },
          code: `FAB-00${index + 1}`,
          detail: 'A substrate every stage can reach',
          id: key,
          label: key,
          placement: { box: box(index), ports: {} },
          scope: 'one',
          scopes: ['one']
        }))
      }
    })
    const canvas = renderToStaticMarkup(createElement(Canvas, { config: catalogue }))
    const svg = renderInfoschematicSvg(catalogue)

    for (const key of standardFabricKeys) {
      const drawn = artworkDrawing(svg, key)
      expect(artworkDrawing(canvas, key), key).toEqual(drawn)
      // A catalogue entry that resolved but drew nothing would satisfy the comparison above twice over.
      expect(drawn.counts.path + drawn.counts.rect, key).toBeGreaterThan(1)
      /* Every Fabric piece captions itself from the document, fitted to the band it is drawn in rather than to the
         label's own length — so the caption is a prefix of the label, whole or cut. */
      const fitted = drawn.text.map((entry) => entry.replace('\u2026', ''))
      expect(
        fitted.every((entry) => entry.length > 0) && fitted.some((entry) => key.startsWith(entry)),
        `${key} captions: ${fitted.join(' | ')}`
      ).toBe(true)
    }
    // The accessible name is the document's whichever treatment draws the Fabric.
    expect(canvas).toContain('>FAB-001: internet-cloud · A substrate every stage can reach<')
    expect(svg).toContain('>FAB-001: internet-cloud · A substrate every stage can reach<')
    for (const markup of [canvas, svg]) expect(resolvedReferences(markup).filter((entry) => !entry.defined)).toEqual([])
  })

  it('draws every standard Graphic treatment the same way in both renderers', () => {
    for (const key of standardGraphicKeys) {
      const drawing = defineInfoschematic({
        title: `Standard ${key}`,
        infoschematic: {
          appearance: { surface: 'blueprint' },
          graphics: [
            {
              id: key,
              label: 'Adaptation',
              placement: box(0),
              properties: { text: 'Observe, decide, act, and observe again' },
              renderer: key
            }
          ]
        }
      })
      /* Both renderers are handed the document and nothing else: an authored Overlay is drawn wherever the Diagram
         is drawn, so neither a Scene's graphic nor a visibility option is needed to reach the treatment. */
      const canvas = renderToStaticMarkup(createElement(Canvas, { config: drawing }))
      const svg = renderInfoschematicSvg(drawing)

      const drawn = artworkDrawing(svg, key)
      expect(artworkDrawing(canvas, key), key).toEqual(drawn)
      /* A piece that resolved but drew nothing would satisfy the comparison above twice over. The floor is the
         whole drawing rather than its outlines, because `annotation` is a panel and its lines of text. */
      const drew = Object.values(drawn.counts).reduce((total, count) => total + count, 0)
      expect(drew, key).toBeGreaterThan(1)
      /* A Scene naming the same Overlay adds nothing: the union is deduplicated by id, so the piece is drawn once. */
      const scened = renderToStaticMarkup(
        createElement(Canvas, {
          config: drawing,
          graphic: createInfoschematicRuntime(drawing).infoschematicOverlays[0]
        })
      )
      expect(artworkDrawing(scened, key), key).toEqual(drawn)
      for (const markup of [canvas, svg])
        expect(
          resolvedReferences(markup).filter((entry) => !entry.defined),
          key
        ).toEqual([])
    }
  })
})
