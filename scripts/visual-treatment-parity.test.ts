import { defineInfoschematic } from '@infoschematics/domain-core'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { Canvas } from '@infoschematics/view-canvas'
import { visualTokens } from '@infoschematics/view-model/tokens'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

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

const semantics = (output: string, compactAttribute: 'data-card-compact' | 'data-compact') => ({
  compact: output.includes(`${compactAttribute}="true"`),
  dataInks: values(output, 'data-ink'),
  description: output.includes('class="infoschematic-card-description"'),
  domainColour: output.includes('fill="#063b35"') && output.includes('stroke="#22c3a6"'),
  domains: values(output, 'data-domain'),
  frames: values(output, 'data-frame-treatment'),
  grid: values(output, 'data-grid-treatment'),
  identity: output.includes('class="infoschematic-card-identity"'),
  labels: values(output, 'data-label-placement'),
  labelTreatments: values(output, 'data-label-treatment'),
  stereotype: output.includes('class="infoschematic-card-stereotype"'),
  surface: values(output, 'data-surface-treatment')
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
      expect(markup).toMatch(/marker-end="url\(#infoschematic-arrow-[^"]+\)"|markerEnd/)
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
    expect(canvas).toContain('fill="url(#infoschematic-grid-dots)"')
    expect(svg).toContain('fill="url(#infoschematic-grid-dots)"')

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
})
