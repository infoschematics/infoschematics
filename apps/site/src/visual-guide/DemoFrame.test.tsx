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
    expect(page).toContain('aria-pressed="true">Rendered</button>')
    expect(page).toContain('aria-pressed="false">Design</button>')
    expect(page).toContain('aria-label="Reset example"')
    expect(page).toContain('aria-label="Expand source"')
    expect(page).toContain('aria-label="Copy snippet"')
    expect(page).toContain('specimen-snippet__source')
    expect(page).not.toContain('>Reset</button>')
    expect(page).not.toContain('>Copy snippet</button>')
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
