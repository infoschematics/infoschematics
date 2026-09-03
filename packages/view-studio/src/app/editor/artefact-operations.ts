import type { InfoschematicConfig } from '@infoschematics/domain-model'
import {
  artefactCapabilities,
  type ArtefactOperation,
  type ArtefactSelection,
  type CreateArtefactOperation,
  defineArtefactSelection,
  type EditableArtefact,
  orderArtefactOperations,
  removeArtefactOperation,
} from '@infoschematics/view-model/editable'
import { orderSourceChanges, type SourceChangeOrder } from './source-changes.ts'

export const artefactOperationKey = (operation: ArtefactOperation): string =>
  operation.target.kind === 'zone'
    ? `zone:${operation.target.laneId}:${operation.target.id}:${operation.operation}`
    : `${operation.target.kind}:${operation.target.id}:${operation.operation}`

const sameTarget = (left: ArtefactSelection, right: ArtefactSelection) =>
  left.kind === right.kind &&
  left.id === right.id &&
  (left.kind !== 'zone' ||
    (right.kind === 'zone' && left.laneId === right.laneId))

/** Replace repeated geometry/order edits while retaining distinct operations. */
export const recordArtefactOperation = (
  current: readonly ArtefactOperation[],
  next: ArtefactOperation,
): readonly ArtefactOperation[] => {
  const created = current.some(
    (operation) =>
      operation.operation === 'create' && sameTarget(operation.target, next.target),
  )
  if (next.operation === 'remove' && created) {
    return orderArtefactOperations(
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
      return orderArtefactOperations(
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
  return orderArtefactOperations([...withoutSuperseded, next])
}

export const recordArtefactOperations = (
  current: readonly ArtefactOperation[],
  next: readonly ArtefactOperation[],
): readonly ArtefactOperation[] =>
  next.reduce(recordArtefactOperation, current)

export const discardArtefactOperation = (
  current: readonly ArtefactOperation[],
  key: string,
): readonly ArtefactOperation[] =>
  orderArtefactOperations(
    current.filter((operation) => artefactOperationKey(operation) !== key),
  )

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
  operations: readonly ArtefactOperation[]
}>

/** Plans dependency cascades before owners and refuses a referenced Graphic. */
export const planArtefactRemoval = (
  config: InfoschematicConfig,
  target: ArtefactSelection,
  current: readonly ArtefactOperation[] = [],
): ArtefactRemovalPlan => {
  if (
    target.kind === 'graphic' &&
    config.stories.some((story) =>
      story.scenes.some((scene) => scene.graphic === target.id),
    )
  ) {
    return {
      blockedReason: `Graphic ${target.id} is referenced by a Story`,
      operations: [],
    }
  }

  const createdFlows = current.flatMap((operation) =>
    operation.operation === 'create' && operation.target.kind === 'flow'
      ? [
          operation.value as InfoschematicConfig['infoschematic']['flows'][number],
        ]
      : [],
  )
  const flows = [...config.infoschematic.flows, ...createdFlows]
  const cascades: ArtefactOperation[] = []
  if (target.kind === 'card' || target.kind === 'fabric') {
    for (const flow of flows) {
      if (flow.source === target.id || flow.target === target.id) {
        cascades.push(removeArtefactOperation(flowSelection(flow)))
      }
    }
  }
  if (target.kind === 'lane') {
    const lane = config.infoschematic.lanes.find(
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
    field: ArtefactOperation['operation']
    key: string
    source: string
  }>

const sourceFor = (operation: ArtefactOperation) => {
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
  }
}

export const artefactSourceChanges = (
  operations: readonly ArtefactOperation[],
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
