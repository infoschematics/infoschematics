#!/usr/bin/env bun
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  type ChromeScheme,
  chromeDeclarations,
  type PaintMode,
  type PaintStyle,
  paintDeclarations,
  type VisualTokenValue,
  visualTokens
} from '../packages/view-model/src/tokens.ts'
import { type CliSpec, isDirectInvocation, runCli } from './cli.ts'

/**
 * How a palette reaches the drawing.
 *
 * Two questions are answered separately here, and the selectors are the proof that they are separate. A style is
 * authored — it says what the drawing is — and a mode is resolved from the reader's ground. Every style therefore has
 * to be emitted against every mode, which is why this is a matrix rather than a list.
 *
 * The plain style is declared on `:root` so a page that says nothing gets its light realisation, and its dark values
 * are declared twice: once behind `prefers-color-scheme`, which is the default path and needs no script at all, and
 * once behind an attribute a host sets when it has resolved the mode itself. The attribute blocks come last and match
 * the media query's specificity, so source order is what lets a host override the reader's preference deliberately.
 *
 * Blueprint sits on the drawing's own element, so it outranks both on specificity and paints that drawing without
 * touching anything around it. It used to stop there, as a single pinned palette. It no longer does: the same three
 * paths repeat for it, nested under the mode selectors, because nesting raises specificity in step and keeps the
 * override order intact within the style. An author choosing blueprint chooses a treatment, not a ground.
 *
 * Paper is light whatever the screen was, so the print rules come last. The neutral one outranks the attribute blocks
 * on equal specificity by order; the blueprint one has to repeat every path blueprint can have arrived by, because a
 * nested selector cannot be out-ranked by an unnested one however late it is written.
 */
/** The two ways a drawing says it is a blueprint: the Canvas class, and the attribute both renderers write. */
const blueprintSelector = '.infoschematic-svg.style-blueprint, [data-infoschematic-style="blueprint"]'

/**
 * The same blueprint selector under a resolved mode, which is what makes a style follow its reader.
 *
 * A descendant combinator is not decoration here. The mode lands on the document element and the style lands on the
 * drawing, so the only way to name the pair is to nest them — and nesting raises specificity, which is exactly what
 * makes a host's resolved mode outrank the unqualified default below it.
 */
const under = (prefix: string, selector: string) =>
  selector
    .split(', ')
    .map((one) => `${prefix} ${one}`)
    .join(', ')

const blueprintUnderLight = under('[data-infoschematic-scheme="light"]', blueprintSelector)
const blueprintUnderDark = under('[data-infoschematic-scheme="dark"]', blueprintSelector)

const paintSelectors: readonly Readonly<{
  mode: PaintMode
  selector: string
  style: PaintStyle
  wrap?: string
}>[] = [
  { mode: 'light', selector: blueprintSelector, style: 'blueprint' },
  { mode: 'dark', selector: ':root', style: 'neutral', wrap: '@media (prefers-color-scheme: dark)' },
  { mode: 'dark', selector: blueprintSelector, style: 'blueprint', wrap: '@media (prefers-color-scheme: dark)' },
  { mode: 'light', selector: '[data-infoschematic-scheme="light"]', style: 'neutral' },
  { mode: 'dark', selector: '[data-infoschematic-scheme="dark"]', style: 'neutral' },
  { mode: 'light', selector: blueprintUnderLight, style: 'blueprint' },
  { mode: 'dark', selector: blueprintUnderDark, style: 'blueprint' },
  { mode: 'light', selector: ':root', style: 'neutral', wrap: '@media print' },
  {
    mode: 'light',
    /* Every path a blueprint can have been painted by, so print ties the mode-qualified rules and wins on order. */
    selector: [blueprintSelector, blueprintUnderLight, blueprintUnderDark].join(', '),
    style: 'blueprint',
    wrap: '@media print'
  }
]

export type VisualTokenEntry = Readonly<{
  cssName: `--infoschematic-${string}`
  path: string
  value: VisualTokenValue
}>

export interface TokenTree {
  readonly [key: string]: TokenTree | VisualTokenValue
}

const cssSegment = (segment: string) =>
  segment
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

