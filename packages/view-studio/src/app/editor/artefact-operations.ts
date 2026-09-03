import type { InfoschematicConfig } from '@infoschematics/domain-model'
import {
  applyArtefactOperations,
  type ArtefactDraftOperation,
} from '@infoschematics/view-model/artefact-draft'
import {
  artefactCapabilities,
  type ArtefactOperation,
  type ArtefactSelection,
  type ArtefactValueByKind,
  type CreateArtefactOperation,
  defineArtefactSelection,
  type EditableArtefact,
  orderArtefactOperations,
  removeArtefactOperation,
} from '@infoschematics/view-model/editable'
import { orderSourceChanges, type SourceChangeOrder } from './source-changes.ts'

type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { readonly [P in keyof T]?: DeepPartial<T[P]> }
    : T

export type ArtefactPropertiesPatch = {
  [K in keyof ArtefactValueByKind]: Readonly<{
    kind: K
    value: DeepPartial<ArtefactValueByKind[K]>
  }>
}[keyof ArtefactValueByKind]

type AnyReplaceArtefactPropertiesOperation = Extract<
  ArtefactDraftOperation,
  { operation: 'replace-properties' }
>

export const artefactOperationKey = (operation: ArtefactDraftOperation): string =>
  operation.target.kind === 'zone'
    ? `zone:${operation.target.laneId}:${operation.target.id}:${operation.operation}`
    : `${operation.target.kind}:${operation.target.id}:${operation.operation}`

const sameTarget = (left: ArtefactSelection, right: ArtefactSelection) =>
  left.kind === right.kind &&
  left.id === right.id &&
  (left.kind !== 'zone' ||
    (right.kind === 'zone' && left.laneId === right.laneId))

const kindOrder: Readonly<Record<ArtefactSelection['kind'], number>> = {
  lane: 0,
  zone: 1,
  fabric: 2,
  card: 3,
  graphic: 4,
  flow: 5,
}

const orderDraftOperations = (
  operations: readonly ArtefactDraftOperation[],
): readonly ArtefactDraftOperation[] => {
  const ordinary = orderArtefactOperations(
    operations.filter(
      (operation): operation is ArtefactOperation =>
        operation.operation !== 'replace-properties',
    ),
  )
  const replacements = operations
    .filter(
      (
        operation,
      ): operation is AnyReplaceArtefactPropertiesOperation =>
        operation.operation === 'replace-properties',
    )
    .sort(
      (left, right) =>
        kindOrder[left.target.kind] - kindOrder[right.target.kind] ||
        (left.target.kind === 'zone' ? left.target.laneId : '').localeCompare(
          right.target.kind === 'zone' ? right.target.laneId : '',
        ) ||
        left.target.id.localeCompare(right.target.id),
    )

  const creates = ordinary.filter(
    (operation) => operation.operation === 'create',
  )
  const changes = ordinary.filter(
    (operation) =>
      operation.operation !== 'create' && operation.operation !== 'remove',
  )
  const removals = ordinary.filter(
    (operation) => operation.operation === 'remove',
  )
  return Object.freeze([...creates, ...replacements, ...changes, ...removals])
}

/** Replace repeated geometry/order edits while retaining distinct operations. */
export function recordArtefactOperation(
  current: readonly ArtefactOperation[],
  next: ArtefactOperation,
): readonly ArtefactOperation[]
export function recordArtefactOperation(
  current: readonly ArtefactDraftOperation[],
  next: ArtefactDraftOperation,
): readonly ArtefactDraftOperation[]
export function recordArtefactOperation(
  current: readonly ArtefactDraftOperation[],
  next: ArtefactDraftOperation,
): readonly ArtefactDraftOperation[] {
  const created = current.some(
    (operation) =>
      operation.operation === 'create' && sameTarget(operation.target, next.target),
  )
  if (next.operation === 'remove' && created) {
    return orderDraftOperations(
      current.filter((operation) => !sameTarget(operation.target, next.target)),
    )
  }

  const priorReorder = current.find(
    (operation) =>
      operation.operation === 'reorder' &&
      sameTarget(operation.target, next.target),
  )
  if (next.operation === 'reorder' && priorReorder?.operation === 'reorder') {
    if (priorReorder.from === next.to) {
      return orderDraftOperations(
        current.filter(
          (operation) =>
            operation.operation !== 'reorder' ||
            !sameTarget(operation.target, next.target),
        ),
      )
    }
    next = { ...next, from: priorReorder.from }
  }

  const withoutSuperseded = current.filter((operation) => {
    if (!sameTarget(operation.target, next.target)) return true
    if (next.operation === 'remove' || next.operation === 'create') return false
    if (operation.operation === 'remove') return false
    return operation.operation !== next.operation
  })
  return orderDraftOperations([...withoutSuperseded, next])
}

