import type { FlowSignal } from '@infoschematics/view-model/signals'

/**
 * A JSON tuple keeps the two independently authored identifiers distinct even
 * when either contains punctuation used by the other.
 */
export const flowSignalKey = (signal: FlowSignal) => JSON.stringify([signal.flowId, signal.occurrenceKey])

const uniqueFlowSignals = (signals: readonly FlowSignal[]): readonly FlowSignal[] => {
  const keys = new Set<string>()
  return signals.filter((signal) => {
    const key = flowSignalKey(signal)
    if (keys.has(key)) return false
    keys.add(key)
    return true
  })
}

export type FlowSignalReconciliation = Readonly<{
  activeSignals: readonly FlowSignal[]
  acceptedSignals: readonly FlowSignal[]
}>

export type FlowSignalAnnouncement = Readonly<{
  revision: number
  signals: readonly FlowSignal[]
}>

/**
 * Advances the live-region input only for newly accepted occurrences. The
 * revision makes a same-Flow replay a distinct text mutation for assistive
 * technology, while cancellation clears stale status content.
 */
export const advanceFlowSignalAnnouncement = (
  current: FlowSignalAnnouncement | undefined,
  acceptedSignals: readonly FlowSignal[],
  activeSignals: readonly FlowSignal[],
): FlowSignalAnnouncement | undefined => {
  if (acceptedSignals.length > 0) {
    return { revision: (current?.revision ?? 0) + 1, signals: acceptedSignals }
  }
  return activeSignals.length > 0 ? current : undefined
}

/**
 * Reconciles host-owned occurrences without allowing a consumed occurrence to
 * restart when visibility changes. `seenSignals` deliberately records hidden
 * occurrences too: making a Flow visible later is not a new occurrence.
 */
export const reconcileFlowSignals = (
  current: readonly FlowSignal[],
  suppliedSignals: readonly FlowSignal[],
  shownFlowIds: ReadonlySet<string>,
  seenSignals: Set<string>,
): FlowSignalReconciliation => {
  const uniqueCurrent = uniqueFlowSignals(current)
  const uniqueSupplied = uniqueFlowSignals(suppliedSignals)
  const suppliedKeys = new Set(uniqueSupplied.map(flowSignalKey))

  for (const signal of uniqueCurrent) seenSignals.add(flowSignalKey(signal))

  const acceptedSignals = uniqueSupplied.filter((signal) => {
    const key = flowSignalKey(signal)
    const fresh = !seenSignals.has(key)
    seenSignals.add(key)
    return fresh && shownFlowIds.has(signal.flowId)
  })

  const activeKeys = new Set<string>()
  const activeSignals = [...uniqueCurrent, ...acceptedSignals].filter((signal) => {
    const key = flowSignalKey(signal)
    if (!suppliedKeys.has(key) || !shownFlowIds.has(signal.flowId) || activeKeys.has(key)) return false
    activeKeys.add(key)
    return true
  })

  return { acceptedSignals, activeSignals }
}
