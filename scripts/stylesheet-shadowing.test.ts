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
 *
 * Selector identity is the line, not declaration text. Two rules with the same selector in an import chain are a shadow
 * whether or not their declarations agree: identical declarations are a copy that will drift, and differing ones are
 * already the drift. Comparing declarations would pass exactly the case that motivated this guard — Studio's
 * `.infoschematic` wrote a literal where Canvas wrote the token, so a declaration comparison would have called them
 * different rules and said nothing. A deliberate difference belongs under a selector that says so.
 *
 * The scanner is what certifies all of the above, so it is held to its own fixtures. An earlier version took everything
 * between one block and the next `{` as a selector and dropped it when it began with `@`, which silently discarded the
 * first rule of any stylesheet opening with `@import` — that is, every stylesheet in this chain — along with every rule
 * inside `@media` or `@container`.
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

/** Past the closing quote, so a brace or semicolon inside a string or a `url()` cannot be read as structure. */
const endOfString = (source: string, start: number) => {
  const quote = source[start]
  let cursor = start + 1
  while (cursor < source.length) {
    if (source[cursor] === '\\') cursor += 2
    else if (source[cursor] === quote) return cursor + 1
    else cursor += 1
  }
  return cursor
}

/** The next character that divides one construct from the next, skipping any that is only part of a string. */
const structure = (source: string, from: number) => {
  let cursor = from
  while (cursor < source.length) {
    const character = source[cursor]
    if (character === '"' || character === "'") cursor = endOfString(source, cursor)
    else if (character === '{' || character === '}' || character === ';') return { at: cursor, character }
    else cursor += 1
  }
  return undefined
}

/**
 * At-rules whose body holds ordinary rules, which therefore have to be read. `@keyframes` holds keyframe steps, which
 * are not selectors and cannot shadow one; `@font-face`, `@page` and `@property` hold bare declarations.
 */
const conditionalGroups = new Set(['container', 'layer', 'media', 'scope', 'supports'])

const collect = (source: string, found: Set<string>) => {
  let index = 0
  while (index < source.length) {
    const token = structure(source, index)
    if (!token) break
    // A statement at-rule such as `@import …;` ends without a body, and so declares no selector to compare.
    if (token.character !== '{') {
      index = token.at + 1
      continue
    }
    const prelude = source.slice(index, token.at).split(/\s+/).join(' ').trim()
    let depth = 1
    let cursor = token.at + 1
    while (depth > 0) {
      const inner = structure(source, cursor)
      if (!inner) {
        cursor = source.length + 1
        break
      }
      if (inner.character === '{') depth += 1
      else if (inner.character === '}') depth -= 1
      cursor = inner.at + 1
    }
    if (prelude.startsWith('@')) {
      const name =
        prelude
          .slice(1)
          .split(/[\s({]/)[0]
          ?.toLowerCase() ?? ''
      if (conditionalGroups.has(name)) collect(source.slice(token.at + 1, Math.max(token.at + 1, cursor - 1)), found)
    } else if (prelude) for (const one of shape(prelude)) found.add(one)
    index = cursor
  }
  return found
}

const selectorsOf = (source: string) => collect(source.replace(/\/\*[\s\S]*?\*\//g, ''), new Set<string>())

const read = async (pathname: string) => selectorsOf(await readFile(new URL(`../${pathname}`, import.meta.url), 'utf8'))

/** Each case is CSS a reader can read off by eye, so the scanner cannot quietly disagree with one. */
const fixtures = [
  {
    // Every stylesheet in the chain opens this way, so dropping the first rule hid its most likely duplicate.
    css: '@import url("f?a=1;b=2");\n@import "t";\n\n.first { color: red; }\n.second { color: blue; }\n',
    declares: ['.first', '.second'],
    reads: 'the first rule of a stylesheet that opens with at-rule statements'
  },
  {
    css: '@media (prefers-reduced-motion: reduce) {\n  .animated { animation: none; }\n}\n',
    declares: ['.animated'],
    reads: 'a rule inside a media query, which wins the cascade like any other'
  },
  {
    css: '@container (width <= 520px) {\n  .narrow { display: none; }\n}\n',
    declares: ['.narrow'],
    reads: 'a rule inside a container query'
  },
  {
    css: '@keyframes pulse {\n  0% { opacity: 0; }\n  to { opacity: 1; }\n}\n',
    declares: [],
    reads: 'no selector out of a keyframe, because a keyframe step cannot shadow a rule'
  },
  {
    css: '@font-face {\n  font-family: Example;\n  src: url("e.woff2");\n}\n',
    declares: [],
    reads: 'no selector out of an at-rule that holds only declarations'
  },
  {
    css: '.card > rect,\n.card ~ text { fill: red; }\n',
    declares: ['.card rect', '.card text'],
    reads: 'a list with combinators as separate flattened selectors'
  },
  {
    css: '.a::after { content: "{"; }\n.b { color: red; }\n',
    declares: ['.a::after', '.b'],
    reads: 'past a brace that is only string content'
  },
  {
    css: '/* .commented { color: red; } */\n.live { color: blue; }\n',
    declares: ['.live'],
    reads: 'nothing out of a commented-out rule'
  }
] as const

describe('view stylesheet shadowing', () => {
  for (const { css, declares, reads } of fixtures)
    it(`reads ${reads}`, () => {
      expect([...selectorsOf(css)].sort()).toEqual([...declares].sort())
    })

  it('sees the rule the Canvas stylesheet opens with, which is the one the chain check must compare', async () => {
    // `.infoschematic` is Canvas's first rule and was the duplicate the earlier scanner could not report.
    expect([...(await read('packages/view-canvas/src/styles.css'))]).toContain('.infoschematic')
  })

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
