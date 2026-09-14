import type { DefinedInfoschematic } from '@infoschematics/domain-model/model'
import { type Document, type Node, parseDocument } from 'yaml'
import type { InfoschematicIssue, ParseInfoschematicOptions } from './parse.ts'
import { parseInfoschematic } from './parse.ts'

declare const infoschematicDocumentBrand: unique symbol

/** Opaque authored document. YAML nodes never cross the Domain Core boundary. */
export type InfoschematicDocument = Readonly<{ [infoschematicDocumentBrand]: true }>

export type InfoschematicDocumentParseResult =
  | Readonly<{ document: InfoschematicDocument; ok: true }>
  | Readonly<{ issues: readonly InfoschematicIssue[]; ok: false }>

type ParsedYamlDocument = Document<Node, true>

export type InfoschematicDocumentState = Readonly<{
  model: DefinedInfoschematic
  pathname?: string
  source: string
  yaml: ParsedYamlDocument
}>

const states = new WeakMap<object, InfoschematicDocumentState>()

export const infoschematicYamlOptions = {
  intAsBigInt: false,
  keepSourceTokens: true,
  merge: false,
  resolveKnownTags: false,
  schema: 'core' as const,
  strict: true,
  stringKeys: true,
  uniqueKeys: true,
  version: '1.2' as const
}

export const infoschematicDocumentHandle = (state: InfoschematicDocumentState): InfoschematicDocument => {
  const handle = Object.freeze({}) as InfoschematicDocument
  states.set(handle, state)
  return handle
}

export const infoschematicDocumentState = (document: InfoschematicDocument): InfoschematicDocumentState => {
  const state = states.get(document)
  if (!state) throw new TypeError('Expected an InfoschematicDocument created by Domain Core.')
  return state
}

/** Parse and retain an authored YAML document and its exact source. */
export const parseInfoschematicDocument = (
  source: string,
  options: ParseInfoschematicOptions = {}
): InfoschematicDocumentParseResult => {
  const parsed = parseInfoschematic(source, options)
  if (!parsed.ok) return parsed

  const yaml = parseDocument(source, infoschematicYamlOptions) as ParsedYamlDocument
  return {
    document: infoschematicDocumentHandle({ model: parsed.model, pathname: options.pathname, source, yaml }),
    ok: true
  }
}

/** Exact current authored source; an unedited document emits byte-for-byte. */
export const infoschematicDocumentSource = (document: InfoschematicDocument): string =>
  infoschematicDocumentState(document).source

/** Original diagnostic pathname, retained without granting persistence authority. */
export const infoschematicDocumentPathname = (document: InfoschematicDocument): string | undefined =>
  infoschematicDocumentState(document).pathname

/** Validated canonical model corresponding to current source. */
export const infoschematicDocumentModel = (document: InfoschematicDocument): DefinedInfoschematic =>
  infoschematicDocumentState(document).model
