import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const vocabularyPath = 'docs/reference/vocabulary.md'
const packagesRoot = 'packages'

/**
 * What the repository does about each non-canonical alternative the vocabulary records.
 *
 * `watched` is the only classification that scans the code: the word may not name its canonical
 * concept there, because two words for one concept is how a contributor learns the wrong one.
 *
 * `retained` is a compatibility input name `ADR-INFOSCHEMATICS-019` deliberately keeps, so the code
 * that accepts that format is correctly named after it. `ordinary` is a word that carries its plain
 * English sense far more often than the vocabulary's - a `box` is geometry, `state` is React's, an
 * `editor` is the editing surface - and watching it would report noise rather than drift. `gloss` is
 * a description of a term rather than a word anyone would type.
 *
 * Every alternative needs an entry. The table is checked against the vocabulary in both directions,
 * so a new alternative fails here until someone decides what it is, and an entry that no longer
 * matches the vocabulary fails rather than sitting dead.
 */
const decisions: Readonly<Record<string, 'watched' | 'retained' | 'ordinary' | 'gloss'>> = {
  anchor: 'ordinary',
  animation: 'ordinary',
  'attachment point': 'gloss',
  author: 'ordinary',
  backdrop: 'ordinary',
  band: 'ordinary',
  bend: 'ordinary',
  box: 'ordinary',
  canvas: 'ordinary',
  'caption card': 'gloss',
  column: 'ordinary',
  connection: 'ordinary',
  'connection point': 'gloss',
  connector: 'ordinary',
  corner: 'ordinary',
  'control surface': 'gloss',
  deck: 'ordinary',
  directing: 'ordinary',
  'drawn annotation': 'gloss',
  edge: 'ordinary',
  editor: 'ordinary',
  element: 'ordinary',
  endpoint: 'ordinary',
  'established compatibility name for card collection': 'retained',
  'established compatibility name for overlay': 'retained',
  'first held element': 'gloss',
  'focus composition': 'gloss',
  'foreground figure': 'gloss',
  geometry: 'ordinary',
  'highlight group': 'gloss',
  inspector: 'ordinary',
  junction: 'ordinary',
  'kind and semantic visual identity shared by cards': 'gloss',
  'kind and semantic visual identity shared by flows': 'gloss',
  lane: 'ordinary',
  'layer filter': 'gloss',
  'line run': 'gloss',
  link: 'ordinary',
  'main view': 'gloss',
  'motion effect': 'gloss',
  'narration card': 'gloss',
  node: 'ordinary',
  operator: 'ordinary',
  'people watching': 'gloss',
  plane: 'ordinary',
  playback: 'ordinary',
  'presentation editing': 'gloss',
  'primary selection': 'gloss',
  region: 'ordinary',
  schematic: 'ordinary',
  segment: 'ordinary',
  'selectable kind': 'gloss',
  'selectable presentation grouping over diagram elements': 'gloss',
  'service box': 'gloss',
  sidebar: 'ordinary',
  sidecar: 'ordinary',
  state: 'ordinary',
  step: 'ordinary',
  story: 'retained',
  'structural diagram': 'gloss',
  'structural editing': 'gloss',
  swimlane: 'ordinary',
  'technical references and interfaces': 'gloss',
  theme: 'watched',
  'thematic scene': 'watched',
  tier: 'ordinary',
  transition: 'ordinary',
  transport: 'ordinary',
  vertex: 'ordinary',
  viewer: 'ordinary',
  viewing: 'ordinary',
  'visual element': 'gloss',
  walkthrough: 'ordinary',
  'what is currently shown': 'gloss',
  wrapper: 'ordinary',
  zone: 'ordinary'
}

/**
 * What a watched alternative looks like in source, which is not always how the vocabulary spells it.
 *
 * Deliberately not global: a `/g` pattern carries `lastIndex` between `test` calls, so the second
 * file scanned would resume mid-string and report a clean pass it had not earned.
 */
const watchedPatterns: Readonly<Record<string, RegExp>> = {
  theme: /theme/i,
  'thematic scene': /thematic/i
}

/**
 * Spellings of the retained Theme input, which are correctly named after the format they accept.
 *
 * These are masked out of a file before it is read for drift, so a reader can tell at a glance which
 * uses of the retired word this repository sanctions and why.
 */
