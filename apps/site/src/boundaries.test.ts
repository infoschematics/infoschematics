import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { promisify } from 'node:util'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/*
 * The dependency-boundary proof, run through Site's own `vitest run` because the KI engineering audit needs one bare
 * Vitest entrypoint to drive it, and Site is the workspace that already depends on every other one. It reads Site's
 * code no more than any other: it cruises every workspace through the isolated checker at `tooling/boundaries`, and
 * holds both halves of a boundary check that can fail open — the real graph is read and clean, and every stated rule
 * still reports a deliberate crossing by name. `scripts/dependency-boundaries.test.ts` and `scripts/boundaries.ts`
 * remain the repository's own gate; this is the same ruleset proved through the binary the gate drives.
 */
const execute = promisify(execFile)
const root = resolve(import.meta.dirname, '../../..')
const tooling = join(root, 'tooling/boundaries')
const checker = join(tooling, 'node_modules/.bin/depcruise')

/** Near today's 346-module cruise, so a parser that reads a plausible fraction of the repository cannot clear it. */
const moduleFloor = 300

type Dependency = Readonly<{
  couldNotResolve: boolean
  dependencyTypes?: readonly string[]
  module: string
  resolved: string
}>
type Graph = Readonly<{
  modules: readonly Readonly<{ dependencies: readonly Dependency[]; source: string }>[]
  summary: Readonly<{ violations: readonly Readonly<{ from: string; rule: Readonly<{ name: string }>; to: string }>[] }>
}>

/** Cruise through the checker's CLI, which exits non-zero on a violation but still prints the graph. */
const cruise = async (cwd: string, paths: readonly string[]): Promise<Graph> => {
  const args = ['--config', '.dependency-cruiser.ts', '--output-type', 'json', ...paths]
  try {
    return JSON.parse((await execute(checker, args, { cwd, maxBuffer: 64 * 1024 * 1024 })).stdout) as Graph
  } catch (error) {
    const { stdout } = error as { stdout?: string }
    if (stdout) return JSON.parse(stdout) as Graph
    throw error
  }
}

/** Every workspace member's `src`, the roots the ruleset governs. */
const workspaceSources = async (): Promise<string[]> => {
  const families = ['packages', 'apps', 'examples']
  const members = await Promise.all(
    families.map(async (family) =>
      (await readdir(join(root, family), { withFileTypes: true }))
        .filter((entry) => entry.isDirectory() && existsSync(join(root, family, entry.name, 'src')))
        .map((entry) => `${family}/${entry.name}/src`)
    )
  )
  return members.flat()
}

/* Each case drives a real TypeScript cruise beside every other workspace task in the gate; see AGENTS.md on why a
   default timeout measures contention rather than the graph. */
