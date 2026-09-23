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

  /*
   * A deliberate absence, so it cannot be mistaken for an oversight and quietly filled in.
   *
   * Present's controls belong to the presenter: they are what the Audience watches being used. A reader's viewing
   * preference is not one of them — changing scheme mid-presentation is a change everyone in the room sees, and the
   * person who wants it is not usually the person holding the controls. So a presenter pins the scheme before
   * starting, and Present follows whatever its host resolved. `ADR-INFOSCHEMATICS-037` records the same division.
   */
  it('offers no colour-scheme control of its own, and still resolves in either scheme', () => {
    const markup = renderToStaticMarkup(<Present config={defineInfoschematic({ title: 'Audience view' })} />)

    expect(markup).not.toContain('colour-scheme-button')
    expect(markup).not.toContain('colour scheme')

    /* It follows a scheme rather than ignoring one: its stylesheet names roles and never a colour of its own, which
       `scripts/stylesheet-literals.test.ts` holds as a floor. */
    expect(markup).toContain('isp-stage')
  })

  it('shows an authored Overlay to an audience', () => {
    /*
     * Present supplies a Scene's own Graphic and nothing else, so before `ADR-INFOSCHEMATICS-033` an authored
     * Overlay reached Studio's Design workspace and no audience. Present is unchanged: Canvas draws the declaration.
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

  it('offers visibility, Scene, Sequence and Story presentation controls', () => {
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
          id: 'sequence',
          title: 'Sequence',
          scenes: [
            {
              id: 'sequence-scene',
              code: 'SEQUENCE-001',
              label: 'Sequence scene',
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
