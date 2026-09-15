import type { ElementEmphasis } from '@infoschematics/view-model/dynamics'
import { visualTokens } from '@infoschematics/view-model/tokens'
import {
  advanceOccurrenceAnnouncement,
  type OccurrenceAnnouncement,
  reconcileOccurrences,
  retireOccurrences
} from './occurrences.ts'

/** The shared emphasis duration, read from the token that also drives the stylesheet, so both retire together. */
export const elementEmphasisDuration = Number.parseInt(visualTokens.canvas.emphasis.duration, 10)

/**
 * Identity is the emphasised element and the occurrence, not the Dynamic that named it: two Dynamics emphasising one
 * element in the same occurrence mean one outline, which is what View Model already resolved.
 */
export const elementEmphasisKey = (emphasis: ElementEmphasis) =>
  JSON.stringify([emphasis.elementId, emphasis.occurrenceKey])

export type ElementEmphasisReconciliation = Readonly<{
  acceptedEmphasis: readonly ElementEmphasis[]
  activeEmphasis: readonly ElementEmphasis[]
}>

export type ElementEmphasisAnnouncement = Readonly<{
  emphasis: readonly ElementEmphasis[]
  revision: number
}>

export const retireElementEmphasis = (
  current: readonly ElementEmphasis[],
  retiring: readonly ElementEmphasis[]
): readonly ElementEmphasis[] => retireOccurrences(current, retiring, elementEmphasisKey)

/** Mirrors the Flow signal lifecycle: an element hidden when its occurrence arrives does not emphasise on reappearing. */
export const reconcileElementEmphasis = (
  current: readonly ElementEmphasis[],
  suppliedEmphasis: readonly ElementEmphasis[],
  shownElementIds: ReadonlySet<string>,
  seenEmphasis: Set<string>
): ElementEmphasisReconciliation => {
  const { accepted, active } = reconcileOccurrences(
    current,
    suppliedEmphasis,
    elementEmphasisKey,
    (emphasis) => shownElementIds.has(emphasis.elementId),
    seenEmphasis
  )
  return { acceptedEmphasis: accepted, activeEmphasis: active }
}

/** The announcement carries the emphasis, because only its Dynamic knows what the treatment means. */
export const advanceElementEmphasisAnnouncement = (
  current: ElementEmphasisAnnouncement | undefined,
  acceptedEmphasis: readonly ElementEmphasis[],
  activeEmphasis: readonly ElementEmphasis[]
): ElementEmphasisAnnouncement | undefined => {
  const held: OccurrenceAnnouncement<ElementEmphasis> | undefined = current && {
    occurrences: current.emphasis,
    revision: current.revision
  }
  const announcement = advanceOccurrenceAnnouncement(held, acceptedEmphasis, activeEmphasis)
  if (!announcement) return undefined
  if (announcement.revision === current?.revision) return current
  return { emphasis: announcement.occurrences, revision: announcement.revision }
}
