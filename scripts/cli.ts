/**
 * Shared command-line conventions for this repository's scripts.
 *
 * Every script under `scripts/` is a real command: it runs directly (`./scripts/<name>.ts`), describes itself with
 * `--help`, rejects unknown flags, and exits 0 on success, 1 on failure, and 2 on misuse.
 */

import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/** Misuse of the command line, reported with usage rather than as a runtime failure. */
export class CliUsageError extends Error {
  override readonly name = 'CliUsageError'
}

export type FlagSpec = Readonly<{
  describe: string
  kind: 'boolean' | 'number' | 'string'
  /** Single-character alias, without its leading dash. */
  short?: string
  /** Value placeholder shown in help. Defaults to the flag kind. */
  value?: string
}>

export type CliSpec = Readonly<{
  describe: string
  flags: Readonly<Record<string, FlagSpec>>
  /** Operand shape shown in the usage line, when the command takes any. */
  operands?: Readonly<{ describe: string; name: string }>
  /** `package.json` script key that delegates to this command, when one exists. */
  run?: string
  /** Repository-relative pathname of the command itself. */
  script: string
}>

export type ParsedCli = Readonly<{
  boolean: (flag: string) => boolean
  help: boolean
  number: (flag: string) => number | undefined
  operands: readonly string[]
  string: (flag: string) => string | undefined
}>

const helpFlag: FlagSpec = { describe: 'Show this message.', kind: 'boolean', short: 'h' }

const specFlags = (spec: CliSpec): Readonly<Record<string, FlagSpec>> => ({ ...spec.flags, help: helpFlag })

const flagName = (spec: CliSpec, token: string) => {
  if (token.startsWith('--')) return token.slice(2)
  const short = token.slice(1)
  const matched = Object.entries(specFlags(spec)).find(([, flag]) => flag.short === short)
  if (!matched) throw new CliUsageError(`Unknown option ${token}.`)
  return matched[0]
}

/** Render the `--help` text from a command's own specification. */
export const formatUsage = (spec: CliSpec): string => {
  const flags = specFlags(spec)
  const operands = spec.operands ? ` [${spec.operands.name}...]` : ''
  const invocations = [`Usage: ${spec.script}${operands} [options]`]
  if (spec.run) invocations.push(`   or: bun run ${spec.run} --${operands} [options]`)

  const rendered = Object.entries(flags).map(([name, flag]) => {
    const alias = flag.short ? `-${flag.short}, ` : '    '
    const value = flag.kind === 'boolean' ? '' : ` <${flag.value ?? flag.kind}>`
    return [`  ${alias}--${name}${value}`, flag.describe] as const
  })
  const column = Math.max(...rendered.map(([left]) => left.length)) + 2

  return [
    spec.describe,
    '',
    ...invocations,
    ...(spec.operands ? ['', `  ${spec.operands.name}: ${spec.operands.describe}`] : []),
    '',
    'Options:',
    ...rendered.map(([left, describe]) => `${left.padEnd(column)}${describe}`)
  ].join('\n')
}

/** Parse `argv` against a command's specification, rejecting unknown flags and missing or malformed values. */
export function parseCli(spec: CliSpec, argv: readonly string[]): ParsedCli {
  const flags = specFlags(spec)
  const values = new Map<string, boolean | number | string>()
  const operands: string[] = []
  let terminated = false

  for (let at = 0; at < argv.length; at += 1) {
    const token = argv[at] as string
    if (terminated || token === '-' || !token.startsWith('-')) {
      operands.push(token)
      continue
    }
    if (token === '--') {
      terminated = true
      continue
    }

    const [head, ...rest] = token.split('=')
    const name = flagName(spec, head as string)
    const flag = flags[name]
    if (!flag) throw new CliUsageError(`Unknown option ${head}.`)

    const inline = rest.length > 0 ? rest.join('=') : undefined
    if (flag.kind === 'boolean') {
      if (inline !== undefined) throw new CliUsageError(`--${name} takes no value.`)
      values.set(name, true)
      continue
    }

    if (inline === undefined) at += 1
    const raw = inline ?? argv[at]
    if (raw === undefined) throw new CliUsageError(`--${name} needs a value.`)
    if (flag.kind === 'number') {
      const parsed = Number(raw)
      if (!Number.isFinite(parsed)) throw new CliUsageError(`--${name} needs a number, received ${raw}.`)
      values.set(name, parsed)
      continue
    }
    values.set(name, raw)
  }

  const typed = <Value>(kind: FlagSpec['kind'], name: string) => {
    if (flags[name]?.kind !== kind) throw new Error(`${spec.script} has no ${kind} flag --${name}`)
    return values.get(name) as Value | undefined
  }

  return {
    boolean: (name) => typed<boolean>('boolean', name) ?? false,
    help: values.get('help') === true,
    number: (name) => typed<number>('number', name),
    operands,
    string: (name) => typed<string>('string', name)
  }
}

/** True when this module is the process entry point rather than an imported library. */
export const isDirectInvocation = (moduleUrl: string): boolean =>
  process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href === moduleUrl : false

/** Run a command's body under the shared help, usage, and exit-code contract. */
export async function runCli(
  spec: CliSpec,
  body: (parsed: ParsedCli) => Promise<void> | void,
  argv: readonly string[] = process.argv.slice(2)
): Promise<void> {
  try {
    const parsed = parseCli(spec, argv)
    if (parsed.help) {
      console.log(formatUsage(spec))
      return
    }
    await body(parsed)
  } catch (error) {
    if (error instanceof CliUsageError) {
      console.error(`${error.message}\n\n${formatUsage(spec)}`)
      process.exitCode = 2
      return
    }
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