export function recordArtefactOperations(
  current: readonly ArtefactOperation[],
  next: readonly ArtefactOperation[],
): readonly ArtefactOperation[]
export function recordArtefactOperations(
  current: readonly ArtefactDraftOperation[],
  next: readonly ArtefactDraftOperation[],
): readonly ArtefactDraftOperation[]
export function recordArtefactOperations(
  current: readonly ArtefactDraftOperation[],
  next: readonly ArtefactDraftOperation[],
): readonly ArtefactDraftOperation[] {
  let result = current
  for (const operation of next) result = recordArtefactOperation(result, operation)
  return result
}

export const discardArtefactOperation = <T extends ArtefactDraftOperation>(
  current: readonly T[],
  key: string,
): readonly T[] =>
  orderDraftOperations(
    current.filter((operation) => artefactOperationKey(operation) !== key),
  ) as readonly T[]

const valueForTarget = (
  config: InfoschematicConfig,
  target: ArtefactSelection,
): ArtefactValueByKind[ArtefactSelection['kind']] | undefined => {
  switch (target.kind) {
    case 'lane':
      return config.infoschematic.lanes.find((value) => value.id === target.id)
    case 'zone':
      return config.infoschematic.lanes
        .find((lane) => lane.id === target.laneId)
        ?.zones.find((value) => value.id === target.id)
    case 'fabric':
      return config.infoschematic.fabrics.find((value) => value.id === target.id)
    case 'card':
      return config.infoschematic.cards.find((value) => value.id === target.id)
    case 'flow':
      return config.infoschematic.flows.find((value) => value.id === target.id)
    case 'graphic':
      return config.infoschematic.graphics.find((value) => value.id === target.id)
  }
}

export const effectiveArtefactValue = (
  config: InfoschematicConfig,
  operations: readonly ArtefactDraftOperation[],
  target: ArtefactSelection,
): ArtefactValueByKind[ArtefactSelection['kind']] | undefined =>
  valueForTarget(applyArtefactOperations(config, operations).config, target)

export const effectiveArtefactOperation = (
  operations: readonly ArtefactDraftOperation[],
  target: ArtefactSelection,
): ArtefactDraftOperation | undefined =>
  operations.some(
    (operation) =>
      operation.operation === 'remove' && sameTarget(operation.target, target),
  )
    ? undefined
    : [...operations]
        .reverse()
        .find(
          (operation) =>
            (operation.operation === 'create' ||
              operation.operation === 'replace-properties') &&
            sameTarget(operation.target, target),
        )

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const mergePatch = (current: unknown, patch: unknown): unknown => {
  if (patch === undefined) return current
  if (!isRecord(current) || !isRecord(patch)) return patch
  const merged: Record<string, unknown> = { ...current }
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) merged[key] = mergePatch(current[key], value)
  }
  return merged
}

const freezeSerialisable = <T>(value: T): T => {
  const clone = JSON.parse(JSON.stringify(value)) as T
  const freeze = (candidate: unknown): void => {
    if (!candidate || typeof candidate !== 'object' || Object.isFrozen(candidate)) return
    for (const child of Object.values(candidate)) freeze(child)
    Object.freeze(candidate)
  }
  freeze(clone)
  return clone
}

export const replaceArtefactPropertiesOperation = (
  config: InfoschematicConfig,
  operations: readonly ArtefactDraftOperation[],
  target: ArtefactSelection,
  patch: ArtefactPropertiesPatch,
): AnyReplaceArtefactPropertiesOperation | undefined => {
  if (patch.kind !== target.kind) return undefined
  const current = effectiveArtefactValue(config, operations, target)
  if (!current) return undefined

  const value = mergePatch(
    current,
    patch.value,
  ) as ArtefactValueByKind[ArtefactSelection['kind']]
  value.id = current.id
  if ('code' in current && 'code' in value) value.code = current.code
  const operation = freezeSerialisable({
    operation: 'replace-properties' as const,
    target,
    value,
  }) as AnyReplaceArtefactPropertiesOperation
  const next = recordArtefactOperation(operations, operation)
  const result = applyArtefactOperations(config, next)
  return result.rejected.some((rejection) => rejection.operation === operation)
    ? undefined
    : operation
}

/** Supplies transient geometry for a newly-created artefact before runtime rebuild. */
export const createdArtefactDetails = (
  operation: CreateArtefactOperation,
): EditableArtefact | undefined => {
  const { target } = operation
  const geometry = (() => {
    switch (target.kind) {
      case 'card':
        return {
          box: (operation.value as InfoschematicConfig['infoschematic']['cards'][number])
            .placement.box,
          role: 'box' as const,
        }
      case 'fabric':
        return {
          box: (operation.value as InfoschematicConfig['infoschematic']['fabrics'][number])
            .placement.box,
          role: 'box' as const,
        }
      case 'flow':
        return {
          points: (operation.value as InfoschematicConfig['infoschematic']['flows'][number])
            .points,
          role: 'route' as const,
        }
      case 'graphic': {
        const placement = (
          operation.value as InfoschematicConfig['infoschematic']['graphics'][number]
        ).placement
        return placement ? { box: placement, role: 'box' as const } : undefined
      }
      case 'lane': {
        const lane = operation.value as InfoschematicConfig['infoschematic']['lanes'][number]
        return { height: lane.height, role: 'lane' as const, y: lane.y }
      }
      case 'zone': {
        const zone = operation.value as InfoschematicConfig['infoschematic']['lanes'][number]['zones'][number]
        return {
          laneId: target.laneId,
          role: 'zone' as const,
          width: zone.width,
          x: zone.x,
        }
      }
    }
  })()

  return geometry
    ? {
        capabilities: artefactCapabilities[target.kind],
        geometry,
        movementTarget: target,
        selection: target,
      }
    : undefined
}

