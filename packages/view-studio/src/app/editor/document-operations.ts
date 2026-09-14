import {
  applyInfoschematicDocumentEdit,
  defineInfoschematicModel,
  type InfoschematicDocument,
  type InfoschematicDocumentEdit,
  type InfoschematicDocumentEditResult,
  type InfoschematicDocumentOperation,
  type InfoschematicDocumentPath,
  infoschematicDocumentModel,
  infoschematicDocumentSource,
  infoschematicDocumentValue,
  infoschematicModelOf
} from '@infoschematics/domain-core'
import type { InfoschematicConfig } from '@infoschematics/domain-model'
import type { DefinedInfoschematic, JsonValue, Sequence } from '@infoschematics/domain-model/model'
import { type ArtefactDraftOperation, applyArtefactOperations } from '@infoschematics/view-model/artefact-draft'
import type { ArtefactKind, ArtefactSelection } from '@infoschematics/view-model/editable'

export type StudioDocumentProjectionResult =
  | Readonly<{ edit: InfoschematicDocumentEdit; ok: true }>
  | Readonly<{ ok: false; reason: string }>

export type StudioDocumentChange = Extract<InfoschematicDocumentEditResult, { ok: true }> &
  Readonly<{ edit: InfoschematicDocumentEdit }>

export type StudioDocumentChangeHandler = (change: StudioDocumentChange) => void

/** Exact emitted source is the host's acknowledgement of one Studio change. */
export const isStudioDocumentAcknowledgement = (document: InfoschematicDocument, emittedSource: string): boolean =>
  infoschematicDocumentSource(document) === emittedSource

const field = (name: string) => ({ field: name }) as const
const id = (value: string) => ({ id: value }) as const

const collectionName: Readonly<Record<ArtefactKind, string>> = {
  card: 'cards',
  fabric: 'fabrics',
  flow: 'flows',
  graphic: 'overlays',
  region: 'regions'
}

const stableId = (target: ArtefactSelection): string => target.code ?? target.id

const collection = (model: DefinedInfoschematic, kind: ArtefactKind): readonly Readonly<{ id: string }>[] => {
  switch (kind) {
    case 'card':
      return model.diagram.cards
    case 'fabric':
      return model.diagram.fabrics
    case 'flow':
      return model.diagram.flows
    case 'graphic':
      return model.diagram.overlays
    case 'region':
      return model.diagram.regions
  }
}

const jsonValue = (value: unknown): JsonValue => JSON.parse(JSON.stringify(value)) as JsonValue

const record = (value: JsonValue | undefined): Readonly<Record<string, JsonValue>> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Readonly<Record<string, JsonValue>>)
    : undefined

const same = (left: unknown, right: unknown): boolean => JSON.stringify(left) === JSON.stringify(right)

const memberPath = (target: ArtefactSelection) => [
  field('diagram'),
  field(collectionName[target.kind]),
  id(stableId(target))
]

const anchorFor = (
  values: readonly Readonly<{ id: string }>[],
  memberId: string
): Readonly<{ after?: string; before?: string }> => {
  const index = values.findIndex((value) => value.id === memberId)
  const before = values[index + 1]?.id
  if (before) return { before }
  const after = index > 0 ? values[index - 1]?.id : undefined
  return after ? { after } : {}
}

const fieldDiff = (
  path: ReturnType<typeof memberPath>,
  before: Readonly<Record<string, unknown>>,
  after: Readonly<Record<string, unknown>>,
  keys: readonly string[]
): readonly InfoschematicDocumentOperation[] =>
  keys.map((key): InfoschematicDocumentOperation => {
    const member = [...path, field(key)]
    if (after[key] === undefined) return { op: 'remove', path: member }
    if (before[key] === undefined) return { op: 'add', path: member, value: jsonValue(after[key]) }
    return { op: 'replace', path: member, value: jsonValue(after[key]) }
  })

const compactFlowLink = (value: Readonly<Record<string, unknown>>): string | undefined => {
  const source = value.source as { element: string; port: string } | undefined
  const target = value.target as { element: string; port: string } | undefined
  if (!source || !target) return undefined
  const arrow = value.direction === 'bidirectional' ? '<->' : '->'
  return `${source.element} ${source.port} ${arrow} ${target.element} ${target.port}`
}

const compactWaypoints = (value: unknown): JsonValue | undefined => {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) return jsonValue(value)
  return value
    .map((point) => {
      const coordinate = point as { x?: unknown; y?: unknown }
      return `${coordinate.x},${coordinate.y}`
    })
    .join(' ')
}

