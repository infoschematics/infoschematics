import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { StaticInfoschematic } from './StaticInfoschematic.tsx'
import { specimenFor } from './visual-guide/specimens.ts'

const options = { annotations: true, visibility: { graphics: 'all' } } as const

describe('a static drawing placed in the page', () => {
  it('puts the renderer output in the document rather than behind an image reference', () => {
    const markup = renderToStaticMarkup(
      <StaticInfoschematic input={specimenFor('card')} options={options} resourceIdPrefix="one" />
    )

    expect(markup).toContain('<svg xmlns="http://www.w3.org/2000/svg"')
    expect(markup).not.toContain('data:image/svg+xml')
    expect(markup).not.toContain('<img')
    // The drawing keeps its authored proportions, so the box it is given can be measured rather than fitted into.
    expect(markup).toMatch(/viewBox="[\d. -]+"/)
  })

  /* Two drawings in one document share a namespace: SVG resolves `url(#…)` to the first match in document order,
     not the nearest, so without distinct prefixes the second drawing paints the first one's grid and arrowheads.
     An `img` never had this problem, because each reference was its own document — so it arrives with inlining. */
  it("keeps two drawings on one page out of the other's resources", () => {
    const page = renderToStaticMarkup(
      <>
        <StaticInfoschematic input={specimenFor('card')} options={options} resourceIdPrefix="first" />
        <StaticInfoschematic input={specimenFor('fabric')} options={options} resourceIdPrefix="second" />
      </>
    )

    const defined = [...page.matchAll(/<(?:marker|pattern)[^>]*\bid="([^"]+)"/g)].map((found) => found[1])
    const references = [...page.matchAll(/url\(#([^)"]+)\)/g)].map((found) => found[1])

    expect(defined.length).toBeGreaterThan(1)
    expect(new Set(defined).size).toBe(defined.length)
    expect(references.filter((reference) => !defined.includes(reference))).toEqual([])
    expect(defined.some((id) => id.startsWith('first-'))).toBe(true)
    expect(defined.some((id) => id.startsWith('second-'))).toBe(true)
  })

  it('names the whole drawing when asked, and stays out of the way when it is decoration', () => {
    const named = renderToStaticMarkup(
      <StaticInfoschematic input={specimenFor('card')} label="A labelled example" resourceIdPrefix="named" />
    )
    // Assistive technology does not descend into an image, so one name is announced rather than two.
    expect(named).toContain('aria-label="A labelled example"')
    expect(named).toContain('role="img"><svg')

    const decorative = renderToStaticMarkup(
      <StaticInfoschematic input={specimenFor('card')} label={null} resourceIdPrefix="decorative" />
    )
    expect(decorative).toContain('aria-hidden="true"')
    expect(decorative).not.toContain('aria-label=""')
    expect(decorative).not.toContain('role="img"><svg')

    // Left alone, the renderer's own name stands — the same name the live Canvas gives the same specimen.
    const unnamed = renderToStaticMarkup(<StaticInfoschematic input={specimenFor('card')} resourceIdPrefix="unnamed" />)
    expect(unnamed).not.toContain('aria-hidden')
    expect(unnamed).toContain('structural Infoschematic')
  })
})
