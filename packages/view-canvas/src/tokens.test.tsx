import { readFile } from 'node:fs/promises'
import { defineInfoschematic } from '@infoschematics/domain-core'
import { type PaintScheme, paintFor, visualTokens } from '@infoschematics/view-model/tokens'
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
const paintBlocks: readonly Readonly<{ after?: string; scheme: PaintScheme; selector: string }>[] = [
  { scheme: 'light', selector: ':root' },
  { after: '@media (prefers-color-scheme: dark)', scheme: 'dark', selector: '  :root' },
  { scheme: 'light', selector: '[data-infoschematic-scheme="light"]' },
  { scheme: 'dark', selector: '[data-infoschematic-scheme="dark"]' },
  { scheme: 'blueprint', selector: '.infoschematic-svg.surface-blueprint, [data-surface-treatment="blueprint"]' },
  { after: '@media print', scheme: 'light', selector: '  :root' }
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

    expect(cssValue(generated, '--infoschematic-canvas-paint-backdrop')).toBe(paintFor('light').backdrop)
    expect(cssValue(generated, '--infoschematic-canvas-flows-route-width')).toBe(
      String(visualTokens.canvas.flows.routeWidth)
    )
    expect(styles).toContain('stroke-width: var(--infoschematic-canvas-flows-route-width);')
    expect(styles).toContain('stroke-width: var(--infoschematic-canvas-geometry-grid-minor-stroke-width);')
    expect(styles).toContain('stroke-width: var(--infoschematic-canvas-geometry-grid-major-stroke-width);')
    /* One rule paints the paper, because a blueprint drawing redeclares the palette rather than the rule. */
    expect(styles).toContain('.infoschematic-backdrop {\n  fill: var(--infoschematic-canvas-paint-backdrop);')
    expect(styles).not.toContain('.surface-neutral .infoschematic-backdrop')
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
  it('declares every paint role in every scheme it offers', async () => {
    const generated = await readFile(new URL('../../view-model/src/tokens.generated.css', import.meta.url), 'utf8')
    const roleNames = [...declarationsIn(generated, ':root').keys()].sort()
    expect(roleNames.length).toBeGreaterThan(0)

    for (const { after, scheme, selector } of paintBlocks) {
      const declared = declarationsIn(generated, selector, after)
      expect([...declared.keys()].sort(), selector).toEqual(roleNames)

      const palette = paintFor(scheme)
      expect(declared.get('--infoschematic-canvas-paint-backdrop'), selector).toBe(palette.backdrop)
      expect(declared.get('--infoschematic-canvas-paint-artwork-glyph-fill'), selector).toBe(palette.artwork.glyphFill)
    }
  })

  /*
   * Paper is light whatever the screen was.
   *
   * The print block shares `:root`'s specificity with the reader's preference and a host's override, so source
   * order is the whole of what makes it win, and asserting its presence would not assert the behaviour. An
   * authored blueprint is not a scheme and keeps its own higher specificity, so printing one stays navy.
   */
  it('restores the light palette for paper, last so it outranks a resolved scheme', async () => {
    const generated = await readFile(new URL('../../view-model/src/tokens.generated.css', import.meta.url), 'utf8')
    const print = generated.indexOf('@media print')

    expect(print).toBeGreaterThan(generated.indexOf('@media (prefers-color-scheme: dark)'))
    expect(print).toBeGreaterThan(generated.indexOf('[data-infoschematic-scheme="dark"]'))
    expect(declarationsIn(generated, '  :root', '@media print').get('--infoschematic-canvas-paint-backdrop')).toBe(
      paintFor('light').backdrop
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

  it('keeps authored Scope, Flow-family and Region colours in rendered data', () => {
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

    expect(markup).toContain('fill="#abcdef"')
    expect(markup).toContain('stroke="#123456"')
    expect(markup).toContain('fill="#a12345"')
    expect(markup).toContain('fill="#c1d2e3"')
  })
})
