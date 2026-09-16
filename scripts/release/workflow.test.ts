import { readFile } from 'node:fs/promises'

import { describe, expect, it } from 'vitest'

import { releaseNpmFloor, releasePackages } from './packages.ts'

const workflowPath = new URL('../../.github/workflows/release-npm.yml', import.meta.url)
const workflow = await readFile(workflowPath, 'utf8')

/**
 * The workflow states its package set as plain shell arrays rather than computing it, because a
 * release emergency is the worst moment to read a workflow that decides its own package list. A
 * stated list is only safe while something checks the statement: these arrays once named seven of
 * the eight published packages, and every gate stayed green because nothing read the workflow.
 *
 * So the extraction is deliberately strict. An array that cannot be found, or that is found empty,
 * is an error rather than an empty result — a lenient parser would report agreement loudest at the
 * moment the workflow stopped naming anything at all.
 */
const shellArray = (source: string, name: string): readonly string[] => {
  const declaration = new RegExp(`^[ \\t]*${name}=\\(\\n([^)]*?)^[ \\t]*\\)`, 'm').exec(source)
  if (!declaration?.[1]) throw new Error(`Release workflow declares no ${name} array.`)

  const entries = declaration[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  if (entries.length === 0) throw new Error(`Release workflow declares an empty ${name} array.`)
  return entries
}

/** The floor the workflow refuses to publish below, stated once as a shell assignment. */
const assertedNpmFloor = (source: string): string => {
  const assignment = /^[ \t]*npm_floor="([^"]+)"/m.exec(source)
  if (!assignment?.[1]) throw new Error('Release workflow asserts no npm floor.')
  return assignment[1]
}

const directories = releasePackages.map(({ directory }) => directory)

describe('release workflow package set', () => {
  it('checks the version of every canonical package, dependency-first', () => {
    expect(shellArray(workflow, 'package_manifests')).toEqual(
      directories.map((directory) => `${directory}/package.json`)
    )
  })

  it('publishes every canonical package, dependency-first', () => {
    expect(shellArray(workflow, 'package_directories')).toEqual(directories)
  })

  it('refuses a workflow whose stated set has silently lost a package', () => {
    const short = workflow.replaceAll('packages/cli\n', '').replaceAll('packages/cli/package.json\n', '')

    expect(shellArray(short, 'package_manifests')).not.toEqual(
      directories.map((directory) => `${directory}/package.json`)
    )
    expect(shellArray(short, 'package_directories')).not.toEqual(directories)
  })

  it('refuses a workflow that states no package set at all', () => {
    const renamed = workflow.replaceAll('package_manifests=(', 'unrelated_array=(')

    expect(() => shellArray(renamed, 'package_manifests')).toThrow(/no package_manifests array/)
    expect(() => shellArray('publish: true\n', 'package_directories')).toThrow(/no package_directories array/)
    expect(() => shellArray('  package_directories=(\n\n  )\n', 'package_directories')).toThrow(
      /empty package_directories array/
    )
  })
})

describe('release workflow publishing floor', () => {
  it('asserts the canonical npm floor', () => {
    expect(assertedNpmFloor(workflow)).toBe(releaseNpmFloor)
  })

  it('asserts the floor before spending the repository gate', () => {
    expect(workflow.indexOf('npm_floor="')).toBeGreaterThan(-1)
    expect(workflow.indexOf('npm_floor="')).toBeLessThan(workflow.indexOf('bun run self:check'))
  })

  it('refuses a workflow that states no floor', () => {
    expect(() => assertedNpmFloor('publish: true\n')).toThrow(/asserts no npm floor/)
  })
})
