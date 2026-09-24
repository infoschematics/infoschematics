import { measuredOverlap } from '@infoschematics/view-model/diagnostics'
import type { Box } from '@infoschematics/view-model/geometry'
import { describe, expect, it } from 'vitest'
import { roomForCard, steppedCentre } from './card-placement.ts'

/**
 * Where a created Card lands, held as arithmetic rather than as a rendered position.
 *
 * The browser suite proves the placement survives the whole creation route; these cases prove the search itself, which
 * is the part a rendered assertion cannot pin down: which candidate is nearest, and what happens when none is clear.
 */

const viewBox: Box = { height: 400, width: 800, x: 0, y: 0 }

const overlapsAnything = (candidate: Box, occupied: readonly Box[]) =>
  occupied.some((taken) => measuredOverlap(candidate, taken) !== undefined)

describe('steppedCentre', () => {
  it('puts the first Card in the middle of the view', () => {
    expect(steppedCentre(viewBox, 0)).toEqual({ height: 80, width: 160, x: 320, y: 160 })
  })

  it('steps along for each Card already made, so a second does not hide the first', () => {
    expect(steppedCentre(viewBox, 2)).toEqual({ height: 80, width: 160, x: 360, y: 200 })
  })
})

describe('roomForCard', () => {
  it('leaves the stepped centre alone when nothing is drawn there', () => {
    expect(roomForCard(viewBox, 0, [])).toEqual(steppedCentre(viewBox, 0))
    expect(roomForCard(viewBox, 3, [{ height: 40, width: 40, x: 10, y: 10 }])).toEqual(steppedCentre(viewBox, 3))
  })

  /*
   * The defect this exists for.
   *
   * A Fabric drawn across the middle is the Playground's Message bus: `artefacts-overlap` excuses a Card on it and the
   * placement must not, because a Producer whose new Card lands on the bus has to drag it off before doing anything.
   */
  it('steps off a Fabric drawn across the middle of the view', () => {
    const messageBus: Box = { height: 120, width: 800, x: 0, y: 140 }
    const placed = roomForCard(viewBox, 0, [messageBus])
    expect(overlapsAnything(placed, [messageBus])).toBe(false)
    expect(placed.x).toBe(320)
  })

  /*
   * Nearest first, and stated: with the stepped centre exactly taken, the closest clear candidate is one Card-height
   * above it, not one Card-width beside it. An order left emergent would make this assertion a record of whatever the
   * loops happened to do.
   */
  it('takes the nearest clear candidate, measured rather than the first one tried', () => {
    const taken = steppedCentre(viewBox, 0)
    expect(roomForCard(viewBox, 0, [taken])).toEqual({ height: 80, width: 160, x: 320, y: 80 })
  })

  it('stays inside the view, never finding room by leaving it', () => {
    const wall: Box = { height: 400, width: 640, x: 0, y: 0 }
    const placed = roomForCard(viewBox, 0, [wall])
    expect(overlapsAnything(placed, [wall])).toBe(false)
    expect(placed.x).toBeGreaterThanOrEqual(viewBox.x)
    expect(placed.x + placed.width).toBeLessThanOrEqual(viewBox.x + viewBox.width)
    expect(placed.y).toBeGreaterThanOrEqual(viewBox.y)
    expect(placed.y + placed.height).toBeLessThanOrEqual(viewBox.y + viewBox.height)
  })

  /* A dense document still produces a Card somebody can see and drag. Refusing to place one, or placing it outside the
     view, would answer an overlap with a Card nobody can find. */
  it('falls back to the stepped centre when the whole view is claimed', () => {
    expect(roomForCard(viewBox, 1, [viewBox])).toEqual(steppedCentre(viewBox, 1))
  })

  /* Two Cards made before either creation is written: the second has to avoid the first, which is only in the pending
     operations and not yet in anything the runtime draws. */
  it('avoids a Card that is still only a pending creation', () => {
    const first = roomForCard(viewBox, 0, [])
    const second = roomForCard(viewBox, 1, [first])
    expect(overlapsAnything(second, [first])).toBe(false)
  })
})
