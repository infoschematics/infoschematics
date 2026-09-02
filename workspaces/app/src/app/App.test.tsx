import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineInfoschematic } from '@infoschematics/model'
import { App } from './App.tsx'
import { createInfoschematicRuntime } from './infoschematic-context.tsx'

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

  it('exposes the settled Infoschematic runtime vocabulary', () => {
    const runtime = createInfoschematicRuntime(defineInfoschematic({ title: 'Vocabulary' }))

    expect(runtime).toMatchObject({ standaloneScenes: [], stories: [], thematicScenes: [] })
    expect(runtime).not.toHaveProperty('programme')
    expect(runtime).not.toHaveProperty('demonstrations')
    expect(runtime).not.toHaveProperty('spotlights')
    expect(runtime).not.toHaveProperty('vendors')
  })
})
