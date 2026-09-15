import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { typecheckProjects } from './typecheck.ts'
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

  it('typechecks every project that has a TypeScript configuration', async () => {
    const owners = ['packages', 'apps', 'examples']
    const directories = await Promise.all(
      owners.map(async (owner) =>
        (await readdir(`${repositoryRoot}${owner}`, { withFileTypes: true }))
          .filter((entry) => entry.isDirectory())
          .map((entry) => `${owner}/${entry.name}`)
      )
    )

    const configured: string[] = []
    for (const project of directories.flat()) {
      const present = await readFile(`${repositoryRoot}${project}/tsconfig.json`, 'utf8').then(
        () => true,
        () => false
      )
      if (present) configured.push(project)
    }

    expect(configured.length).toBeGreaterThan(0)
    expect([...typecheckProjects].sort()).toEqual([...configured, 'tsconfig.scripts.json'].sort())
  })
})
