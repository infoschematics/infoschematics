import { describe, expect, it } from 'vitest'
import type { InfoschematicConfig } from '@infoschematics/domain-model'
import { visualTokens } from '@infoschematics/view-model/tokens'
import { renderInfoschematicSvg } from './index.ts'

const blank = (title: string): InfoschematicConfig => ({
  title,
  infoschematic: {
    viewBox: { height: 80, width: 120, x: 0, y: 0 },
    scopes: [],
    flowFamilies: [],
    lanes: [],
    cards: [],
    fabrics: [],
    points: [],
    flows: [],
    graphics: [],
    interfaces: [],
    specificationGroups: [],
  },
  standaloneScenes: [],
  themes: [],
  stories: [],
  calloutPositions: [],
})

const representative: InfoschematicConfig = {
  title: 'A & B <architecture>',
  subtitle: 'Static "view"',
  infoschematic: {
    viewBox: { height: 240, width: 400, x: 0, y: 0 },
    scopes: [
      { color: '#2463eb', description: 'One', fill: '#dbeafe', id: 'one', label: 'One', prefix: 'ONE' },
      { color: '#b45309', description: 'Two', fill: '#fef3c7', id: 'two', label: 'Two', prefix: 'TWO' },
    ],
    flowFamilies: [
      { color: '#7c3aed', description: 'Calls', id: 'calls', label: 'Calls', prefix: 'CALL' },
    ],
    lanes: [
      {
        height: 200,
        id: 'delivery',
        label: 'Delivery',
        labelY: 24,
        panel: { height: 200, radius: 8, width: 380, x: 10, y: 20 },
        y: 20,
        zones: [{ fill: '#f8fafc', id: 'runtime', label: 'Runtime', width: 380, x: 10 }],
      },
    ],
    cards: [
      {
        code: 'ONE-001',
        detail: 'Source <entry>',
        id: 'source',
        label: 'Source & gateway',
        placement: { box: { height: 60, width: 120, x: 40, y: 80 }, ports: {} },
        scope: 'one',
        scopes: ['one'],
      },
      {
        code: 'TWO-001',
        detail: 'Target',
        id: 'target',
        label: 'Target',
        placement: { box: { height: 60, width: 120, x: 240, y: 80 }, ports: {} },
        scope: 'two',
        scopes: ['two'],
      },
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
          { x: 240, y: 110 },
        ],
        source: 'source',
        sourcePort: 'E1',
        target: 'target',
        targetPort: 'W1',
      },
    ],
    graphics: [
      {
        id: 'note',
        label: 'Note <safe>',
        placement: { height: 34, width: 90, x: 155, y: 170 },
        renderer: 'note"renderer',
      },
    ],
    interfaces: [],
    specificationGroups: [],
  },
  standaloneScenes: [
    {
      code: 'SCN-001',
      description: 'Source only',
      focus: { artefacts: ['source'], flows: [], graphics: ['note'] },
      id: 'source-only',
      label: 'Source only',
    },
  ],
  themes: [],
  stories: [],
  calloutPositions: [],
}

