import type { FlowSignal } from '@infoschematics/view-model/signals'
import {
  advanceOccurrenceAnnouncement,
  type OccurrenceAnnouncement,
  reconcileOccurrences,
  retireOccurrences
} from './occurrences.ts'

export const flowSignalDuration = 900

/**
 * A JSON tuple keeps the two independently authored identifiers distinct even
 * when either contains punctuation used by the other.
 */
export const flowSignalKey = (signal: FlowSignal) => JSON.stringify([signal.flowId, signal.occurrenceKey])

export type FlowSignalReconciliation = Readonly<{
  activeSignals: readonly FlowSignal[]
  acceptedSignals: readonly FlowSignal[]
}>

export type FlowSignalAnnouncement = Readonly<{
  revision: number
  signals: readonly FlowSignal[]
}>

export const retireFlowSignals = (
  current: readonly FlowSignal[],
  retiring: readonly FlowSignal[]
): readonly FlowSignal[] => retireOccurrences(current, retiring, flowSignalKey)

/**
 * Advances the live-region input only for newly accepted occurrences. The
 * revision makes a same-Flow replay a distinct text mutation for assistive
 * technology, while cancellation clears stale status content.
 */
export const advanceFlowSignalAnnouncement = (
  current: FlowSignalAnnouncement | undefined,
  acceptedSignals: readonly FlowSignal[],
  activeSignals: readonly FlowSignal[]
): FlowSignalAnnouncement | undefined => {
  const held: OccurrenceAnnouncement<FlowSignal> | undefined = current && {
    occurrences: current.signals,
    revision: current.revision
  }
  const announcement = advanceOccurrenceAnnouncement(held, acceptedSignals, activeSignals)
  if (!announcement) return undefined
  // A retained announcement stays the same object, so a live region does not read content it has already read.
  if (announcement.revision === current?.revision) return current
  return { revision: announcement.revision, signals: announcement.occurrences }
}

/**
 * Reconciles host-owned occurrences without allowing a consumed occurrence to
 * restart when visibility changes. `seenSignals` records every currently
 * supplied occurrence, including hidden ones, but releases occurrences the
 * host has withdrawn so an indefinitely running Story remains bounded.
 */
export const reconcileFlowSignals = (
  current: readonly FlowSignal[],
  suppliedSignals: readonly FlowSignal[],
  shownFlowIds: ReadonlySet<string>,
  seenSignals: Set<string>
): FlowSignalReconciliation => {
  const { accepted, active } = reconcileOccurrences(
    current,
    suppliedSignals,
    flowSignalKey,
    (signal) => shownFlowIds.has(signal.flowId),
    seenSignals
  )
  return { acceptedSignals: accepted, activeSignals: active }
}