const compactFlowDiff = (
  path: ReturnType<typeof memberPath>,
  before: Readonly<Record<string, unknown>>,
  after: Readonly<Record<string, unknown>>,
  changed: readonly string[]
): readonly InfoschematicDocumentOperation[] => {
  const ordinary = changed.filter((key) => !['direction', 'route', 'source', 'target'].includes(key))
  const edits = [...fieldDiff(path, before, after, ordinary)]

  if (changed.some((key) => ['direction', 'source', 'target'].includes(key))) {
    const link = compactFlowLink(after)
    if (link) edits.push({ op: 'replace', path: [...path, field('link')], value: link })
  }

  if (changed.includes('route')) {
    const beforeRoute = (before.route ?? {}) as Readonly<Record<string, unknown>>
    const afterRoute = (after.route ?? {}) as Readonly<Record<string, unknown>>
    for (const key of ['labelAt', 'waypoints'] as const) {
      if (same(beforeRoute[key], afterRoute[key])) continue
      const member = [...path, field(key)]
      const value =
        afterRoute[key] === undefined
          ? undefined
          : key === 'waypoints'
            ? compactWaypoints(afterRoute[key])
            : jsonValue(afterRoute[key])
      if (value === undefined) edits.push({ op: 'remove', path: member })
      else if (beforeRoute[key] === undefined) edits.push({ op: 'add', path: member, value })
      else edits.push({ op: 'replace', path: member, value })
    }
  }

  return edits
}

const memberDiff = (
  target: ArtefactSelection,
  before: Readonly<Record<string, unknown>>,
  after: Readonly<Record<string, unknown>>,
  source: Readonly<Record<string, JsonValue>> | undefined
): readonly InfoschematicDocumentOperation[] => {
  const path = memberPath(target)
  const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
    (key) => key !== 'id' && !same(before[key], after[key])
  )
  return target.kind === 'flow' && source?.link !== undefined
    ? compactFlowDiff(path, before, after, changed)
    : fieldDiff(path, before, after, changed)
}

const scopeDiff = (
  before: DefinedInfoschematic,
  after: DefinedInfoschematic
): readonly InfoschematicDocumentOperation[] =>
  after.scopes.flatMap((scope) => {
    const previous = before.scopes.find((candidate) => candidate.id === scope.id)
    if (!previous || same(previous.elements, scope.elements)) return []
    return [
      {
        op: 'replace' as const,
        path: [field('scopes'), id(scope.id), field('elements')],
        value: jsonValue(scope.elements)
      }
    ]
  })

const projectOperation = (
  before: DefinedInfoschematic,
  after: DefinedInfoschematic,
  operation: ArtefactDraftOperation,
  sourceMember: Readonly<Record<string, JsonValue>> | undefined
): readonly InfoschematicDocumentOperation[] => {
  const targetId = stableId(operation.target)
  const beforeValues = collection(before, operation.target.kind)
  const afterValues = collection(after, operation.target.kind)
  const path = memberPath(operation.target)
  const changedScopes = scopeDiff(before, after)

  switch (operation.operation) {
    case 'create': {
      const value = afterValues.find((candidate) => candidate.id === targetId)
      return value
        ? [{ ...anchorFor(afterValues, targetId), op: 'add', path, value: jsonValue(value) }, ...changedScopes]
        : []
    }
    case 'remove':
      return [{ op: 'remove', path }, ...changedScopes]
    case 'reorder':
      return [{ ...anchorFor(afterValues, targetId), op: 'move', path }, ...changedScopes]
    case 'move':
    case 'resize':
    case 'replace-properties': {
      const previous = beforeValues.find((candidate) => candidate.id === targetId)
      const value = afterValues.find((candidate) => candidate.id === targetId)
      return previous && value
        ? [
            ...memberDiff(
              operation.target,
              previous as Readonly<Record<string, unknown>>,
              value as Readonly<Record<string, unknown>>,
              sourceMember
            ),
            ...changedScopes
          ]
        : []
    }
  }
}

