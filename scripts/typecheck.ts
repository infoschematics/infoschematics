#!/usr/bin/env bun
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { availableParallelism } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type CliSpec, isDirectInvocation, runCli } from './cli.ts'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))

/**
 * Every TypeScript project this repository checks, in dependency order.
 *
 * The order only affects which failure a reader sees first; the checks are independent, because each project reads
 * its dependencies' emitted declarations rather than their sources.
 */
export const typecheckProjects: readonly string[] = [
  'packages/domain-model',
  'packages/domain-core',
  'packages/view-model',
  'packages/render-svg',
  'packages/cli',
  'packages/view-canvas',
  'packages/view-present',
  'packages/view-studio',
  'examples/is-blank',
  'examples/is-infoschematics',
  'examples/is-system',
  'apps/site',
  'tsconfig.scripts.json'
]

const buildInfoRoot = join(repositoryRoot, 'node_modules/.cache/infoschematics-typecheck')

const buildInfoPath = (project: string) => join(buildInfoRoot, `${project.replace(/[/.]/g, '-')}.tsbuildinfo`)

export type TypecheckResult = Readonly<{ project: string; ok: boolean; output: string }>

/**
 * Check one project, reusing its build information so an unchanged project reports in well under a second.
 *
 * `--noEmit --incremental` is the least-change detection available without restructuring every package as a
 * composite project: `tsc` compares its recorded file versions and re-checks only what moved.
 */
const checkProject = (project: string): Promise<TypecheckResult> =>
  new Promise((settle) => {
    // The workspace binary, not whatever `tsc` a machine happens to have on its path: a different compiler reports
    // different errors, and one that cannot resolve this repository's types reports errors that are not there.
    const child = spawn(
      join(repositoryRoot, 'node_modules/.bin/tsc'),
      [
        '--noEmit',
        '--incremental',
        '--tsBuildInfoFile',
        buildInfoPath(project),
        '-p',
        resolve(repositoryRoot, project)
      ],
      { cwd: repositoryRoot, stdio: ['ignore', 'pipe', 'pipe'] }
    )

    let output = ''
    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })
    child.stderr.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })
    child.on('error', (error) => settle({ ok: false, output: error.message, project }))
    child.on('close', (code) => settle({ ok: code === 0, output: output.trim(), project }))
  })

/** Check every project concurrently and report every failure rather than only the first. */
export async function typecheckAll(
  projects: readonly string[] = typecheckProjects,
  parallelism = Math.max(1, Math.min(availableParallelism(), projects.length))
): Promise<readonly TypecheckResult[]> {
  await mkdir(buildInfoRoot, { recursive: true })

  const queue = [...projects]
  const results: TypecheckResult[] = []
  const worker = async () => {
    for (let project = queue.shift(); project; project = queue.shift()) {
      results.push(await checkProject(project))
    }
  }

  await Promise.all(Array.from({ length: parallelism }, worker))
  return projects.map((project) => results.find((result) => result.project === project)).filter((result) => !!result)
}

export const typecheckCli: CliSpec = {
  describe: 'Typecheck every TypeScript project in this repository, concurrently and incrementally.',
  flags: {},
  run: 'self:verify:typecheck',
  script: 'scripts/typecheck.ts'
}

if (isDirectInvocation(import.meta.url)) {
  await runCli(typecheckCli, async () => {
    const results = await typecheckAll()
    const failed = results.filter((result) => !result.ok)

    for (const result of failed) console.error(`${result.project}\n${result.output}\n`)
    console.log(`${results.length - failed.length}/${results.length} TypeScript projects check cleanly.`)
    if (failed.length > 0) throw new Error(`${failed.length} TypeScript projects do not typecheck.`)
  })
}
