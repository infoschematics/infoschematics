#!/usr/bin/env bun

import { spawn } from 'node:child_process'
import { type CliSpec, isDirectInvocation, runCli } from './cli.ts'

/**
 * Why this repository runs Knip through a wrapper rather than straight from a script line.
 *
 * `GEN-1` of the engineering standard requires the managed discovery surfaces — Biome, Knip, and the Markdown linter —
 * to exclude the same paths, and `.claude/skills` and `.agents/skills` are two of them. Knip's own root project glob is
 * `scripts/**\/*.ts`, so those ignore entries match nothing it would otherwise have read, and it reports each one as a
 * configuration hint asking for its removal. Taking that advice breaks the cross-tool contract, which is why the
 * standard says the hint is expected and not an instruction; `--treat-config-hints-as-errors` cannot tell the two
 * apart, so it fails the repository for holding the line it was told to hold.
 *
 * This command therefore sanctions exactly those two hints by name and treats every other hint, and every issue, as a
 * failure — which keeps the strictness the flag was there for without keeping its one wrong answer.
 */
const sanctioned: Readonly<Record<string, string>> = {
  '.agents/skills': 'a managed discovery surface GEN-1 requires every tool to exclude',
  '.claude/skills': 'a managed discovery surface GEN-1 requires every tool to exclude'
}

/** How Knip's default reporter renders a sanctioned ignore entry: the path, the file it came from, and the advice. */
const hintRow = (path: string) => new RegExp(`^${path.replace(/[.]/g, '\\.')}\\s+knip\\.json\\s+Remove from ignore$`)

const hints = 'Configuration hints'

export type Section = Readonly<{ rows: readonly string[]; title: string }>

/** Split Knip's report into its `Title (count)` sections, which is the only structure its default reporter has. */
export const sections = (output: string): readonly Section[] => {
  const parsed: { rows: string[]; title: string }[] = []
  for (const line of output.split('\n')) {
    const row = line.trim()
    const heading = /^(.+?) \((\d+)\)$/.exec(row)
    if (heading) parsed.push({ rows: [], title: heading[1] as string })
    else if (row) parsed[parsed.length - 1]?.rows.push(row)
  }
  return parsed
}

/**
 * Why this run is not a pass, or nothing when it is.
 *
 * Kept separate from running Knip so every verdict can be exercised against a report this repository does not
 * currently produce. The demand that the sanctioned hints are *present* is the assertion about the command's own
 * coverage that `AGENTS.md` requires: a wrapper that only ever subtracts would keep passing if the ignore entries were
 * dropped from `knip.json`, or if Knip reworded the hint and the sanction stopped matching anything — both of which
 * are the cross-tool contract quietly lapsing, and both of which fail here instead.
 */
export const assess = (report: string, status: number): readonly string[] => {
  const parsed = sections(report)
  const reasons = parsed
    .filter((section) => section.title !== hints)
    .map((section) => `${section.title.toLowerCase()}: ${section.rows.join(', ')}`)

  const reported = parsed.find((section) => section.title === hints)?.rows ?? []
  for (const [path, why] of Object.entries(sanctioned)) {
    if (!reported.some((row) => hintRow(path).test(row))) {
      reasons.push(
        `knip no longer reports the sanctioned hint for ${path}, ${why}: either the entry has gone from knip.json or the hint has been reworded, and this command cannot vouch for either`
      )
    }
  }
  for (const row of reported) {
    if (!Object.keys(sanctioned).some((path) => hintRow(path).test(row))) {
      reasons.push(`unsanctioned configuration hint: ${row}`)
    }
  }

  if (reasons.length === 0 && status !== 0) reasons.push(`knip exited ${status} without reporting anything`)
  return reasons
}

/**
 * Run Knip over the workspace and return its whole report, whatever it found.
 *
 * Knip splits its report across both streams: issues go to standard output and configuration hints to standard error,
 * so a wrapper that reads only the first sees an empty report and passes a repository it never looked at. Both are
 * captured, and the hint check below is what proves the second stream was read.
 */
const knip = async (): Promise<{ report: string; status: number }> => {
  const run = spawn('bunx', ['knip', '--no-progress'], { stdio: ['ignore', 'pipe', 'pipe'] })
  const chunks: Buffer[] = []
  run.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
  run.stderr.on('data', (chunk: Buffer) => chunks.push(chunk))
  const status = await new Promise<number>((settle) => run.on('close', (code) => settle(code ?? 1)))
  return { report: Buffer.concat(chunks).toString('utf8'), status }
}

export const spec: CliSpec = {
  describe: 'Report unused files, dependencies and exports, sanctioning only the shared exclusions GEN-1 requires.',
  flags: {
    report: { describe: "Print Knip's report as well as the verdict.", kind: 'boolean' }
  },
  run: 'self:unused:verify',
  script: 'scripts/unused.ts'
}

if (isDirectInvocation(import.meta.url)) {
  await runCli(spec, async (parsed) => {
    const { report, status } = await knip()
    if (parsed.boolean('report')) console.log(report.trimEnd())

    const failures = assess(report, status)
    if (failures.length > 0) {
      if (!parsed.boolean('report')) console.log(report.trimEnd())
      throw new Error(`Knip is not satisfied:\n- ${failures.join('\n- ')}`)
    }
    console.log(`No unused files, dependencies or exports, with ${Object.keys(sanctioned).length} sanctioned hints.`)
  })
}