const flowSelection = (flow: InfoschematicConfig['infoschematic']['flows'][number]) =>
  defineArtefactSelection({
    code: flow.code,
    geometry: 'route' as const,
    id: flow.id,
    kind: 'flow' as const,
  })

export type ArtefactRemovalPlan = Readonly<{
  blockedReason?: string
  operations: readonly ArtefactDraftOperation[]
}>

/** Plans dependency cascades before owners and refuses a referenced Graphic. */
export const planArtefactRemoval = (
  config: InfoschematicConfig,
  target: ArtefactSelection,
  current: readonly ArtefactDraftOperation[] = [],
): ArtefactRemovalPlan => {
  const effectiveConfig = applyArtefactOperations(config, current).config
  if (
    target.kind === 'graphic' &&
    effectiveConfig.stories.some((story) =>
      story.scenes.some((scene) => scene.graphic === target.id),
    )
  ) {
    return {
      blockedReason: `Graphic ${target.id} is referenced by a Story`,
      operations: [],
    }
  }

  const flows = effectiveConfig.infoschematic.flows
  const cascades: ArtefactOperation[] = []
  if (target.kind === 'card' || target.kind === 'fabric') {
    for (const flow of flows) {
      if (flow.source === target.id || flow.target === target.id) {
        cascades.push(removeArtefactOperation(flowSelection(flow)))
      }
    }
  }
  if (target.kind === 'lane') {
    const lane = effectiveConfig.infoschematic.lanes.find(
      (candidate) => candidate.id === target.id,
    )
    for (const zone of lane?.zones ?? []) {
      cascades.push(
        removeArtefactOperation(
          defineArtefactSelection({
            code: null,
            geometry: 'zone' as const,
            id: zone.id,
            kind: 'zone' as const,
            laneId: lane?.id ?? target.id,
          }),
        ),
      )
    }
  }

  return {
    operations: orderArtefactOperations([
      ...cascades,
      removeArtefactOperation(target),
    ]),
  }
}

export const artefactIndex = (
  config: InfoschematicConfig,
  target: ArtefactSelection,
): number | undefined => {
  const index = (() => {
    switch (target.kind) {
      case 'lane':
        return config.infoschematic.lanes.findIndex(
          (entry) => entry.id === target.id,
        )
      case 'zone':
        return config.infoschematic.lanes
          .find((entry) => entry.id === target.laneId)
          ?.zones.findIndex((entry) => entry.id === target.id)
      case 'fabric':
        return config.infoschematic.fabrics.findIndex(
          (entry) => entry.id === target.id,
        )
      case 'card':
        return config.infoschematic.cards.findIndex(
          (entry) => entry.id === target.id,
        )
      case 'flow':
        return config.infoschematic.flows.findIndex(
          (entry) => entry.id === target.id,
        )
      case 'graphic':
        return config.infoschematic.graphics.findIndex(
          (entry) => entry.id === target.id,
        )
    }
  })()
  return index === undefined || index < 0 ? undefined : index
}

export type ArtefactSourceChange = SourceChangeOrder &
  Readonly<{
    field: ArtefactDraftOperation['operation']
    key: string
    source: string
  }>

const sourceFor = (operation: ArtefactDraftOperation) => {
  const identity = operation.target.code ?? operation.target.id
  switch (operation.operation) {
    case 'create':
      return `${identity} -> create ${operation.target.kind} at ${operation.at}: ${JSON.stringify(operation.value)}`
    case 'move':
    case 'resize':
      return `${identity} -> ${operation.operation}: ${JSON.stringify(operation.geometry)}`
    case 'reorder':
      return `${identity} -> reorder: ${operation.from} to ${operation.to}`
    case 'remove':
      return `${identity} -> remove ${operation.target.kind}`
    case 'replace-properties':
      return `${identity} -> replace ${operation.target.kind}: ${JSON.stringify(operation.value)}`
  }
}

export const artefactSourceChanges = (
  operations: readonly ArtefactDraftOperation[],
): readonly ArtefactSourceChange[] =>
  orderSourceChanges(
    operations.map((operation) => ({
      authoredIndex:
        operation.operation === 'create'
          ? operation.at
          : operation.operation === 'reorder'
            ? operation.from
            : undefined,
      field: operation.operation,
      key: artefactOperationKey(operation),
      owner:
        operation.target.kind === 'zone'
          ? operation.target.laneId
          : undefined,
      phase:
        operation.operation === 'create'
          ? 'create'
          : operation.operation === 'remove'
            ? 'remove'
            : 'update',
      source: sourceFor(operation),
      target: operation.target,
    })),
  )
