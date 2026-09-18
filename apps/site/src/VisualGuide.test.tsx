import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { componentPaths } from './routes.ts'
import { ComponentsHub, VisualGuide } from './VisualGuide.tsx'

describe('components guide', () => {
  it('keeps the hub concise and links each focused page', () => {
    const page = renderToStaticMarkup(<ComponentsHub />)
    expect(page).toContain('<h1>Components</h1>')
    expect(page).toContain('href="/docs/components/canvas/"')
    expect(page).toContain('href="/docs/components/regions/"')
    expect(page).toContain('href="/docs/components/future/"')
    expect(page).not.toContain('Live example')
    expect(page).not.toContain('A labelled Infoschematic')
  })

  it('renders a focused specimen with property reference and honest wording', () => {
    const page = renderToStaticMarkup(
      <VisualGuide
        route={{
          path: componentPaths.canvas,
          title: 'Canvas',
          summary: 'Backdrop',
          section: 'components',
          componentId: 'canvas'
        }}
      />
    )
    expect(page).toContain('<h1>Canvas</h1>')
    expect(page).toContain('View box width')
    expect(page).toContain('id="canvas-example"')
    expect(page).toContain('id="canvas-properties"')
    expect(page).toContain('major dots')
    expect(page).toContain('Pattern × Intervals')
    expect(page).toContain('Property reference')
  })

  it('shows supported Card variants side by side in one demo', () => {
    const page = renderToStaticMarkup(
      <VisualGuide
        route={{
          path: componentPaths.card,
          title: 'Cards',
          summary: 'Cards',
          section: 'components',
          componentId: 'card'
        }}
      />
    )
    expect(page).toContain('demo-frame__preview--variants')
    expect(page).toContain('<figcaption>Standard</figcaption>')
    expect(page).toContain('<figcaption>Adapter</figcaption>')
    expect(page.match(/aria-label="Card properties live example"/g)).toHaveLength(1)
  })

  it('plays each cue policy side by side on the Dynamics page, over a document that carries no timing', () => {
    const page = renderToStaticMarkup(
      <VisualGuide
        route={{
          path: componentPaths.dynamics,
          title: 'Dynamics',
          summary: 'Dynamics',
          section: 'components',
          componentId: 'dynamics'
        }}
      />
    )

    expect(page).toContain('<h1>Dynamics</h1>')
    // The three policies are three panes of one frame, so a reader compares them rather than navigating between them.
    expect(page).toContain('demo-frame__preview--variants')
    expect(page.match(/<figure>/g)).toHaveLength(3)
    expect(page).toContain('<code>once</code>')
    expect(page).toContain('<code>repeat</code> <button aria-pressed="true"')
    expect(page).toContain('<code>depicts: state</code>')
    // Two panes signal the Flow the Dynamic names; the third holds emphasis on the element it names.
    expect(page.match(/class="infoschematic-flow-signal"/g)).toHaveLength(2)
    expect(page).toContain('data-artefact-id="SENSOR" data-depicts="state" data-dynamic-id="sensor-is-live"')
    // The authored definition on the page is the whole of what a document says: a policy, and no timing at all.
    expect(page).toContain('playback: repeat')
    expect(page).toContain('depicts: state')
    for (const runtimeInstruction of ['duration', 'easing', 'occurrenceKey', 'interval']) {
      expect(page.slice(page.indexOf('Authored definition'))).not.toContain(runtimeInstruction)
    }
  })

  it('does not use internal Point endpoint language', () => {
    const page = renderToStaticMarkup(
      <VisualGuide
        route={{
          path: componentPaths.point,
          title: 'Points',
          summary: 'Points',
          section: 'components',
          componentId: 'point'
        }}
      />
    )
    expect(page).toContain('Start, end, junction, anchor')
    expect(page).not.toContain('unexplained dot')
  })
})
