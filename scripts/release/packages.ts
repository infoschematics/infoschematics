import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export type ReleasePackage = Readonly<{
  cssExports: readonly string[]
  directory: string
  name: string
}>

/** Fixed public package set in deterministic dependency-first build order. */
export const releasePackages: readonly ReleasePackage[] = Object.freeze([
  { cssExports: [], directory: 'packages/domain-model', name: '@infoschematics/domain-model' },
  { cssExports: [], directory: 'packages/domain-core', name: '@infoschematics/domain-core' },
  { cssExports: ['./tokens.css'], directory: 'packages/view-model', name: '@infoschematics/view-model' },
  { cssExports: [], directory: 'packages/render-svg', name: '@infoschematics/render-svg' },
  { cssExports: ['./styles.css'], directory: 'packages/view-canvas', name: '@infoschematics/view-canvas' },
  { cssExports: ['./styles.css'], directory: 'packages/view-present', name: '@infoschematics/view-present' },
  { cssExports: ['./styles.css'], directory: 'packages/view-studio', name: '@infoschematics/view-studio' },
])

export const releasePackageNames = new Set(releasePackages.map(({ name }) => name))
export const releaseRepositoryUrl = 'git+https://github.com/infoschematics/infoschematics.git'

export type PackageManifest = Readonly<{
  dependencies?: Readonly<Record<string, string>>
  description?: string
  devDependencies?: Readonly<Record<string, string>>
  engines?: Readonly<Record<string, string>>
  exports?: Readonly<Record<string, unknown>> | string
  files?: readonly string[]
  license?: string
  name?: string
  optionalDependencies?: Readonly<Record<string, string>>
  peerDependencies?: Readonly<Record<string, string>>
  private?: boolean
  publishConfig?: Readonly<{ access?: string }>
  repository?: string | Readonly<{ directory?: string; type?: string; url?: string }>
  type?: string
  version?: string
  [key: string]: unknown
}>

export const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))

export async function readReleaseManifests(root = repositoryRoot) {
  return Promise.all(
    releasePackages.map(async (entry) => {
      const path = resolve(root, entry.directory, 'package.json')
      const manifest = JSON.parse(await readFile(path, 'utf8')) as PackageManifest
      return { entry, manifest, path }
    }),
  )
}

const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
const dependencySections = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'] as const

export function validateReleaseManifests(
  packages: readonly Readonly<{ entry: ReleasePackage; manifest: PackageManifest; path?: string }>[],
): string[] {
  const errors: string[] = []
  const byName = new Map(packages.map((entry) => [entry.manifest.name, entry]))
  const versions = new Set<string>()

  if (packages.length !== releasePackages.length) {
    errors.push(`Expected exactly ${releasePackages.length} release packages; received ${packages.length}.`)
  }

  for (const expected of releasePackages) {
    const found = byName.get(expected.name)
    if (!found) {
      errors.push(`Missing release package ${expected.name}.`)
      continue
    }
    const { manifest } = found
    const location = found.path ?? expected.directory
    if (manifest.name !== expected.name) errors.push(`${location}: package name must be ${expected.name}.`)
    if (!manifest.version || !semver.test(manifest.version)) errors.push(`${location}: version must be fixed semver.`)
    else versions.add(manifest.version)
    if (manifest.private === true) errors.push(`${location}: public release package cannot be private.`)
    if (!manifest.description?.trim()) errors.push(`${location}: description is required.`)
    if (manifest.license !== 'MIT') errors.push(`${location}: license must be MIT.`)
    if (manifest.type !== 'module') errors.push(`${location}: type must be module.`)
    if (!manifest.exports || typeof manifest.exports !== 'object') errors.push(`${location}: exports map is required.`)
    if (typeof manifest.repository !== 'object' || manifest.repository.url !== releaseRepositoryUrl) {
      errors.push(`${location}: repository.url must be ${releaseRepositoryUrl}.`)
    }
    if (typeof manifest.repository !== 'object' || manifest.repository.directory !== expected.directory) {
      errors.push(`${location}: repository.directory must be ${expected.directory}.`)
    }
    if (manifest.engines?.node !== '>=22') errors.push(`${location}: engines.node must be >=22.`)
    if (manifest.publishConfig?.access !== 'public') errors.push(`${location}: publishConfig.access must be public.`)
  }

  if (versions.size > 1) errors.push(`Release package versions must move together; found ${[...versions].sort().join(', ')}.`)
  const coordinatedVersion = versions.size === 1 ? [...versions][0] : undefined
  const buildPosition = new Map(releasePackages.map(({ name }, index) => [name, index]))

  for (const { entry, manifest, path } of packages) {
    for (const section of dependencySections) {
      for (const [dependency, range] of Object.entries(manifest[section] ?? {})) {
        if (!releasePackageNames.has(dependency)) continue
        if ((buildPosition.get(dependency) ?? Number.MAX_SAFE_INTEGER) >= (buildPosition.get(entry.name) ?? -1)) {
          errors.push(`${path ?? entry.directory}: ${dependency} must precede ${entry.name} in release build order.`)
        }
        if (!coordinatedVersion || range !== coordinatedVersion) {
          errors.push(
            `${path ?? entry.directory}: ${section}.${dependency} must equal coordinated version ${coordinatedVersion ?? '(unresolved)'}, received ${range}.`,
          )
        }
      }
    }
  }

  return errors
}

export function coordinatedVersion(
  packages: readonly Readonly<{ manifest: PackageManifest }>[],
): string | undefined {
  const versions = new Set(packages.map(({ manifest }) => manifest.version).filter((value): value is string => !!value))
  return versions.size === 1 ? [...versions][0] : undefined
}
