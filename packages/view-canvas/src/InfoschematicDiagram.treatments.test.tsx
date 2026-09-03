import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { defineInfoschematic } from '@infoschematics/domain-core'
import type { GridTreatment } from '@infoschematics/domain-model/appearance'
import { Canvas } from './Canvas.tsx'

const treatmentConfig = defineInfoschematic({
  title: 'Treatment reference',
  infoschematic: {
    appearance: {
      surface: 'blueprint',
      grid: 'major-plus-minor',
      card: { compact: true, description: true, identity: true, stereotype: true },
    },
    scopes: [
      {
        id: 'delivery',
        prefix: 'DEL',
        label: 'Delivery scope',
        description: 'Controls applicability',
        color: '#ff0055',
        fill: '#330011',
      },
    ],
    domains: [
      {
        id: 'platform',
        label: 'Platform domain',
        description: 'Controls semantic treatment',
        color: '#00aa88',
        fill: '#053c35',
      },
    ],
    lanes: [
      {
        id: 'lane',
        label: 'Delivery',
        appearance: { frame: 'notched', label: 'south-east' },
        y: 20,
        height: 240,
        labelY: 20,
        legend: 'bottom',
        panel: { x: 10, y: 20, width: 620, height: 240, radius: 8 },
        zones: [
          {
            id: 'zone',
            label: 'Runtime',
            appearance: { frame: 'plain', label: 'center' },
            x: 10,
            width: 620,
            fill: '#071e2d',
          },
        ],
      },
    ],
    cards: [
      {
        id: 'gateway',
        code: 'DEL-001',
        label: 'Gateway',
        detail: 'Accepts external requests',
        scope: 'delivery',
        scopes: ['delivery'],
        domain: 'platform',
        stereotype: 'service',
        placement: { box: { x: 80, y: 100, width: 220, height: 90 }, ports: {} },
      },
    ],
  },
})

