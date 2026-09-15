import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Alias } from 'vite'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))

type PackageManifest = Readonly<{
  name: string
  exports?: Readonly<Record<string, string | Readonly<Record<string, string>>>>
  dependencies?: Readonly<Record<string, string>>
  peerDependencies?: Readonly<Record<string, string>>
}>

export type WorkspaceEntryPoint = Readonly<{
  /** Specifier a consumer imports. */
  specifier: string
  /** Absolute pathname of the source file that becomes the published target. */
  source: string
}>

export type WorkspacePackage = Readonly<{
  /** Package name as a consumer imports it. */
  name: string
  /** Directory name beneath `packages/`. */
  directory: string
  /** Absolute pathname of the package's own source root. */
  source: string
  /** Every published specifier, resolved back to the source file it is built from. */
  entryPoints: readonly WorkspaceEntryPoint[]
  /** Sibling packages this one depends on, by name, so a build or a fingerprint can follow the graph. */
  dependencies: readonly string[]
}>

/** Resolve one published target back to the source file the build compiles into it. */
const sourceOf = (packageSource: string, target: string): string =>
  join(packageSource, target.replace(/^\.\/dist\//, '').replace(/\.d\.ts$|\.js$/, '.ts'))

const entryPointsOf = (manifest: PackageManifest, packageSource: string): readonly WorkspaceEntryPoint[] =>
  Object.entries(manifest.exports ?? {}).map(([subpath, target]) => ({
    source: sourceOf(packageSource, typeof target === 'string' ? target : (target.types ?? target.import ?? '')),
    specifier: subpath === '.' ? manifest.name : `${manifest.name}${subpath.slice(1)}`
  }))

/** Every reusable package in this repository, discovered from the workspace rather than a list to maintain. */
export const workspacePackages = (): readonly WorkspacePackage[] => {
  const declared = readdirSync(join(repositoryRoot, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const source = join(repositoryRoot, 'packages', entry.name, 'src')
      const manifest = JSON.parse(
        readFileSync(join(repositoryRoot, 'packages', entry.name, 'package.json'), 'utf8')
      ) as PackageManifest
      return { directory: entry.name, manifest, source }
    })

  // A dependency only belongs to the graph when the workspace itself owns it; everything else is an installed package.
  const owned = new Set(declared.map(({ manifest }) => manifest.name))

  return declared.map(({ directory, manifest, source }) => ({
    dependencies: Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies })
      .filter((name) => owned.has(name))
      .sort(),
    directory,
    entryPoints: entryPointsOf(manifest, source),
    name: manifest.name,
    source
  }))
}

/**
 * Resolve every published specifier to the source file it is built from, while testing.
 *
 * Each package publishes compiled `dist`, so without these aliases a suite in one package imports the last build of
 * its siblings. That makes a change to a shared package invisible until someone remembers to rebuild, and makes a
 * green run against a stale build indistinguishable from a green run against the working tree. Builds still happen —
 * `self:packages:build` proves the published shape — but no suite depends on one having happened first.
 *
 * The mapping comes from each package's own `exports`, because a published subpath need not be named after its source
 * file: `@infoschematics/view-model/tokens.css` is built from `src/tokens.generated.css`.
 *
 * `tsconfig.json` carries the same intent as `paths` for typechecking, and `tsconfig.build-base.json` clears it so a
 * published declaration still resolves its siblings through their entry points.
 */
export const workspaceSourceAliases = (): readonly Alias[] =>
  workspacePackages().flatMap(({ entryPoints }) =>
    entryPoints.map(({ specifier, source }) => ({
      // Exact specifiers: a bare string would prefix-match, sending every subpath to the package's own entry point.
      find: new RegExp(`^${specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
      replacement: source
    }))
  )
