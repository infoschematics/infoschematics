import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineInfoschematic } from '@infoschematics/domain-core'
import { App } from './App.tsx'
import { createInfoschematicRuntime } from './infoschematic-context.tsx'
import type { FabricRendererProps } from './renderers.tsx'

describe('App', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('renders a title-only configuration as a safe blank canvas', () => {
    const localStorage = { getItem: vi.fn(), setItem: vi.fn() }
    const sessionStorage = { getItem: vi.fn(), setItem: vi.fn() }
    vi.stubGlobal('window', { localStorage, sessionStorage })

    const markup = renderToStaticMarkup(<App config={defineInfoschematic({ title: 'Infoschematics' })} />)

    expect(markup).toContain('<h1>Infoschematics</h1>')
    expect(markup).toContain('<svg')
    expect(markup).toContain('viewBox="0 0 1200 800"')
    expect(markup).not.toContain('infoschematic-service')
    expect(localStorage.getItem).not.toHaveBeenCalled()
    expect(sessionStorage.getItem).not.toHaveBeenCalled()
  })

  it('renders structural data supplied by the host configuration', () => {
    const config = defineInfoschematic({
      id: 'example',
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
            detail: 'Supplied by the host',
            scope: 'system',
            scopes: ['system'],
            placement: { box: { x: 100, y: 100, width: 160, height: 80 }, ports: {} },
          },
        ],
      },
    })

    const markup = renderToStaticMarkup(<App config={config} />)

    expect(markup).toContain('Configured source')
    expect(markup).toContain('SYS-01')
  })

  it('uses host renderers while retaining a generic Fabric fallback', () => {
    const config = defineInfoschematic({
      title: 'Rendered',
      infoschematic: {
        scopes: [
          {
            id: 'system',
            prefix: 'SYS',
            label: 'System',
            description: 'The configured system',
            color: '#6699cc',
            fill: '#112233',
            icon: 'system',
          },
        ],
        fabrics: [
          {
            id: 'custom',
            code: 'SYS-01',
            label: 'Custom Fabric',
            detail: 'Rendered by the host',
            scope: 'system',
            scopes: ['system'],
            placement: { box: { x: 100, y: 120, width: 300, height: 90 } },
            appearance: { renderer: 'custom' },
          },
          {
            id: 'fallback',
            code: 'SYS-02',
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
    const Definitions = () => <linearGradient id="host-gradient" />
    const ScopeIcon = ({ size }: { 'aria-hidden': true; size: number }) => <path data-scope-icon={size} />

    const markup = renderToStaticMarkup(
      <App
        config={config}
        renderers={{
          definitions: Definitions,
          fabrics: { custom: CustomFabric },
          scopeIcons: { system: ScopeIcon },
        }}
      />,
    )

    expect(markup).toContain('id="host-gradient"')
    expect(markup).toContain('data-fabric="custom"')
    expect(markup).toContain('cx="250"')
    expect(markup).toContain('data-scope-icon="13"')
    expect(markup).toContain('Fallback Fabric')
    expect(markup).toContain('x="500"')
    expect(markup).toContain('width="240"')
  })

  it('resolves Story Graphics only through authored Graphic records', () => {
    const resolved = createInfoschematicRuntime(
      defineInfoschematic({
        title: 'Graphics',
        infoschematic: { graphics: [{ id: 'annotation', label: 'A host annotation', renderer: 'custom' }] },
        stories: [
          {
            id: 'story',
            code: 'STORY-01',
            title: 'Story',
            scenes: [{ graphic: 'annotation' }, { graphic: 'missing' }],
          },
        ],
      }),
    )

    expect(resolved.stories[0]?.steps[0]?.graphic).toMatchObject({ id: 'annotation', renderer: 'custom' })
    expect(resolved.stories[0]?.steps[1]?.graphic).toBeUndefined()
  })

  it('exposes the settled Infoschematic runtime vocabulary', () => {
    const runtime = createInfoschematicRuntime(defineInfoschematic({ title: 'Vocabulary' }))

    expect(runtime).toMatchObject({ standaloneScenes: [], stories: [], thematicScenes: [] })
    expect(runtime).not.toHaveProperty('programme')
    expect(runtime).not.toHaveProperty('demonstrations')
    expect(runtime).not.toHaveProperty('spotlights')
    expect(runtime).not.toHaveProperty('vendors')
  })
})
