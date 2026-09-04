import {
  type ArtefactOperation,
  type ArtefactSelection,
  orderArtefactOperations,
  type RemoveArtefactOperation,
  type ReorderArtefactOperation
} from '@infoschematics/view-model/editable'

export type SourceChangePhase = 'create' | 'update' | 'remove'

export type SourceChangeOrder = Readonly<{
  authoredIndex?: number
  field: string
  owner?: string
  phase: SourceChangePhase
  target: ArtefactSelection
}>

const operationFor = (change: SourceChangeOrder): ArtefactOperation =>
  change.phase === 'remove'
    ? ({ operation: 'remove', target: change.target } as RemoveArtefactOperation)
    : ({ from: 0, operation: 'reorder', target: change.target, to: 0 } as ReorderArtefactOperation)

const dependencyRanks = (
  changes: readonly SourceChangeOrder[],
  phase: Extract<SourceChangePhase, 'create' | 'remove'>
): ReadonlyMap<ArtefactSelection['kind'], number> => {
  const representative = new Map<ArtefactSelection['kind'], SourceChangeOrder>()
  for (const change of changes) {
    if (change.phase === phase && !representative.has(change.target.kind)) {
      representative.set(change.target.kind, change)
    }
  }
  const ordered = orderArtefactOperations([...representative.values()].map(operationFor))
  return new Map(ordered.map((operation, index) => [operation.target.kind, index]))
}

const kindRanks = (changes: readonly SourceChangeOrder[]): ReadonlyMap<ArtefactSelection['kind'], number> => {
  const representative = new Map<ArtefactSelection['kind'], SourceChangeOrder>()
  for (const change of changes)
    if (!representative.has(change.target.kind)) representative.set(change.target.kind, change)
  const ordered = orderArtefactOperations(
    [...representative.values()].map(
      (change) => ({ from: 0, operation: 'reorder', target: change.target, to: 0 }) as ReorderArtefactOperation
    )
  )
  return new Map(ordered.map((operation, index) => [operation.target.kind, index]))
}

const phaseRank: Readonly<Record<SourceChangePhase, number>> = {
  create: 0,
  update: 1,
  remove: 2
}

const identityOf = (target: ArtefactSelection) => target.code ?? target.id

/**
 * Source order follows the View Model's dependency order. Within updates, the
 * authored owner/index/field tuple remains stable rather than recording event
 * arrival order.
 */
export const orderSourceChanges = <T extends SourceChangeOrder>(changes: readonly T[]): readonly T[] => {
  const createRanks = dependencyRanks(changes, 'create')
  const removeRanks = dependencyRanks(changes, 'remove')
  const kinds = kindRanks(changes)
  return Object.freeze(
    [...changes].sort((left, right) => {
      const byPhase = phaseRank[left.phase] - phaseRank[right.phase]
      if (byPhase !== 0) return byPhase

      const ranks = left.phase === 'remove' ? removeRanks : createRanks
      const byDependency = (ranks.get(left.target.kind) ?? 0) - (ranks.get(right.target.kind) ?? 0)
      if (left.phase !== 'update' && byDependency !== 0) return byDependency

      if (left.phase === 'update') {
        const byKind = (kinds.get(left.target.kind) ?? 0) - (kinds.get(right.target.kind) ?? 0)
        if (byKind !== 0) return byKind

        const leftOwner = left.owner ?? ''
        const rightOwner = right.owner ?? ''
        const byOwner = leftOwner.localeCompare(rightOwner)
        if (byOwner !== 0) return byOwner

        const byIndex =
          (left.authoredIndex ?? Number.MAX_SAFE_INTEGER) - (right.authoredIndex ?? Number.MAX_SAFE_INTEGER)
        if (byIndex !== 0) return byIndex

        const byField = left.field.localeCompare(right.field)
        if (byField !== 0) return byField
      }

      return (
        identityOf(left.target).localeCompare(identityOf(right.target)) || left.target.id.localeCompare(right.target.id)
      )
    })
  )
}
