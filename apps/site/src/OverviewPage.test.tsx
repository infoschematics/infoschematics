import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { OverviewPage } from './OverviewPage.tsx'
import { docsIndexPath, documentationRoutes } from './routes.ts'

describe('overview page', () => {
  it('introduces the labelled Infoschematic before the guide journey continues', () => {
    const route = documentationRoutes.find((candidate) => candidate.path === docsIndexPath)

    if (!route) throw new Error('Overview route is not published')

    const page = renderToStaticMarkup(<OverviewPage route={route} />)

    expect(page).toContain('class="document-content document-content--before-anatomy"')
    /* The labelled example is the largest drawing the site shows, and it is drawn in the page rather than
       referenced and resampled. Its name sits on the host, so the drawing inside it is not announced twice. */
    expect(page).not.toContain('data:image/svg+xml')
    expect(page).toContain('class="visual-guide__anatomy-drawing"')
    expect(page).toContain(
      'aria-label="A labelled Infoschematic showing its Canvas, Region, Fabric, Card, Flows, Point, and Graphic"'
    )
    expect(page).toContain('<h2 id="labelled-example">A labelled Infoschematic</h2>')
    expect(page).toContain('aria-label="Labels for the complete example"')
    expect(page).toContain('href="/docs/installation/" rel="next"')
  })
})
