import { existsSync, statSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { releaseNodeEngine } from './release/packages.ts'

/**
 * The repository's own command surface, read as a whole rather than one command at a time.
 *
 * Every finding this file asserts was first found by reading `package.json`, `turbo.json`, `.husky/pre-commit`, and
 * `scripts/` by hand, which is exactly the audit that had never been done. An inventory written as prose goes stale
 * the next time a feature adds a command; written as a test it fails instead, so the surface cannot quietly grow a
 * second entry point, a command nothing invokes, or a command whose target no longer exists.
 *
 * `GDR-INFOSCHEMATICS-005` records the naming regime these cases enforce.
 */

const repositoryRoot = new URL('..', import.meta.url)

const read = (relative: string) => readFile(new URL(relative, repositoryRoot), 'utf8')

const within = (relative: string) => fileURLToPath(new URL(relative, repositoryRoot))

const isFile = (relative: string) => existsSync(within(relative)) && statSync(within(relative)).isFile()

const isDirectory = (relative: string) => existsSync(within(relative)) && statSync(within(relative)).isDirectory()

type Manifest = Readonly<{
  devDependencies?: Readonly<Record<string, string>>
  scripts?: Readonly<Record<string, string>>
}>

const rootManifest = JSON.parse(await read('package.json')) as Manifest
const rootScripts = rootManifest.scripts ?? {}
const turboTasks = Object.keys((JSON.parse(await read('turbo.json')) as { tasks: object }).tasks)
const preCommit = await read('.husky/pre-commit')
const readme = await read('README.md')

const workspaceDirectories = (
  await Promise.all(
    ['apps', 'examples', 'packages'].map(async (root) =>
      (
        await readdir(within(root), { withFileTypes: true })
      )
        .filter((entry) => entry.isDirectory())
        .map((entry) => `${root}/${entry.name}`)
    )
  )
).flat()

/** Every workspace manifest, so a task name can be recognised as one a workspace actually declares. */
const workspaceScripts = new Map<string, Readonly<Record<string, string>>>(
  await Promise.all(
    workspaceDirectories.map(
      async (workspace) =>
        [workspace, (JSON.parse(await read(`${workspace}/package.json`)) as Manifest).scripts ?? {}] as const
    )
  )
)

const everyWorkspaceTask = new Set([...workspaceScripts.values()].flatMap((scripts) => Object.keys(scripts)))

/** Each `scripts/` module, whether it is a command, a library, or a test. */
const scriptModules = async (directory = 'scripts'): Promise<readonly string[]> => {
  const entries = await readdir(within(directory), { withFileTypes: true })
  const nested = await Promise.all(
    entries.filter((entry) => entry.isDirectory()).map((entry) => scriptModules(`${directory}/${entry.name}`))
  )
  return [
    ...entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
      .map((entry) => `${directory}/${entry.name}`),
    ...nested.flat()
  ]
}

const modules = await scriptModules()

/**
 * A command is a module that runs itself when it is the process entry point, by either guard the repository uses.
 *
 * A library under `scripts/` has no guard and is reached only by import, so it needs no invoker of its own.
 */
const commandModules = (
  await Promise.all(
    modules
      .filter((module) => !module.endsWith('.test.ts'))
      .map(async (module) => [module, await read(module)] as const)
  )
)
  .filter(([, source]) => /isDirectInvocation\(import\.meta\.url\)|import\.meta\.main/.test(source))
  .map(([module]) => module)

/** One thing a root script names, and the kind of thing it has to be for the script to run at all. */
type Target = Readonly<
  | { kind: 'binary'; name: string }
  | { kind: 'directory'; name: string }
  | { kind: 'file'; name: string }
  | { kind: 'rootScript'; name: string }
  | { kind: 'task'; name: string }
  | { kind: 'workspaceScript'; name: string; workspace: string }
>

const valueAfter = (words: readonly string[], flag: string) => {
  const at = words.indexOf(flag)
  return at >= 0 ? words[at + 1] : undefined
}

const operands = (words: readonly string[]) => words.filter((word) => !word.startsWith('-'))

/**
 * Read one command segment for the things it depends on existing.
 *
 * Deliberately literal about the handful of launchers the surface uses: a segment whose launcher is unrecognised is
 * reported as a binary, so a new kind of command fails this file rather than slipping past an over-general parser.
 */
const targetsOf = (segment: string): readonly Target[] => {
  const words = segment.trim().split(/\s+/).filter(Boolean)
  const [launcher, ...rest] = words
  if (!launcher) return []

  switch (launcher) {
    case 'turbo':
      // `turbo run <task>... [--flag]`: every operand before the first flag is a task name.
      return [
        { kind: 'binary', name: 'turbo' },
        ...operands(rest.slice(1)).map((name) => ({ kind: 'task', name }) as const)
      ]
    case 'bun':
      if (rest[0] !== 'run') {
        // `bun install` and `bun update --latest` act on the dependency tree itself, so neither names a file target.
        return rest[0] === 'install' || rest[0] === 'update' ? [] : rest[0] ? [{ kind: 'file', name: rest[0] }] : []
      }
      if (rest[1] === '--cwd' && rest[2] && rest[3]) {
        return [{ kind: 'workspaceScript', name: rest[3], workspace: rest[2] }]
      }
      return rest[1] ? [{ kind: 'rootScript', name: rest[1] }] : []
    case 'bunx':
      return rest[0] ? [{ kind: 'binary', name: rest[0] }] : []
    case 'depcruise': {
      const configuration = valueAfter(rest, '--config')
      return [
        { kind: 'binary', name: 'depcruise' },
        ...(configuration ? [{ kind: 'file', name: configuration } as const] : []),
        ...operands(rest)
          .filter((operand) => operand !== configuration)
          .map((name) => ({ kind: name.endsWith('.ts') ? 'file' : 'directory', name }) as const)
      ]
    }
    case 'tsc': {
      const project = valueAfter(rest, '-p') ?? valueAfter(rest, '--project')
      return [{ kind: 'binary', name: 'tsc' }, ...(project ? [{ kind: 'file', name: project } as const] : [])]
    }
    case 'vitest': {
      const root = valueAfter(rest, '--root')
      return [{ kind: 'binary', name: 'vitest' }, ...(root ? [{ kind: 'directory', name: root } as const] : [])]
    }
    case 'rm':
      // Removing something that is already absent is the intended outcome, so a path here names no requirement.
      return []
    default:
      return [{ kind: 'binary', name: launcher }]
  }
}

const targetsIn = (command: string) => command.split(/&&|\|\|/).flatMap(targetsOf)

/** Why a target cannot be reached, or `undefined` when it can. */
const unreachable = (target: Target): string | undefined => {
  switch (target.kind) {
    case 'binary':
      return isFile(`node_modules/.bin/${target.name}`) ? undefined : `no ${target.name} on the installed path`
    case 'directory':
      return isDirectory(target.name) ? undefined : `no directory ${target.name}`
    case 'file':
      return isFile(target.name) ? undefined : `no file ${target.name}`
    case 'rootScript':
      return target.name in rootScripts ? undefined : `no root script ${target.name}`
    case 'task':
      return turboTasks.includes(target.name) ||
        turboTasks.includes(`//#${target.name}`) ||
        everyWorkspaceTask.has(target.name)
        ? undefined
        : `no task ${target.name}`
    case 'workspaceScript':
      return workspaceScripts.get(target.workspace)?.[target.name]
        ? undefined
        : `no ${target.name} script in ${target.workspace}`
  }
}

/**
 * The command surface section of `README.md`, which is where a contributor looks for the list.
 *
 * A command that is in the manifest and not in that section is either undiscoverable or dead, and the two are
 * indistinguishable from outside, so both fail here.
 */
const commandSurface = (() => {
  const heading = '### Command surface'
  const start = readme.indexOf(heading)
  if (start < 0) return ''
  const section = readme.slice(start + heading.length)
  const next = section.search(/\n#{2,3} /)
  return next < 0 ? section : section.slice(0, next)
})()

/** `prepare` is a package lifecycle name that the package manager runs, not a command anyone types. */
const lifecycleScripts = new Set(['prepare'])

/**
 * The verbs this repository's commands use.
 *
 * Only needed to catch the one inversion `GDR-INFOSCHEMATICS-005` rules out: a verb standing where the subject
 * belongs, which is how `self:verify:visual-tokens` came to name the same subject as `self:tokens:generate`
 * differently. A verb the list does not know is a subject as far as this case is concerned, which is the safe way
 * round — it never invents a violation.
 */
const verbs = new Set([
  'build',
  'check',
  'clean',
  'deploy',
  'dev',
  'generate',
  'preview',
  'render',
  'test',
  'typecheck',
  'update',
  'verify'
])

describe('the repository command surface', () => {
  it('invokes every command under scripts/', () => {
    const invoked = new Set(
      Object.values(rootScripts)
        .flatMap(targetsIn)
        .filter((target) => target.kind === 'file')
        .map((target) => target.name)
    )

    const orphaned = commandModules.filter(
      (module) => !invoked.has(module) && !preCommit.includes(module) && !commandSurface.includes(module)
    )
    expect(orphaned).toEqual([])
  })

  it('names a reachable target from every root script', () => {
    const broken = Object.entries(rootScripts).flatMap(([name, command]) =>
      targetsIn(command)
        .map(unreachable)
        .filter((reason): reason is string => reason !== undefined)
        .map((reason) => `${name}: ${reason}`)
    )
    expect(broken).toEqual([])
  })

  it('documents every root script in the command surface', () => {
    const undocumented = Object.keys(rootScripts).filter(
      (name) => !lifecycleScripts.has(name) && !commandSurface.includes(`\`${name}\``)
    )
    expect(undocumented).toEqual([])
  })

  it('backs every root task in turbo.json with a root script', () => {
    const dangling = turboTasks
      .filter((task) => task.startsWith('//#'))
      .map((task) => task.slice(3))
      .filter((name) => !(name in rootScripts))
    expect(dangling).toEqual([])
  })

  it('passes a bare name straight through to the task it is named after', () => {
    const notPassthrough = Object.keys(rootScripts).filter(
      (name) =>
        !lifecycleScripts.has(name) &&
        !name.startsWith('ki:') &&
        !name.startsWith('self:') &&
        !(rootScripts[name] ?? '').startsWith(`turbo run ${name}`)
    )
    expect(notPassthrough).toEqual([])
  })

  it('orders a repository-owned name subject first, then verb', () => {
    const inverted = Object.keys(rootScripts)
      .filter((name) => name.startsWith('self:'))
      .map((name) => name.split(':'))
      .filter((parts) => parts.some((part) => part.length === 0) || (parts.length > 2 && verbs.has(parts[1] ?? '')))
      .map((parts) => parts.join(':'))
    expect(inverted).toEqual([])
  })

  it('pairs every generator with a check that runs the same script', () => {
    const generators = Object.keys(rootScripts).filter((name) => name.endsWith(':generate'))
    expect(generators.length).toBeGreaterThan(0)

    for (const generator of generators) {
      const verifier = `${generator.slice(0, -':generate'.length)}:verify`
      expect(rootScripts, `${generator} has no ${verifier}`).toHaveProperty(verifier)
      expect(rootScripts[verifier]).toBe(`${rootScripts[generator]} --check`)
    }
  })
})

/**
 * `ki:deps:update` is a mandated Knowledge Islands capability command with a mandated shape — the blanket
 * `bun update --latest` — so it cannot be taught about a hold. The hold is therefore enforced against the tree the
 * command would leave behind: a blanket update that carries `@types/node` past the Node line the published packages
 * promise fails here rather than passing silently, because nothing else in the repository reads that range.
 */
describe('the dependency hold the blanket update would cross', () => {
  const floor = Number(releaseNodeEngine.replace(/[^\d.]/g, '').split('.')[0])

  it('keeps the blanket update command in its mandated shape', () => {
    expect(rootScripts['ki:deps:update']).toBe('bun update --latest')
  })

  it('still declares the hold it is enforcing', async () => {
    expect(await read('.ki.toml')).toMatch(/dependency_holds = \[[^\]]*@types\/node/)
  })

  it('holds @types/node at the Node line the published packages promise', () => {
    const declared = rootManifest.devDependencies?.['@types/node']
    expect(declared).toBeTypeOf('string')
    const major = Number((declared ?? '').replace(/[^\d.]/g, '').split('.')[0])
    expect(
      major,
      `@types/node is ${declared}; GDR-INFOSCHEMATICS-004 holds it at ${floor} until releaseNodeEngine moves`
    ).toBe(floor)
  })
})
