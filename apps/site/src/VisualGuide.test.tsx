import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { VisualGuide } from './VisualGuide.tsx'

describe('components guide', () => {
  it('uses the standard documentation treatment', () => {
    const page = renderToStaticMarkup(<VisualGuide />)

    expect(page).toContain('<article aria-label="Components" class="document-content">')
    expect(page).toContain('<h1>Components</h1>')
    expect(page).toContain('class="skip-link"')
    expect(page).toContain('aria-label="Components sections"')
    expect(page).toContain('href="#anatomy"')
    expect(page).toContain('href="#card-treatments"')
    expect(page).not.toContain('visual-guide__intro')
    expect(page).not.toContain('visual-guide__contents')
    expect(page).not.toContain('visual-guide__section--callout')
  })

  it('combines visible anatomy, groupings, treatments and explanatory capabilities', () => {
    const page = renderToStaticMarkup(<VisualGuide />)

    expect(page).toContain('Anatomy of an Infoschematic')
    expect(page).toContain('Groupings')
    expect(page).toContain('Treatments')
    expect(page).toContain('Explanation and presentation')
    expect(page).toContain('Flow signal')
    expect(page).toContain('Presentation states')
  })

  it('keeps terminology available after the guided explanation instead of linking every concept away', () => {
    const page = renderToStaticMarkup(<VisualGuide />)

    expect(page.match(/href="\/docs\/reference\/vocabulary\//g)).toHaveLength(1)
    expect(page).toContain('href="/docs/approach/visual-language/"')
  })
})
