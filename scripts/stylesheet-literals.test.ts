import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { chromeDeclarations, paintDeclarations } from '../packages/view-model/src/tokens.ts'

/**
 * Whether a stylesheet still chooses its own colours.
 *
 * A colour written into a stylesheet cannot follow a reader's preference, and the chrome was un-switchable for
 * exactly that reason: 542 literals across four files, 158 of them distinct, with no variable layer beneath them to
 * swap. Once the layer exists nothing stops a literal returning — a quick fix, a copied rule, a colour picker — and it returns silently,
 * because a hard-coded colour looks perfectly correct in whichever scheme it was picked in.
 *
 * So this states a floor rather than counting what happens to be here: zero, and it fails when one comes back.
 */
const stylesheets = [
  'apps/site/src/styles.css',
  'packages/view-canvas/src/styles.css',
  'packages/view-present/src/styles.css',
  'packages/view-studio/src/styles.css'
] as const

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

/**
 * What counts as choosing a colour.
 *
 * The hex and function forms are the obvious ones. The named forms are not, and they are the reason this check
 * nearly shipped with a hole in it: twenty-two `color: white` declarations sat in the chrome, invisible to a pattern
 * looking for `#`, and every one of them was a bug rather than a survivor — white type on the light scheme's pale
 * selected wash is unreadable, so the scheme that could not be tested was also the scheme that was wrong.
 *
 * `transparent` and `currentColor` are deliberately absent: neither names a colour, they name the absence of one
 * and the inheritance of one.
 */
const named =
  'white|black|red|green|blue|gr[ae]y|orange|yellow|purple|pink|cyan|magenta|silver|gold|navy|teal|olive|maroon|lime|aqua|fuchsia'
const colour = new RegExp(`#[0-9a-fA-F]{3,8}\\b|\\brgba?\\(|\\bhsla?\\(|\\b(?:${named})\\b`, 'g')

/**
 * A comment is not a declaration.
 *
 * The stylesheets explain themselves at length — an eyebrow "green set in caps", a dismissal that "turns red on
 * approach" — and a named-colour pattern reads those as paint. Comments are blanked rather than removed so the line
 * a real literal is reported on is still the line it is on.
 */
const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '))

/**
 * A mask is not a colour.
 *
 * `mask-image: linear-gradient(to bottom, #000 …)` names opacity, not paint: the gradient's stops say which pixels
 * survive, and a role there would resolve to a colour whose alpha is the only part that matters. Those declarations
 * are excluded by property rather than by pattern, so a genuine colour cannot hide behind the exemption.
 */
/**
 * A mask is not a colour.
 *
 * `mask-image: linear-gradient(to bottom, #000 …)` names opacity, not paint: the gradient's stops say which pixels
 * survive, and a role there would resolve to a colour whose alpha is the only part that matters. Those declarations
 * are excluded by property rather than by pattern, so a genuine colour cannot hide behind the exemption.
 */
const masked = /^-?(?:webkit-)?mask-image$/

/**
 * Every declaration in a stylesheet, with the line it starts on.
 *
 * Splitting on lines is the obvious approach and it is wrong in both directions. A selector list runs across
 * several lines — `.brand-mark__node--green,` sits on its own line with its brace on the next — and a value does
 * too, because `box-shadow` takes a comma-separated list that is conventionally broken up. So this tracks the
 * delimiters instead: text ending at `{` was a selector and is discarded, text ending at `;` or `}` was a
 * declaration and is kept. That is the same rule a parser uses, and it is the only one that cannot be fooled by
 * where the newlines happen to fall.
 */
const declarations = (css: string) => {
  const found: { line: number; property: string; value: string }[] = []
  let pending = ''
  let line = 1
  let at = 1

  const take = () => {
    const colon = pending.indexOf(':')
    if (colon > 0) found.push({ line: at, property: pending.slice(0, colon).trim(), value: pending.slice(colon + 1) })
    pending = ''
  }

  for (const character of css) {
    if (character === '\n') line += 1
    if (character === '{') {
      pending = ''
      at = line
    } else if (character === ';' || character === '}') {
      take()
      at = line
    } else {
      if (pending.trim() === '') at = line
      pending += character
    }
  }

  return found
}

const literalsIn = (css: string) =>
  declarations(withoutComments(css))
    .filter(({ property }) => !masked.test(property))
    .flatMap(({ line, value }) => [...value.matchAll(colour)].map((match) => ({ line, literal: match[0] })))

const literalsOf = (path: string) => literalsIn(source(path))

const references = (path: string) => [
  ...new Set([...source(path).matchAll(/var\((--infoschematic-[a-z0-9-]+)/g)].map((found) => found[1] as string))
]

describe('stylesheet colour literals', () => {
  /* The check's own coverage: a glob that matched nothing, or a file that lost its role references, would pass
     every assertion below while measuring nothing at all. The per-file floor is low because Present's chrome is
     genuinely small — a title, a progress rail, two controls — so the union carries the real claim: between them
     these four stylesheets reach most of the role set, and a rewrite that collapsed them onto a handful of
     variables would fail here rather than quietly pass the literal count. */
  it('reads four stylesheets that reference the role layer', () => {
    expect(stylesheets).toHaveLength(4)
    for (const path of stylesheets) {
      expect(source(path).length, path).toBeGreaterThan(1000)
      expect(references(path).length, path).toBeGreaterThan(10)
    }
    expect(new Set(stylesheets.flatMap(references)).size).toBeGreaterThan(60)
  })

  /* The other half of the check's own coverage, and the half the four cases below cannot supply: they assert an
     empty list, which is exactly what a scanner that had stopped recognising colours would also return. This one
     hands it colours and demands it find them, and hands it the four things that look like colours and are not. */
  it('finds a colour a stylesheet chose, and only that', () => {
    const found = literalsIn(`/* An eyebrow green set in caps, and a dismissal that turns red on approach. */
.brand-mark__node--green,
.panel[data-tone="blue"] {
  background: #1b7ec4;
  border-color: var(--infoschematic-chrome-paint-border);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.4),
    0 0 0 1px currentColor;
  color: white;
  fill: transparent;
  mask-image: linear-gradient(to bottom, #000 80%, rgba(0, 0, 0, 0) 100%);
  white-space: nowrap;
}

@media (prefers-color-scheme: dark) {
  .panel {
    outline-color: hsl(200 50% 40%);
  }
}`)

    /* The line is where the declaration starts, not where the literal sits inside it — `box-shadow` opens on 6 and
       its `rgba(` lands on 7. That is the line a maintainer would look for the declaration on. */
    expect(found).toEqual([
      { line: 4, literal: '#1b7ec4' },
      { line: 6, literal: 'rgba(' },
      { line: 9, literal: 'white' },
      { line: 17, literal: 'hsl(' }
    ])
  })

  for (const path of stylesheets) {
    it(`leaves no colour of its own in ${path}`, () => {
      expect(literalsOf(path)).toEqual([])
    })
  }

  it('references only roles the generated stylesheet declares', () => {
    const declared = new Set([
      ...paintDeclarations('light').map(([name]) => name),
      ...chromeDeclarations('light').map(([name]) => name)
    ])
    /* Names the manifest writes outside the palettes — geometry, metrics, type — and the per-mount selection
       properties Canvas sets itself, both of which are declared elsewhere and are not roles. */
    const elsewhere = /^--infoschematic-canvas-(?!paint-)/

    for (const path of stylesheets) {
      const unresolved = references(path).filter((name) => !declared.has(name) && !elsewhere.test(name))
      expect(unresolved, path).toEqual([])
    }
  })
})
