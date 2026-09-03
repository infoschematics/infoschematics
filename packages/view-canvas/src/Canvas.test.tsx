import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { defineInfoschematic } from '@infoschematics/domain-core'
import { Canvas } from './Canvas.tsx'
import type { FabricRendererProps } from './renderers.tsx'

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
})
