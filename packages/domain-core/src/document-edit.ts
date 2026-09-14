import type { DefinedInfoschematic, JsonValue } from '@infoschematics/domain-model/model'
import { isMap, isScalar, isSeq, type Node, type Pair, type Scalar, type YAMLMap, type YAMLSeq } from 'yaml'
import {
  type InfoschematicDocument,
  infoschematicDocumentHandle,
  infoschematicDocumentModel,
  infoschematicDocumentState,
  parseInfoschematicDocument
} from './document.ts'
import type { InfoschematicIssue } from './parse.ts'
import { infoschematicFieldOrder } from './serialise.ts'

export type InfoschematicDocumentPathSegment = Readonly<{ field: string }> | Readonly<{ id: string }>
export type InfoschematicDocumentPath = readonly InfoschematicDocumentPathSegment[]

export type InfoschematicDocumentAnchor = Readonly<{
  after?: string
  before?: string
}>

type EditBase = Readonly<{ path: InfoschematicDocumentPath }>

export type InfoschematicDocumentAdd = EditBase &
  InfoschematicDocumentAnchor &
  Readonly<{ op: 'add'; value: JsonValue }>
export type InfoschematicDocumentRemove = EditBase & Readonly<{ op: 'remove' }>
export type InfoschematicDocumentReplace = EditBase & Readonly<{ op: 'replace'; value: JsonValue }>
export type InfoschematicDocumentMove = EditBase & InfoschematicDocumentAnchor & Readonly<{ op: 'move' }>

export type InfoschematicDocumentOperation =
  | InfoschematicDocumentAdd
  | InfoschematicDocumentMove
  | InfoschematicDocumentRemove
  | InfoschematicDocumentReplace

/**
 * Version-one inert edit envelope.
 *
 * `syntax` is generated for inverse edits. Domain Core accepts it only when
 * it is valid YAML for the same semantic result as `operations`.
 */
export type InfoschematicDocumentEdit = Readonly<{
  operations: readonly InfoschematicDocumentOperation[]
  syntax?: Readonly<{ source: string }>
  version: 1
}>

export type InfoschematicDocumentEditResult =
  | Readonly<{
      changedElements: readonly string[]
      document: InfoschematicDocument
      inverse: InfoschematicDocumentEdit
      model: DefinedInfoschematic
      ok: true
      source: string
    }>
  | Readonly<{ issues: readonly InfoschematicIssue[]; ok: false }>

type YamlDocument = ReturnType<typeof infoschematicDocumentState>['yaml']

const issue = (message: string, path: string, pathname?: string): InfoschematicIssue =>
  pathname ? { document: pathname, message, path } : { message, path }

const segmentName = (segment: InfoschematicDocumentPathSegment): string =>
  'field' in segment ? segment.field : `{${segment.id}}`

const pathName = (path: InfoschematicDocumentPath): string => path.map(segmentName).join('.')

const keyOf = (pair: Pair<unknown, unknown>): unknown => {
  if (isScalar(pair.key)) return pair.key.value
  const node = pair.key as { toJSON?: () => unknown }
  return node.toJSON?.() ?? pair.key
}

const pairFor = (map: YAMLMap<unknown, unknown>, field: string): Pair<unknown, unknown> | undefined =>
  map.items.find((pair) => keyOf(pair) === field)

const idOf = (node: unknown): string | undefined => {
  if (!isMap(node)) return undefined
  const pair = pairFor(node, 'id')
  return pair && isScalar(pair.value) && typeof pair.value.value === 'string' ? pair.value.value : undefined
}

const indexOfId = (sequence: YAMLSeq<unknown>, id: string): number =>
  sequence.items.findIndex((entry) => idOf(entry) === id)

type Location = Readonly<{
  key: number | string | null
  node: Node
  parent: YamlDocument | YAMLMap<unknown, unknown> | YAMLSeq<unknown>
}>

const rootLocation = (yaml: YamlDocument): Location | undefined =>
  yaml.contents ? { key: null, node: yaml.contents, parent: yaml } : undefined

