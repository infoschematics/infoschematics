import { defineInfoschematic } from '@infoschematics/domain-core'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Present } from './Present.tsx'

describe('Present', () => {
  it('renders a title-only Infoschematic without Producer editing controls', () => {
    const markup = renderToStaticMarkup(<Present config={defineInfoschematic({ title: 'Audience view' })} />)

    expect(markup).toContain('<h1>Audience view</h1>')
    expect(markup).toContain('<svg')
    expect(markup).toContain('Presentation details')
    expect(markup).not.toContain('Open the editors')
    expect(markup).not.toContain('Design')
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

    expect(markup).toContain('aria-label="Scopes"')
    expect(markup).toContain('aria-label="Scenes"')
    expect(markup).toContain('aria-label="Themes"')
    expect(markup).toContain('aria-label="Stories"')
  })
})
