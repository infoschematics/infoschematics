import { defineInfoschematic } from '@infoschematics/domain-core'
import { InfoschematicContext } from '@infoschematics/view-canvas'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import type { WorkspaceKind } from '@infoschematics/view-present'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Presentation } from '../hooks/use-presentation.ts'
import { PanelRail } from './PanelRail.tsx'
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
      flowFamilies: [
        {
          color: '#44cc88',
          description: 'A flow family',
          id: 'family-one',
          label: 'Family one',
          prefix: 'FLOW'
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
        id: 'sequence-one',
        scenes: [
          {
            code: 'STALE-SEQUENCE',
            focus: { artefacts: ['missing-card'] },
            id: 'stale-sequence-scene',
            label: 'Stale sequence'
          },
          {
            code: 'READY-SEQUENCE',
            focus: { artefacts: ['card-one'] },
            id: 'ready-sequence-scene',
            label: 'Ready sequence'
          },
          {
            callout: { body: 'An explanation that intentionally focuses nothing.' },
            code: 'CALLOUT-SEQUENCE',
            focus: {},
            id: 'callout-sequence-scene',
            label: 'Callout sequence'
          }
        ],
        title: 'Sequence one'
      }
    ]
  })
)

/* The two axes the controls read, set independently: a reader is not producing, and a Producer is in one workspace. */
const presentation = (producing: boolean, workspace: WorkspaceKind = 'design') =>
  ({
    annotated: false,
    designing: producing && workspace === 'design',
    directing: producing && workspace === 'direct',
    lightNothing: vi.fn(),
    overlays: true,
    playing: null,
    presenting: !producing,
    produceIn: vi.fn(),
    producing,
    setProducing: vi.fn(),
    workspace,
    startStory: vi.fn(),
    stopStory: vi.fn(),
    expandedScene: null,
    toggleAnnotated: vi.fn(),
    toggleFamily: vi.fn(),
    toggleOverlays: vi.fn(),
    toggleScope: vi.fn(),
    toggleExpandedScene: vi.fn(),
    visibleFamilies: new Set<string>(),
    visibleScopes: new Set(['scope-one'])
  }) as unknown as Presentation

const withRuntime = (children: ReactNode) => (
  <InfoschematicContext.Provider value={runtime}>{children}</InfoschematicContext.Provider>
)

