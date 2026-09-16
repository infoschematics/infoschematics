/**
 * No stylesheet in the view stack redeclares what it already imports.
 *
 * Studio's stylesheet imports Present's, which imports Canvas's, which imports the generated visual tokens. That chain
 * is what lets a treatment be written once in Canvas and reach every surface. A selector declared again downstream
 * breaks it silently and in both directions: the copy wins the cascade, so a Canvas change stops arriving, and the copy
 * is written with literal colours, so a token change stops arriving too. A held-group treatment was written in Canvas,
 * reached the element, passed the whole suite, and was still not drawn — and Studio's copy of the Design grid pointed
 * at a pattern no renderer defines, so the grid stopped being painted at all with nothing turning red.
 *
 * Specificity is not the safeguard: a combinator adds none, so `.card rect` downstream silently overrides `.card > rect`
 * upstream while looking like a different rule. Selectors are compared with combinators flattened for that reason, and
 * one at a time rather than as authored lists, because reordering a list of six changes the text and nothing else.
 */
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

/** Each stylesheet paired with the ones its import chain already gives it. */
const chain = [
  { imports: [], stylesheet: 'packages/view-canvas/src/styles.css' },
  { imports: ['packages/view-canvas/src/styles.css'], stylesheet: 'packages/view-present/src/styles.css' },
  {
    imports: ['packages/view-canvas/src/styles.css', 'packages/view-present/src/styles.css'],
    stylesheet: 'packages/view-studio/src/styles.css'
  }
] as const

/** One selector per entry, combinators flattened, because neither a list's order nor a combinator decides which rule wins. */
const shape = (selectorList: string) =>
  selectorList
    .replace(/[>+~]/g, ' ')
    .split(',')
    .map((selector) => selector.trim().split(/\s+/).join(' '))
    .filter((selector) => selector.length > 0)

const selectorsOf = (source: string) => {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '')
  const found = new Set<string>()
  let index = 0
  while (index < withoutComments.length) {
    const open = withoutComments.indexOf('{', index)
    if (open < 0) break
    const selector = withoutComments.slice(index, open).split(/\s+/).join(' ').trim()
    let depth = 1
    let cursor = open + 1
    while (depth > 0 && cursor < withoutComments.length) {
      if (withoutComments[cursor] === '{') depth += 1
      else if (withoutComments[cursor] === '}') depth -= 1
      cursor += 1
    }
    if (selector && !selector.startsWith('@')) for (const one of shape(selector)) found.add(one)
    index = cursor
  }
  return found
}

const read = async (pathname: string) => selectorsOf(await readFile(new URL(`../${pathname}`, import.meta.url), 'utf8'))

describe('view stylesheet shadowing', () => {
  it('declares each selector once across an import chain, so a treatment written upstream reaches every surface', async () => {
    for (const { imports, stylesheet } of chain) {
      const own = await read(stylesheet)
      const inherited = new Set((await Promise.all(imports.map(read))).flatMap((set) => [...set]))
      const shadowed = [...own].filter((selector) => inherited.has(selector)).sort()

      expect({ shadowed, stylesheet }).toEqual({ shadowed: [], stylesheet })
    }
  })

  it('reads a chain that is actually imported, so the comparison is not against stylesheets nobody loads', async () => {
    for (const { imports, stylesheet } of chain) {
      if (imports.length === 0) continue
      const source = await readFile(new URL(`../${stylesheet}`, import.meta.url), 'utf8')
      const direct = imports[imports.length - 1]
      const specifier = direct.replace('packages/', '@infoschematics/').replace('/src/', '/')

      // An import that follows a rule is dropped by a conforming parser, so position is part of the contract, and
      // reporting the stylesheet alongside it is what turns a bare false into a failure that names the file.
      expect({ imported: source.slice(0, source.indexOf('{')).includes(`@import "${specifier}"`), stylesheet }).toEqual(
        {
          imported: true,
          stylesheet
        }
      )
    }
  })
})
