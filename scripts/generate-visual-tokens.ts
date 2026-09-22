#!/usr/bin/env bun
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  type PaintScheme,
  paintDeclarations,
  type VisualTokenValue,
  visualTokens
} from '../packages/view-model/src/tokens.ts'
import { type CliSpec, isDirectInvocation, runCli } from './cli.ts'

/**
 * How a palette reaches the drawing.
 *
 * `light` is declared on `:root` so a page that says nothing gets it, and the dark values are declared twice: once
 * behind `prefers-color-scheme`, which is the default path and needs no script at all, and once behind an attribute
 * a host sets when it has resolved the scheme itself. The attribute blocks come last and match the media query's
 * specificity, so source order is what lets a host override the reader's preference deliberately.
 *
 * `blueprint` is authored rather than resolved, so it sits on the drawing's own element with a higher specificity
 * than either. Custom properties inherit, so declaring it there paints that drawing and nothing around it.
 *
 * Paper is light whatever the screen was, so the print rule comes last and outranks both the reader's preference
 * and a host's override on equal specificity. An authored blueprint still outranks it: a treatment an author chose
 * is not a scheme somebody resolved.
 */
const paintSelectors: readonly Readonly<{ scheme: PaintScheme; selector: string; wrap?: string }>[] = [
  { scheme: 'dark', selector: ':root', wrap: '@media (prefers-color-scheme: dark)' },
  { scheme: 'light', selector: '[data-infoschematic-scheme="light"]' },
  { scheme: 'dark', selector: '[data-infoschematic-scheme="dark"]' },
  { scheme: 'blueprint', selector: '.infoschematic-svg.surface-blueprint, [data-surface-treatment="blueprint"]' },
  { scheme: 'light', selector: ':root', wrap: '@media print' }
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
      /* A palette is not one more branch of the tree: its roles are declared several times over, once per scheme,
         under names that carry no scheme at all. `paintEntries` reads them instead. */
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
export const paintEntries = (scheme: PaintScheme): readonly VisualTokenEntry[] =>
  /* Named by the manifest rather than by the tree walk, which skips `canvas.paint` by design: a static rendering
     carries these same declarations, and one spelling is the only thing that keeps the two resolving alike. */
  paintDeclarations(scheme).map(([cssName, value]) => ({
    cssName: cssName as `--infoschematic-${string}`,
    path: `canvas.paint.${scheme}.${cssName}`,
    value
  }))

/** Every scheme answers every role, or the stylesheet is not written. */
const paintRolesAgree = () => {
  const schemes = Object.keys(visualTokens.canvas.paint) as readonly PaintScheme[]
  const byScheme = schemes.map((scheme) => ({ names: paintEntries(scheme).map((entry) => entry.cssName), scheme }))
  const first = byScheme[0]
  if (!first) throw new Error('The visual token manifest declares no paint schemes.')

  for (const other of byScheme.slice(1)) {
    const missing = first.names.filter((name) => !other.names.includes(name))
    const extra = other.names.filter((name) => !first.names.includes(name))
    if (missing.length > 0 || extra.length > 0) {
      throw new Error(
        `Paint schemes disagree about their roles: ${other.scheme} is missing ${
          missing.join(', ') || 'nothing'
        } and adds ${extra.join(', ') || 'nothing'} against ${first.scheme}.`
      )
    }
  }

  return first.names.length
}

const block = (selector: string, entries: readonly VisualTokenEntry[], indent = '') => [
  `${indent}${selector} {`,
  ...entries.map((entry) => `${indent}  ${entry.cssName}: ${String(entry.value)};`),
  `${indent}}`
]

export const generateVisualTokenCss = (tokens: TokenTree = visualTokens): string => {
  paintRolesAgree()

  const lines = [
    '/* Generated by scripts/generate-visual-tokens.ts. Do not edit. */',
    ...block(':root', [...visualTokenEntries(tokens), ...paintEntries('light')])
  ]

  for (const { scheme, selector, wrap } of paintSelectors) {
    lines.push('')
    if (wrap === undefined) {
      lines.push(...block(selector, paintEntries(scheme)))
      continue
    }
    lines.push(`${wrap} {`, ...block(selector, paintEntries(scheme), '  '), '}')
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
    const roles = paintEntries('light').length
    const shape = `${count} declarations and ${roles} paint roles in ${Object.keys(visualTokens.canvas.paint).length} schemes`
    console.log(
      check
        ? `Visual tokens current: ${shape} in ${fileURLToPath(output)}`
        : `Visual tokens written: ${shape} to ${fileURLToPath(output)}`
    )
  })
}