const childLocation = (parent: Location, segment: InfoschematicDocumentPathSegment): Location | undefined => {
  if ('field' in segment) {
    if (!isMap(parent.node)) return undefined
    const pair = pairFor(parent.node, segment.field)
    return pair?.value && typeof pair.value === 'object'
      ? { key: segment.field, node: pair.value as Node, parent: parent.node }
      : undefined
  }

  if (!isSeq(parent.node)) return undefined
  const index = indexOfId(parent.node, segment.id)
  const node = parent.node.items[index]
  return index >= 0 && node && typeof node === 'object'
    ? { key: index, node: node as Node, parent: parent.node }
    : undefined
}

const locate = (yaml: YamlDocument, path: InfoschematicDocumentPath): Location | undefined => {
  let location = rootLocation(yaml)
  for (const segment of path) {
    if (!location) return undefined
    location = childLocation(location, segment)
  }
  return location
}

const assertJsonValue = (value: unknown, ancestors: ReadonlySet<object> = new Set()): void => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Edit values must contain finite JSON numbers.')
    return
  }
  if (typeof value !== 'object') throw new Error(`Edit values must be inert JSON data, received ${typeof value}.`)
  if (ancestors.has(value)) throw new Error('Edit values cannot contain cycles.')
  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  ) {
    throw new Error('Edit values must contain only plain JSON objects.')
  }
  const nested = new Set(ancestors).add(value)
  for (const child of Array.isArray(value) ? value : Object.values(value)) assertJsonValue(child, nested)
}

const cloneJson = <T extends JsonValue>(value: T): T => {
  assertJsonValue(value)
  return JSON.parse(JSON.stringify(value)) as T
}

const isJsonObject = (value: JsonValue): value is Readonly<Record<string, JsonValue>> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const fieldsOf = (path: InfoschematicDocumentPath): readonly string[] =>
  path.flatMap((segment) => ('field' in segment ? [segment.field] : []))

const endsWith = (values: readonly string[], suffix: readonly string[]): boolean =>
  values.length >= suffix.length &&
  suffix.every((value, index) => values[values.length - suffix.length + index] === value)

const isElementSetPath = (path: InfoschematicDocumentPath): boolean => {
  const fields = fieldsOf(path)
  return (
    endsWith(fields, ['scopes', 'elements']) ||
    endsWith(fields, ['scenes', 'focus', 'elements']) ||
    endsWith(fields, ['scenes', 'visibility', 'show', 'elements']) ||
    endsWith(fields, ['scenes', 'visibility', 'hide', 'elements'])
  )
}

const normaliseEditedElementSets = (value: JsonValue, path: InfoschematicDocumentPath): JsonValue => {
  if (isElementSetPath(path) && Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
    return [...new Set(value)].sort((left, right) => left.localeCompare(right))
  }
  if (Array.isArray(value)) {
    return value.map((entry) =>
      normaliseEditedElementSets(entry, [
        ...path,
        ...(isJsonObject(entry) && typeof entry.id === 'string' ? [{ id: entry.id } as const] : [])
      ])
    )
  }
  if (isJsonObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([field, entry]) => [field, normaliseEditedElementSets(entry, [...path, { field }])])
    )
  }
  return value
}

const mappingContext = (path: InfoschematicDocumentPath): string => {
  const fields = fieldsOf(path)
  return fields.length === 0 ? '<root>' : (fields.at(-1) ?? '<root>')
}

const addFieldInAuthoringOrder = (
  yaml: YamlDocument,
  map: YAMLMap<unknown, unknown>,
  field: string,
  value: unknown,
  parentPath: InfoschematicDocumentPath
): void => {
  const order = infoschematicFieldOrder(mappingContext(parentPath))
  const wanted = order.indexOf(field)
  const wantedRank = wanted < 0 ? order.length : wanted
  const pair = yaml.createPair(field, value)
  const index = map.items.findIndex((entry) => {
    const key = keyOf(entry)
    if (typeof key !== 'string') return false
    const candidate = order.indexOf(key)
    const candidateRank = candidate < 0 ? order.length : candidate
    return candidateRank > wantedRank || (candidateRank === wantedRank && candidateRank === order.length && key > field)
  })
  map.items.splice(index < 0 ? map.items.length : index, 0, pair)
}

