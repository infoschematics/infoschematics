import type { InfoschematicConfig } from '@infoschematics/domain-model'
import { parse as parseYaml } from 'yaml'
import { defineInfoschematic } from './define.ts'
import { infoschematicConfigSchema } from './schema.ts'

/** Serialised document formats an Infoschematic can be authored in. */
export type InfoschematicFormat = 'json' | 'yaml'

/** One reason a document was rejected, addressed to whoever has to fix the document. */
export type InfoschematicIssue = Readonly<{
  /** Pathname of the offending document, when the caller supplied one. */
  document?: string
  message: string
  /** Dotted path to the offending value, empty for the document itself. */
  path: string
}>

export type InfoschematicParseResult =
  | Readonly<{ config: InfoschematicConfig; ok: true }>
  | Readonly<{ issues: readonly InfoschematicIssue[]; ok: false }>

export type ParseInfoschematicOptions = Readonly<{
  /** Explicit format. Inferred from `pathname` when omitted. */
  format?: InfoschematicFormat
  /** Pathname the text came from, used to infer the format and to address diagnostics. */
  pathname?: string
}>

const extensions: Readonly<Record<string, InfoschematicFormat>> = {
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml'
}

/** The format a pathname declares by its extension, or `undefined` when it declares none this loader supports. */
export const infoschematicFormatOf = (pathname: string): InfoschematicFormat | undefined =>
  extensions[(/\.[^./\\]+$/.exec(pathname)?.[0] ?? '').toLowerCase()]

/** Every supported extension, in the order a usage message should list them. */
export const infoschematicFormatExtensions: readonly string[] = Object.keys(extensions)

const failure = (
  document: string | undefined,
  issues: readonly Readonly<{ message: string; path: string }>[]
): InfoschematicParseResult => ({
  issues: issues.map((issue) => (document ? { ...issue, document } : issue)),
  ok: false
})

// `$schema` is how a JSON document points an editor at its schema. It is editor metadata rather than part of the
// contract, so the loader drops it instead of the strict schema rejecting it as an unknown key.
const withoutEditorMetadata = (document: unknown): unknown => {
  if (typeof document !== 'object' || document === null || Array.isArray(document)) return document
  if (!('$schema' in document)) return document
  const { $schema: _editorSchema, ...rest } = document as Record<string, unknown>
  return rest
}

/** Render one issue as a single line addressed to whoever has to fix the document. */
export const formatInfoschematicIssue = ({ document, message, path }: InfoschematicIssue): string =>
  `${document ? `${document}:` : ''}${path || '<document>'} ${message}`

/**
 * Turn an authored JSON or YAML document into a normalised Infoschematic.
 *
 * The result is discriminated rather than thrown, because the caller at a file boundary almost always wants to print a
 * diagnostic. Syntax errors, contract violations, and the normaliser's own referential checks all arrive in that one
 * shape, so a caller has a single thing to report.
 */
export function parseInfoschematic(text: string, options: ParseInfoschematicOptions = {}): InfoschematicParseResult {
  const { pathname } = options
  const format = options.format ?? (pathname ? infoschematicFormatOf(pathname) : undefined)
  if (!format) {
    const supported = infoschematicFormatExtensions.join(', ')
    const cause = pathname ? `${pathname} has no supported extension` : 'no format or pathname was given'
    return failure(pathname, [{ message: `Cannot choose a parser: ${cause}. Supported: ${supported}.`, path: '' }])
  }

  let document: unknown
  try {
    document = format === 'json' ? JSON.parse(text) : parseYaml(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return failure(pathname, [{ message: `Malformed ${format.toUpperCase()}: ${message}`, path: '' }])
  }

  const validated = infoschematicConfigSchema.safeParse(withoutEditorMetadata(document))
  if (!validated.success) {
    return failure(
      pathname,
      validated.error.issues.map((issue) => ({ message: issue.message, path: issue.path.join('.') }))
    )
  }

  // `defineInfoschematic` still owns the referential checks a shape schema cannot express, such as a Card naming a
  // Domain that was never declared. Those become issues too, so one malformed document reports one way.
  try {
    return { config: defineInfoschematic(validated.data), ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return failure(pathname, [{ message, path: 'infoschematic' }])
  }
}