describe('Canvas visual treatments', () => {
  it('renders authored blueprint, shared region geometry, compact Card metadata and Domain semantics', () => {
    const markup = renderToStaticMarkup(<Canvas config={treatmentConfig} />)

    expect(markup).toContain('data-surface-treatment="blueprint"')
    expect(markup).toContain('data-grid-treatment="major-plus-minor"')
    expect(markup).toContain('fill="url(#infoschematic-grid-major-plus-minor)"')
    expect(markup).toContain('data-frame-treatment="notched"')
    expect(markup).toContain('data-label-placement="south-east"')
    expect(markup).toContain('data-frame-treatment="plain"')
    expect(markup).toContain('data-label-placement="center"')
    expect(markup).toContain('class="infoschematic-region-frame"')

    expect(markup).toContain('data-card-compact="true"')
    expect(markup).toContain('data-domain="platform"')
    expect(markup).toContain('fill="#053c35"')
    expect(markup).toContain('stroke="#00aa88"')
    expect(markup).not.toContain('stroke="#ff0055"')
    expect(markup).toContain('data-card-detail="identity"')
    expect(markup).toContain('data-card-detail="stereotype"')
    expect(markup).toContain('data-card-detail="description"')
    expect(markup).toContain('«service»')
    expect(markup).toContain('Accepts external requests')
    expect(markup).toContain('aria-label="Card Gateway"')
    expect(markup).toContain('<title>DEL-001 · Gateway · service · Accepts external requests</title>')
  })

  it('keeps hidden Card metadata accessible when output detail overrides hide its visual rows', () => {
    const markup = renderToStaticMarkup(
      <Canvas
        cardDetails={{ description: false, identity: false, stereotype: false }}
        config={treatmentConfig}
      />,
    )

    expect(markup).not.toContain('data-card-detail=')
    expect(markup).toContain('<title>DEL-001 · Gateway · service · Accepts external requests</title>')
    expect(markup).toContain('aria-label="Card Gateway"')
  })

  it('retains neutral, label-only backward defaults and Scope appearance without a Domain', () => {
    const config = defineInfoschematic({
      title: 'Defaults',
      infoschematic: {
        scopes: [
          {
            id: 'scope',
            prefix: 'SCP',
            label: 'Scope',
            description: 'Compatibility appearance',
            color: '#456789',
            fill: '#123456',
          },
        ],
        lanes: [
          {
            id: 'lane',
            label: 'Legacy lane',
            y: 20,
            height: 180,
            labelY: 20,
            panel: { x: 10, y: 20, width: 420, height: 180, radius: 8 },
            zones: [{ id: 'zone', label: 'Legacy zone', x: 10, width: 420, fill: '#081522' }],
          },
        ],
        cards: [
          {
            id: 'card',
            code: 'SCP-001',
            label: 'Default Card',
            detail: 'Accessible only by default',
            scope: 'scope',
            scopes: ['scope'],
            placement: { box: { x: 80, y: 80, width: 180, height: 80 }, ports: {} },
          },
        ],
      },
    })
    const markup = renderToStaticMarkup(<Canvas config={config} />)

    expect(markup).toContain('data-surface-treatment="neutral"')
    expect(markup).toContain('data-grid-treatment="none"')
    expect(markup).not.toContain('class="infoschematic-authored-grid"')
    expect(markup).toContain('data-frame-treatment="plain"')
    expect(markup).toContain('data-frame-treatment="none"')
    expect(markup).toContain('data-label-placement="north-west"')
    expect(markup).toContain('data-label-placement="north-east"')
    expect(markup).toMatch(/text-anchor="end" x="414" y="20">LEGACY ZONE<\/text>/)
    expect(markup).toMatch(/text-anchor="start" x="26" y="20">LEGACY LANE<\/text>/)
    expect(markup).not.toContain('data-card-compact=')
    expect(markup).not.toContain('data-card-detail=')
    expect(markup).toContain('fill="#123456"')
    expect(markup).toContain('stroke="#456789"')
    expect(markup).toContain('<title>SCP-001 · Default Card · Accessible only by default</title>')
  })

  it.each(['major', 'major-plus-minor'] as const satisfies readonly GridTreatment[])(
    'renders authored %s grid independently of the legacy Design overlay',
    (grid) => {
      const config = defineInfoschematic({ title: grid, infoschematic: { appearance: { grid } } })
      const markup = renderToStaticMarkup(<Canvas config={config} grid={false} />)

      expect(markup).toContain(`fill="url(#infoschematic-grid-${grid})"`)
      expect(markup).not.toContain('<g class="edit-grid">')
    },
  )

  it('preserves the legacy boolean Design grid without changing authored treatment', () => {
    const markup = renderToStaticMarkup(<Canvas config={defineInfoschematic({ title: 'Edit' })} grid mode="design" />)

    expect(markup).toContain('data-grid-treatment="none"')
    expect(markup).toContain('<g class="edit-grid">')
    expect(markup).toContain('fill="url(#infoschematic-grid-major-plus-minor)"')
  })

  it('keeps an authored hidden label accessible and converts an impossible notch to a plain frame', () => {
    const config = defineInfoschematic({
      title: 'Hidden label',
      infoschematic: {
        lanes: [
          {
            id: 'lane',
            label: 'Private geography',
            appearance: { frame: 'notched', label: 'none' },
            y: 10,
            height: 100,
            labelY: 10,
            panel: { x: 10, y: 10, width: 300, height: 100, radius: 8 },
            zones: [],
          },
        ],
      },
    })
    const markup = renderToStaticMarkup(<Canvas config={config} />)

    expect(markup).toContain('aria-label="Lane Private geography"')
    expect(markup).toContain('data-frame-treatment="plain"')
    expect(markup).toContain('data-label-placement="none"')
    expect(markup).not.toContain('>PRIVATE GEOGRAPHY</text>')
  })

  it('uses Scope only for visibility and Domain only for semantic colour', () => {
    const visible = renderToStaticMarkup(<Canvas config={treatmentConfig} visibleScopes={new Set(['delivery'])} />)
    const hidden = renderToStaticMarkup(<Canvas config={treatmentConfig} visibleScopes={new Set()} />)

    expect(visible).toContain('data-domain="platform"')
    expect(visible).toContain('fill="#053c35"')
    expect(hidden).not.toContain('data-domain="platform"')
    expect(hidden).not.toContain('Gateway')
  })
})
