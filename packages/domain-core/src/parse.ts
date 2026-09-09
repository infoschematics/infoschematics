import type { DefinedInfoschematic } from '@infoschematics/domain-model/model'
import { parseDocument } from 'yaml'
import { defineInfoschematicModel } from './model.ts'
import { infoschematicSchema } from './schema.ts'

/** One reason a document was rejected, addressed to whoever can fix it. */
export type InfoschematicIssue = Readonly<{
  /** Pathname of the offending document, when the caller supplied one. */
  document?: string
  message: string
  /** Dotted path to the offending value, or empty for the document itself. */
  path: string
}>

export type InfoschematicParseResult =
  | Readonly<{ model: DefinedInfoschematic; ok: true }>
  | Readonly<{ issues: readonly InfoschematicIssue[]; ok: false }>

export type ParseInfoschematicOptions = Readonly<{
  /** Pathname the text came from, used only to address diagnostics. */
  pathname?: string
}>

const extensions = ['.yaml', '.yml', '.json'] as const

/** Whether a pathname declares a YAML-based Infoschematic document. */
export const infoschematicFormatOf = (pathname: string): 'yaml' | undefined =>
  extensions.includes((/\.[^./\\]+$/.exec(pathname)?.[0] ?? '').toLowerCase() as (typeof extensions)[number])
    ? 'yaml'
    : undefined

/** Supported document extensions, ordered by the preferred authored form. */
export const infoschematicFormatExtensions: readonly string[] = extensions

const failure = (
  document: string | undefined,
  issues: readonly Readonly<{ message: string; path: string }>[]
): InfoschematicParseResult => ({
  issues: issues.map((issue) => (document ? { ...issue, document } : issue)),
  ok: false
})

// `$schema` is editor metadata rather than part of the domain contract.
const withoutEditorMetadata = (document: unknown): unknown => {
  if (typeof document !== 'object' || document === null || Array.isArray(document)) return document
  if (!('$schema' in document)) return document
  const { $schema: _editorSchema, ...rest } = document as Record<string, unknown>
  return rest
}

const jsonValueIssue = (
  value: unknown,
  path = '',
  ancestors: ReadonlySet<object> = new Set()
): Readonly<{ message: string; path: string }> | undefined => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return undefined
  if (typeof value === 'number') {
    return Number.isFinite(value) ? undefined : { message: 'Expected a finite JSON number.', path }
  }
  if (typeof value !== 'object') return { message: `Expected a JSON value, received ${typeof value}.`, path }
  if (ancestors.has(value)) return { message: 'Cyclic YAML aliases are not supported.', path }

  const prototype = Object.getPrototypeOf(value)
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    return { message: `Expected a plain JSON object, received ${prototype?.constructor?.name ?? 'object'}.`, path }
  }

  const nestedAncestors = new Set(ancestors).add(value)
  const entries: readonly [string, unknown][] = Array.isArray(value)
    ? value.map((entry, index) => [String(index), entry])
    : Object.entries(value)

  for (const [key, entry] of entries) {
    const issue = jsonValueIssue(entry, path ? `${path}.${key}` : key, nestedAncestors)
    if (issue) return issue
  }
  return undefined
}

/** Render one issue as a printable line. */
export const formatInfoschematicIssue = ({ document, message, path }: InfoschematicIssue): string =>
  `${document ? `${document}:` : ''}${path || '<document>'} ${message}`

/** Parse inert YAML 1.2 data, including JSON syntax, and normalise it into the canonical TypeScript model. */
export function parseInfoschematic(text: string, options: ParseInfoschematicOptions = {}): InfoschematicParseResult {
  const { pathname } = options

  try {
    const document = parseDocument(text, {
      intAsBigInt: false,
      merge: false,
      resolveKnownTags: false,
      schema: 'core',
      strict: true,
      stringKeys: true,
      uniqueKeys: true,
      version: '1.2'
    })
    const diagnostics = [...document.errors, ...document.warnings]
    if (diagnostics.length > 0) {
      return failure(
        pathname,
        diagnostics.map(({ message }) => ({ message: `Malformed YAML: ${message}`, path: '' }))
      )
    }

    const authored: unknown = document.toJS({ mapAsMap: false, maxAliasCount: 100 })
    const jsonIssue = jsonValueIssue(authored)
    if (jsonIssue) return failure(pathname, [jsonIssue])

    const validated = infoschematicSchema.safeParse(withoutEditorMetadata(authored))
    if (!validated.success) {
      return failure(
        pathname,
        validated.error.issues.map((issue) => ({ message: issue.message, path: issue.path.join('.') }))
      )
    }

    try {
      return { model: defineInfoschematicModel(validated.data), ok: true }
    } catch (error) {
      return failure(pathname, [{ message: error instanceof Error ? error.message : String(error), path: 'diagram' }])
    }
  } catch (error) {
    return failure(pathname, [
      { message: `Malformed YAML: ${error instanceof Error ? error.message : String(error)}`, path: '' }
    ])
  }
}