const nodeValueOf = (node: Node, yaml: YamlDocument): JsonValue =>
  cloneJson(node.toJS(yaml, { mapAsMap: false, maxAliasCount: 100 }) as JsonValue)

const copyNodePresentation = (source: Node, target: Node): Node => {
  target.comment = source.comment
  target.commentBefore = source.commentBefore
  target.spaceBefore = source.spaceBefore
  return target
}

const replacementNode = (yaml: YamlDocument, current: Node, value: JsonValue): Node => {
  if (isScalar(current) && (value === null || ['boolean', 'number', 'string'].includes(typeof value))) {
    const next = current.clone() as Scalar<JsonValue>
    next.value = value
    return next as Node
  }
  return copyNodePresentation(current, yaml.createNode(value) as Node)
}

const replaceAt = (location: Location, replacement: Node): void => {
  if ('contents' in location.parent && location.key === null) location.parent.contents = replacement
  else if (isMap(location.parent) && typeof location.key === 'string') {
    const pair = pairFor(location.parent, location.key)
    if (pair) pair.value = replacement
  } else if (isSeq(location.parent) && typeof location.key === 'number') {
    location.parent.items[location.key] = replacement
  }
}

const removeAt = (location: Location): void => {
  if (isMap(location.parent) && typeof location.key === 'string') location.parent.delete(location.key)
  else if (isSeq(location.parent) && typeof location.key === 'number') location.parent.items.splice(location.key, 1)
  else throw new Error('The document root cannot be removed.')
}

const anchorError = (operation: InfoschematicDocumentAnchor): string | undefined => {
  if (operation.before && operation.after) return 'Use either before or after, not both.'
  if (operation.before !== undefined && operation.before.length === 0) return 'A before anchor must name an ID.'
  if (operation.after !== undefined && operation.after.length === 0) return 'An after anchor must name an ID.'
  return undefined
}

const insertionIndex = (sequence: YAMLSeq<unknown>, anchor: InfoschematicDocumentAnchor): number => {
  const invalid = anchorError(anchor)
  if (invalid) throw new Error(invalid)
  if (anchor.before !== undefined) {
    const index = indexOfId(sequence, anchor.before)
    if (index < 0) throw new Error(`Before anchor ${anchor.before} does not exist.`)
    return index
  }
  if (anchor.after !== undefined) {
    const index = indexOfId(sequence, anchor.after)
    if (index < 0) throw new Error(`After anchor ${anchor.after} does not exist.`)
    return index + 1
  }
  return sequence.items.length
}

const anchorAt = (sequence: YAMLSeq<unknown>, index: number): InfoschematicDocumentAnchor => {
  const before = sequence.items[index + 1] ? idOf(sequence.items[index + 1]) : undefined
  if (before) return { before }
  const after = index > 0 ? idOf(sequence.items[index - 1]) : undefined
  return after ? { after } : {}
}

const validatePath = (path: InfoschematicDocumentPath): string | undefined => {
  if (!Array.isArray(path) || path.length === 0) return 'An edit path must contain at least one segment.'
  for (const segment of path) {
    if (!segment || typeof segment !== 'object') return 'Each path segment must be structured data.'
    const fields = Object.keys(segment)
    if (fields.length !== 1 || (fields[0] !== 'field' && fields[0] !== 'id')) {
      return 'Each path segment must contain exactly one field or id.'
    }
    const value = 'field' in segment ? segment.field : segment.id
    if (typeof value !== 'string' || value.length === 0) return 'Path fields and IDs must be non-empty strings.'
  }
  return undefined
}

