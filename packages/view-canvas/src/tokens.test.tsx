import { readFile } from 'node:fs/promises'
import { defineInfoschematic } from '@infoschematics/domain-core'
import { resolveAuthoredColour } from '@infoschematics/view-model/colour'
import { type PaintMode, type PaintStyle, paintFor, visualTokens } from '@infoschematics/view-model/tokens'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Canvas } from './Canvas.tsx'

const cssValue = (css: string, name: string) => css.match(new RegExp(`${name}: ([^;]+);`))?.[1]

/**
 * The declarations one selector's block makes, keyed by custom property.
 *
 * A palette reaches a drawing by redeclaring the same names in a later block, so reading the stylesheet as one flat
 * list cannot tell a role every scheme answers from a role only the first block declared — the flat read finds the
 * name either way. Blocks are read separately for that reason.
 */
const declarationsIn = (css: string, selector: string, after = '') => {
  const from = after ? css.indexOf(after) : 0
  if (from < 0) throw new Error(`the generated stylesheet has no ${after}`)
  const opened = css.indexOf(`${selector} {`, from)
  if (opened < 0) throw new Error(`the generated stylesheet has no block for ${selector}`)
  const body = css.slice(opened, css.indexOf('\n}', opened))
  return new Map(
    [...body.matchAll(/(--infoschematic-canvas-paint-[a-z-]+): ([^;]+);/g)].map(([, name, value]) => [name, value])
  )
}

/**
 * Where each palette is declared. `:root` carries the one a page that says nothing gets.
 *
 * Two blocks have the same selector and are told apart by what precedes them, because the media rule they sit in
 * is the whole difference between them: one answers a reader who prefers dark, the other answers paper.
 */
const blueprintSelector = '.infoschematic-svg.style-blueprint, [data-infoschematic-style="blueprint"]'
const under = (prefix: string) =>
  blueprintSelector
    .split(', ')
    .map((one) => `${prefix} ${one}`)
    .join(', ')

const paintBlocks: readonly Readonly<{
  after?: string
  mode: PaintMode
  selector: string
  style: PaintStyle
}>[] = [
  { mode: 'light', selector: ':root', style: 'neutral' },
  { mode: 'light', selector: blueprintSelector, style: 'blueprint' },
  { after: '@media (prefers-color-scheme: dark)', mode: 'dark', selector: '  :root', style: 'neutral' },
  {
    after: '@media (prefers-color-scheme: dark)',
    mode: 'dark',
    selector: `  ${blueprintSelector}`,
    style: 'blueprint'
  },
  { mode: 'light', selector: '[data-infoschematic-scheme="light"]', style: 'neutral' },
  { mode: 'dark', selector: '[data-infoschematic-scheme="dark"]', style: 'neutral' },
  { mode: 'light', selector: under('[data-infoschematic-scheme="light"]'), style: 'blueprint' },
  { mode: 'dark', selector: under('[data-infoschematic-scheme="dark"]'), style: 'blueprint' },
  { after: '@media print', mode: 'light', selector: '  :root', style: 'neutral' }
]

/**
 * The prefix this rendering gave the definitions it owns, read back off its own markup.
 *
 * The identifiers are per-mount by design, so a suite that named one literally would be asserting the
 * default generator rather than the treatment. Reading the prefix back keeps the assertion about the
 * pattern while leaving what it is called to the renderer.
 */
const resourcePrefixOf = (markup: string) => {
  const found = markup.match(/id="([^"]*)-grid-minor"/)
  if (!found?.[1]) throw new Error('the rendered markup defines no prefixed minor grid pattern')
  return found[1]
}

