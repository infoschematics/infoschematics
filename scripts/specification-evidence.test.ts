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
        id: block.match(/^### ([A-Z][A-Z-]*-\d+) — /)?.[1] ?? ''
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
