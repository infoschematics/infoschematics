import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DocumentPage } from './DocumentPage.tsx'
import { documentationRoutes } from './routes.ts'

describe('documentation pages', () => {
  it.each(documentationRoutes)('renders the canonical $key Markdown', (route) => {
    const page = renderToStaticMarkup(<DocumentPage route={route} />)

    expect(page).toContain('<article')
    expect(page).toContain('<h1>')
    expect(page).toContain(`aria-label="${route.title}"`)
    expect(page).toContain('href="/"')
  })

  it('renders Markdown structure rather than exposing source text', () => {
    const route = documentationRoutes.find(({ key }) => key === 'authoring')

    if (!route) {
      throw new Error('The authoring documentation route is missing.')
    }

    const page = renderToStaticMarkup(<DocumentPage route={route} />)

    expect(page).toContain('<code>')
    expect(page).not.toContain('# Authoring')
  })

  it('rewrites repository-relative links to their canonical GitHub location', () => {
    const route = documentationRoutes.find(({ key }) => key === 'vocabulary')

    if (!route) {
      throw new Error('The vocabulary documentation route is missing.')
    }

    const page = renderToStaticMarkup(<DocumentPage route={route} />)

    expect(page).toContain(
      'href="https://github.com/infoschematics/infoschematics/blob/main/docs/decisions/KDR-INFOSCHEMATICS-001-product-vocabulary.md"'
    )
    expect(page).not.toContain('href="../decisions/')
  })
})
