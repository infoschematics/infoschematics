/**
 * Each rendering names the SVG definitions it owns.
 *
 * A `marker` or `pattern` reference is resolved by document order, not by proximity, so two renderings
 * that share a page and an identifier both draw whichever definition came first. Every instance emitting
 * `infoschematic-grid-minor` is therefore not a naming inconvenience but a rendering defect: authored
 * appearance is right, the definitions are right, and the output is still wrong.
 *
 * These are the unit-level guarantees. That the collision actually changes what is *drawn* is proved in
 * `InfoschematicDiagram.host.browser.test.tsx`, because it needs a real document to resolve references in.
 */
import { defineInfoschematic } from '@infoschematics/domain-core'
import { svgResourcePrefix } from '@infoschematics/view-model/resources'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Canvas } from './Canvas.tsx'

const config = (title: string) =>
  defineInfoschematic({ title, infoschematic: { appearance: { grid: 'major-plus-minor' } } })

/** Every `pattern` identifier in the order it was emitted. Each Canvas defines four, dormant ones included. */
const patternIds = (markup: string) => [...markup.matchAll(/<pattern[^>]*\bid="([^"]+)"/g)].map((found) => found[1])

describe('renderer definition identity', () => {
  it('gives two Canvases in one tree disjoint definition identifiers', () => {
    const markup = renderToStaticMarkup(
      <>
        <Canvas config={config('First')} />
        <Canvas config={config('Second')} />
      </>
    )

    const ids = patternIds(markup)
    expect(ids).toHaveLength(8)

    // The two instances emit their four patterns in the same order, so the halves are the instances.
    const first = ids.slice(0, 4)
    const second = ids.slice(4)
    expect(first.filter((id) => second.includes(id))).toEqual([])

    // Each half must be one prefix applied to the four treatments, not four unrelated names.
    const prefixes = [...new Set(ids.map((id) => id.replace(/-grid-.*$/, '')))]
    expect(prefixes).toHaveLength(2)

    // The default comes from `useId`, whose composition is a React implementation detail rather than a
    // promise to us: an underscore, then letters, digits and underscores. Asserted rather than relied on,
    // so a React release that reintroduced the colons of its 18 series fails here instead of in a host.
    for (const prefix of prefixes) {
      expect(prefix).toMatch(/^_[A-Za-z0-9_]*$/)
      expect(svgResourcePrefix(undefined, prefix)).toBe(prefix)
    }
  })

  it('keeps every reference resolvable inside the rendering that made it', () => {
    const markup = renderToStaticMarkup(<Canvas config={config('Closed loop')} grid mode="design" />)

    const defined = new Set([...markup.matchAll(/<(?:marker|pattern)[^>]*\bid="([^"]+)"/g)].map((f) => f[1]))
    const references = [...markup.matchAll(/url\(#([^)"]+)\)/g)].map((found) => found[1])

    expect(references.length).toBeGreaterThan(0)
    expect(references.filter((reference) => !defined.has(reference))).toEqual([])
  })

  it('lets a host name a rendering that React cannot see the other half of, and refuses an unusable name', () => {
    // Two independent render passes cannot see each other, so both take the same `useId` value by design.
    // That is the one case an unconfigured host is not covered for, and the prop is its escape hatch.
    const separate = config('Separate pass')
    expect(renderToStaticMarkup(<Canvas config={separate} />)).toEqual(
      renderToStaticMarkup(<Canvas config={separate} />)
    )

    const named = renderToStaticMarkup(<Canvas config={separate} resourceIdPrefix="page-one" />)
    expect(named).toContain('id="page-one-grid-minor"')
    expect(named).toContain('url(#page-one-grid-major-plus-minor)')
    expect(patternIds(named).every((id) => id.startsWith('page-one-'))).toBe(true)

    expect(() => renderToStaticMarkup(<Canvas config={separate} resourceIdPrefix="unsafe prefix" />)).toThrow(TypeError)
  })
})
