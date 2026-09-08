/**
 * A TypeScript Infoschematic document, read as data.
 *
 * This is not a TypeScript runtime and never evaluates anything. The accepted grammar is a very strict subset chosen
 * so an authored definition module - comments, `import type` lines, one exported object literal - parses as a plain
 * value, exactly as JSON.parse reads a JSON document. Everything TypeScript can otherwise express - identifiers as
 * values, call expressions, template literals, spreads, computed keys, `satisfies`, arithmetic - is rejected with a
 * path-addressed diagnostic, because a document that needs evaluation is a program, not a document.
 */

export type TypescriptDocumentIssue = Readonly<{ message: string; path: string }>

export type TypescriptDocumentResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ issues: readonly TypescriptDocumentIssue[]; ok: false }>

const identifierStart = /[A-Za-z_$]/
const identifierPart = /[A-Za-z0-9_$]/

/** Raised internally to carry one diagnostic out of the descent; never escapes `parseTypescriptDocument`. */
class DocumentError extends Error {
  readonly path: string
  constructor(message: string, path: readonly (string | number)[], line: number, column: number) {
    super(`${message} (line ${line}, column ${column})`)
    this.path = path.join('.')
  }
}

export const parseTypescriptDocument = (text: string): TypescriptDocumentResult => {
  let at = 0
  const path: (string | number)[] = []

  const position = () => {
    const before = text.slice(0, at)
    const line = before.split('\n').length
    const column = at - before.lastIndexOf('\n')
    return { column, line }
  }

  const fail = (message: string): never => {
    const { column, line } = position()
    throw new DocumentError(message, path, line, column)
  }

  const skipTrivia = () => {
    for (;;) {
      const char = text[at]
      if (char === undefined) return
      if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        at += 1
      } else if (char === '/' && text[at + 1] === '/') {
        const end = text.indexOf('\n', at)
        at = end === -1 ? text.length : end
      } else if (char === '/' && text[at + 1] === '*') {
        const end = text.indexOf('*/', at + 2)
        if (end === -1) fail('Unterminated block comment.')
        at = end + 2
      } else {
        return
      }
    }
  }

  const peek = () => text[at]

  const wordAhead = (): string | undefined => {
    if (!identifierStart.test(text[at] ?? '')) return undefined
    let end = at + 1
    while (identifierPart.test(text[end] ?? '')) end += 1
    return text.slice(at, end)
  }

  const readWord = (): string => {
    const word = wordAhead()
    if (!word) fail('Expected a name.')
    at += (word as string).length
    return word as string
  }

  const expect = (char: string, what: string) => {
    if (text[at] !== char) fail(`Expected ${what}.`)
    at += 1
  }

  const readString = (): string => {
    const quote = text[at]
    if (quote === '`') fail('Template literals are not part of the strict TypeScript document subset.')
    if (quote !== "'" && quote !== '"') fail('Expected a string.')
    at += 1
    let value = ''
    for (;;) {
      const char = text[at]
      if (char === undefined || char === '\n') fail('Unterminated string.')
      if (char === quote) {
        at += 1
        return value
      }
      if (char === '\\') {
        const escaped = text[at + 1]
        at += 2
        if (escaped === 'n') value += '\n'
        else if (escaped === 't') value += '\t'
        else if (escaped === 'r') value += '\r'
        else if (escaped === '\\' || escaped === "'" || escaped === '"' || escaped === '`') value += escaped
        else if (escaped === 'u') {
          const hex = text.slice(at, at + 4)
          if (!/^[0-9A-Fa-f]{4}$/.test(hex)) fail('Expected four hexadecimal digits after \\u.')
          value += String.fromCharCode(Number.parseInt(hex, 16))
          at += 4
        } else fail(`Unsupported escape \\${escaped ?? ''} in the strict TypeScript document subset.`)
      } else {
        value += char
        at += 1
      }
    }
  }

  const readNumber = (): number => {
    const start = at
    if (text[at] === '-') at += 1
    if (!/[0-9]/.test(text[at] ?? '')) fail('Expected a number.')
    while (/[0-9]/.test(text[at] ?? '')) at += 1
    if (text[at] === '.') {
      at += 1
      if (!/[0-9]/.test(text[at] ?? '')) fail('Expected digits after the decimal point.')
      while (/[0-9]/.test(text[at] ?? '')) at += 1
    }
    if (text[at] === 'e' || text[at] === 'E') {
      at += 1
      if (text[at] === '+' || text[at] === '-') at += 1
      if (!/[0-9]/.test(text[at] ?? '')) fail('Expected digits in the exponent.')
      while (/[0-9]/.test(text[at] ?? '')) at += 1
    }
    if (/[xXbBoO_]/.test(text[at] ?? '') || identifierPart.test(text[at] ?? '')) {
      fail('Only plain decimal numbers are part of the strict TypeScript document subset.')
    }
    return Number(text.slice(start, at))
  }

  const readValue = (): unknown => {
    skipTrivia()
    const char = peek()
    if (char === undefined) fail('Expected a value.')
    if (char === '{') return readObject()
    if (char === '[') return readArray()
    if (char === "'" || char === '"' || char === '`') return readString()
    if (char === '-' || /[0-9]/.test(char as string)) return readNumber()
    if (char === '.') {
      if (text.startsWith('...', at)) fail('Spreads are not part of the strict TypeScript document subset.')
      fail('Expected a value.')
    }
    const word = wordAhead()
    if (word === 'true' || word === 'false' || word === 'null') {
      at += word.length
      return word === 'true' ? true : word === 'false' ? false : null
    }
    if (word) {
      const after = at + word.length
      let lookahead = after
      while (/[ \t\r\n]/.test(text[lookahead] ?? '')) lookahead += 1
      if (text[lookahead] === '(') {
        fail(`Call expressions such as ${word}(...) are not part of the strict TypeScript document subset.`)
      }
      fail(`Identifiers such as ${word} are not values in the strict TypeScript document subset.`)
    }
    return fail('Expected a value.')
  }

  const readObject = (): Record<string, unknown> => {
    expect('{', 'an object literal')
    const value: Record<string, unknown> = {}
    for (;;) {
      skipTrivia()
      if (peek() === '}') {
        at += 1
        return value
      }
      if (text.startsWith('...', at)) fail('Spreads are not part of the strict TypeScript document subset.')
      if (peek() === '[') fail('Computed keys are not part of the strict TypeScript document subset.')
      const key = peek() === "'" || peek() === '"' ? readString() : readWord()
      path.push(key)
      skipTrivia()
      expect(':', `a colon after the key ${key}`)
      value[key] = readValue()
      path.pop()
      skipTrivia()
      if (peek() === ',') {
        at += 1
      } else if (peek() !== '}') {
        fail('Expected a comma or the end of the object literal.')
      }
    }
  }

  const readArray = (): unknown[] => {
    expect('[', 'an array literal')
    const value: unknown[] = []
    for (;;) {
      skipTrivia()
      if (peek() === ']') {
        at += 1
        return value
      }
      if (text.startsWith('...', at)) fail('Spreads are not part of the strict TypeScript document subset.')
      path.push(value.length)
      value.push(readValue())
      path.pop()
      skipTrivia()
      if (peek() === ',') {
        at += 1
      } else if (peek() !== ']') {
        fail('Expected a comma or the end of the array literal.')
      }
    }
  }

  const skipImport = () => {
    // `import type { A, B } from 'module'` - names and module are read and discarded; only type imports are
    // admitted, because a runtime import is a dependency a document must not have.
    readWord()
    skipTrivia()
    if (wordAhead() !== 'type') fail('Only `import type` lines are part of the strict TypeScript document subset.')
    readWord()
    skipTrivia()
    expect('{', 'the imported names')
    for (;;) {
      skipTrivia()
      if (peek() === '}') {
        at += 1
        break
      }
      if (peek() === ',') {
        at += 1
        continue
      }
      readWord()
    }
    skipTrivia()
    if (wordAhead() !== 'from') fail('Expected `from` in the import line.')
    readWord()
    skipTrivia()
    readString()
    skipTrivia()
    if (peek() === ';') at += 1
  }

  const readModule = (): unknown => {
    for (;;) {
      skipTrivia()
      if (wordAhead() !== 'import') break
      skipImport()
    }

    skipTrivia()
    if (wordAhead() !== 'export') fail('Expected one exported definition: `export const <name> = { ... }`.')
    readWord()
    skipTrivia()

    const kind = wordAhead()
    let value: unknown
    if (kind === 'default') {
      readWord()
      value = readValue()
    } else if (kind === 'const') {
      readWord()
      skipTrivia()
      readWord()
      skipTrivia()
      if (peek() === ':') {
        at += 1
        skipTrivia()
        readWord()
      }
      skipTrivia()
      expect('=', 'an equals sign before the definition')
      value = readValue()
    } else {
      return fail('Expected `export const` or `export default`.')
    }

    skipTrivia()
    if (wordAhead() === 'satisfies') {
      fail('`satisfies` is not part of the strict TypeScript document subset.')
    }
    if (peek() === ';') at += 1
    skipTrivia()
    if (wordAhead() === 'export') fail('Expected exactly one exported definition.')
    if (at !== text.length) fail('Expected the module to end after the exported definition.')
    return value
  }

  try {
    return { ok: true, value: readModule() }
  } catch (error) {
    if (error instanceof DocumentError) return { issues: [{ message: error.message, path: error.path }], ok: false }
    throw error
  }
}
