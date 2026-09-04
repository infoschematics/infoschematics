import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { defineInfoschematic } from '@infoschematics/domain-core'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { Canvas } from '@infoschematics/view-canvas'

const config = defineInfoschematic({
  title: 'Cross-renderer treatment reference',
  infoschematic: {
    appearance: {
      card: { compact: true, description: true, identity: true, stereotype: true },
      grid: 'major-plus-minor',
      surface: 'blueprint',
    },
    domains: [
      {
        color: '#22c3a6',
        fill: '#063b35',
        id: 'platform',
        label: 'Platform',
      },
    ],
    scopes: [
      {
        color: '#ff0055',
        description: 'Controls applicability only',
        fill: '#330011',
        id: 'delivery-scope',
        label: 'Delivery scope',
        prefix: 'DEL',
      },
    ],
    regions: [
      {
        box: { height: 180, width: 380, x: 10, y: 20 },
        fill: '#071e2d',
        frame: { style: 'dotted' },
        id: 'runtime',
        label: 'Runtime',
        labelPlacement: 'south-east',
      },
      {
        box: { height: 180, radius: 8, width: 380, x: 10, y: 20 },
        frame: { style: 'dashed' },
        id: 'delivery',
        label: 'Delivery',
        labelMount: 'boundary',
        labelPlacement: 'north',
      },
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
        stereotype: 'service',
      },
    ],
  },
})

const values = (output: string, attribute: string) =>
  [...output.matchAll(new RegExp(`${attribute}="([^"]+)"`, 'g'))].map((match) => match[1]).sort()

const regionPaths = (output: string) =>
  [
    ...output.matchAll(
      /<path class="infoschematic-region-frame" d="([^"]+)"/g,
    ),
  ].map((match) => match[1])

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
  surface: values(output, 'data-surface-treatment'),
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
          surface: 'blueprint',
        },
        domains: [
          { color: '#22c3a6', fill: '#063b35', id: 'dark', label: 'Dark' },
          { color: '#13579b', fill: '#dceeff', id: 'light', label: 'Light' },
        ],
        scopes: [
          {
            color: '#ff0055',
            description: 'Controls applicability only',
            fill: '#330011',
            id: 'delivery-scope',
            label: 'Delivery scope',
            prefix: 'DEL',
          },
        ],
        regions: [
          {
            box: { height: 180, radius: 8, width: 380, x: 10, y: 20 },
            fill: '#071e2d',
            id: 'runtime',
            label: 'Runtime',
          },
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
            scopes: ['delivery-scope'],
          },
          {
            code: 'LGT-001',
            detail: 'Light fill takes dark ink',
            domain: 'light',
            id: 'light-card',
            label: 'Light card',
            placement: { box: { height: 60, width: 150, x: 220, y: 70 }, ports: {} },
            scope: 'delivery-scope',
            scopes: ['delivery-scope'],
          },
        ],
      },
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
            id: 'legacy-zone',
            label: 'Legacy zone',
            labelPlacement: 'north-east',
          },
          {
            box: { height: 80, radius: 2, width: 300, x: 10, y: 10 },
            frame: { style: 'solid' },
            id: 'legacy',
            label: 'Legacy lane',
            labelMount: 'boundary',
          },
          {
            box: { height: 80, radius: 30, width: 300, x: 10, y: 150 },
            frame: { style: 'dashed' },
            id: 'hidden',
            label: 'Hidden lane',
            labelMount: 'boundary',
            labelPlacement: 'none',
          },
        ],
      },
    })
    const canvas = renderToStaticMarkup(createElement(Canvas, { config: legacy }))
    const svg = renderInfoschematicSvg(legacy)

    expect(semantics(canvas, 'data-card-compact')).toEqual(semantics(svg, 'data-compact'))
    expect(regionPaths(canvas)).toEqual(regionPaths(svg))
    expect(values(canvas, 'data-label-placement')).toEqual(['none', 'north-east', 'north-west'])
    expect(values(canvas, 'data-label-treatment')).toEqual(['notched', 'plain', 'plain'])
    expect(canvas).not.toContain('>HIDDEN LANE</text>')
    expect(svg).not.toContain('>HIDDEN LANE</text>')
  })

  it('keeps the dots grid treatment equivalent across renderers', () => {
    const dotted = defineInfoschematic({
      title: 'Dotted grid reference',
      infoschematic: { appearance: { grid: 'dots' } },
    })
    const canvas = renderToStaticMarkup(createElement(Canvas, { config: dotted }))
    const svg = renderInfoschematicSvg(dotted)

    expect(semantics(canvas, 'data-card-compact')).toEqual(semantics(svg, 'data-compact'))
    expect(values(canvas, 'data-grid-treatment')).toEqual(['dots'])
    expect(canvas).toContain('fill="url(#infoschematic-grid-dots)"')
    expect(svg).toContain('fill="url(#infoschematic-grid-dots)"')
  })
})
