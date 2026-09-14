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

  it.each(documentationRoutes)('lists the primary journey in the sidebar for $sourcePath', (route) => {
    const page = renderToStaticMarkup(<DocumentPage route={route} />)
    const primaryRoutes = documentationRoutes.filter((candidate) => candidate.section !== 'reference')

    expect(page).toContain('aria-label="Documentation"')
    for (const other of primaryRoutes) {
      expect(page).toContain(`>${other.title}</a>`)
    }
    expect(page).toContain('>Components</a>')
    expect(page).not.toContain('>Terminology</a>')
    expect(page).not.toContain('>Reference</h2>')
    if (route.section === 'reference') {
      expect(page).not.toContain(`aria-current="page" href="${route.path}"`)
    } else {
      expect(page).toMatch(new RegExp(`aria-current="page"[^>]*href="${route.path}"`))
    }
  })

  it('keeps the complete user-guide journey in reading order', () => {
    const route = documentationRoutes.find(({ path }) => path === '/docs/')
    if (!route) throw new Error('The getting-started route is missing.')

    const page = renderToStaticMarkup(<DocumentPage route={route} />)
    const titles = [
      'Overview',
      'Installation',
      'Components',
      'Authoring',
      'Representation patterns',
      'Explanation',
      'Present view',
      'Studio view',
      'Static rendering',
      'React integration'
    ]
    const positions = titles.map((title) => page.indexOf(`>${title}</a>`))

    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((left, right) => left - right))
  })

  it('explains architectural and supporting representation patterns', () => {
    const route = documentationRoutes.find(({ sourcePath }) => sourcePath === 'apps/site/content/representations.md')
    if (!route) throw new Error('The representation-patterns documentation route is missing.')

    const page = renderToStaticMarkup(<DocumentPage route={route} />)

    expect(page).toContain('Architecture is the centre')
    expect(page).toContain('Architecture dashboard views')
    expect(page).toContain('Data and media pipelines')
    expect(page).toContain('href="/playground/?preset=media-pipeline"')
    expect(page).toContain('Embedding in an operational console')
  })

  it('explains hosted and local ways to use Infoschematics before package setup', () => {
    const route = documentationRoutes.find(({ sourcePath }) => sourcePath === 'apps/site/content/installation.md')
    if (!route) throw new Error('The installation documentation route is missing.')

    const page = renderToStaticMarkup(<DocumentPage route={route} />)
    const hosted = page.indexOf('Hosted editor (no install)')
    const packages = page.indexOf('Install a published package')

    expect(hosted).toBeGreaterThanOrEqual(0)
    expect(page).toContain('create, edit, and copy an Infoschematic in your browser')
    expect(page).toContain('@infoschematics/render-svg')
    expect(page).toContain('@infoschematics/view-canvas')
    expect(page).toContain('@infoschematics/view-present')
    expect(page).toContain('@infoschematics/view-studio')
    expect(packages).toBeGreaterThan(hosted)
  })

  it('gives headings anchor ids and expands them beneath the active page in the sidebar', () => {
    const route = documentationRoutes.find(({ sourcePath }) => sourcePath === 'apps/site/content/authoring.md')

    if (!route) {
      throw new Error('The authoring documentation route is missing.')
    }

    const page = renderToStaticMarkup(<DocumentPage route={route} />)
    const article = page.slice(page.indexOf('<article'), page.indexOf('</article>'))
    const ids = [...article.matchAll(/<h[23] id="([^"]+)"/g)].map(([, id]) => id)

    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
    expect(page).toContain('aria-label="Authoring sections"')
    expect(page).not.toContain('aria-label="On this page"')
    for (const id of ids) {
      expect(page).toContain(`href="#${id}"`)
    }
  })

  it('keeps the guide map and active outline available through mobile navigation', () => {
    const route = documentationRoutes.find(({ sourcePath }) => sourcePath === 'apps/site/content/authoring.md')

    if (!route) throw new Error('The authoring documentation route is missing.')

    const page = renderToStaticMarkup(<DocumentPage route={route} />)

    expect(page).toContain('<details class="docs-mobile-navigation">')
    expect(page).toContain('<span>Guide navigation</span><strong>Authoring</strong>')
    expect(page).toContain('aria-label="Mobile documentation"')
    expect(page.match(/aria-label="Authoring sections"/g)).toHaveLength(2)
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
