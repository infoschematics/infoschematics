#!/usr/bin/env bun
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { availableParallelism } from 'node:os'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type CliSpec, isDirectInvocation, runCli } from './cli.ts'
import { type WorkspacePackage, workspacePackages } from './workspace-sources.ts'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))

const cacheRoot = join(repositoryRoot, 'node_modules/.cache/infoschematics-build')

/**
 * Inputs shared by every package's build.
 *
 * `bun.lock` stands for the installed dependency set, the compiler among them: a different TypeScript emits different
 * declarations from identical sources, so a package whose own files are untouched is still out of date after an
 * upgrade. `LICENSE` is copied into every `dist`.
 */
const sharedInputs = ['bun.lock', 'tsconfig.build-base.json', 'LICENSE'].map((name) => join(repositoryRoot, name))

/** Files one package's build reads, less the tests its build configuration excludes from the program. */
const packageInputs = async (workspace: WorkspacePackage): Promise<readonly string[]> => {
  const directory = join(repositoryRoot, 'packages', workspace.directory)
  const entries = await readdir(workspace.source, { recursive: true, withFileTypes: true })
  const sources = entries
    .filter((entry) => entry.isFile() && !/\.test\.tsx?$/.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name))

  return [...sources, ...['package.json', 'tsconfig.build.json', 'build.mjs'].map((name) => join(directory, name))]
}

const digestOf = async (files: readonly string[]): Promise<string> => {
  const digest = createHash('sha256')
  // Pathname as well as content: moving a file changes what is built without changing any byte that is read.
  for (const file of [...files].sort()) digest.update(relative(repositoryRoot, file)).update(await readFile(file))
  return digest.digest('hex')
}

/**
 * Order the packages so each one follows everything it depends on, in levels that may be built concurrently.
 *
 * A package's build reads its dependencies' emitted declarations, so the order is a correctness requirement rather
 * than a scheduling preference.
 */
export const buildOrder = (
  packages: readonly WorkspacePackage[] = workspacePackages()
): readonly (readonly WorkspacePackage[])[] => {
  const remaining = new Map(packages.map((workspace) => [workspace.name, workspace]))
  const levels: (readonly WorkspacePackage[])[] = []

  while (remaining.size > 0) {
    const level = [...remaining.values()].filter((workspace) =>
      workspace.dependencies.every((dependency) => !remaining.has(dependency))
    )
    if (level.length === 0) throw new Error(`Packages depend on one another in a cycle: ${[...remaining.keys()]}`)
    for (const workspace of level) remaining.delete(workspace.name)
    levels.push(level)
  }

  return levels
}

/**
 * Fingerprint every package's build inputs, each one folding in the fingerprints of its dependencies.
 *
 * That transitivity is the whole of the change detection: editing Domain Model changes the fingerprint of every
 * package downstream of it, so none of them can match a recorded value and skip.
 */
export const inputFingerprints = async (
  packages: readonly WorkspacePackage[] = workspacePackages()
): Promise<ReadonlyMap<string, string>> => {
  const shared = await digestOf(sharedInputs)
  const fingerprints = new Map<string, string>()

  for (const level of buildOrder(packages)) {
    for (const workspace of level) {
      const digest = createHash('sha256')
        .update(shared)
        .update(await digestOf(await packageInputs(workspace)))
      for (const dependency of workspace.dependencies) digest.update(fingerprints.get(dependency) ?? '')
      fingerprints.set(workspace.name, digest.digest('hex'))
    }
  }

  return fingerprints
}

const runBuild = (workspace: WorkspacePackage): Promise<Readonly<{ ok: boolean; output: string }>> =>
  new Promise((settle) => {
    const child = spawn('bun', ['run', '--cwd', join('packages', workspace.directory), 'build'], {
      cwd: repositoryRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let output = ''
    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })
    child.stderr.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })
    child.on('error', (error) => settle({ ok: false, output: error.message }))
    child.on('close', (code) => settle({ ok: code === 0, output: output.trim() }))
  })

export type BuildResult = Readonly<{ package: string; built: boolean; ok: boolean; output: string }>

const recordPath = (workspace: WorkspacePackage) => join(cacheRoot, `${workspace.directory}.sha256`)

const buildOne = async (workspace: WorkspacePackage, fingerprint: string, force: boolean): Promise<BuildResult> => {
  const recorded = await readFile(recordPath(workspace), 'utf8').then(
    (text) => text.trim(),
    () => undefined
  )
  // The record alone is not evidence: someone can delete `dist` without touching a single input.
  const current = recorded === fingerprint && existsSync(join(repositoryRoot, 'packages', workspace.directory, 'dist'))
  if (current && !force) return { built: false, ok: true, output: '', package: workspace.name }

  // Clear the record before building, never after failing: an interrupted build must not leave one behind that
  // claims output it never produced is current.
  await rm(recordPath(workspace), { force: true })
  const { ok, output } = await runBuild(workspace)
  if (ok) await writeFile(recordPath(workspace), `${fingerprint}\n`)

  return { built: true, ok, output, package: workspace.name }
}

/** Build every package whose inputs moved, in dependency order, concurrently within each level. */
export async function buildPackages(force = false): Promise<readonly BuildResult[]> {
  await mkdir(cacheRoot, { recursive: true })

  const packages = workspacePackages()
  const fingerprints = await inputFingerprints(packages)
  const results: BuildResult[] = []

  for (const level of buildOrder(packages)) {
    const queue = [...level]
    const worker = async () => {
      for (let workspace = queue.shift(); workspace; workspace = queue.shift()) {
        results.push(await buildOne(workspace, fingerprints.get(workspace.name) as string, force))
      }
    }
    await Promise.all(Array.from({ length: Math.max(1, Math.min(availableParallelism(), level.length)) }, worker))

    // Nothing downstream can be built against output that was never produced, and reporting it as failing too would
    // bury the one failure that matters.
    if (results.some((result) => !result.ok)) break
  }

  return results
}

export const buildPackagesCli: CliSpec = {
  describe: 'Build every package whose inputs changed since its last build, in dependency order.',
  flags: {
    force: { describe: 'Build every package, whether or not its inputs changed.', kind: 'boolean', short: 'f' }
  },
  run: 'self:packages:build',
  script: 'scripts/build-packages.ts'
}

if (isDirectInvocation(import.meta.url)) {
  await runCli(buildPackagesCli, async (parsed) => {
    const results = await buildPackages(parsed.boolean('force'))
    const failed = results.filter((result) => !result.ok)
    const built = results.filter((result) => result.built && result.ok)

    for (const result of failed) console.error(`${result.package}\n${result.output}\n`)
    console.log(`${built.length} packages built, ${results.length - built.length - failed.length} already current.`)
    if (failed.length > 0) throw new Error(`${failed.length} packages do not build.`)
  })
}
