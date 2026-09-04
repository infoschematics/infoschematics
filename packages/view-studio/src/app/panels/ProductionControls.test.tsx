import { defineInfoschematic } from '@infoschematics/domain-core'
import { InfoschematicContext } from '@infoschematics/view-canvas'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Presentation } from '../hooks/use-presentation.ts'
import { ProducerControls } from './ProducerControls.tsx'
import { TitleBar } from './TitleBar.tsx'

const runtime = createInfoschematicRuntime(
  defineInfoschematic({
    title: 'Production controls',
    infoschematic: {
      cards: [
        {
          code: 'CARD-01',
          detail: 'Valid focus target',
          id: 'card-one',
          label: 'Card one',
          placement: { box: { height: 80, width: 120, x: 20, y: 20 } },
          scope: 'scope-one',
          scopes: ['scope-one']
        }
      ],
      scopes: [
        {
          color: '#336699',
          description: 'A scope',
          fill: '#112233',
          id: 'scope-one',
          label: 'Scope one',
          prefix: 'ONE'
        }
      ]
    },
    standaloneScenes: [
      {
        code: 'SCENE-01',
        description: 'Available',
        focus: { artefacts: ['card-one'] },
        id: 'scene-one',
        label: 'Scene one'
      }
    ],
    stories: [
      { code: 'EMPTY', id: 'empty-story', scenes: [], title: 'Empty' },
      {
        code: 'STALE',
        id: 'stale-story',
        scenes: [{ sourceScene: 'missing-scene' }],
        title: 'Stale'
      },
      {
        code: 'READY',
        id: 'ready-story',
        scenes: [{ sourceScene: 'scene-one' }],
        title: 'Ready'
      }
    ],
    themes: [
      {
        id: 'theme-one',
        scenes: [
          {
            code: 'STALE-THEME',
            focus: { artefacts: ['missing-card'] },
            id: 'stale-theme-scene',
            label: 'Stale theme'
          },
          {
            code: 'READY-THEME',
            focus: { artefacts: ['card-one'] },
            id: 'ready-theme-scene',
            label: 'Ready theme'
          }
        ],
        title: 'Theme one'
      }
    ]
  })
)

const presentation = (mode: 'present' | 'design' | 'direct') =>
  ({
    annotated: false,
    hasVisibleFamilies: false,
    hasVisibleScopes: true,
    lightNothing: vi.fn(),
    mode,
    playing: null,
    setMode: vi.fn(),
    showAllFamilies: vi.fn(),
    showAllScopes: vi.fn(),
    startStory: vi.fn(),
    stopStory: vi.fn(),
    takeaways: true,
    thematicScene: null,
    toggleAnnotated: vi.fn(),
    toggleFamily: vi.fn(),
    toggleScope: vi.fn(),
    toggleTakeaways: vi.fn(),
    toggleThematicScene: vi.fn(),
    visibleFamilies: new Set<string>(),
    visibleScopes: new Set(['scope-one'])
  }) as unknown as Presentation

const withRuntime = (children: ReactNode) => (
  <InfoschematicContext.Provider value={runtime}>{children}</InfoschematicContext.Provider>
)

describe('production controls', () => {
  it('exposes three explicit modes and keeps Audience options in Present', () => {
    const present = renderToStaticMarkup(
      withRuntime(
        <TitleBar
          collapsed={false}
          fullscreen={false}
          onToggleCollapsed={vi.fn()}
          onToggleFullscreen={vi.fn()}
          presentation={presentation('present')}
        />
      )
    )
    const direct = renderToStaticMarkup(
      withRuntime(
        <TitleBar
          collapsed={false}
          fullscreen={false}
          onToggleCollapsed={vi.fn()}
          onToggleFullscreen={vi.fn()}
          presentation={presentation('direct')}
        />
      )
    )

    expect(present).toContain('aria-label="Production mode"')
    expect(present).toContain('aria-label="Present mode" aria-pressed="true"')
    expect(present).toContain('aria-label="Design mode" aria-pressed="false"')
    expect(present).toContain('aria-label="Direct mode" aria-pressed="false"')
    expect(present).toContain('aria-label="Annotate"')
    expect(present).toContain('aria-label="Key takeaways"')
    expect(direct).toContain('aria-label="Direct mode" aria-pressed="true"')
    expect(direct).not.toContain('aria-label="Annotate"')
    expect(direct).not.toContain('aria-label="Key takeaways"')
  })

  it('removes Present controls in Producer modes', () => {
    const markup = renderToStaticMarkup(
      withRuntime(<ProducerControls onPlay={vi.fn()} presentation={presentation('design')} ref={null} />)
    )

    expect(markup).toBe('')
  })

  it('disables empty and stale activation while retaining ready work', () => {
    const markup = renderToStaticMarkup(
      withRuntime(<ProducerControls onPlay={vi.fn()} presentation={presentation('present')} ref={null} />)
    )

    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Empty<\/button>/)
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Stale<\/button>/)
    expect(markup).toMatch(/<button[^>]*>Ready<\/button>/)
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Stale theme<\/button>/)
    expect(markup).toMatch(/<button[^>]*>Ready theme<\/button>/)
  })
})
