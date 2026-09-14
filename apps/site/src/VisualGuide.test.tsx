import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { VisualGuide } from './VisualGuide.tsx'

describe('components guide', () => {
  it('uses the standard documentation layout and expands every component in the sidebar', () => {
    const page = renderToStaticMarkup(<VisualGuide />)

    expect(page).toContain('<article aria-label="Components" class="document-content">')
    expect(page).toContain('<h1>Components</h1>')
    expect(page).toContain('aria-label="Components sections"')
    expect(page).toContain('<span>Guide navigation</span><strong>Components</strong>')
    expect(page).toContain('aria-label="Mobile documentation"')
    for (const slug of [
      'labelled-example',
      'canvas',
      'region',
      'fabric',
      'card',
      'flow',
      'point',
      'graphic',
      'future-notation',
      'where-next'
    ]) {
      expect(page).toContain(`href="#${slug}"`)
    }
  })

  it('uses a labelled whole example followed by isolated property specimens', () => {
    const page = renderToStaticMarkup(<VisualGuide />)

    expect(page).toContain('A labelled Infoschematic')
    expect(page).toContain('Labels for the complete example')
    expect(page).toContain('acts as a real endpoint')
    expect(page.match(/<legend>Properties<\/legend>/g)).toHaveLength(7)
    expect(page.match(/>Reset<\/button>/g)).toHaveLength(7)
    expect(page).toContain('Fill opacity')
    expect(page).toContain('Property reference')
    expect(page).toContain('Copy snippet')
    expect(page).toContain('TypeScript')
    expect(page).toContain('Standard and Adapter Cards')
    expect(page).toContain('A <strong>Port</strong> is a numbered attachment position')
    expect(page).toContain('Future notation')
    expect(page).not.toContain('aria-hidden="true">01')
    expect(page).not.toContain('Canvas colour currently comes from a surface preset')
    expect(page).not.toContain('Explanation and presentation')
    expect(page).not.toContain('Presentation states')
    expect(page).not.toContain('Treatments')
    expect(page).not.toContain('Service boundary')
    expect(page).not.toContain('Event fabric')
    expect(page).not.toContain('Customer API')
  })

  it('routes explanation elsewhere and keeps precise terminology available once', () => {
    const page = renderToStaticMarkup(<VisualGuide />)

    expect(page).toContain('href="/docs/explanation/"')
    expect(page.match(/href="\/docs\/reference\/vocabulary\//g)).toHaveLength(1)
  })
})