describe('Canvas visual tokens', () => {
  it('consumes only generated custom properties for shared CSS decisions', async () => {
    const styles = await readFile(new URL('./styles.css', import.meta.url), 'utf8')
    const generated = await readFile(new URL('../../view-model/src/tokens.generated.css', import.meta.url), 'utf8')

    expect(styles).toContain('@import "@infoschematics/view-model/tokens.css";')

    const references = [...styles.matchAll(/var\((--infoschematic-canvas-[a-z-]+)\)/g)].map(([, name]) => name)
    expect(references.length).toBeGreaterThan(0)
    for (const name of references) expect(cssValue(generated, name)).toBeDefined()

    expect(cssValue(generated, '--infoschematic-canvas-paint-backdrop')).toBe(paintFor('neutral', 'light').backdrop)
    expect(cssValue(generated, '--infoschematic-canvas-flows-route-width')).toBe(
      String(visualTokens.canvas.flows.routeWidth)
    )
    expect(styles).toContain('stroke-width: var(--infoschematic-canvas-flows-route-width);')
    expect(styles).toContain('stroke-width: var(--infoschematic-canvas-geometry-grid-minor-stroke-width);')
    expect(styles).toContain('stroke-width: var(--infoschematic-canvas-geometry-grid-major-stroke-width);')
    /* One rule paints the paper, because a blueprint drawing redeclares the palette rather than the rule. */
    expect(styles).toContain('.infoschematic-backdrop {\n  fill: var(--infoschematic-canvas-paint-backdrop);')
    expect(styles).not.toContain('.style-neutral .infoschematic-backdrop')
    expect(styles).toContain('stroke-dasharray: var(--infoschematic-canvas-metrics-region-dash);')
    expect(styles).toContain('stroke-dasharray: var(--infoschematic-canvas-metrics-region-dot);')
  })

  /*
   * Every block declares every role.
   *
   * The names carry no scheme, so a role one palette declares and another does not resolves to whatever an earlier
   * block left behind: the drawing is then half one palette and half the other, under a preference no default page
   * expresses. That is the failure mode this case exists to catch, and nothing about a single rendering shows it.
   */
  it('declares every paint role in every style on every ground it offers', async () => {
    const generated = await readFile(new URL('../../view-model/src/tokens.generated.css', import.meta.url), 'utf8')
    const roleNames = [...declarationsIn(generated, ':root').keys()].sort()
    expect(roleNames.length).toBeGreaterThan(0)

    for (const { after, mode, selector, style } of paintBlocks) {
      const declared = declarationsIn(generated, selector, after)
      /* Only the plain style carries the chrome, so a blueprint block answers the paint roles and no more. */
      const expected =
        style === 'blueprint' ? roleNames.filter((name) => !name.startsWith('--infoschematic-chrome')) : roleNames
      expect([...declared.keys()].sort(), selector).toEqual(expected)

      const palette = paintFor(style, mode)
      expect(declared.get('--infoschematic-canvas-paint-backdrop'), selector).toBe(palette.backdrop)
      expect(declared.get('--infoschematic-canvas-paint-artwork-glyph-fill'), selector).toBe(palette.artwork.glyphFill)
    }
  })

  /*
   * Paper is light whatever the screen was.
   *
   * The print block shares `:root`'s specificity with the reader's preference and a host's override, so source
   * order is the whole of what makes it win, and asserting its presence would not assert the behaviour. An
   * An authored blueprint keeps its own higher specificity on every path it can have been painted by, which is why
   * the print block repeats them: a nested selector cannot be outranked by an unnested one however late it is written.
   */
  it('restores the light palette for paper, last so it outranks a resolved scheme', async () => {
    const generated = await readFile(new URL('../../view-model/src/tokens.generated.css', import.meta.url), 'utf8')
    const print = generated.indexOf('@media print')

    expect(print).toBeGreaterThan(generated.indexOf('@media (prefers-color-scheme: dark)'))
    expect(print).toBeGreaterThan(generated.indexOf('[data-infoschematic-scheme="dark"]'))
    expect(declarationsIn(generated, '  :root', '@media print').get('--infoschematic-canvas-paint-backdrop')).toBe(
      paintFor('neutral', 'light').backdrop
    )
  })

  it('uses the manifest for component and editing-grid geometry', async () => {
    const source = await readFile(new URL('./InfoschematicDiagram.tsx', import.meta.url), 'utf8')
    const markup = renderToStaticMarkup(
      <Canvas config={defineInfoschematic({ title: 'Token geometry' })} grid editor="design" />
    )

    expect(source).toMatch(/}\s*=\s*visualTokens\.canvas\.geometry/)
    expect(source).not.toMatch(
      /const (?:addReach|attachmentReach|cornerRadius|dragThreshold|gridMajorSize|gridSize) = \d/
    )
    const prefix = resourcePrefixOf(markup)
    expect(markup).toContain(`<pattern height="${visualTokens.canvas.geometry.gridSize}" id="${prefix}-grid-minor"`)
    expect(markup).toContain(
      `<pattern height="${visualTokens.canvas.geometry.gridMajorSize}" id="${prefix}-grid-major"`
    )
  })

  /*
   * An authored colour reaches the drawing as a seed, and the author keeps a way to say they meant a literal.
   *
   * `ADR-INFOSCHEMATICS-037` held that resolving a ground must never repaint an authored colour, and that held for
   * exactly as long as there was one ground to be on. A blue chosen against navy is a different colour on paper, and
   * the author wrote one value: they are not in a position to have meant both. So the hue, the saturation and the
   * ordering among their own colours are theirs, and the band the lightness sits in belongs to the ground. An author
   * who did mean the literal ends the value with `!` and gets it back untouched.
   */
  it('realises authored Scope, Flow-family and Region colours on the ground, and honours a pin', () => {
    const markup = renderToStaticMarkup(
      <Canvas
        config={defineInfoschematic({
          title: 'Authored colours',
          infoschematic: {
            cards: [
              {
                code: 'SCP-001',
                detail: 'Authored data',
                id: 'card',
                label: 'Card',
                placement: {
                  box: { height: 60, width: 120, x: 20, y: 30 },
                  ports: {}
                },
                scope: 'scope',
                scopes: ['scope']
              }
            ],
            flowFamilies: [
              {
                color: '#a12345',
                description: 'Authored family',
                id: 'family',
                label: 'Family',
                prefix: 'FAM'
              }
            ],
            regions: [
              {
                box: { height: 120, radius: 8, width: 180, x: 0, y: 0 },
                fill: '#c1d2e3',
                id: 'region',
                label: 'Region'
              }
            ],
            scopes: [
              {
                color: '#123456',
                description: 'Authored scope',
                fill: '#abcdef',
                id: 'scope',
                label: 'Scope',
                prefix: 'SCP'
              }
            ]
          }
        })}
      />
    )

    /* Canvas resolves a ground for the interface, and the drawing is now painted against the same one. */
    expect(markup).toContain(`fill="${resolveAuthoredColour('#abcdef', 'light', 'fill')}"`)
    expect(markup).toContain(`stroke="${resolveAuthoredColour('#123456', 'light', 'ink')}"`)
    expect(markup).toContain(`fill="${resolveAuthoredColour('#a12345', 'light', 'ink')}"`)
    expect(markup).toContain(`fill="${resolveAuthoredColour('#c1d2e3', 'light', 'ground')}"`)

    // None of the literals survives, which is the half of this a realisation assertion alone would not catch.
    for (const literal of ['#abcdef', '#123456', '#a12345', '#c1d2e3']) {
      expect(markup, literal).not.toContain(`"${literal}"`)
    }
  })

  it('draws a pinned authored colour exactly as it was written', () => {
    const markup = renderToStaticMarkup(
      <Canvas
        config={defineInfoschematic({
          title: 'Pinned colours',
          infoschematic: {
            regions: [
              {
                box: { height: 120, radius: 8, width: 180, x: 0, y: 0 },
                fill: '#c1d2e3!',
                id: 'region',
                label: 'Region'
              }
            ]
          }
        })}
      />
    )

    /* The pin is a suffix rather than a companion field: every authored colour is already a string in a position
       that exists, and a parallel boolean beside each one would widen the contract in six places to say something
       about a value rather than about the thing carrying it. A trailing `!` cannot appear in a valid colour. */
    expect(markup).toContain('#c1d2e3')
    expect(markup).not.toContain('#c1d2e3!')
    expect(markup).not.toContain(resolveAuthoredColour('#c1d2e3', 'light', 'ground'))
  })
})
