import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { VisualGuide } from './VisualGuide.tsx'

describe('visual guide', () => {
  it('combines visible anatomy, groupings, treatments and explanatory capabilities', () => {
    const page = renderToStaticMarkup(<VisualGuide />)

    expect(page).toContain('Anatomy of an Infoschematic')
    expect(page).toContain('Groupings are not shapes')
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