describe('renderInfoschematicSvg', () => {
  it('renders a title-only Infoschematic as stable standalone SVG', () => {
    expect(renderInfoschematicSvg(blank('A & <B> "quoted"'))).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" aria-label="A &amp; &lt;B&gt; &quot;quoted&quot; structural Infoschematic" data-grid-treatment="none" data-surface-treatment="neutral" height="80" preserveAspectRatio="xMidYMid meet" role="img" viewBox="0 0 120 80" width="120">',
        '  <title>A &amp; &lt;B&gt; "quoted"</title>',
        `  <rect class="infoschematic-backdrop" fill="${visualTokens.canvas.output.backdrop}" height="80" width="120" x="0" y="0" />`,
        '</svg>',
      ].join('\n'),
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
    expect(first).toContain('d="M160 110 H240"')
    expect(first).not.toContain('Source <entry>')
  })

  it('uses shared static tokens while preserving authored colours', () => {
    const config: InfoschematicConfig = {
      ...representative,
      infoschematic: {
        ...representative.infoschematic,
        flows: representative.infoschematic.flows.map((flow) => ({ ...flow, dashed: true })),
      },
    }
    const svg = renderInfoschematicSvg(config, {
      scene: { kind: 'standalone', sceneId: 'source-only' },
      visibility: { graphics: 'all' },
    })

    expect(svg).toContain(`fill="${visualTokens.canvas.output.backdrop}"`)
    expect(svg).toContain(`rx="${visualTokens.canvas.geometry.cornerRadius}"`)
    expect(svg).toContain(`stroke-width="${visualTokens.canvas.flows.pipeWidth}"`)
    expect(svg).toContain(`stroke-width="${visualTokens.canvas.flows.routeWidth}"`)
    expect(svg).toContain(`stroke-dasharray="${visualTokens.canvas.flows.dash}"`)
    expect(svg).toContain(`stroke-linecap="${visualTokens.canvas.flows.lineCap}"`)
    expect(svg).toContain(`stroke-linejoin="${visualTokens.canvas.flows.lineJoin}"`)
    expect(svg).toContain(`opacity="${visualTokens.canvas.output.unfocusedOpacity}"`)
    expect(svg).toContain(`font-family="${visualTokens.canvas.output.fontFamily}"`)
    expect(svg).toContain(`font-size="${visualTokens.canvas.output.componentFontSize}"`)
    expect(svg).toContain(`font-size="${visualTokens.canvas.output.metadataFontSize}"`)
    expect(svg).toContain(`fill="${visualTokens.canvas.output.cardText}"`)

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
          card: { compact: true, description: true, identity: true, stereotype: true },
          grid: 'major-plus-minor',
          surface: 'blueprint',
        },
        domains: [
          {
            color: '#13579b',
            fill: '#dceeff',
            id: 'platform',
            label: 'Platform',
          },
        ],
        lanes: representative.infoschematic.lanes.map((lane) => ({
          ...lane,
          appearance: { frame: 'notched' as const, label: 'north' as const },
          zones: lane.zones.map((zone) => ({
            ...zone,
            appearance: { frame: 'plain' as const, label: 'south-east' as const },
          })),
        })),
        cards: representative.infoschematic.cards.map((card, index) =>
          index === 0 ? { ...card, domain: 'platform', stereotype: 'service' } : card,
        ),
      },
    }

    const svg = renderInfoschematicSvg(config)
    expect(svg).toContain('data-grid-treatment="major-plus-minor"')
    expect(svg).toContain('data-surface-treatment="blueprint"')
    expect(svg).toContain(`fill="${visualTokens.canvas.surfaces.backdrop}"`)
    expect(svg).toContain('id="infoschematic-grid-major-plus-minor"')
    expect(svg).toContain('data-frame-treatment="notched"')
    expect(svg).toContain('data-label-placement="south-east"')
    expect(svg).toContain('data-domain="platform"')
    expect(svg).toContain('data-stereotype="service"')
    expect(svg).toContain('fill="#dceeff"')
    expect(svg).toContain('stroke="#13579b"')
    expect(svg).toContain('class="infoschematic-card-identity"')
    expect(svg).toContain('class="infoschematic-card-stereotype"')
    expect(svg).toContain('class="infoschematic-card-description"')

    const overridden = renderInfoschematicSvg(config, {
      cardDetails: { description: false, identity: false, stereotype: false },
    })
    expect(overridden).not.toContain('class="infoschematic-card-identity"')
    expect(overridden).not.toContain('class="infoschematic-card-stereotype"')
    expect(overridden).not.toContain('class="infoschematic-card-description"')
    expect(overridden).toContain('data-compact="true"')
  })

  it('applies explicit Scope visibility and Scene focus without motion or browser state', () => {
    expect(renderInfoschematicSvg(representative)).not.toContain('data-renderer=')

    const focused = renderInfoschematicSvg(representative, {
      scene: { kind: 'standalone', sceneId: 'source-only' },
      visibility: { scopes: ['one', 'two'], unfocused: 'hide' },
    })

    expect(focused).toContain('data-id="source"')
    expect(focused).toContain('data-id="note"')
    expect(focused).not.toContain('data-id="target"')
    expect(focused).not.toContain('data-id="call"')

    const oneScope = renderInfoschematicSvg(representative, { visibility: { scopes: ['one'] } })
    expect(oneScope).toContain('data-id="source"')
    expect(oneScope).not.toContain('data-id="target"')
    expect(oneScope).not.toContain('data-id="call"')
  })

  it('fails explicitly when a selected Scene does not exist', () => {
    expect(() =>
      renderInfoschematicSvg(representative, {
        scene: { kind: 'standalone', sceneId: 'missing' },
      }),
    ).toThrow('Unknown Standalone Scene: missing')
  })
})
