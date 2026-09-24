import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { destinationFromSearch } from './DestinationDemo.tsx'
import { ReactIntegrationPage } from './ReactIntegrationPage.tsx'
import { documentationRoutes, isReactIntegrationPath, reactIntegrationPath } from './routes.ts'

describe('the address this host reads', () => {
  it('turns its own query string into an authored identity and nothing more', () => {
    expect(destinationFromSearch('?artefact=STORE')).toEqual({ code: 'STORE', kind: 'artefact' })
    expect(destinationFromSearch('?scope=edge')).toEqual({ id: 'edge', kind: 'scope' })
    /* An artefact wins a page that names both, so one address never means two places. */
    expect(destinationFromSearch('?artefact=STORE&scope=edge')).toEqual({ code: 'STORE', kind: 'artefact' })
    expect(destinationFromSearch('')).toBeNull()
    expect(destinationFromSearch('?page=2')).toBeNull()
    /* An address that names nothing in this document is still a destination: refusing it is the Diagram's job, and
       a host that filtered it here would have to know the document, which is the coupling the boundary prevents. */
    expect(destinationFromSearch('?artefact=GONE-01')).toEqual({ code: 'GONE-01', kind: 'artefact' })
  })
})

describe('the React integration page', () => {
  const route = documentationRoutes.find((candidate) => candidate.path === reactIntegrationPath)

  it('is the page the router sends a reader to for this guide', () => {
    expect(isReactIntegrationPath('/docs/react-integration/')).toBe(true)
    expect(isReactIntegrationPath('/docs/react-integration')).toBe(true)
    expect(isReactIntegrationPath('/docs/static-rendering/')).toBe(false)
  })

  it('shows the mechanism under the prose that describes it', () => {
    if (!route) throw new Error('React integration route is not published')

    const page = renderToStaticMarkup(<ReactIntegrationPage route={route} />)

    expect(page).toContain('<h2 id="try-an-address">Try an address</h2>')
    expect(page).toContain('aria-label="Destinations in the example Infoschematic"')
    /* Including the address that leads nowhere: a reader will not put an address into prose they cannot edit until
       they have seen what happens when it goes stale. */
    expect(page).toContain('?artefact=GONE-01')
    expect(page).toContain('?scope=edge')
    /* Server-rendered there is no reader and no viewport, so the whole document is drawn and nothing is reported. */
    expect(page).toContain('No destination. The whole document is shown.')
    expect(page).toContain('data-artefact-id="STORE"')
  })
})