describe('production controls', () => {
  it('offers the two axes separately and keeps Audience options for a reader', () => {
    const present = renderToStaticMarkup(
      withRuntime(
        <TitleBar
          collapsed={false}
          fullscreen={false}
          onFitDiagram={vi.fn()}
          onToggleCollapsed={vi.fn()}
          onToggleFullscreen={vi.fn()}
          onZoomIn={vi.fn()}
          onZoomOut={vi.fn()}
          presentation={presentation(false)}
        />
      )
    )
    const direct = renderToStaticMarkup(
      withRuntime(
        <TitleBar
          collapsed={false}
          fullscreen={false}
          onFitDiagram={vi.fn()}
          onToggleCollapsed={vi.fn()}
          onToggleFullscreen={vi.fn()}
          onZoomIn={vi.fn()}
          onZoomOut={vi.fn()}
          presentation={presentation(true, 'direct')}
        />
      )
    )

    expect(present).toContain('aria-label="Presentation"')
    expect(present).toContain('aria-label="Workspace"')
    expect(present).toContain('aria-label="Diagram zoom"')
    expect(present).toContain('aria-label="Reset zoom to fit"')
    expect(present).toContain('aria-label="Present" aria-pressed="true"')
    expect(present).toContain('aria-label="Design workspace" aria-pressed="false"')
    expect(present).toContain('aria-label="Direct workspace" aria-pressed="false"')
    expect(present).toContain('aria-label="Show tags"')
    expect(present).toContain('aria-label="Show overlays"')
    expect(present).toContain('aria-label="Window and panels"')
    expect(present.indexOf('aria-label="Diagram zoom"')).toBeLessThan(present.indexOf('aria-label="Display"'))
    expect(present.indexOf('aria-label="Display"')).toBeLessThan(present.indexOf('aria-label="Presentation"'))
    expect(present.indexOf('aria-label="Presentation"')).toBeLessThan(present.indexOf('aria-label="Workspace"'))
    expect(present.indexOf('aria-label="Workspace"')).toBeLessThan(present.indexOf('aria-label="Window and panels"'))
    /* Four: the two axis banks sit together between one pair of dividers, and the Appearance bank holding the
       colour-scheme switch brings one of its own. */
    expect(present.match(/class="tool-divider"/g)).toHaveLength(4)
    /* Direct is producing, so the Present toggle reads unpressed while its own workspace reads pressed - the pair
       a single enum could not say at once. */
    expect(direct).toContain('aria-label="Present" aria-pressed="false"')
    expect(direct).toContain('aria-label="Direct workspace" aria-pressed="true"')
    expect(direct).toContain('aria-label="Design workspace" aria-pressed="false"')
    expect(direct).not.toContain('aria-label="Show tags"')
    expect(direct).not.toContain('aria-label="Show overlays"')
  })

  it('keeps the visibility banks in a Producer workspace', () => {
    const markup = renderToStaticMarkup(
      withRuntime(<ProducerControls onPlay={vi.fn()} presentation={presentation(true)} ref={null} />)
    )

    /* What the Diagram draws is a Diagram question, so these stay. That playback leaves is asserted in
       `App.browser.test.tsx`, against a document that has a Sequence to withhold - this fixture has none. */
    expect(markup).toContain('aria-label="Architectural scopes"')
    expect(markup).toContain('aria-label="Flow families"')
  })

  it('names architectural scopes and flow families without bulk vocabulary controls', () => {
    const expanded = renderToStaticMarkup(
      withRuntime(<ProducerControls onPlay={vi.fn()} presentation={presentation(false)} ref={null} />)
    )
    const compact = renderToStaticMarkup(withRuntime(<PanelRail onPlay={vi.fn()} presentation={presentation(false)} />))

    for (const markup of [expanded, compact]) {
      expect(markup).toContain('aria-label="Architectural scopes"')
      expect(markup).toContain('title="Architectural scope: Scope one — A scope"')
      expect(markup).toContain('title="Flow family: Family one — A flow family"')
      expect(markup).not.toContain('Hide all components')
      expect(markup).not.toContain('Show all components')
      expect(markup).not.toContain('Hide all flows')
      expect(markup).not.toContain('Show all flows')
    }

    expect(expanded).toContain('aria-label="Flow families"')
    expect(compact).toContain('aria-label="Flow families"')
  })

  it('draws a scope and a family by the name its author gave it', () => {
    const expanded = renderToStaticMarkup(
      withRuntime(<ProducerControls onPlay={vi.fn()} presentation={presentation(false)} ref={null} />)
    )
    const compact = renderToStaticMarkup(withRuntime(<PanelRail onPlay={vi.fn()} presentation={presentation(false)} />))

    // The fixture's id, code prefix and label all differ, so a control that reached for the wrong one cannot
    // pass by coincidence the way the showcase's word-shaped family ids let it.
    expect(expanded).toContain('>Scope one</button>')
    expect(expanded).toContain('>Family one</button>')
    expect(compact).toContain('<span class="rail-scope__name">Scope one</span>')

    for (const markup of [expanded, compact]) {
      // `ONE` and `FLOW` are what the next card and the next flow are numbered from, not what a reader is shown.
      expect(markup).not.toContain('>ONE<')
      expect(markup).not.toContain('>FLOW<')
      expect(markup).not.toContain('>scope-one<')
    }
  })

  it('disables empty and stale activation while retaining ready work', () => {
    const expanded = renderToStaticMarkup(
      withRuntime(<ProducerControls onPlay={vi.fn()} presentation={presentation(false)} ref={null} />)
    )
    const compact = renderToStaticMarkup(withRuntime(<PanelRail onPlay={vi.fn()} presentation={presentation(false)} />))

    expect(expanded).toMatch(/<button[^>]*disabled=""[^>]*>Empty<\/button>/)
    expect(expanded).toMatch(/<button[^>]*disabled=""[^>]*>Stale<\/button>/)
    expect(expanded).toMatch(/<button[^>]*>Ready<\/button>/)
    expect(expanded).toMatch(/<button[^>]*disabled=""[^>]*>Stale sequence<\/button>/)
    expect(expanded).toMatch(/<button[^>]*>Ready sequence<\/button>/)

    const expandedCallout = expanded.match(/<button[^>]*>Callout sequence<\/button>/)?.[0]
    const compactCallout = compact.match(/<button[^>]*aria-label="Callout sequence"[^>]*>/)?.[0]
    expect(expandedCallout).toBeDefined()
    expect(expandedCallout).not.toContain('disabled')
    expect(compactCallout).toBeDefined()
    expect(compactCallout).not.toContain('disabled')
  })
})
