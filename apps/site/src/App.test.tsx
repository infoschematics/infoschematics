import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from './App.tsx'
import { BlankInfoschematic } from './BlankInfoschematic.tsx'
import { documentationRoutes, getDocumentationRoute, isBlankExamplePath } from './routes.ts'

describe('website routes', () => {
  it('keeps the designed Infoschematics homepage at the root route', () => {
    const page = renderToStaticMarkup(<App />)

    expect(page).toContain('See how it')
    expect(page).toContain('A system, explained')
    expect(page).toContain('OBS-01')
    expect(page).toContain('SEE-04')
    expect(page.match(/system-card__tag/g)).toHaveLength(4)
    expect(page).not.toContain('system-card__status')
    expect(page).toContain('Preview online')
    expect(page).toContain('href="/examples/blank/"')
    expect(page).toContain('href="/guides/authoring/"')
    expect(page).toContain('href="/reference/vocabulary/"')
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
})