const retainedSpellings: readonly Readonly<{ pattern: RegExp; because: string }>[] = [
  { pattern: /ThematicSceneConfig|ThemeConfig/g, because: 'the retained input types' },
  { pattern: /\bthemes\b/g, because: 'the authored field that carries them' },
  { pattern: /domain-model\/theme|\btheme\.ts\b/g, because: 'the module that declares them' },
  { pattern: /THM-/g, because: 'the authored Scene code prefix existing documents carry' },
  { pattern: /'theme'|'thematic-scene'/g, because: 'their authored subject kinds' }
]

/**
 * Files that handle the retained input and therefore still name it, with the reason each one does.
 *
 * Every entry is asserted to still match, so a file that stops using the word leaves this list
 * rather than sitting in it as permission nobody needs.
 */
const retainedReaders: Readonly<Record<string, string>> = {
  'domain-core/src/model.ts': 'maps the retained Theme input into canonical Sequences',
  'domain-model/src/sequence.ts': 'states the compatibility boundary in prose',
  'render-svg/src/index.ts': 'names the retained Theme a selection failed to resolve',
  'view-model/src/artefact-draft.ts': 'rewrites the retained input in place',
  'view-model/src/signals.ts': 'selects a Scene inside a retained Theme',
  'view-model/src/artefact-draft.test.ts': 'fixtures for that rewrite',
  'view-model/src/signals.test.ts': 'fixtures for the retained-input selector',
  'view-studio/src/app/App.tsx': 'reads Callouts from the retained input'
}

const alternatives = (source: string): string[] =>
  [...source.matchAll(/^\| `[a-z-]+` \| <span id="[a-z-]+"><\/span>[^|]+\| ([^|]+?) \|/gm)].flatMap(([, also]) =>
    (also ?? '').split(',').map((entry) => entry.trim().toLowerCase())
  )

const sourceFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name)
      if (entry.name === 'node_modules' || entry.name === 'dist') return Promise.resolve([])
      if (entry.isDirectory()) return sourceFiles(path)
      return Promise.resolve(/\.(css|ts|tsx)$/.test(entry.name) ? [path] : [])
    })
  )
  return nested.flat()
}

const withoutRetainedSpellings = (content: string): string =>
  retainedSpellings.reduce((carry, { pattern }) => carry.replaceAll(pattern, ''), content)

/** Report each watched alternative left in one file once its retained spellings are masked out. */
const driftIn = (path: string, content: string): string[] => {
  const readable = withoutRetainedSpellings(content)
  return Object.entries(watchedPatterns).flatMap(([alternative, pattern]) =>
    pattern.test(readable) ? [`${path}: ${alternative}`] : []
  )
}

describe('vocabulary drift', () => {
  it('has a decision for every non-canonical alternative the vocabulary records', async () => {
    const recorded = new Set(alternatives(await readFile(vocabularyPath, 'utf8')))

    // The floor: a parse that matched nothing would make every other assertion here vacuous.
    expect(recorded.size).toBeGreaterThan(60)
    expect(recorded.has('theme')).toBe(true)

    expect([...recorded].filter((entry) => !(entry in decisions))).toEqual([])
    expect(Object.keys(decisions).filter((entry) => !recorded.has(entry))).toEqual([])
    expect(Object.keys(watchedPatterns).sort()).toEqual(
      Object.entries(decisions)
        .filter(([, decision]) => decision === 'watched')
        .map(([alternative]) => alternative)
        .sort()
    )
  })

  it('reports a watched alternative reintroduced into a package', () => {
    // A check whose failure mode is silence reads as evidence. This is what a failure looks like.
    expect(driftIn('view-studio/src/app/editor/composition.ts', 'export const themeCanActivate = () => true')).toEqual([
      'view-studio/src/app/editor/composition.ts: theme'
    ])
    expect(driftIn('view-present/src/production.ts', "type Target = { kind: 'sequence' }")).toEqual([])

    // Twice over, because a stateful pattern would report the first file and then miss every other.
    const reintroduced = 'export const themeCanActivate = () => true'
    expect(driftIn('a.ts', reintroduced)).toEqual(driftIn('a.ts', reintroduced))
  })

  it('leaves no watched alternative naming its canonical concept in the packages', async () => {
    const files = await sourceFiles(packagesRoot)
    expect(files.length).toBeGreaterThan(200)

    const findings: string[] = []
    const matchedReaders = new Set<string>()

    for (const path of files) {
      const relative = path.slice(packagesRoot.length + 1)
      const drift = driftIn(relative, await readFile(path, 'utf8'))
      if (drift.length === 0) continue
      if (relative in retainedReaders) matchedReaders.add(relative)
      else findings.push(...drift)
    }

    expect(findings).toEqual([])
    expect(Object.keys(retainedReaders).filter((path) => !matchedReaders.has(path))).toEqual([])
  })
})
