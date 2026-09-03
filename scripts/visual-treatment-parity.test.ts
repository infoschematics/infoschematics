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
    lanes: [
      {
        appearance: { frame: 'notched', label: 'north' },
        height: 180,
        id: 'delivery',
        label: 'Delivery',
        labelY: 20,
        panel: { height: 180, radius: 8, width: 380, x: 10, y: 20 },
        y: 20,
        zones: [
          {
            appearance: { frame: 'plain', label: 'south-east' },
            fill: '#071e2d',
            id: 'runtime',
            label: 'Runtime',
            width: 380,
            x: 10,
          },
        ],
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
      /<path class="infoschematic-(?:lane|region-frame|zone-frame)" d="([^"]+)"/g,
    ),
  ].map((match) => match[1])

const semantics = (output: string, compactAttribute: 'data-card-compact' | 'data-compact') => ({
  compact: output.includes(`${compactAttribute}="true"`),
  description: output.includes('class="infoschematic-card-description"'),
  domainColour: output.includes('fill="#063b35"') && output.includes('stroke="#22c3a6"'),
  domains: values(output, 'data-domain'),
  frames: values(output, 'data-frame-treatment'),
  grid: values(output, 'data-grid-treatment'),
  identity: output.includes('class="infoschematic-card-identity"'),
  labels: values(output, 'data-label-placement'),
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

  it('keeps omitted and hidden region treatments equivalent with redundant legacy bounds', () => {
    const legacy = defineInfoschematic({
      title: 'Legacy region treatment',
      infoschematic: {
        lanes: [
          {
            height: 100,
            id: 'legacy',
            label: 'Legacy lane',
            labelY: 30,
            panel: { height: 80, radius: 2, width: 300, x: 10, y: 10 },
            y: 30,
            zones: [
              { fill: '#eeeeee', id: 'legacy-zone', label: 'Legacy zone', width: 300, x: 10 },
            ],
          },
          {
            appearance: { frame: 'notched', label: 'none' },
            height: 80,
            id: 'hidden',
            label: 'Hidden lane',
            labelY: 150,
            panel: { height: 80, radius: 30, width: 300, x: 10, y: 150 },
            y: 150,
            zones: [],
          },
        ],
      },
    })
    const canvas = renderToStaticMarkup(createElement(Canvas, { config: legacy }))
    const svg = renderInfoschematicSvg(legacy)

    expect(semantics(canvas, 'data-card-compact')).toEqual(semantics(svg, 'data-compact'))
    expect(regionPaths(canvas)).toEqual(regionPaths(svg))
    expect(values(canvas, 'data-label-placement')).toEqual(['none', 'north-east', 'north-west'])
    expect(canvas).not.toContain('>HIDDEN LANE</text>')
    expect(svg).not.toContain('>HIDDEN LANE</text>')
  })
})
