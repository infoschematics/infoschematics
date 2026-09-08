import { parseInfoschematic } from '@infoschematics/domain-core'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Issues, Playground, Preview, presetFromSearch, presets } from './Playground.tsx'
import jsonSeed from './playground/seeds/format-parity.json?raw'
import typescriptSeed from './playground/seeds/format-parity.ts.txt?raw'
import yamlSeed from './playground/seeds/format-parity.yaml?raw'

describe('Playground', () => {
  it('orders the three format tabs by portability with YAML active and a live preview of its seed', () => {
    const page = renderToStaticMarkup(<Playground />)

    const yamlTab = page.indexOf('>YAML</button>')
    const jsonTab = page.indexOf('>JSON</button>')
    const typescriptTab = page.indexOf('>TypeScript</button>')
    expect(yamlTab).toBeGreaterThan(-1)
    expect(yamlTab).toBeLessThan(jsonTab)
    expect(jsonTab).toBeLessThan(typescriptTab)
    expect(page).toContain('aria-selected="true"')
    expect(page).toContain('aria-label="YAML document"')
    expect(page).toContain('data:image/svg+xml')
  })

  it('is a full-view page in the wide shell with the preset picker listed', () => {
    const page = renderToStaticMarkup(<Playground />)

    expect(page).toContain('document-shell--wide')
    expect(page).toContain('playground-shell')
    for (const { label } of presets) {
      expect(page).toContain(`>${label}</option>`)
    }
  })

  it('seeds every tab with a document its own format accepts', () => {
    expect(parseInfoschematic(typescriptSeed, { format: 'typescript' }).ok).toBe(true)
    expect(parseInfoschematic(jsonSeed, { format: 'json' }).ok).toBe(true)
    expect(parseInfoschematic(yamlSeed, { format: 'yaml' }).ok).toBe(true)
  })

  it('starts every format with a visible Flow from Source to Sink', () => {
    const seeds = [
      { format: 'yaml', text: yamlSeed },
      { format: 'json', text: jsonSeed },
      { format: 'typescript', text: typescriptSeed }
    ] as const

    for (const { format, text } of seeds) {
      const parsed = parseInfoschematic(text, { format })
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) continue

      expect(parsed.config.infoschematic.flows).toEqual([expect.objectContaining({ source: 'source', target: 'sink' })])
      expect(renderInfoschematicSvg(parsed.config)).toContain('d="M300 220 H500"')
    }
  })

  it('serialises every example preset to a document JSON accepts', () => {
    for (const preset of presets) {
      for (const [format, text] of Object.entries(preset.buffers)) {
        const parsed = parseInfoschematic(text, { format: format as never })
        expect(parsed.ok, `${preset.key} ${format}`).toBe(true)
      }
    }
  })

  it('starts on the buffer a preset focuses, rendering its definition', () => {
    const page = renderToStaticMarkup(<Playground preset="system" />)

    expect(page).toContain('aria-label="JSON document"')
    expect(page).toContain('data:image/svg+xml')
  })

  it('selects a preset from the query string and refuses one it does not know', () => {
    expect(presetFromSearch('?preset=system')).toBe('system')
    expect(presetFromSearch('?preset=blank')).toBe('blank')
    expect(presetFromSearch('?preset=nonesuch')).toBeUndefined()
    expect(presetFromSearch('')).toBeUndefined()
  })

  it('renders a valid document as a preview image', () => {
    const parsed = parseInfoschematic(jsonSeed, { format: 'json' })
    const panel = renderToStaticMarkup(<Preview parsed={parsed} />)

    expect(parsed.ok).toBe(true)
    expect(panel).toContain('data:image/svg+xml')
  })

  it('shows path-addressed issues for a broken document', () => {
    const broken = jsonSeed.replace('"width": 800', '"width": "wide"')
    const parsed = parseInfoschematic(broken, { format: 'json' })
    const panel = renderToStaticMarkup(<Issues parsed={parsed} />)

    expect(parsed.ok).toBe(false)
    expect(panel).toContain('playground-issues')
    expect(panel).toContain('infoschematic.viewBox.width')
  })

  it('rejects executable TypeScript rather than running it', () => {
    const parsed = parseInfoschematic("export const d = defineInfoschematic({ title: 'Nope' })", {
      format: 'typescript'
    })

    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.issues[0]?.message).toMatch(/Call expressions/)
  })
})
