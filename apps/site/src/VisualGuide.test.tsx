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
    expect(page).toContain('aria-label="Guide journey"')
    expect(page).toContain('href="/docs/installation/" rel="prev"')
    expect(page).toContain('href="/docs/authoring/" rel="next"')
    for (const slug of ['canvas', 'region', 'fabric', 'card', 'flow', 'point', 'graphic', 'future-notation']) {
      expect(page).toContain(`href="#${slug}"`)
    }
  })

  it('links back to the labelled overview and presents isolated property specimens', () => {
    const page = renderToStaticMarkup(<VisualGuide />)

    expect(page).toContain('href="/docs/#labelled-example"')
    expect(page).not.toContain('Labels for the complete example')
    expect(page).not.toContain('unexplained dot')
    expect(page.match(/<legend>Properties<\/legend>/g)).toHaveLength(7)
    expect(page.match(/aria-label="Reset example"/g)).toHaveLength(7)
    expect(page.match(/>Rendered<\/button>/g)).toHaveLength(7)
    expect(page.match(/>Design<\/button>/g)).toHaveLength(7)
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

  it('uses the shared journey instead of an ad hoc handoff section', () => {
    const page = renderToStaticMarkup(<VisualGuide />)

    expect(page).toContain('aria-label="Guide journey"')
    expect(page).not.toContain('id="where-next"')
  })
})
