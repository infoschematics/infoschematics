/**
 * The one structure a sustained Sequence could grow, measured over enough cycles that growth would be unmistakable.
 *
 * `SCENE-006` forbids retained state in proportion to elapsed cycles. Automatic playback mints a fresh Scene
 * occurrence key on every step — `present-scene-1`, `present-scene-2`, and onward without end — and every one of
 * them is offered to this reconciliation. `seen` is the only thing here that lives for the Canvas's whole lifetime,
 * so it is the only candidate; the comment above `reconcileOccurrences` claims it stays bounded because keys the
 * host has withdrawn are released.
 *
 * That claim is not observable from the page. A retained key changes no markup, retires no occurrence and alters no
 * timer — it is invisible until it is a heap profile. So it is measured here, at the module that owns the set,
 * rather than inferred from the browser case that drives the same lifecycle through the real Canvas.
 */
import { expect, it } from 'vitest'
import { reconcileOccurrences } from './occurrences.ts'

type Occurrence = Readonly<{ flowId: string; occurrenceKey: string }>

const keyOf = (occurrence: Occurrence) => JSON.stringify([occurrence.flowId, occurrence.occurrenceKey])

const cycles = 2000

it('releases withdrawn keys, so a sustained Sequence does not grow the seen set', () => {
  const seen = new Set<string>()
  let current: readonly Occurrence[] = []
  const sizes: number[] = []
  const activeCounts: number[] = []
  let accepted = 0

  for (let cycle = 1; cycle <= cycles; cycle += 1) {
    // Exactly what `derivePresentation` supplies on each step: the focused Flow under a per-step occurrence key.
    const supplied: readonly Occurrence[] = [{ flowId: 'LOAD', occurrenceKey: `present-scene-${cycle}` }]
    const reconciliation = reconcileOccurrences(current, supplied, keyOf, () => true, seen)
    current = reconciliation.active
    accepted += reconciliation.accepted.length
    sizes.push(seen.size)
    activeCounts.push(reconciliation.active.length)
  }

  // Each step's occurrence is genuinely new, so the set is being exercised rather than handed the same key 2000
  // times — without this, a set that never grew would prove nothing about a Sequence that never changed key.
  expect(accepted).toBe(cycles)

  // One supplied occurrence per step means one retained key and one active occurrence per step, at every step. The
  // assertion is the distinct values observed across the whole run, so a single cycle's drift shows up as an extra
  // entry rather than being averaged away.
  expect({ sizes: [...new Set(sizes)], active: [...new Set(activeCounts)] }).toEqual({ sizes: [1], active: [1] })
})