/** Flatten and validate a token tree in deterministic CSS-name order. */
export const visualTokenEntries = (tokens: TokenTree = visualTokens): readonly VisualTokenEntry[] => {
  const entries: VisualTokenEntry[] = []

  const visit = (tree: TokenTree, parent: readonly string[]) => {
    for (const [key, value] of Object.entries(tree)) {
      const path = [...parent, key]
      /* A palette is not one more branch of the tree: its roles are declared several times over, once per style and
         ground, under names that carry neither. `paintEntries` reads them instead. */
      if (key === 'paint' && parent.length === 1) continue
      if (typeof value === 'object' && value !== null) {
        visit(value, path)
        continue
      }

      const segments = path.map(cssSegment)
      if (segments.some((segment) => segment.length === 0)) {
        throw new Error(`Visual token path cannot produce an empty CSS segment: ${path.join('.')}`)
      }

      entries.push({
        cssName: `--infoschematic-${segments.join('-')}`,
        path: path.join('.'),
        value
      })
    }
  }

  visit(tokens, [])
  entries.sort((left, right) => (left.cssName < right.cssName ? -1 : left.cssName > right.cssName ? 1 : 0))

  const pathsByName = new Map<string, string>()
  for (const entry of entries) {
    const firstPath = pathsByName.get(entry.cssName)
    if (firstPath) {
      throw new Error(`Visual token CSS name collision for ${entry.cssName}: ${firstPath}, ${entry.path}`)
    }
    pathsByName.set(entry.cssName, entry.path)
  }

  return Object.freeze(entries.map((entry) => Object.freeze(entry)))
}

/**
 * One scheme's paint roles as CSS declarations, under names that do not say which scheme they came from.
 *
 * Every scheme therefore writes the same names, which is what lets a second block redefine the first. It is also
 * why the roles have to agree: a name declared by one scheme and not another would resolve to whatever an earlier
 * block happened to leave behind, and the drawing would be half one palette.
 */
export const paintEntries = (style: PaintStyle, mode: PaintMode): readonly VisualTokenEntry[] =>
  /* Named by the manifest rather than by the tree walk, which skips `canvas.paint` by design: a static rendering
     carries these same declarations, and one spelling is the only thing that keeps the two resolving alike. */
  paintDeclarations(style, mode).map(([cssName, value]) => ({
    cssName: cssName as `--infoschematic-${string}`,
    path: `canvas.paint.${style}.${mode}.${cssName}`,
    value
  }))

/**
 * One scheme's chrome roles, declared under the same names by every scheme for the same reason the paint roles are.
 *
 * Blueprint has no entry here. It is an authored treatment of a drawing, and it does not repaint the interface
 * around that drawing, so the blueprint block below redeclares the paint roles and leaves the chrome as the reader
 * resolved it.
 */
export const chromeEntries = (scheme: ChromeScheme): readonly VisualTokenEntry[] =>
  chromeDeclarations(scheme).map(([cssName, value]) => ({
    cssName: cssName as `--infoschematic-${string}`,
    path: `chrome.paint.${scheme}.${cssName}`,
    value
  }))

/** The same agreement, held for the chrome: a role one scheme omits resolves to the other scheme's value. */
const chromeRolesAgree = () => {
  const schemes = Object.keys(visualTokens.chrome.paint) as readonly ChromeScheme[]
  const byScheme = schemes.map((scheme) => ({ names: chromeEntries(scheme).map((entry) => entry.cssName), scheme }))
  const first = byScheme[0]
  if (!first) throw new Error('The visual token manifest declares no chrome schemes.')

  for (const other of byScheme.slice(1)) {
    const missing = first.names.filter((name) => !other.names.includes(name))
    const extra = other.names.filter((name) => !first.names.includes(name))
    if (missing.length > 0 || extra.length > 0) {
      throw new Error(
        `Chrome schemes disagree about their roles: ${other.scheme} is missing ${
          missing.join(', ') || 'nothing'
        } and adds ${extra.join(', ') || 'nothing'} against ${first.scheme}.`
      )
    }
  }

  return first.names.length
}

/**
 * Every style answers every role on every ground, or the stylesheet is not written.
 *
 * The comparison is over the whole matrix rather than a list of palettes, because splitting the axes added a way for
 * this to fail that a flat check could not see: a style that answers every role on one ground and not the other is
 * complete by any per-palette measure and still paints half a drawing the moment its reader switches.
 */
