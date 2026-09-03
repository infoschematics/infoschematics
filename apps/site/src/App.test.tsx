import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from './App.tsx'
import { BlankInfoschematic } from './BlankInfoschematic.tsx'
import {
  documentationRoutes,
  getDocumentationRoute,
  infoschematicsExamplePath,
  isBlankExamplePath,
  isInfoschematicsExamplePath,
} from './routes.ts'

describe('website routes', () => {
  it('keeps the designed Infoschematics homepage at the root route', () => {
    const page = renderToStaticMarkup(<App />)

    expect(page).toContain('See how it')
    expect(page).toContain('A system, explained')
    expect(page).toContain('Bespoke homepage treatment')
    expect(page).toContain('Shared renderer treatment')
    expect(page).toContain('data-treatment="bespoke"')
    expect(page).toContain('data-treatment="shared-renderer"')
    expect(page).toContain('<fieldset aria-hidden="true" class="stage__lane"><legend>Infoschematic</legend>')
    expect(page).toContain('OBS-01')
    expect(page).toContain('SEE-04')
    expect(page.match(/system-card__tag/g)).toHaveLength(4)
    expect(page).not.toContain('system-card__status')
    expect(page).not.toContain('Backstage')
    expect(page).not.toContain('Preview online')
    expect(page).toContain('rendered through shared SVG output')
    expect(page).toContain('src="data:image/svg+xml;charset=utf-8,%3Csvg')
    expect(page).toContain('viewBox%3D%220%200%201400%20920%22')
    expect(page).toContain(`href="${infoschematicsExamplePath}"`)
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

  it('resolves the hosted Infoschematics example with or without a trailing slash', () => {
    expect(isInfoschematicsExamplePath('/examples/infoschematics/')).toBe(true)
    expect(isInfoschematicsExamplePath('/examples/infoschematics')).toBe(true)
    expect(isInfoschematicsExamplePath('/examples/infoschematic/')).toBe(false)
    expect(isInfoschematicsExamplePath('/')).toBe(false)
  })
})