const addOperation = (yaml: YamlDocument, operation: InfoschematicDocumentAdd): InfoschematicDocumentOperation => {
  const last = operation.path.at(-1)
  if (!last) throw new Error('An add path must contain a target segment.')

  const parentPath = operation.path.slice(0, -1)
  let parent = locate(yaml, parentPath)

  // Compact source may omit an empty collection. Create it only for an
  // ID-addressed member, preserving all existing mapping order.
  if (!parent && 'id' in last) {
    const collection = parentPath.at(-1)
    const owner = locate(yaml, parentPath.slice(0, -1))
    if (collection && 'field' in collection && owner && isMap(owner.node) && !pairFor(owner.node, collection.field)) {
      addFieldInAuthoringOrder(yaml, owner.node, collection.field, [], parentPath.slice(0, -1))
      const sequence = pairFor(owner.node, collection.field)?.value
      if (sequence && isSeq(sequence)) parent = { key: collection.field, node: sequence, parent: owner.node }
    }
  }

  if (!parent) throw new Error(`Parent ${pathName(parentPath)} does not exist.`)

  if ('field' in last) {
    if (!isMap(parent.node)) throw new Error('A field can only be added to a mapping.')
    if (pairFor(parent.node, last.field)) throw new Error(`Field ${last.field} already exists.`)
    if (operation.before !== undefined || operation.after !== undefined) {
      throw new Error('Ordering anchors apply only to ID-addressed collection members.')
    }
    addFieldInAuthoringOrder(
      yaml,
      parent.node,
      last.field,
      cloneJson(normaliseEditedElementSets(operation.value, operation.path)),
      parentPath
    )
    return { op: 'remove', path: operation.path }
  }

  if (!isSeq(parent.node)) throw new Error('An ID-addressed member can only be added to a sequence.')
  if (indexOfId(parent.node, last.id) >= 0) throw new Error(`ID ${last.id} already exists.`)
  if (!isJsonObject(operation.value)) {
    throw new Error('An ID-addressed member must be a mapping value.')
  }
  if (operation.value.id !== last.id) throw new Error(`Added value must carry id ${last.id}.`)

  const index = insertionIndex(parent.node, operation)
  parent.node.items.splice(
    index,
    0,
    yaml.createNode(cloneJson(normaliseEditedElementSets(operation.value, operation.path))) as Node
  )
  return { op: 'remove', path: operation.path }
}

const removeOperation = (
  yaml: YamlDocument,
  operation: InfoschematicDocumentRemove
): InfoschematicDocumentOperation => {
  const location = locate(yaml, operation.path)
  if (!location) throw new Error(`Target ${pathName(operation.path)} does not exist.`)
  const value = nodeValueOf(location.node, yaml)
  const anchor =
    isSeq(location.parent) && typeof location.key === 'number' ? anchorAt(location.parent, location.key) : {}
  removeAt(location)
  return { ...anchor, op: 'add', path: operation.path, value }
}

const replaceOperation = (
  yaml: YamlDocument,
  operation: InfoschematicDocumentReplace
): InfoschematicDocumentOperation => {
  const location = locate(yaml, operation.path)
  if (!location) throw new Error(`Target ${pathName(operation.path)} does not exist.`)
  const last = operation.path.at(-1)
  if (last && 'id' in last) {
    if (!isJsonObject(operation.value)) {
      throw new Error('An ID-addressed member must remain a mapping value.')
    }
    if (operation.value.id !== last.id) throw new Error(`Replacement must retain id ${last.id}.`)
  }
  const value = nodeValueOf(location.node, yaml)
  replaceAt(
    location,
    replacementNode(yaml, location.node, cloneJson(normaliseEditedElementSets(operation.value, operation.path)))
  )
  return { op: 'replace', path: operation.path, value }
}

