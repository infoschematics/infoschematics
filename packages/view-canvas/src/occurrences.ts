/**
 * Reconciliation shared by every host-owned transient occurrence.
 *
 * A signalled Flow and an emphasised element differ in what they identify and in how a renderer draws them. Their
 * lifecycle is the same statement — accept an occurrence once, hold it for a finite duration, release it when the host
 * withdraws it — so it is written here once instead of twice, and a Dynamic cannot drift from the Flow signals it
 * resolves into.
 */

export type OccurrenceReconciliation<Occurrence> = Readonly<{
  accepted: readonly Occurrence[]
  active: readonly Occurrence[]
}>

export type OccurrenceAnnouncement<Occurrence> = Readonly<{
  occurrences: readonly Occurrence[]
  revision: number
}>

const uniqueOccurrences = <Occurrence>(
  occurrences: readonly Occurrence[],
  keyOf: (occurrence: Occurrence) => string
): readonly Occurrence[] => {
  const keys = new Set<string>()
  return occurrences.filter((occurrence) => {
    const key = keyOf(occurrence)
    if (keys.has(key)) return false
    keys.add(key)
    return true
  })
}

/**
 * Reconciles host-owned occurrences without allowing a consumed occurrence to
 * restart when visibility changes. `seen` records every currently supplied
 * occurrence, including hidden ones, but releases occurrences the host has
 * withdrawn so an indefinitely running Story remains bounded.
 */
export const reconcileOccurrences = <Occurrence>(
  current: readonly Occurrence[],
  supplied: readonly Occurrence[],
  keyOf: (occurrence: Occurrence) => string,
  isShown: (occurrence: Occurrence) => boolean,
  seen: Set<string>
): OccurrenceReconciliation<Occurrence> => {
  const uniqueCurrent = uniqueOccurrences(current, keyOf)
  const uniqueSupplied = uniqueOccurrences(supplied, keyOf)
  const suppliedKeys = new Set(uniqueSupplied.map(keyOf))

  for (const key of seen) {
    if (!suppliedKeys.has(key)) seen.delete(key)
  }

  const accepted = uniqueSupplied.filter((occurrence) => {
    const key = keyOf(occurrence)
    const fresh = !seen.has(key)
    seen.add(key)
    return fresh && isShown(occurrence)
  })

  const activeKeys = new Set<string>()
  const active = [...uniqueCurrent, ...accepted].filter((occurrence) => {
    const key = keyOf(occurrence)
    if (!suppliedKeys.has(key) || !isShown(occurrence) || activeKeys.has(key)) return false
    activeKeys.add(key)
    return true
  })

  return { accepted, active }
}

export const retireOccurrences = <Occurrence>(
  current: readonly Occurrence[],
  retiring: readonly Occurrence[],
  keyOf: (occurrence: Occurrence) => string
): readonly Occurrence[] => {
  const retiringKeys = new Set(retiring.map(keyOf))
  return current.filter((occurrence) => !retiringKeys.has(keyOf(occurrence)))
}

/**
 * Advances the live-region input only for newly accepted occurrences. The
 * revision makes a repeat of the same occurrence a distinct text mutation for
 * assistive technology, while cancellation clears stale status content.
 */
export const advanceOccurrenceAnnouncement = <Occurrence>(
  current: OccurrenceAnnouncement<Occurrence> | undefined,
  accepted: readonly Occurrence[],
  active: readonly Occurrence[]
): OccurrenceAnnouncement<Occurrence> | undefined => {
  if (accepted.length > 0) return { occurrences: accepted, revision: (current?.revision ?? 0) + 1 }
  return active.length > 0 ? current : undefined
}
