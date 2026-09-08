import { parseInfoschematic } from '@infoschematics/domain-core'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Playground, Preview } from './Playground.tsx'
import jsonSeed from './playground/seeds/format-parity.json?raw'
import typescriptSeed from './playground/seeds/format-parity.ts.txt?raw'
import yamlSeed from './playground/seeds/format-parity.yaml?raw'

describe('Playground', () => {
  it('renders the three format tabs with TypeScript active and a live preview of its seed', () => {
    const page = renderToStaticMarkup(<Playground />)

    expect(page).toContain('>TypeScript</button>')
    expect(page).toContain('>JSON</button>')
    expect(page).toContain('>YAML</button>')
    expect(page).toContain('aria-selected="true"')
    expect(page).toContain('export const formatParityDefinition')
    expect(page).toContain('data:image/svg+xml')
  })

  it('seeds every tab with a document its own format accepts', () => {
    expect(parseInfoschematic(typescriptSeed, { format: 'typescript' }).ok).toBe(true)
    expect(parseInfoschematic(jsonSeed, { format: 'json' }).ok).toBe(true)
    expect(parseInfoschematic(yamlSeed, { format: 'yaml' }).ok).toBe(true)
  })

  it('renders a valid document as a preview image', () => {
    const parsed = parseInfoschematic(jsonSeed, { format: 'json' })
    const panel = renderToStaticMarkup(<Preview parsed={parsed} />)

    expect(parsed.ok).toBe(true)
    expect(panel).toContain('data:image/svg+xml')
    expect(panel).not.toContain('playground-issues')
  })

  it('shows path-addressed issues for a broken document', () => {
    const broken = jsonSeed.replace('"width": 800', '"width": "wide"')
    const parsed = parseInfoschematic(broken, { format: 'json' })
    const panel = renderToStaticMarkup(<Preview parsed={parsed} />)

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
