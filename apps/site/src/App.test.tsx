import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from './App.tsx'
import { BlankInfoschematic } from './BlankInfoschematic.tsx'
import { ExamplesIndex } from './ExamplesIndex.tsx'
import {
  canonicalSitePath,
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
    expect(page).toContain('viewBox%3D%220%200%201268%20408%22')
    expect(page).toContain('%3ESTR-01%3C')
    expect(page).toContain('%3ESHAPE%3C')
    expect(page).toContain('%3EDIRECT%3C')
    expect(page).toContain('%3ERENDER%3C')
    expect(page).toContain('%3EPRESENT%3C')
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
    expect(isBlankExamplePath('/examples/blank')).toBe(true)
    expect(isBlankExamplePath('/')).toBe(false)
    expect(page).toContain('<h1>Infoschematics</h1>')
    expect(page).toContain('viewBox="0 0 1920 1080"')
    expect(page).toContain('data-surface-treatment="blueprint"')
    expect(page).toContain('data-grid-treatment="major-plus-minor"')
    expect(page).not.toContain('5G-EMERGE')
  })

  it.each(documentationRoutes)('resolves $path with or without a trailing slash', (route) => {
    expect(getDocumentationRoute(route.path)).toEqual(route)
    expect(getDocumentationRoute(route.path.slice(0, -1))).toEqual(route)
  })

  it('keeps Site-owned guide content separate from repository-owned approach documents', () => {
    expect(getDocumentationRoute('/docs/authoring/')?.sourcePath).toBe('apps/site/content/authoring.md')
    expect(getDocumentationRoute('/docs/approach/architecture/')?.sourcePath).toBe('docs/design/architecture.md')
    expect(getDocumentationRoute('/docs/guides/authoring/')).toBeUndefined()
  })

  it('publishes the user guide in step-by-step order', () => {
    const titles = documentationRoutes.filter((route) => route.section === 'guide').map((route) => route.title)

    expect(titles).toEqual([
      'Getting started',
      'Installation',
      'Authoring',
      'Present view',
      'Studio view',
      'Static rendering',
      'React integration'
    ])
  })

  it('keeps terminology available without making Reference a primary section', () => {
    expect(getDocumentationRoute('/docs/reference/vocabulary/')?.title).toBe('Terminology')
    expect(documentationRoutes.filter((route) => route.section === 'reference')).toHaveLength(1)
  })

  it('canonicalises retired Capabilities and Design paths', () => {
    expect(canonicalSitePath('/docs/capabilities/')).toBe('/docs/visual-guide/')
    expect(canonicalSitePath('/docs/capabilities')).toBe('/docs/visual-guide/')
    expect(canonicalSitePath('/docs/design/architecture/')).toBe('/docs/approach/architecture/')
    expect(getDocumentationRoute('/docs/design/architecture/')?.sourcePath).toBe('docs/design/architecture.md')
    expect(canonicalSitePath('/docs/authoring/')).toBe('/docs/authoring/')
  })

  it('publishes guidance while specifications stay in the repository', () => {
    expect(documentationRoutes.some((route) => route.sourcePath.startsWith('docs/specs/'))).toBe(false)
    expect(getDocumentationRoute('/docs/specs/')).toBeUndefined()
  })

  it('resolves the docs and examples indexes with or without a trailing slash', () => {
    expect(isDocsIndexPath('/docs/')).toBe(true)
    expect(isDocsIndexPath('/docs')).toBe(true)
    expect(isDocsIndexPath('/')).toBe(false)
    expect(isExamplesIndexPath('/examples/')).toBe(true)
    expect(isExamplesIndexPath('/examples')).toBe(true)
    expect(isExamplesIndexPath('/')).toBe(false)
  })

  it('renders the getting-started guide at the docs index path', () => {
    expect(getDocumentationRoute('/docs/')?.sourcePath).toBe('apps/site/content/getting-started.md')
    expect(getDocumentationRoute('/docs')?.sourcePath).toBe('apps/site/content/getting-started.md')
  })

  it('lists all three hosted examples on the examples index', () => {
    const page = renderToStaticMarkup(<ExamplesIndex />)

    expect(page).toContain('href="/examples/infoschematics/"')
    expect(page).toContain('href="/examples/system/"')
    expect(page).toContain('href="/examples/blank/"')
  })

  it('resolves hosted Infoschematics examples with or without trailing slashes', () => {
    expect(isInfoschematicsExamplePath('/examples/infoschematics/')).toBe(true)
    expect(isInfoschematicsExamplePath('/examples/infoschematics')).toBe(true)
    expect(isInfoschematicsExamplePath('/examples/infoschematic/')).toBe(false)
    expect(isSystemExamplePath('/examples/system/')).toBe(true)
    expect(isSystemExamplePath('/examples/system')).toBe(true)
    expect(isSystemExamplePath('/examples/systems/')).toBe(false)
  })
})
