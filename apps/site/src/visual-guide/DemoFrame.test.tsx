import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DemoFrame } from './DemoFrame.tsx'
import { specimenFor } from './specimens.ts'

describe('component demo frame', () => {
  it('offers honest preview modes and accessible source actions', () => {
    const page = renderToStaticMarkup(
      <DemoFrame
        config={specimenFor('canvas')}
        kind="canvas"
        propertyControls={<span>Controls</span>}
        reset={() => undefined}
        title="Canvas properties"
      />
    )

    expect(page).toContain('>Preview mode</legend>')
    expect(page).toMatch(/aria-pressed="true"[^>]*>Rendered<\/button>/)
    expect(page).toMatch(/aria-pressed="false"[^>]*>Design<\/button>/)
    expect(page).toContain('aria-label="Reset example"')
    expect(page).toContain('aria-label="Expand source"')
    expect(page).toContain('aria-label="Copy snippet"')
    expect(page).toContain('specimen-snippet__source')
    expect(page).not.toContain('>Reset</button>')
    expect(page).not.toContain('>Copy snippet</button>')
  })

  it('keeps the actions on the snippet they act on, leaving the property grid to properties', () => {
    const page = renderToStaticMarkup(
      <DemoFrame
        config={specimenFor('canvas')}
        kind="canvas"
        propertyControls={<span>Controls</span>}
        reset={() => undefined}
        title="Canvas properties"
      />
    )

    /* Reset and expand act on the specimen, not on it: read beside the copy control rather than as two
       more properties at the end of the grid. */
    const toolbar = page.slice(page.indexOf('specimen-snippet__toolbar'))
    for (const label of ['Copy snippet', 'Reset example', 'Expand source'])
      expect(toolbar, label).toContain(`aria-label="${label}"`)
    expect(page).not.toContain('demo-frame__actions')

    const controls = page.slice(page.indexOf('demo-frame__controls'), page.indexOf('specimen-snippet'))
    expect(controls).toContain('Controls')
    expect(controls).not.toContain('<button')
  })

  it('mounts the copy notice as a live region before there is anything to announce', () => {
    const page = renderToStaticMarkup(
      <DemoFrame
        config={specimenFor('canvas')}
        kind="canvas"
        propertyControls={null}
        reset={() => undefined}
        title="Canvas properties"
      />
    )

    /* A region that appears only once it has something to say is a new region to discover rather than an
       update to announce, so the first copy would go unread. */
    expect(page).toContain('aria-live="polite"')
    expect(page).toContain('specimen-snippet__notice')
    expect(page).not.toContain('specimen-snippet__feedback')
  })

  it('can compare supported variants side by side', () => {
    const config = specimenFor('card')
    const page = renderToStaticMarkup(
      <DemoFrame
        config={config}
        kind="card"
        propertyControls={null}
        reset={() => undefined}
        title="Card variants"
        variants={[
          { config, id: 'standard', label: 'Standard' },
          { config, id: 'adapter', label: 'Adapter' }
        ]}
      />
    )

    expect(page).toContain('demo-frame__preview--variants')
    expect(page).toContain('<figcaption>Standard</figcaption>')
    expect(page).toContain('<figcaption>Adapter</figcaption>')
  })
})
