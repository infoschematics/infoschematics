import { infoschematicDocumentSource, parseInfoschematic } from '@infoschematics/domain-core'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { authoredDocumentForPreset, documentForPreset, Playground, presetFromSearch, presets } from './Playground.tsx'
import yamlSeed from './playground/seeds/format-parity.yaml?raw'
import mediaPipelineSeed from './playground/seeds/media-pipeline.yaml?raw'

describe('Playground', () => {
  it('hosts the real Studio rather than a second Site-owned editor', () => {
    const page = renderToStaticMarkup(<Playground />)

    expect(page).toContain('>Playground controls</legend>')
    expect(page).toContain('class="playground-studio"')
    expect(page).toContain('data-production-mode="present"')
    expect(page).toContain('aria-label="Design mode')
    expect(page).toContain('aria-label="Format parity Infoschematic"')
    expect(page).not.toContain('playground-editor-pane')
    expect(page).not.toContain('aria-label="Infoschematic document"')
    expect(page).not.toContain('data:image/svg+xml')
  })

  it('keeps preset routing and reset controls in the Site host', () => {
    const page = renderToStaticMarkup(<Playground />)

    expect(page).toContain('document-shell--wide')
    expect(page).toContain('playground-shell')
    for (const { label } of presets) expect(page).toContain(`>${label}</option>`)
    expect(page).toContain('>Preset loaded</span>')
    expect(page).toContain('>Reset preset</button>')
    expect(page).toContain('Use Design to shape it and Source to edit, validate, undo, or copy YAML.')
  })

  it('starts with a visible Flow from Source to Sink', () => {
    const parsed = parseInfoschematic(yamlSeed)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(parsed.model.diagram.flows).toEqual([
      expect.objectContaining({
        source: { element: 'SRC', port: 'E1' },
        target: { element: 'SNK', port: 'W1' }
      })
    ])
  })

  it('offers an architectural media pipeline whose Flow Families say what moves', () => {
    const parsed = parseInfoschematic(mediaPipelineSeed)

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(parsed.model.diagram.cards).toHaveLength(5)
    expect(parsed.model.diagram.flows).toHaveLength(5)
    /*
     * One Point, with a Flow leaving it. A Producer trying Design on this preset needs something on the surface that
     * is a Point rather than a Card, and one that nothing depends on would not show what moving it does to a route.
     */
    expect(parsed.model.diagram.points.map(({ id }) => id)).toEqual(['CAPTIONS'])
    expect(parsed.model.diagram.flows.at(-1)).toMatchObject({
      id: 'CAPTIONED',
      source: { element: 'CAPTIONS', port: 'N1' }
    })
    expect(parsed.model.diagram.families.map(({ label }) => label)).toEqual([
      'Audio and video',
      'Segments and manifest',
      'Playback'
    ])
  })

  it('gives the hosted Studio named Dynamics to play, so a Producer can rehearse a host binding', () => {
    const parsed = parseInfoschematic(mediaPipelineSeed)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(parsed.model.diagram.dynamics.map(({ id }) => id)).toEqual(['segment-published', 'playback-stalled'])

    const page = renderToStaticMarkup(<Playground preset="media-pipeline" />)
    expect(page).toContain('aria-label="Diagram Dynamics"')
    expect(page).toContain('>Playback has stalled</button>')
    expect(page).toContain('>A segment is published</button>')
    // Nothing plays until a Producer asks: the preset loads quiet.
    expect(page).not.toContain('infoschematic-element-emphasis')
  })

  it('retains every canonical preset as a valid authored YAML document', () => {
    for (const preset of presets) {
      const document = authoredDocumentForPreset(preset.key)
      expect(infoschematicDocumentSource(document), preset.key).toBe(preset.document)
    }
  })

  it('renders a selected preset through Studio', () => {
    const page = renderToStaticMarkup(<Playground preset="explained" />)

    expect(page).toContain('aria-label="What makes an Infoschematic Infoschematic"')
    expect(page).toContain('<option value="explained" selected="">An Infoschematic explained</option>')
    expect(documentForPreset('explained')).toContain('What makes an Infoschematic')
  })

  it('reaches the capability showcase, which is the whole reason it is published', () => {
    const page = renderToStaticMarkup(<Playground preset="showcase" />)

    expect(page).toContain('<option value="showcase" selected="">Every capability</option>')
    // The notation no other preset carries: the Adapter Card's clasp and the Fabric beneath it.
    expect(documentForPreset('showcase')).toContain('adapts: CARD-03')
    expect(documentForPreset('showcase')).toContain('key: message-bus')
  })

  it('selects a preset from the query string and refuses one it does not know', () => {
    expect(presetFromSearch('?preset=source-to-sink')).toBe('source-to-sink')
    expect(presetFromSearch('?preset=media-pipeline')).toBe('media-pipeline')
    expect(presetFromSearch('?preset=explained')).toBe('explained')
    expect(presetFromSearch('?preset=blank')).toBe('blank')
    expect(presetFromSearch('?preset=showcase')).toBe('showcase')
    expect(presetFromSearch('?preset=system')).toBe('explained')
    expect(presetFromSearch('?preset=format-parity')).toBe('source-to-sink')
    expect(presetFromSearch('?preset=nonesuch')).toBeUndefined()
    expect(presetFromSearch('')).toBeUndefined()
  })
})
