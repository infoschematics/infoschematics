import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { defineInfoschematic } from '@infoschematics/domain-core'
import { Canvas } from './Canvas.tsx'
import type {
  FabricRendererProps,
  GraphicRendererProps,
  RendererDiagnostic,
  RendererProperties,
} from './renderers.tsx'

describe('Canvas', () => {
  it('renders a title-only configuration as a safe blank Canvas', () => {
    const markup = renderToStaticMarkup(<Canvas config={defineInfoschematic({ title: 'Infoschematics' })} />)

    expect(markup).toContain('aria-label="Infoschematics Infoschematic"')
    expect(markup).toContain('<svg')
    expect(markup).toContain('viewBox="0 0 1200 800"')
    expect(markup).not.toContain('infoschematic-service')
  })

  it('renders configured Cards and generic or host-provided Fabrics', () => {
    const config = defineInfoschematic({
      title: 'Configured',
      infoschematic: {
        scopes: [
          {
            id: 'system',
            prefix: 'SYS',
            label: 'System',
            description: 'The configured system',
            color: '#6699cc',
            fill: '#112233',
          },
        ],
        cards: [
          {
            id: 'source',
            code: 'SYS-01',
            label: 'Configured source',
            detail: 'Supplied by host',
            scope: 'system',
            scopes: ['system'],
            placement: { box: { x: 100, y: 100, width: 160, height: 80 }, ports: {} },
          },
        ],
        fabrics: [
          {
            id: 'custom',
            code: 'SYS-02',
            label: 'Custom Fabric',
            detail: 'Rendered by the host',
            scope: 'system',
            scopes: ['system'],
            placement: { box: { x: 100, y: 220, width: 300, height: 90 } },
            appearance: { renderer: 'custom' },
          },
          {
            id: 'fallback',
            code: 'SYS-03',
            label: 'Fallback Fabric',
            detail: 'Rendered generically',
            scope: 'system',
            scopes: ['system'],
            placement: { box: { x: 500, y: 220, width: 240, height: 80 } },
            appearance: { renderer: 'unknown' },
          },
        ],
      },
    })
    const CustomFabric = ({ fabric, bounds }: FabricRendererProps) => (
      <circle data-fabric={fabric.id} cx={bounds.x + bounds.width / 2} cy={bounds.y + bounds.height / 2} r="20" />
    )

    const markup = renderToStaticMarkup(<Canvas config={config} renderers={{ fabrics: { custom: CustomFabric } }} />)

    expect(markup).toContain('Configured source')
    expect(markup).toContain('data-fabric="custom"')
    expect(markup).toContain('cx="250"')
    expect(markup).toContain('Fallback Fabric')
    expect(markup).toContain('x="500"')
  })

  it('validates definitions and keeps labelled Fabric and Graphic fallbacks in server output', () => {
    const diagnostics: RendererDiagnostic[] = []
    const config = defineInfoschematic({
      title: 'Validated',
      infoschematic: {
        scopes: [
          {
            id: 'system',
            prefix: 'SYS',
            label: 'System',
            description: 'The configured system',
            color: '#6699cc',
            fill: '#112233',
          },
        ],
        fabrics: [
          {
            id: 'valid',
            code: 'SYS-01',
            label: 'Validated Fabric',
            detail: 'Rendered by the host',
            scope: 'system',
            scopes: ['system'],
            placement: { box: { x: 100, y: 100, width: 240, height: 80 } },
            appearance: { renderer: 'badge', properties: { label: 'safe' } },
          },
          {
            id: 'invalid',
            code: 'SYS-02',
            label: 'Invalid Fabric fallback',
            detail: 'Still visible',
            scope: 'system',
            scopes: ['system'],
            placement: { box: { x: 400, y: 100, width: 240, height: 80 } },
            appearance: { renderer: 'badge', properties: { label: false } },
          },
        ],
      },
    })
    const Badge = ({ fabric, properties }: FabricRendererProps & { properties: RendererProperties }) => (
      <text
        data-authored-label={fabric.appearance?.properties?.label}
        data-badge={properties.label}
        data-renderer={fabric.appearance?.renderer}
      >
        validated
      </text>
    )
    const markup = renderToStaticMarkup(
      <Canvas
        config={config}
        graphic={{ id: 'missing-graphic', label: 'Graphic fallback', renderer: 'missing' }}
        renderers={{
          fabrics: [
            {
              key: 'badge',
              schemaVersion: 1,
              validateProperties: (properties) =>
                typeof properties?.label === 'string'
                  ? { valid: true, properties }
                  : { valid: false, reason: 'label must be a string' },
              component: Badge,
            },
          ],
          onDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
        }}
      />,
    )

    expect(markup).toContain('data-badge="safe"')
    expect(markup).toContain('data-authored-label="safe"')
    expect(markup).toContain('data-renderer="badge"')
    expect(markup).toContain('Invalid Fabric fallback')
    expect(markup).toContain('aria-label="Graphic fallback"')
    expect(markup).toContain('>Graphic fallback</text>')
    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual(['unknown-key', 'invalid-properties'])
  })

  it('renders a validated Graphic definition with its normalised properties', () => {
    const Graphic = ({ bounds, graphic, properties }: GraphicRendererProps & { properties: RendererProperties }) => (
      <text
        data-authored-caption={graphic.properties?.caption}
        data-bounds={`${bounds.x},${bounds.y},${bounds.width},${bounds.height}`}
        data-graphic={graphic.id}
        data-renderer={graphic.renderer}
      >
        {properties.caption}
      </text>
    )
    const markup = renderToStaticMarkup(
      <Canvas
        config={defineInfoschematic({ title: 'Graphic' })}
        graphic={{ id: 'custom-graphic', renderer: 'caption', properties: { caption: 'Host graphic' } }}
        renderers={{
          graphics: [
            {
              key: 'caption',
              schemaVersion: 1,
              validateProperties: (properties) =>
                typeof properties?.caption === 'string'
                  ? { valid: true, properties: { caption: properties.caption.toUpperCase() } }
                  : { valid: false, reason: 'caption must be a string' },
              component: Graphic,
            },
          ],
        }}
      />,
    )

    expect(markup).toContain('data-graphic="custom-graphic"')
    expect(markup).toContain('data-renderer="caption"')
    expect(markup).toContain('data-authored-caption="Host graphic"')
    expect(markup).toContain('data-bounds="440,360,320,80"')
    expect(markup).toContain('HOST GRAPHIC')
  })
})
