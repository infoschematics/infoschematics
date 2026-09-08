import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from './App.tsx'
import { BlankInfoschematic } from './BlankInfoschematic.tsx'
import { ExamplesIndex } from './ExamplesIndex.tsx'
import {
  docsIndexPath,
  documentationRoutes,
  examplesIndexPath,
  getDocumentationRoute,
  isBlankExamplePath,
  isDocsIndexPath,
  isExamplesIndexPath,
  isInfoschematicsExamplePath,
  isSystemExamplePath
} from './routes.ts'

describe('website routes', () => {
  it('keeps the designed Infoschematics homepage at the root route', () => {
    const page = renderToStaticMarkup(<App />)

    expect(page).toContain('See how it')
    expect(page).toContain('rendered through shared SVG output')
    expect(page).toContain('src="data:image/svg+xml;charset=utf-8,%3Csvg')
    expect(page).toContain('viewBox%3D%220%200%201268%20248%22')
    expect(page).toContain('%3EOBS-01%3C')
    expect(page).toContain('%3ESELECT%3C')
    expect(page).toContain('%3ECONNECT%3C')
    expect(page).toContain('%3EREVEAL%3C')
    expect(page).not.toContain('comparison-lane')
    expect(page).not.toContain('data-treatment')
    expect(page).not.toContain('Bespoke homepage treatment')
    expect(page).not.toContain('system-card')
    expect(page).not.toContain('flow-connector')
    expect(page).toContain(`href="${docsIndexPath}"`)
    expect(page).toContain(`href="${examplesIndexPath}"`)
  })

  it('renders the title-only Infoschematic at its blank example route', () => {
    const page = renderToStaticMarkup(<BlankInfoschematic />)

    expect(isBlankExamplePath('/examples/blank/')).toBe(true)
    expect(isBlankExamplePath('/')).toBe(false)
    expect(page).toContain('<h1>Infoschematics</h1>')
    expect(page).toContain('<svg')
    expect(page).toContain('viewBox="0 0 1200 800"')
    expect(page).not.toContain('5G-EMERGE')
  })

  it('resolves each canonical documentation route with or without a trailing slash', () => {
    for (const route of documentationRoutes) {
      expect(getDocumentationRoute(route.path)).toEqual(route)
      expect(getDocumentationRoute(route.path.slice(0, -1))).toEqual(route)
    }

    expect(getDocumentationRoute('/')).toBeUndefined()
    expect(getDocumentationRoute('/guides/unknown/')).toBeUndefined()
  })

  it('derives each document path from its source path, collapsing a trailing README', () => {
    expect(getDocumentationRoute('/docs/guides/authoring/')?.sourcePath).toBe('docs/guides/authoring.md')
    expect(getDocumentationRoute('/docs/specs/')?.sourcePath).toBe('docs/specs/README.md')
    expect(getDocumentationRoute('/docs/specs/domain-core/')?.sourcePath).toBe('docs/specs/domain-core.md')
  })

  it('resolves the docs and examples indexes with or without a trailing slash', () => {
    expect(isDocsIndexPath('/docs/')).toBe(true)
    expect(isDocsIndexPath('/docs')).toBe(true)
    expect(isDocsIndexPath('/')).toBe(false)
    expect(isExamplesIndexPath('/examples/')).toBe(true)
    expect(isExamplesIndexPath('/examples')).toBe(true)
    expect(isExamplesIndexPath('/')).toBe(false)
  })

  it('renders the overview document at the docs index path', () => {
    expect(getDocumentationRoute('/docs/')?.sourcePath).toBe('docs/overview.md')
    expect(getDocumentationRoute('/docs')?.sourcePath).toBe('docs/overview.md')
  })

  it('lists all three hosted examples on the examples index', () => {
    const page = renderToStaticMarkup(<ExamplesIndex />)

    expect(page).toContain('href="/examples/infoschematics/"')
    expect(page).toContain('href="/examples/system/"')
    expect(page).toContain('href="/examples/blank/"')
  })

  it('resolves the hosted Infoschematics example with or without a trailing slash', () => {
    expect(isInfoschematicsExamplePath('/examples/infoschematics/')).toBe(true)
    expect(isInfoschematicsExamplePath('/examples/infoschematics')).toBe(true)
    expect(isInfoschematicsExamplePath('/examples/infoschematic/')).toBe(false)
    expect(isInfoschematicsExamplePath('/')).toBe(false)
  })

  it('resolves the hosted system example with or without a trailing slash', () => {
    expect(isSystemExamplePath('/examples/system/')).toBe(true)
    expect(isSystemExamplePath('/examples/system')).toBe(true)
    expect(isSystemExamplePath('/examples/systems/')).toBe(false)
    expect(isSystemExamplePath('/')).toBe(false)
  })
})
