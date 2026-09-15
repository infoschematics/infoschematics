import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { workspacePackages, workspaceSourceAliases } from './workspace-sources.ts'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))

const readJson = async (pathname: string) => JSON.parse(await readFile(`${repositoryRoot}${pathname}`, 'utf8'))

describe('workspace source resolution', () => {
  it('aliases every published specifier to the source it is built from', () => {
    const aliases = workspaceSourceAliases()

    for (const { entryPoints, name } of workspacePackages()) {
      expect(entryPoints.length, `${name} publishes nothing`).toBeGreaterThan(0)
      for (const { specifier, source } of entryPoints) {
        const matched = aliases.filter((alias) => alias.find instanceof RegExp && alias.find.test(specifier))
        // Exactly one alias may claim a specifier, or which source a test reads becomes a matter of ordering.
        expect(
          matched.map((alias) => alias.replacement),
          `${specifier} has no single source alias`
        ).toEqual([source])
        expect(existsSync(source), `${specifier} resolves to ${source}, which does not exist`).toBe(true)
      }
    }
  })

  it('maps the same packages through tsconfig paths, and never through a build configuration', async () => {
    const check = await readJson('tsconfig.json')
    const build = await readJson('tsconfig.build-base.json')

    for (const { directory, entryPoints, name } of workspacePackages()) {
      const subpath = check.compilerOptions.paths[`${name}/*`]
      expect(subpath, `${name} has no typechecking path`).toBeTruthy()
      expect(subpath[0]).toBe(`./packages/${directory}/src/*.ts`)
      const root = entryPoints.find((entry) => entry.specifier === name)
      if (root) expect(check.compilerOptions.paths[name]).toEqual([`./packages/${directory}/src/index.ts`])
    }

    // A published declaration must resolve siblings through their entry points, not through this repository's layout.
    expect(build.compilerOptions.paths).toEqual({})
  })

  it('declares every workspace to the orchestrator, so none escapes the graph', async () => {
    const turbo = await readJson('turbo.json')
    const workspaces = (
      await Promise.all(
        ['packages', 'apps', 'examples'].map(async (owner) =>
          (
            await readdir(`${repositoryRoot}${owner}`, { withFileTypes: true })
          )
            .filter((entry) => entry.isDirectory())
            .map((entry) => `${owner}/${entry.name}`)
        )
      )
    ).flat()

    expect(workspaces.length).toBeGreaterThan(0)
    for (const workspace of workspaces) {
      const manifest = await readJson(`${workspace}/package.json`)
      // A workspace missing one of these is simply skipped by `turbo run`, silently and with a green result.
      for (const task of ['typecheck', 'test']) {
        expect(Object.keys(manifest.scripts), `${workspace} declares no ${task}`).toContain(task)
        expect(Object.keys(turbo.tasks), `turbo.json declares no ${task}`).toContain(task)
      }
      expect(existsSync(`${repositoryRoot}${workspace}/tsconfig.json`), `${workspace} has no tsconfig`).toBe(true)
    }
  })

  it('keeps workspace packages out of the root manifest, where they would flatten the graph', async () => {
    const root = await readJson('package.json')
    const declared = Object.keys({ ...root.dependencies, ...root.devDependencies }).filter((name) =>
      workspacePackages().some((workspace) => workspace.name === name)
    )

    // Turborepo attributes the root package's dependencies to every workspace, so one entry here makes each package
    // appear to depend on it: editing any package would then invalidate all of them, and the graph would say nothing.
    // Repository scripts import the packages they use from source, exactly as the generators already do.
    expect(declared, 'the root manifest depends on workspace packages').toEqual([])
  })
})
