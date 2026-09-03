import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { infoschematicsExample } from '@infoschematics/is-infoschematics'
import { InfoschematicsExample, infoschematicsExampleDocumentTitle } from './InfoschematicsExample.tsx'

describe('hosted Infoschematics example', () => {
  it('mounts the shared authored definition through View Studio', () => {
    const page = renderToStaticMarkup(<InfoschematicsExample />)

    expect(page).toContain(`<h1>${infoschematicsExample.title}</h1>`)
    expect(page).toContain('data-production-mode="present"')
    expect(page).toContain('aria-label="Present mode"')
    expect(page).toContain('aria-label="Design mode"')
    expect(page).toContain('aria-label="Direct mode"')
  })

  it('provides route-owned document title metadata', () => {
    expect(infoschematicsExampleDocumentTitle).toBe(`${infoschematicsExample.title} · Infoschematics`)
  })
})