const objectDiff = (
  path: InfoschematicDocumentPath,
  before: Readonly<Record<string, JsonValue>>,
  after: Readonly<Record<string, JsonValue>>,
  ignored: ReadonlySet<string> = new Set()
): readonly InfoschematicDocumentOperation[] =>
  [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap((key) => {
    if (ignored.has(key) || same(before[key], after[key])) return []
    const member = [...path, field(key)]
    if (after[key] === undefined) return [{ op: 'remove' as const, path: member }]
    if (before[key] === undefined) return [{ op: 'add' as const, path: member, value: after[key] }]
    const beforeRecord = record(before[key])
    const afterRecord = record(after[key])
    return beforeRecord && afterRecord
      ? objectDiff(member, beforeRecord, afterRecord)
      : [{ op: 'replace' as const, path: member, value: after[key] }]
  })

const collectionOrderChanged = (
  before: readonly Readonly<{ id: string }>[],
  after: readonly Readonly<{ id: string }>[]
): boolean =>
  !same(
    before.map(({ id: value }) => value),
    after.map(({ id: value }) => value)
  )

const keyedCollectionDiff = (
  path: InfoschematicDocumentPath,
  before: readonly Readonly<{ id: string }>[],
  after: readonly Readonly<{ id: string }>[],
  nested?: (
    path: InfoschematicDocumentPath,
    before: Readonly<Record<string, JsonValue>>,
    after: Readonly<Record<string, JsonValue>>
  ) => readonly InfoschematicDocumentOperation[]
): readonly InfoschematicDocumentOperation[] => {
  const beforeById = new Map(before.map((entry) => [entry.id, entry]))
  const afterById = new Map(after.map((entry) => [entry.id, entry]))
  const removals = before.flatMap((entry) =>
    afterById.has(entry.id) ? [] : [{ op: 'remove' as const, path: [...path, id(entry.id)] }]
  )
  const available = new Set(before.filter((entry) => afterById.has(entry.id)).map((entry) => entry.id))
  const additions: InfoschematicDocumentOperation[] = []
  for (const entry of [...after].reverse()) {
    if (beforeById.has(entry.id)) continue
    const index = after.findIndex((candidate) => candidate.id === entry.id)
    const next = after[index + 1]
    additions.push({
      ...(next && available.has(next.id) ? { before: next.id } : {}),
      op: 'add',
      path: [...path, id(entry.id)],
      value: jsonValue(entry)
    })
    available.add(entry.id)
  }
  const moves = collectionOrderChanged(before, after)
    ? [...after]
        .reverse()
        .map((entry) => ({ ...anchorFor(after, entry.id), op: 'move' as const, path: [...path, id(entry.id)] }))
    : []
  const changes = after.flatMap((entry) => {
    const previous = beforeById.get(entry.id)
    if (!previous) return []
    const member = [...path, id(entry.id)]
    const previousRecord = record(jsonValue(previous)) ?? {}
    const nextRecord = record(jsonValue(entry)) ?? {}
    return nested
      ? nested(member, previousRecord, nextRecord)
      : objectDiff(member, previousRecord, nextRecord, new Set(['id']))
  })
  return [...removals, ...additions, ...moves, ...changes]
}

const sequenceDiff = (
  path: InfoschematicDocumentPath,
  before: Readonly<Record<string, JsonValue>>,
  after: Readonly<Record<string, JsonValue>>
): readonly InfoschematicDocumentOperation[] => {
  const beforeScenes = Array.isArray(before.scenes) ? (before.scenes as readonly Readonly<{ id: string }>[]) : []
  const afterScenes = Array.isArray(after.scenes) ? (after.scenes as readonly Readonly<{ id: string }>[]) : []
  return [
    ...objectDiff(path, before, after, new Set(['id', 'scenes'])),
    ...keyedCollectionDiff([...path, field('scenes')], beforeScenes, afterScenes)
  ]
}

const sequenceOperations = (
  before: readonly Sequence[],
  after: readonly Sequence[]
): readonly InfoschematicDocumentOperation[] => keyedCollectionDiff([field('sequences')], before, after, sequenceDiff)

/** Project current Studio draft operations into the stable document protocol. */
export const projectStudioDocumentOperations = (
  document: InfoschematicDocument,
  config: InfoschematicConfig,
  operations: readonly ArtefactDraftOperation[],
  sequences?: readonly Sequence[]
): StudioDocumentProjectionResult => {
  let current = config
  let currentDocument = document
  const edits: InfoschematicDocumentOperation[] = []

  for (const operation of operations) {
    const before = defineInfoschematicModel(infoschematicModelOf(current))
    const applied = applyArtefactOperations(current, [operation])
    const rejection = applied.rejected[0]
    if (rejection) return { ok: false, reason: rejection.reason }
    const after = defineInfoschematicModel(infoschematicModelOf(applied.config))
    const projected = projectOperation(
      before,
      after,
      operation,
      record(infoschematicDocumentValue(currentDocument, memberPath(operation.target)))
    )
    const interim = applyInfoschematicDocumentEdit(currentDocument, { operations: projected, version: 1 })
    if (!interim.ok) return { ok: false, reason: interim.issues.map((entry) => entry.message).join('; ') }
    edits.push(...projected)
    current = applied.config
    currentDocument = interim.document
  }

  if (sequences) {
    const before = infoschematicDocumentModel(currentDocument)
    let after: DefinedInfoschematic
    try {
      after = defineInfoschematicModel({ ...before, sequences })
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : String(error) }
    }
    const projected = sequenceOperations(before.sequences, after.sequences)
    const interim = applyInfoschematicDocumentEdit(currentDocument, { operations: projected, version: 1 })
    if (!interim.ok) return { ok: false, reason: interim.issues.map((entry) => entry.message).join('; ') }
    edits.push(...projected)
  }

  return { edit: Object.freeze({ operations: Object.freeze(edits), version: 1 }), ok: true }
}

/** Apply projected Studio operations without giving Studio persistence authority. */
export const applyStudioDocumentOperations = (
  document: InfoschematicDocument,
  config: InfoschematicConfig,
  operations: readonly ArtefactDraftOperation[],
  sequences?: readonly Sequence[]
): InfoschematicDocumentEditResult => {
  const projection = projectStudioDocumentOperations(document, config, operations, sequences)
  return projection.ok
    ? applyInfoschematicDocumentEdit(document, projection.edit)
    : { issues: [{ message: `Studio operation rejected: ${projection.reason}`, path: 'edit' }], ok: false }
}
