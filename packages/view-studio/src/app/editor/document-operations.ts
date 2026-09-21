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
  point: 'points',
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
    case 'point':
      return model.diagram.points
    case 'region':
      return model.diagram.regions
  }
}

/*
 * The order removals are written in, dependents first.
 *
 * A Flow names the endpoint it runs to, so taking the endpoint away while the Flow still names it describes a
 * document that could not be read back. Emitting the Flow first means every intermediate state is one a parser
 * would accept, which is what lets a removal be undone in a single step rather than repaired in two.
 */
const removalOrder: readonly ArtefactKind[] = ['flow', 'graphic', 'card', 'fabric', 'point', 'region']

/*
 * Everything a removal actually took, not just the element the Producer named.
 *
 * A Point exists so that Flows can enter or leave, so removing one nearly always removes Flows with it; the same
 * is true of a Card and the Adapters around it. Those were already worked out when the operation was applied, so
 * they are read off the two models rather than derived a second time from the relationships.
 */
const removedMembers = (
  before: DefinedInfoschematic,
  after: DefinedInfoschematic
): readonly InfoschematicDocumentOperation[] =>
  removalOrder.flatMap((kind) => {
    const remaining = new Set(collection(after, kind).map((value) => value.id))
    return collection(before, kind)
      .filter((value) => !remaining.has(value.id))
      .map((value) => ({
        op: 'remove' as const,
        path: [field('diagram'), field(collectionName[kind]), id(value.id)]
      }))
  })

const jsonValue = (value: unknown): JsonValue => JSON.parse(JSON.stringify(value)) as JsonValue

const record = (value: JsonValue | undefined): Readonly<Record<string, JsonValue>> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Readonly<Record<string, JsonValue>>)
    : undefined

const same = (left: unknown, right: unknown): boolean => JSON.stringify(left) === JSON.stringify(right)

/** Reads a member as the document authored it, so a projection can keep the shorthand the Producer wrote. */
type DocumentMemberSource = (path: InfoschematicDocumentPath) => Readonly<Record<string, JsonValue>> | undefined

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

/*
 * A coordinate, written back the way it was authored.
 *
 * The serialiser compacts an `at:` to the pair `x y`, so replacing one with a mapping would expand a line a
 * Producer wrote by hand - the change would be correct and the document would still read as damaged. This is the
 * same courtesy `compactWaypoints` does for a route, applied to the one key that states a place.
 */
const compactCoordinate = (key: string, value: unknown): JsonValue | undefined => {
  if (key !== 'at' || value === null || typeof value !== 'object' || Array.isArray(value)) return undefined
  const { x, y, ...rest } = value as Readonly<Record<string, unknown>>
  if (typeof x !== 'number' || typeof y !== 'number' || Object.keys(rest).length > 0) return undefined
  return `${x} ${y}`
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
    const value = compactCoordinate(key, after[key]) ?? jsonValue(after[key])
    if (before[key] === undefined) return { op: 'add', path: member, value }
    return { op: 'replace', path: member, value }
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

/*
 * Every Flow the operation moved without naming it.
 *
 * A Card carries the ends of the Flows attached to it, and the draft repairs each of those routes as the Card
 * moves: `moveRouteEnds` gives the run beside a moved port the corner that keeps it orthogonal. Projecting only the
 * member the Producer named leaves that repair in the draft, so the document keeps the Card's new box beside the
 * route's old waypoints, the first run arrives diagonally, and `ROUTE-001` refuses the document the edit just
 * wrote - `COMPOSE-002`, thrown out of runtime construction rather than refused at the edit.
 *
 * The Flow the operation names is excluded because `memberDiff` has already written it.
 */
const dependentFlowDiff = (
  before: DefinedInfoschematic,
  after: DefinedInfoschematic,
  named: string | undefined,
  sourceFor: DocumentMemberSource
): readonly InfoschematicDocumentOperation[] => {
  const beforeById = new Map(before.diagram.flows.map((flow) => [flow.id, flow]))
  return after.diagram.flows.flatMap((flow) => {
    const previous = beforeById.get(flow.id)
    if (flow.id === named || !previous || same(previous, flow)) return []
    /*
     * Only a route that carries waypoints is written. A Flow authored by its ports alone has no shape of its own to
     * keep: `moveRouteEnds` derives it through `routeBetweenPorts` every time, so it already follows a port that moved,
     * and writing the bend the draft derived would freeze a derived route into the document as though someone had
     * drawn it - the re-routing `INFOSCHEMATICS-TOOL-084` deliberately did not introduce.
     */
    if ((previous.route?.waypoints?.length ?? 0) === 0) return []
    const target = { code: null, geometry: 'route', id: flow.id, kind: 'flow' } as const
    return memberDiff(
      target,
      previous as unknown as Readonly<Record<string, unknown>>,
      flow as unknown as Readonly<Record<string, unknown>>,
      sourceFor(memberPath(target))
    )
  })
}

const projectOperation = (
  before: DefinedInfoschematic,
  after: DefinedInfoschematic,
  operation: ArtefactDraftOperation,
  sourceFor: DocumentMemberSource
): readonly InfoschematicDocumentOperation[] => {
  const targetId = stableId(operation.target)
  const beforeValues = collection(before, operation.target.kind)
  const afterValues = collection(after, operation.target.kind)
  const path = memberPath(operation.target)
  const sourceMember = sourceFor(path)
  const changedScopes = scopeDiff(before, after)

  switch (operation.operation) {
    case 'create': {
      const value = afterValues.find((candidate) => candidate.id === targetId)
      return value
        ? [{ ...anchorFor(afterValues, targetId), op: 'add', path, value: jsonValue(value) }, ...changedScopes]
        : []
    }
    case 'remove':
      return [...removedMembers(before, after), ...changedScopes]
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
            ...dependentFlowDiff(before, after, operation.target.kind === 'flow' ? targetId : undefined, sourceFor),
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
    const projected = projectOperation(before, after, operation, (path) =>
      record(infoschematicDocumentValue(currentDocument, path))
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
