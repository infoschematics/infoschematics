import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DocumentPage } from './DocumentPage.tsx'
import { documentationRoutes } from './routes.ts'

describe('documentation pages', () => {
  it.each(documentationRoutes)('renders the canonical $sourcePath Markdown', (route) => {
    const page = renderToStaticMarkup(<DocumentPage route={route} />)

    expect(page).toContain('<article')
    expect(page).toContain('<h1 id="')
    expect(page).toContain(`aria-label="${route.title}"`)
    expect(page).toContain('href="/docs/"')
  })

  it.each(documentationRoutes)('lists every article in the sidebar and marks $sourcePath current', (route) => {
    const page = renderToStaticMarkup(<DocumentPage route={route} />)

    expect(page).toContain('aria-label="Documentation"')
    for (const other of documentationRoutes) {
      expect(page).toContain(`>${other.title}</a>`)
    }
    expect(page).toContain(`aria-current="page" href="${route.path}"`)
  })

  it('gives headings anchor ids and lists them in the page contents', () => {
    const route = documentationRoutes.find(({ sourcePath }) => sourcePath === 'apps/site/content/authoring.md')

    if (!route) {
      throw new Error('The authoring documentation route is missing.')
    }

    const page = renderToStaticMarkup(<DocumentPage route={route} />)
    const article = page.slice(page.indexOf('<article'), page.indexOf('</article>'))
    const ids = [...article.matchAll(/<h[23] id="([^"]+)"/g)].map(([, id]) => id)

    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
    expect(page).toContain('aria-label="On this page"')
    for (const id of ids) {
      expect(page).toContain(`href="#${id}"`)
    }
  })

  it('renders Markdown structure rather than exposing source text', () => {
    const route = documentationRoutes.find(({ sourcePath }) => sourcePath === 'apps/site/content/authoring.md')

    if (!route) {
      throw new Error('The authoring documentation route is missing.')
    }

    const page = renderToStaticMarkup(<DocumentPage route={route} />)

    expect(page).toContain('<code>')
    expect(page).not.toContain('# Authoring')
  })

  it('rewrites repository-relative links to their canonical GitHub location', () => {
    const route = documentationRoutes.find(({ sourcePath }) => sourcePath === 'docs/design/architecture.md')

    if (!route) {
      throw new Error('The architecture documentation route is missing.')
    }

    const page = renderToStaticMarkup(<DocumentPage route={route} />)

    expect(page).toContain(
      'href="https://github.com/infoschematics/infoschematics/blob/main/docs/decisions/PDR-INFOSCHEMATICS-001-framework-neutral-library.md"'
    )
    expect(page).not.toContain('href="../decisions/')
  })

  it('renders stable vocabulary anchors for direct concept links', () => {
    const route = documentationRoutes.find(({ sourcePath }) => sourcePath === 'docs/reference/vocabulary.md')

    if (!route) {
      throw new Error('The vocabulary documentation route is missing.')
    }

    const page = renderToStaticMarkup(<DocumentPage route={route} />)

    expect(page).toContain('<span id="infoschematic"></span>')
    expect(page).toContain('<span id="point"></span>')
    expect(page).toContain('<span id="flow-family"></span>')
  })
})
