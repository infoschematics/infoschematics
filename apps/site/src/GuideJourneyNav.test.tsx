import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GuideJourneyNav } from './GuideJourneyNav.tsx'

describe('guide journey navigation', () => {
  it('connects an article to the previous and next practical steps', () => {
    const navigation = renderToStaticMarkup(<GuideJourneyNav currentPath="/docs/installation/" />)

    expect(navigation).toContain('aria-label="Guide journey"')
    expect(navigation).toContain('href="/docs/" rel="prev"')
    expect(navigation).toContain('<strong>Overview</strong>')
    expect(navigation).toContain('href="/docs/components/" rel="next"')
    expect(navigation).toContain('<strong>Components</strong>')
  })

  it('starts and finishes without linking outside the practical journey', () => {
    const start = renderToStaticMarkup(<GuideJourneyNav currentPath="/docs/" />)
    const finish = renderToStaticMarkup(<GuideJourneyNav currentPath="/docs/react-integration/" />)

    expect(start).not.toContain('rel="prev"')
    expect(start).toContain('href="/docs/installation/" rel="next"')
    expect(finish).toContain('href="/docs/static-rendering/" rel="prev"')
    expect(finish).not.toContain('rel="next"')
  })

  it('does not impose the practical journey on supporting material', () => {
    expect(renderToStaticMarkup(<GuideJourneyNav currentPath="/docs/approach/architecture/" />)).toBe('')
    expect(renderToStaticMarkup(<GuideJourneyNav currentPath="/docs/reference/vocabulary/" />)).toBe('')
  })
})
