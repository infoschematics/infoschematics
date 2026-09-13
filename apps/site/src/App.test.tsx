import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from './App.tsx'
import { homepageGuideActions } from './HomepageGuideDiagram.tsx'
import {
  canonicalSiteLocation,
  canonicalSitePath,
  docsIndexPath,
  documentationRoutes,
  getDocumentationRoute,
  isDocsIndexPath
} from './routes.ts'

describe('website routes', () => {
  const siteStyles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8')

  it('keeps the designed Infoschematics homepage at the root route', () => {
    const page = renderToStaticMarkup(<App />)

    expect(page).toContain('See how it')
    expect(page).toContain('<section aria-label="Inline Infoschematic reference">')
    expect(page).toContain('<svg xmlns="http://www.w3.org/2000/svg"')
    expect(page).toContain('viewBox="0 0 1268 408"')
    for (const id of ['STR-01', 'PRS-02', 'INFO-03', 'OUT-04', 'OUT-05']) {
      expect(page).toContain(`data-artefact-id="${id}" data-artefact-kind="card"`)
    }
    expect(page).not.toContain('data:image/svg+xml')
    expect(page).not.toContain('comparison-lane')
    expect(page).not.toContain('data-treatment')
    expect(page).not.toContain('Bespoke homepage treatment')
    expect(page).not.toContain('system-card')
    expect(page).not.toContain('flow-connector')
    expect(page).toContain(`href="${docsIndexPath}"`)
    expect(page).toContain('Getting started')
    expect(page).toContain('Structure — visual guide')
    expect(page).toContain('Presentation — authoring')
    expect(page).toContain('Infoschematic — getting started')
    expect(page).toContain('Rendered — static rendering')
    expect(page).toContain('Presented — present view')
    expect(page).toContain('href="/playground/"')
    expect(page).not.toContain('href="/examples/"')
  })

  it('gives the homepage preview vertical breathing room before its edge fade', () => {
    expect(siteStyles).toContain('padding-block: clamp(12px, 2vh, 24px)')
    expect(siteStyles.match(/linear-gradient\(to bottom, transparent, #000 3%, #000 97%, transparent\)/g)).toHaveLength(
      2
    )
  })

  it('keeps homepage artefact pathways on the approved guide destinations', () => {
    expect(homepageGuideActions.map(({ id, href }) => ({ href, id }))).toEqual([
      { href: '/docs/visual-guide/#anatomy', id: 'STR-01' },
      { href: '/docs/authoring/#add-presentation-material', id: 'PRS-02' },
      { href: '/docs/', id: 'INFO-03' },
      { href: '/docs/static-rendering/', id: 'OUT-04' },
      { href: '/docs/present/', id: 'OUT-05' }
    ])
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

  it('maps legacy example pages to curated Playground presets', () => {
    expect(canonicalSiteLocation('/examples/')).toEqual({
      pathname: '/playground/',
      search: '?preset=source-to-sink'
    })
    expect(canonicalSiteLocation('/examples/blank')).toEqual({ pathname: '/playground/', search: '?preset=blank' })
    expect(canonicalSiteLocation('/examples/infoschematics/')).toEqual({
      pathname: '/playground/',
      search: '?preset=explained'
    })
    expect(canonicalSiteLocation('/examples/system')).toEqual({
      pathname: '/playground/',
      search: '?preset=explained'
    })
    expect(canonicalSiteLocation('/examples/retired-example/')).toEqual({
      pathname: '/playground/',
      search: '?preset=source-to-sink'
    })
  })

  it('publishes guidance while specifications stay in the repository', () => {
    expect(documentationRoutes.some((route) => route.sourcePath.startsWith('docs/specs/'))).toBe(false)
    expect(getDocumentationRoute('/docs/specs/')).toBeUndefined()
  })

  it('resolves the docs index with or without a trailing slash', () => {
    expect(isDocsIndexPath('/docs/')).toBe(true)
    expect(isDocsIndexPath('/docs')).toBe(true)
    expect(isDocsIndexPath('/')).toBe(false)
  })

  it('renders the getting-started guide at the docs index path', () => {
    expect(getDocumentationRoute('/docs/')?.sourcePath).toBe('apps/site/content/getting-started.md')
    expect(getDocumentationRoute('/docs')?.sourcePath).toBe('apps/site/content/getting-started.md')
  })
})
