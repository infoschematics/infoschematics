import { readFile } from 'node:fs/promises'
import { defineInfoschematic } from '@infoschematics/domain-core'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Present } from './Present.tsx'

describe('Present', () => {
  it('passes opt-in responsive Card detail to Canvas', async () => {
    const source = await readFile(new URL('./Present.tsx', import.meta.url), 'utf8')

    expect(source).toContain('responsiveCardDetails={responsiveCardDetails}')
  })

  it('renders a title-only Infoschematic without Producer editing controls', () => {
    const markup = renderToStaticMarkup(<Present config={defineInfoschematic({ title: 'Audience view' })} />)

    expect(markup).toContain('<h1>Audience view</h1>')
    expect(markup).toContain('<svg')
    expect(markup).toContain('Presentation details')
    expect(markup).not.toContain('Open the editors')
    expect(markup).not.toContain('Design')
  })

  it('shows an authored Overlay to an audience', () => {
    /*
     * Present supplies a Scene's own Graphic and nothing else, so before `ADR-INFOSCHEMATICS-037` an authored
     * Overlay reached Studio's Design mode and no audience. Present is unchanged: Canvas draws the declaration.
     */
    const markup = renderToStaticMarkup(
      <Present
        config={defineInfoschematic({
          title: 'Annotated view',
          infoschematic: {
            graphics: [
              {
                id: 'OVL-01',
                label: 'Reading order',
                placement: { x: 40, y: 40, width: 200, height: 80 },
                renderer: 'annotation'
              }
            ]
          }
        })}
      />
    )

    expect(markup).toContain('data-artefact-id="OVL-01"')
    expect(markup).toContain('infoschematic-graphic')
  })

  it('offers visibility, Scene, Theme and Story presentation controls', () => {
    const config = defineInfoschematic({
      title: 'Narrative view',
      infoschematic: {
        scopes: [
          {
            id: 'scope',
            prefix: 'S',
            label: 'Scope',
            description: 'A scope',
            color: '#1199ff',
            fill: '#113355'
          }
        ]
      },
      standaloneScenes: [
        {
          id: 'scene',
          code: 'SCENE-001',
          label: 'Scene',
          description: 'A scene',
          focus: {}
        }
      ],
      themes: [
        {
          id: 'theme',
          title: 'Theme',
          scenes: [
            {
              id: 'theme-scene',
              code: 'THEME-001',
              label: 'Theme scene',
              focus: {}
            }
          ]
        }
      ],
      stories: [
        {
          id: 'story',
          code: 'STORY-001',
          title: 'Story',
          scenes: [{ callout: { body: 'A Story Scene' } }]
        }
      ]
    })

    const markup = renderToStaticMarkup(<Present config={config} />)

    expect(markup).toContain('aria-label="Architectural scopes"')
    expect(markup).toContain('aria-label="Flow families"')
    expect(markup).toContain('title="Architectural scope: A scope"')
    expect(markup).not.toContain('>Hide all</button>')
    expect(markup).not.toContain('>Show all</button>')
    expect(markup).toContain('aria-label="Sequences"')
  })
})
