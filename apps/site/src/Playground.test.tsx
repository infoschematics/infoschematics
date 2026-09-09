import { parseInfoschematic } from '@infoschematics/domain-core'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Issues, Playground, Preview, presetFromSearch, presets } from './Playground.tsx'
import yamlSeed from './playground/seeds/format-parity.yaml?raw'

describe('Playground', () => {
  it('presents one YAML document with a live preview', () => {
    const page = renderToStaticMarkup(<Playground />)

    expect(page).toContain('>YAML</p>')
    expect(page).not.toContain('>TypeScript<')
    expect(page).not.toContain('aria-label="JSON document"')
    expect(page).toContain('aria-label="YAML document"')
    expect(page).toContain('data:image/svg+xml')
  })

  it('is a full-view page with every preset listed', () => {
    const page = renderToStaticMarkup(<Playground />)

    expect(page).toContain('document-shell--wide')
    expect(page).toContain('playground-shell')
    for (const { label } of presets) expect(page).toContain(`>${label}</option>`)
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
    expect(renderInfoschematicSvg(parsed.model)).toContain('d="M300 220 H500"')
  })

  it('serialises every canonical preset as valid YAML', () => {
    for (const preset of presets) expect(parseInfoschematic(preset.document).ok, preset.key).toBe(true)
  })

  it('renders a selected preset from the same YAML editor', () => {
    const page = renderToStaticMarkup(<Playground preset="system" />)

    expect(page).toContain('aria-label="YAML document"')
    expect(page).toContain('data:image/svg+xml')
  })

  it('selects a preset from the query string and refuses one it does not know', () => {
    expect(presetFromSearch('?preset=system')).toBe('system')
    expect(presetFromSearch('?preset=blank')).toBe('blank')
    expect(presetFromSearch('?preset=nonesuch')).toBeUndefined()
    expect(presetFromSearch('')).toBeUndefined()
  })

  it('renders a valid document as a preview image', () => {
    const parsed = parseInfoschematic(yamlSeed)
    const panel = renderToStaticMarkup(<Preview parsed={parsed} />)

    expect(parsed.ok).toBe(true)
    expect(panel).toContain('data:image/svg+xml')
  })

  it('shows canonical path-addressed issues for a broken document', () => {
    const broken = yamlSeed.replace('width: 800', 'width: wide')
    const parsed = parseInfoschematic(broken)
    const panel = renderToStaticMarkup(<Issues parsed={parsed} />)

    expect(parsed.ok).toBe(false)
    expect(panel).toContain('playground-issues')
    expect(panel).toContain('diagram.bounds.width')
  })

  it('treats executable-looking TypeScript as inert invalid YAML', () => {
    const parsed = parseInfoschematic("export const d = defineInfoschematic({ title: 'Nope' })")
    expect(parsed.ok).toBe(false)
  })
})