describe('resolved dependency boundaries', { timeout: 120_000 }, () => {
  it('drives a TypeScript the checker supports', async () => {
    const { stdout } = await execute(
      'node',
      [
        '--input-type=module',
        '--eval',
        "import {getAvailableTranspilers} from 'dependency-cruiser'; console.log(JSON.stringify(getAvailableTranspilers()))"
      ],
      { cwd: tooling }
    )
    expect(JSON.parse(stdout)).toContainEqual(expect.objectContaining({ available: true, name: 'typescript' }))
  })

  it('reads the whole workspace graph, resolves across packages, and finds it clean', async () => {
    const graph = await cruise(root, await workspaceSources())
    expect(graph.modules.length).toBeGreaterThanOrEqual(moduleFloor)

    // A workspace import may resolve through a linked install to an absolute path, so match the owner by its tail.
    const diagram = graph.modules.find(
      (module) => module.source === 'packages/view-canvas/src/InfoschematicDiagram.tsx'
    )
    const workspace = (diagram?.dependencies ?? []).filter((edge) => edge.module.startsWith('@infoschematics/'))
    expect(workspace.length).toBeGreaterThan(0)
    for (const edge of workspace) {
      expect(edge).toEqual(
        expect.objectContaining({ couldNotResolve: false, resolved: expect.stringMatching(/(^|\/)packages\//) })
      )
    }

    // Only a parser reading pre-compilation imports sees a type-only crossing, and several rules match on them.
    const owner = (path: string) => path.match(/(?:^|\/)((?:packages|apps|examples)\/[^/]+)\//)?.[1]
    const typeOnlyCrossings = graph.modules.flatMap((module) =>
      module.dependencies.filter(
        (edge) =>
          edge.dependencyTypes?.includes('type-only') &&
          owner(edge.resolved) !== undefined &&
          owner(edge.resolved) !== owner(module.source)
      )
    )
    expect(typeOnlyCrossings.length).toBeGreaterThan(0)

    expect(graph.summary.violations).toEqual([])
  })

  describe('rejects a deliberate crossing of each stated boundary', () => {
    /** A module with no imports of its own, so no crossing can also close a cycle. */
    const leaf = 'export const leaf = 1\n'
    const thirdParty = (name: string) => ({
      [`node_modules/${name}/index.js`]: leaf,
      [`node_modules/${name}/package.json`]: JSON.stringify({ main: 'index.js', name, type: 'module' })
    })
    const support: Record<string, string> = {
      ...thirdParty('react'),
      ...thirdParty('undeclared-runtime'),
      ...thirdParty('build-toolchain'),
      'packages/cli/package.json': JSON.stringify({ dependencies: { 'undeclared-runtime': '1.0.0' } }),
      'packages/view-canvas/package.json': JSON.stringify({ devDependencies: { 'build-toolchain': '1.0.0' } })
    }

    // [rule, importing module, imported module]: each importer crosses exactly one stated boundary.
    const crossings = [
      [
        'studio-is-mounted-not-borrowed',
        'packages/view-studio/src/borrows-app.ts',
        'packages/view-studio/src/app/leaf.ts'
      ],
      ['entry-stays-thin', 'packages/view-studio/src/index.ts', 'packages/view-studio/src/library/leaf.ts'],
      [
        'canvas-depends-only-on-models',
        'packages/view-canvas/src/reaches-present.ts',
        'packages/view-present/src/leaf.ts'
      ],
      ['present-builds-on-canvas', 'packages/view-present/src/reaches-studio.ts', 'packages/view-studio/src/leaf.ts'],
      ['studio-builds-on-lower-views', 'packages/view-studio/src/reaches-example.ts', 'examples/is-blank/src/leaf.ts'],
      [
        'domain-core-is-a-test-only-dependency-for-interactive-views',
        'packages/view-canvas/src/reaches-domain-core.ts',
        'packages/domain-core/src/leaf.ts'
      ],
      [
        'static-renderer-stays-framework-neutral',
        'packages/render-svg/src/reaches-canvas.ts',
        'packages/view-canvas/src/leaf.ts'
      ],
      ['renderer-command-stays-thin', 'packages/cli/src/reaches-canvas.ts', 'packages/view-canvas/src/leaf.ts'],
      [
        'renderer-command-names-its-third-party-dependencies',
        'packages/cli/src/reaches-runtime.ts',
        'node_modules/undeclared-runtime/index.js'
      ],
      ['view-model-stays-generic', 'packages/view-model/src/reaches-canvas.ts', 'packages/view-canvas/src/leaf.ts'],
      [
        'domain-model-has-no-workspace-dependencies',
        'packages/domain-model/src/reaches-domain-core.ts',
        'packages/domain-core/src/leaf.ts'
      ],
      [
        'domain-core-depends-only-on-domain-model',
        'packages/domain-core/src/reaches-view-model.ts',
        'packages/view-model/src/leaf.ts'
      ],
      [
        'domain-and-derivation-stay-framework-neutral',
        'packages/view-model/src/reaches-react.ts',
        'node_modules/react/index.js'
      ],
      [
        'library-stays-reusable',
        'packages/view-studio/src/library/reaches-app.ts',
        'packages/view-studio/src/app/leaf.ts'
      ],
      [
        'authored-infoschematics-stay-framework-neutral',
        'examples/is-blank/src/reaches-view-model.ts',
        'packages/view-model/src/leaf.ts'
      ],
      ['site-does-not-own-product-model', 'apps/site/src/reaches-view-model.ts', 'packages/view-model/src/leaf.ts'],
      ['nothing-imports-repository-scripts', 'packages/view-model/src/reaches-scripts.ts', 'scripts/leaf.ts'],
      ['not-to-dev-dep', 'packages/view-canvas/src/reaches-toolchain.ts', 'node_modules/build-toolchain/index.js']
    ] as const

    /** How the importer names its target: by package for a third-party module, by relative path otherwise. */
    const specifier = (from: string, to: string) =>
      to.startsWith('node_modules/') ? to.split('/')[1] : relative(dirname(from), to).replace(/^(?!\.)/, './')

    let fixture: string
    let graph: Graph

    beforeAll(async () => {
      fixture = await mkdtemp(join(tmpdir(), 'infoschematics-boundary-'))
      const files: Record<string, string> = {
        ...support,
        '.dependency-cruiser.ts': await readFile(join(root, '.dependency-cruiser.ts'), 'utf8'),
        // Keep the repository's compiler options, scoped to the fixture's own files.
        'tsconfig.json': JSON.stringify({ exclude: [], extends: join(root, 'tsconfig.json'), include: ['**/*.ts'] })
      }
      for (const [, from, to] of crossings) {
        files[from] = `export { leaf } from '${specifier(from, to)}'\n`
        if (!to.startsWith('node_modules/')) files[to] = leaf
      }
      for (const [path, text] of Object.entries(files)) {
        await mkdir(dirname(join(fixture, path)), { recursive: true })
        await writeFile(join(fixture, path), text)
      }
      graph = await cruise(fixture, ['packages', 'apps', 'examples'])
    }, 120_000)

    afterAll(async () => {
      if (fixture) await rm(fixture, { force: true, recursive: true })
    })

    it.each(crossings)('%s', (rule, from, to) => {
      const importer = graph.modules.find((module) => module.source === from)
      expect(importer?.dependencies).toContainEqual(expect.objectContaining({ couldNotResolve: false, resolved: to }))
      expect(
        graph.summary.violations
          .filter((violation) => violation.from === from && violation.to === to)
          .map((violation) => violation.rule.name)
      ).toContain(rule)
    })
  })
})
