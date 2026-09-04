import { systemExample } from '@infoschematics/is-system'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SystemExample, systemExampleDocumentTitle } from './SystemExample.tsx'

describe('hosted system example', () => {
  it('mounts the shared authored definition through View Studio', () => {
    const page = renderToStaticMarkup(<SystemExample />)

    expect(page).toContain(`<h1>${systemExample.title}</h1>`)
    expect(page).toContain('data-production-mode="present"')
    expect(page).toContain('aria-label="Present mode"')
    expect(page).toContain('aria-label="Design mode"')
    expect(page).toContain('aria-label="Direct mode"')
  })

  it('provides route-owned document title metadata', () => {
    expect(systemExampleDocumentTitle).toBe(`${systemExample.title} · Infoschematics`)
  })
})