const moveOperation = (yaml: YamlDocument, operation: InfoschematicDocumentMove): InfoschematicDocumentOperation => {
  const invalid = anchorError(operation)
  if (invalid) throw new Error(invalid)
  const location = locate(yaml, operation.path)
  if (!location || !isSeq(location.parent) || typeof location.key !== 'number') {
    throw new Error('A move target must be an ID-addressed collection member.')
  }
  const last = operation.path.at(-1)
  if (!last || !('id' in last)) throw new Error('A move path must end with an ID segment.')
  if (operation.before === last.id || operation.after === last.id) {
    throw new Error('A move cannot anchor a member to itself.')
  }

  const originalAnchor = anchorAt(location.parent, location.key)
  const [node] = location.parent.items.splice(location.key, 1)
  if (!node) throw new Error(`Target ${last.id} does not exist.`)
  const index = insertionIndex(location.parent, operation)
  location.parent.items.splice(index, 0, node)
  return { ...originalAnchor, op: 'move', path: operation.path }
}

const changedElementsOf = (operations: readonly InfoschematicDocumentOperation[]): readonly string[] => {
  const ids = new Set<string>()
  for (const operation of operations) {
    for (const segment of operation.path) if ('id' in segment) ids.add(segment.id)
    if (operation.op === 'add' && isJsonObject(operation.value)) {
      if (typeof operation.value.id === 'string') ids.add(operation.value.id)
    }
  }
  return Object.freeze([...ids].sort((left, right) => left.localeCompare(right)))
}

const sameModel = (left: DefinedInfoschematic, right: DefinedInfoschematic): boolean =>
  JSON.stringify(left) === JSON.stringify(right)

/** Apply a complete edit batch to a clone, validating before publishing it. */
export const applyInfoschematicDocumentEdit = (
  document: InfoschematicDocument,
  edit: InfoschematicDocumentEdit
): InfoschematicDocumentEditResult => {
  const state = infoschematicDocumentState(document)
  if (edit?.version !== 1 || !Array.isArray(edit.operations)) {
    return {
      issues: [issue('Expected a version-one Infoschematic document edit envelope.', '', state.pathname)],
      ok: false
    }
  }

  if (edit.operations.length === 0 && !edit.syntax) {
    return {
      changedElements: Object.freeze([]),
      document,
      inverse: Object.freeze({ operations: Object.freeze([]), version: 1 }),
      model: state.model,
      ok: true,
      source: state.source
    }
  }

  const yaml = state.yaml.clone() as YamlDocument
  const inverse: InfoschematicDocumentOperation[] = []

  try {
    for (const [index, operation] of edit.operations.entries()) {
      const invalidPath = validatePath(operation.path)
      if (invalidPath) throw new Error(`Operation ${index + 1}: ${invalidPath}`)
      const undo = (() => {
        switch (operation.op) {
          case 'add':
            return addOperation(yaml, operation)
          case 'move':
            return moveOperation(yaml, operation)
          case 'remove':
            return removeOperation(yaml, operation)
          case 'replace':
            return replaceOperation(yaml, operation)
          default:
            throw new Error(`Operation ${index + 1}: Unsupported operation.`)
        }
      })()
      inverse.unshift(undo)
    }
  } catch (error) {
    return {
      issues: [issue(error instanceof Error ? error.message : String(error), 'edit', state.pathname)],
      ok: false
    }
  }

  const candidate = parseInfoschematicDocument(yaml.toString(), { pathname: state.pathname })
  if (!candidate.ok) return candidate
  let next = candidate.document

  if (edit.syntax) {
    const syntax = parseInfoschematicDocument(edit.syntax.source, { pathname: state.pathname })
    if (!syntax.ok) return syntax
    if (!sameModel(infoschematicDocumentModel(syntax.document), infoschematicDocumentModel(candidate.document))) {
      return {
        issues: [
          issue(
            'Concrete syntax does not represent the semantic result of its operations.',
            'edit.syntax',
            state.pathname
          )
        ],
        ok: false
      }
    }
    next = syntax.document
  }

  const nextState = infoschematicDocumentState(next)
  return {
    changedElements: changedElementsOf(edit.operations),
    document: infoschematicDocumentHandle(nextState),
    inverse: Object.freeze({
      operations: Object.freeze(inverse),
      syntax: Object.freeze({ source: state.source }),
      version: 1
    }),
    model: nextState.model,
    ok: true,
    source: nextState.source
  }
}
