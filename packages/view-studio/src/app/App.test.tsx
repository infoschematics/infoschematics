import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineInfoschematic } from '@infoschematics/domain-core'
import type { CalloutConfig } from '@infoschematics/domain-model/scene'
import {
  defineInfoschematicRenderers,
  type FabricRendererProps,
  InfoschematicContext,
  InfoschematicRenderersContext,
  type RendererProperties,
} from '@infoschematics/view-canvas'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import { App } from './App.tsx'
import { SceneCallout } from './panels/SceneCallout.tsx'

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

  it('starts each Studio session in explicit Present mode with Producer controls available', () => {
    const localStorage = {
      getItem: vi.fn((key: string) => (key.endsWith('.presentation.mode') ? '"direct"' : null)),
      setItem: vi.fn(),
    }
    const sessionStorage = { getItem: vi.fn(), setItem: vi.fn() }
    vi.stubGlobal('window', { localStorage, sessionStorage })

    const markup = renderToStaticMarkup(
      <App config={defineInfoschematic({ id: 'mode-session', title: 'Mode session' })} />,
    )

    expect(markup).toContain('data-production-mode="present"')
    expect(markup).toContain('aria-label="Infoschematic controls"')
    expect(markup).toContain('aria-label="Present mode"')
    expect(markup).toContain('aria-label="Design mode"')
    expect(markup).toContain('aria-label="Direct mode"')
    expect(localStorage.getItem).not.toHaveBeenCalledWith('mode-session.presentation.mode')
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
  })
})

const calloutRuntime = createInfoschematicRuntime(defineInfoschematic({ title: 'Studio Callout renderers' }))

const renderSceneCallout = (
  calloutConfig: CalloutConfig,
  renderers = defineInfoschematicRenderers({}),
) =>
  renderToStaticMarkup(
    <InfoschematicRenderersContext value={renderers}>
      <InfoschematicContext value={calloutRuntime}>
        <SceneCallout
          body="Studio audience content"
          calloutConfig={calloutConfig}
          eyebrow="Story"
          onExit={() => undefined}
          onStep={() => undefined}
          step={{ callout: { x: 0.5, y: 0.5 }, components: [], flows: [] }}
          stepNumber={1}
          stepTotal={2}
          takeaways={['Keep the standard content']}
          title="A Studio Callout"
        />
      </InfoschematicContext>
    </InfoschematicRenderersContext>,
  )

describe('Studio SceneCallout renderers', () => {
  it('renders a validated custom Callout inside the existing Studio panel', () => {
    const renderers = defineInfoschematicRenderers({
      callouts: [
        {
          key: 'emphasis',
          schemaVersion: 1,
          validateProperties: (properties: RendererProperties | undefined) =>
            typeof properties?.tone === 'string'
              ? { valid: true as const, properties: { tone: properties.tone } }
              : { valid: false as const, reason: 'tone must be a string' },
          component: ({ children, properties }: { children: ReactNode; properties: Readonly<{ tone: string }> }) => (
            <div data-studio-callout={properties.tone}>{children}</div>
          ),
        },
      ],
    })

    const markup = renderSceneCallout(
      { body: 'Studio audience content', properties: { tone: 'urgent' }, renderer: 'emphasis' },
      renderers,
    )

    expect(markup).toContain('data-studio-callout="urgent"')
    expect(markup).toContain('class="scene-callout"')
    expect(markup).toContain('Studio audience content')
    expect(markup).toContain('aria-label="Next step"')
  })

  it('reports an unknown Callout and retains the standard Studio content', () => {
    const onDiagnostic = vi.fn()
    const markup = renderSceneCallout(
      { body: 'Studio audience content', renderer: 'missing' },
      defineInfoschematicRenderers({ callouts: [], onDiagnostic }),
    )

    expect(onDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'unknown-key', key: 'missing', kind: 'callout' }),
    )
    expect(markup).toContain('Studio audience content')
    expect(markup).toContain('role="status"')
  })

  it('reports invalid Callout properties and retains the standard Studio content', () => {
    const onDiagnostic = vi.fn()
    const markup = renderSceneCallout(
      { body: 'Studio audience content', properties: { tone: 3 }, renderer: 'emphasis' },
      defineInfoschematicRenderers({
        callouts: [
          {
            key: 'emphasis',
            schemaVersion: 1,
            validateProperties: () => ({ valid: false as const, reason: 'tone must be a string' }),
            component: ({ children }: { children: ReactNode }) => <div data-studio-callout>{children}</div>,
          },
        ],
        onDiagnostic,
      }),
    )

    expect(onDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'invalid-properties', key: 'emphasis', kind: 'callout' }),
    )
    expect(markup).not.toContain('data-studio-callout')
    expect(markup).toContain('Studio audience content')
    expect(markup).toContain('Keep the standard content')
  })
})
