#!/usr/bin/env bun
/**
 * Check the documented dependency direction, and refuse to report success on a cruise that examined nothing.
 *
 * A boundary check fails open. Every rule in `.dependency-cruiser.ts` matches on resolved paths, so a cruise that
 * resolves nothing satisfies every rule and prints a clean result — which is exactly what this repository shipped
 * after TypeScript 7 landed: `0 modules, 0 dependencies cruised`, above a warning, read as a pass. The rules check
 * the graph; this command checks that there was a graph to check.
 */
import { spawn } from 'node:child_process'
import { type CliSpec, isDirectInvocation, runCli } from './cli.ts'

/** Every source root the documented dependency direction governs. */
export const boundaryRoots = [
  'packages/domain-model/src',
  'packages/domain-core/src',
  'packages/view-model/src',
  'packages/view-canvas/src',
  'packages/view-present/src',
  'packages/view-studio/src',
  'packages/render-svg/src',
  'packages/cli/src',
  'examples/is-blank/src',
  'examples/is-infoschematics/src',
  'examples/is-system/src',
  'apps/site/src',
  'scripts'
] as const

/**
 * The floor below which the cruise is not measuring this repository.
 *
 * Deliberately a floor near the real count rather than a merely non-zero one: a parser that resolves nothing reports
 * 0, but a parser that resolves only the JavaScript it recognises reports a plausible-looking fraction. Today's cruise
 * reports 328 modules, so ordinary growth never trips this and a broken parser cannot clear it.
 */
export const moduleFloor = 300

/** A cross-package type-only edge, which only a TypeScript parser reading pre-compilation imports can see. */
const crossPackage = /^(packages|apps|examples)\/([^/]+)\//

type Dependency = Readonly<{ dependencyTypes?: readonly string[]; resolved: string }>
type Module = Readonly<{ dependencies?: readonly Dependency[]; source: string }>

export type Cruise = Readonly<{
  modules: readonly Module[]
  summary: Readonly<{ totalCruised: number; violations: readonly Readonly<{ rule: Readonly<{ name: string }> }>[] }>
}>

const owner = (source: string) => source.match(crossPackage)?.slice(1, 3).join('/')

/** Count the type-only dependencies that cross from one package root into another. */
export const crossPackageTypeOnly = (cruise: Cruise): number =>
  cruise.modules.reduce(
    (total, module) =>
      total +
      (module.dependencies ?? []).filter(
        (dependency) =>
          (dependency.dependencyTypes ?? []).includes('type-only') &&
          owner(module.source) !== undefined &&
          owner(dependency.resolved) !== undefined &&
          owner(module.source) !== owner(dependency.resolved)
      ).length,
    0
  )

/**
 * Why this cruise is not evidence, or nothing when it is.
 *
 * Kept separate from running the command so the conditions it rejects can be exercised without a parser to break.
 */
export const assess = (cruise: Cruise): readonly string[] => {
  const reasons: string[] = []
  if (cruise.summary.totalCruised < moduleFloor) {
    reasons.push(
      `cruised ${cruise.summary.totalCruised} modules, below the floor of ${moduleFloor}: the parser is not reading this repository`
    )
  }
  if (crossPackageTypeOnly(cruise) === 0) {
    reasons.push(
      'saw no cross-package type-only dependency: `tsPreCompilationDeps` is on, so a parser that reads pre-compilation imports finds these and one that does not cannot enforce the rules that match them'
    )
  }
  return reasons
}

/**
 * Where the boundary tooling lives, and why it is not the repository's own install.
 *
 * dependency-cruiser reads TypeScript through the TypeScript compiler API and supports `typescript@>=2 <7`; this
 * repository is on TypeScript 7, so the compiler it finds is one it refuses to use. Its own fallback parser reads
 * value imports but not type-only re-exports, which `.dependency-cruiser.ts` explicitly depends on seeing. So the
 * checker gets its own install root, outside the workspace graph, holding the TypeScript 6 it can drive. Nothing
 * else in the repository resolves it, and the repository's own TypeScript is untouched.
 */
const tooling = 'tooling/boundaries'

/** Run the boundary tooling's own dependency-cruiser over the source roots and return its graph. */
const cruise = async (): Promise<Cruise> => {
  const install = spawn('bun', ['install', '--frozen-lockfile', '--cwd', tooling], {
    stdio: ['ignore', 'ignore', 'inherit']
  })
  const installed = await new Promise<number>((settle) => install.on('close', (status) => settle(status ?? 1)))
  if (installed !== 0)
    throw new Error(`the boundary tooling in ${tooling} does not match its lockfile (exit ${installed})`)

  const cruiser = spawn(
    `${tooling}/node_modules/.bin/depcruise`,
    ['--config', '.dependency-cruiser.ts', '--output-type', 'json', ...boundaryRoots],
    { stdio: ['ignore', 'pipe', 'inherit'] }
  )
  const chunks: Buffer[] = []
  cruiser.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
  const code = await new Promise<number>((settle) => cruiser.on('close', (status) => settle(status ?? 1)))
  const output = Buffer.concat(chunks).toString('utf8')
  if (!output) throw new Error(`dependency-cruiser produced no graph (exit ${code})`)
  return JSON.parse(output) as Cruise
}

export const spec: CliSpec = {
  describe: 'Cruise the documented dependency direction, failing when a rule is broken or the cruise measured nothing.',
  flags: {
    json: { describe: 'Report the cruise summary as JSON.', kind: 'boolean' }
  },
  run: 'self:boundaries:verify',
  script: 'scripts/boundaries.ts'
}

if (isDirectInvocation(import.meta.url)) {
  await runCli(spec, async (parsed) => {
    const graph = await cruise()
    const summary = {
      crossPackageTypeOnly: crossPackageTypeOnly(graph),
      modules: graph.summary.totalCruised,
      violations: graph.summary.violations.map((violation) => violation.rule.name)
    } as const
    const vacuous = assess(graph)

    if (parsed.boolean('json')) console.log(JSON.stringify(summary, null, 2))
    else console.log(`Cruised ${summary.modules} modules, ${summary.crossPackageTypeOnly} cross-package type-only.`)

    if (vacuous.length > 0) throw new Error(`The boundary cruise is not evidence:\n- ${vacuous.join('\n- ')}`)
    if (summary.violations.length > 0) {
      throw new Error(`Dependency boundary violations:\n- ${[...new Set(summary.violations)].join('\n- ')}`)
    }
  })
}