const paintRolesAgree = () => {
  const styles = Object.keys(visualTokens.canvas.paint) as readonly PaintStyle[]
  const first = styles[0]
  if (!first) throw new Error('The visual token manifest declares no paint styles.')

  const modesOf = (style: PaintStyle) => Object.keys(visualTokens.canvas.paint[style]) as readonly PaintMode[]
  const byPalette = styles.flatMap((style) =>
    modesOf(style).map((mode) => ({ mode, names: paintEntries(style, mode).map((entry) => entry.cssName), style }))
  )

  const reference = byPalette[0]
  if (!reference) throw new Error('The visual token manifest declares no paint modes.')

  for (const other of byPalette.slice(1)) {
    const missing = reference.names.filter((name) => !other.names.includes(name))
    const extra = other.names.filter((name) => !reference.names.includes(name))
    if (missing.length > 0 || extra.length > 0) {
      throw new Error(
        `Paint palettes disagree about their roles: ${other.style}.${other.mode} is missing ${
          missing.join(', ') || 'nothing'
        } and adds ${extra.join(', ') || 'nothing'} against ${reference.style}.${reference.mode}.`
      )
    }
  }

  /* A style that answers no ground at all would pass the comparison above by never entering it. */
  for (const style of styles) {
    const modes = modesOf(style)
    if (!modes.includes('dark') || !modes.includes('light')) {
      throw new Error(`Paint style ${style} does not answer both grounds: it declares ${modes.join(', ') || 'none'}.`)
    }
  }

  return reference.names.length
}

const block = (selector: string, entries: readonly VisualTokenEntry[], indent = '') => [
  `${indent}${selector} {`,
  ...entries.map((entry) => `${indent}  ${entry.cssName}: ${String(entry.value)};`),
  `${indent}}`
]

/* A blueprint drawing does not repaint the interface around it, so only the plain style carries chrome. */
const entriesFor = (style: PaintStyle, mode: PaintMode): readonly VisualTokenEntry[] =>
  style === 'blueprint' ? paintEntries(style, mode) : [...paintEntries(style, mode), ...chromeEntries(mode)]

export const generateVisualTokenCss = (tokens: TokenTree = visualTokens): string => {
  paintRolesAgree()
  chromeRolesAgree()

  const lines = [
    '/* Generated by scripts/generate-visual-tokens.ts. Do not edit. */',
    ...block(':root', [...visualTokenEntries(tokens), ...entriesFor('neutral', 'light')])
  ]

  for (const { mode, selector, style, wrap } of paintSelectors) {
    lines.push('')
    if (wrap === undefined) {
      lines.push(...block(selector, entriesFor(style, mode)))
      continue
    }
    lines.push(`${wrap} {`, ...block(selector, entriesFor(style, mode), '  '), '}')
  }

  return `${lines.join('\n')}\n`
}

export const generatedVisualTokensUrl = new URL('../packages/view-model/src/tokens.generated.css', import.meta.url)

export const generateVisualTokens = async ({
  check = false,
  output = generatedVisualTokensUrl
}: {
  check?: boolean
  output?: URL
} = {}): Promise<void> => {
  const expected = generateVisualTokenCss()

  if (check) {
    const actual = await readFile(output, 'utf8').catch(() => undefined)
    if (actual !== expected) {
      throw new Error(
        `Generated visual tokens are stale: ${fileURLToPath(output)}. Run scripts/generate-visual-tokens.ts.`
      )
    }
    return
  }

  await writeFile(output, expected)
}

export const spec: CliSpec = {
  describe: 'Generate the CSS custom properties that mirror the view model\u2019s visual tokens.',
  flags: {
    check: { describe: 'Verify the generated file is current instead of writing it.', kind: 'boolean' },
    out: {
      describe: 'Generated CSS pathname. Defaults to the view model\u2019s tokens.',
      kind: 'string',
      value: 'path'
    }
  },
  run: 'self:tokens:generate',
  script: 'scripts/generate-visual-tokens.ts'
}

if (isDirectInvocation(import.meta.url)) {
  await runCli(spec, async (parsed) => {
    const out = parsed.string('out')
    const output = out ? pathToFileURL(resolve(out)) : generatedVisualTokensUrl
    const check = parsed.boolean('check')

    await generateVisualTokens({ check, output })
    const count = visualTokenEntries().length
    const roles = paintEntries('neutral', 'light').length
    const chrome = chromeEntries('light').length
    const styles = Object.keys(visualTokens.canvas.paint).length
    const shape = `${count} declarations, ${roles} paint roles across ${styles} styles on 2 grounds, and ${chrome} chrome roles in ${Object.keys(visualTokens.chrome.paint).length}`
    console.log(
      check
        ? `Visual tokens current: ${shape} in ${fileURLToPath(output)}`
        : `Visual tokens written: ${shape} to ${fileURLToPath(output)}`
    )
  })
}
