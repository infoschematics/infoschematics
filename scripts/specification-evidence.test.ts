import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The Specifications corpus records, per requirement, a conformance state and the proof behind it. Nothing else in the
 * gate reads that proof, so evidence can stop resolving without any run turning red: nine requirements were recorded as
 * conforming on a path that moved package. These cases read the corpus the way a reader would.
 */
const specificationsDirectory = 'docs/specs'
const conformanceStates = ['conforming', 'divergent', 'pending']
const citedRoots = ['apps', 'docs', 'examples', 'packages', 'scripts']
const ignoredDirectories = new Set(['.turbo', '.wrangler', 'coverage', 'dist', 'node_modules'])
const citedExtensions = ['css', 'html', 'json', 'md', 'svg', 'ts', 'tsx', 'yaml', 'yml']

type Requirement = Readonly<{
  citations: readonly string[]
  conformance: string
  file: string
  id: string
  named: readonly Readonly<{ paths: readonly string[]; thing: string }>[]
}>

const pathsUnder = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name)
      if (!entry.isDirectory()) return Promise.resolve([path])
      return ignoredDirectories.has(entry.name)
        ? Promise.resolve([])
        : pathsUnder(path).then((under) => [path, ...under])
    })
  )
  return nested.flat()
}

/** Everything a citation could name: a directory is as citable as a file, and the root's own files are citable too. */
const citablePaths = async () => {
  const roots = await Promise.all(citedRoots.map(pathsUnder))
  const top = (await readdir('.', { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name)
  return [...citedRoots, ...roots.flat(), ...top]
}

/** A requirement's proof lives on its `_Verify:_` and `_Evidence:_` lines, in backticks, mixed with prose. */
const citations = (block: string) =>
  [...block.matchAll(/^_(?:Evidence|Verify):_ (.*)$/gm)].flatMap(([, line]) =>
    [...(line ?? '').matchAll(/`([^`]+)`/g)].map(([, cited]) => cited ?? '')
  )

const requirements = async (): Promise<Requirement[]> => {
  const files = (await readdir(specificationsDirectory)).filter((name) => name.endsWith('.md')).sort()
  const parsed = await Promise.all(
    files.map(async (name) => {
      const file = join(specificationsDirectory, name)
      const blocks = (await readFile(file, 'utf8')).split(/^(?=### [A-Z][A-Z-]*-\d+ — )/m).slice(1)
      return blocks.map((block) => ({
        citations: citations(block),
        conformance: block.match(/^_Conformance:_ (.*)$/m)?.[1]?.trim() ?? '',
        file,
        id: block.match(/^### ([A-Z][A-Z-]*-\d+) — /)?.[1] ?? '',
        named: namedThings(block)
      }))
    })
  )
  return parsed.flat()
}

/** A citation names a repository path when it reads like one; the same lines also cite symbols, options and commands. */
const isPath = (cited: string) => cited.includes('/') && /^[\w./@-]+$/.test(cited)

/** A citation may name a directory, which reads naturally with a trailing separator. */
const withoutTrailingSeparator = (cited: string) => (cited.endsWith('/') ? cited.slice(0, -1) : cited)

const isFileName = (cited: string) => new RegExp(`^[\\w.-]+\\.(?:${citedExtensions.join('|')})$`).test(cited)

/**
 * A resolving path is the weaker half of a citation. `DESIGN-006` and `DESIGN-010` went on citing
 * `packages/view-studio/src/styles.css` after the rules they named moved to Canvas: the path still opened, and nothing
 * in the gate read what was inside it. The corpus writes proof as "`thing` … in `path`", so where a citation names the
 * thing it can be checked against the file — and where it names only prose it cannot, which is the reason to name it.
 */
const namedInAFile = /((?:`[^`]+`(?:,? (?:and|or) )?)+) in (`[^`]+`(?: and `[^`]+`)*)/g

/** A placeholder describes a shape rather than naming a thing, so it is not something to look for verbatim. */
const isPlaceholder = (cited: string) => cited.includes('<')

const namedThings = (block: string) =>
  [...block.matchAll(/^_(?:Evidence|Verify):_ (.*)$/gm)].flatMap(([, line]) =>
    [...(line ?? '').matchAll(namedInAFile)].flatMap(([, named, where]) => {
      const backticked = (text: string) => [...text.matchAll(/`([^`]+)`/g)].map(([, cited]) => cited ?? '')
      const things = backticked(named ?? '').filter((cited) => !isPath(cited) && !isPlaceholder(cited))
      const paths = backticked(where ?? '').filter(isPath)
      return paths.length === 0 ? [] : things.map((thing) => ({ paths, thing }))
    })
  )

describe('specification evidence', () => {
  it('declares exactly one recognised conformance state per requirement', async () => {
    const parsed = await requirements()

    expect(parsed.length).toBeGreaterThan(150)
    for (const requirement of parsed) {
      expect(
        conformanceStates,
        `${requirement.file} ${requirement.id} declares "${requirement.conformance}"`
      ).toContain(requirement.conformance)
    }
  })

  it('cites paths that still resolve, so conformance rests on proof a reader can open', async () => {
    const parsed = await requirements()
    const present = new Set(await citablePaths())
    let cited = 0

    for (const requirement of parsed) {
      for (const path of requirement.citations.filter(isPath).map(withoutTrailingSeparator)) {
        cited += 1
        expect(present, `${requirement.file} ${requirement.id} cites missing path ${path}`).toContain(path)
      }
    }

    expect(cited).toBeGreaterThan(100)
  })

  it('cites content that is still in the file named, so a rule that moved package cannot keep its old proof', async () => {
    const parsed = await requirements()
    let checked = 0

    for (const requirement of parsed)
      for (const { paths, thing } of requirement.named) {
        checked += 1
        const absent: string[] = []
        for (const path of paths) {
          const content = await readFile(path, 'utf8').catch(() => '')
          if (!content.includes(thing)) absent.push(path)
        }
        // Every cited path, not merely one of them: a requirement that cites two files and is supported by one is how
        // `DESIGN-006` went on naming Studio's stylesheet after its editing layers moved to Canvas.
        expect(
          absent,
          `${requirement.file} ${requirement.id} cites "${thing}" in files that do not contain it`
        ).toEqual([])
      }

    expect(checked).toBeGreaterThan(60)
  })

  it('cites file names that name a file somewhere, so a moved file is still caught', async () => {
    const parsed = await requirements()
    const names = new Set((await citablePaths()).map((path) => path.split('/').at(-1)))

    for (const requirement of parsed) {
      for (const name of requirement.citations.filter((cited) => !isPath(cited) && isFileName(cited))) {
        expect(names, `${requirement.file} ${requirement.id} cites missing file ${name}`).toContain(name)
      }
    }
  })
})
