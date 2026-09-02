import { describe, expect, it } from 'vitest'
import { chooseSpot, type Obstacle } from './placement.ts'

// A thousand by a thousand starting at the origin, so a fraction reads as a
// coordinate and an assertion says what it means.
const view = { height: 1000, width: 1000, x: 0, y: 0 }
const label = { height: 100, width: 200 }

const at = (x: number, y: number) => ({ x, y })

const blocking = (x: number, y: number, weight?: number): Obstacle => ({
  height: 120,
  weight,
  width: 220,
  x: x * 1000 - 110,
  y: y * 1000 - 60
})

describe('choosing where a floating panel sits', () => {
  it('takes the first candidate when nothing is in the way', () => {
    expect(chooseSpot({ candidates: [at(0.5, 0.5), at(0.5, 0.2)], label, obstacles: [], view })).toEqual(at(0.5, 0.5))
  })

  // The preferred position is kept whenever it is free, so the panel does not
  // wander between two beats that both have room in the middle.
  it('keeps the preferred candidate even where a later one is emptier', () => {
    const obstacles = [blocking(0.5, 0.9)]
    expect(chooseSpot({ candidates: [at(0.5, 0.5), at(0.5, 0.2)], label, obstacles, view })).toEqual(at(0.5, 0.5))
  })

  it('passes over a blocked candidate for a clear one', () => {
    const obstacles = [blocking(0.5, 0.5)]
    expect(chooseSpot({ candidates: [at(0.5, 0.5), at(0.5, 0.2)], label, obstacles, view })).toEqual(at(0.5, 0.2))
  })

  /*
   * The case that matters most, because it is the normal one once a step has
   * lit most of the stage. Falling back to a fixed position puts the panel over
   * the diagram exactly when the diagram is busiest, so the least-obstructed
   * candidate wins instead.
   */
  it('takes the least obstructed candidate when none is clear', () => {
    const obstacles = [blocking(0.5, 0.5), { ...blocking(0.5, 0.2), width: 40 }]
    expect(chooseSpot({ candidates: [at(0.5, 0.5), at(0.5, 0.2)], label, obstacles, view })).toEqual(at(0.5, 0.2))
  })

  // A card hidden is a card the reader cannot see; a line crossed is still
  // legible. So a small weighted obstacle outranks a larger unweighted one.
  it('would rather cross a line than cover a component', () => {
    const line = { height: 8, weight: 1, width: 900, x: 50, y: 160 }
    const card = { height: 80, weight: 6, width: 160, x: 420, y: 460 }
    expect(chooseSpot({ candidates: [at(0.5, 0.5), at(0.5, 0.2)], label, obstacles: [card, line], view })).toEqual(
      at(0.5, 0.2)
    )
  })

  // Judged where it would be drawn rather than where it was asked for: a
  // candidate at the very edge is pulled in far enough to fit, and the fraction
  // that comes back is the one that was scored.
  it('clamps a candidate so the panel stays inside the view', () => {
    const spot = chooseSpot({ candidates: [at(0, 0)], label, obstacles: [], view })
    expect(spot).toEqual(at(0.1, 0.05))
  })

  it('scores the clamped position rather than the asked-for one', () => {
    // Nothing sits at the corner asked for; the corner it is pulled back to is
    // covered, so a clear second candidate wins.
    const obstacles = [blocking(0.1, 0.05)]
    expect(chooseSpot({ candidates: [at(0, 0), at(0.5, 0.5)], label, obstacles, view })).toEqual(at(0.5, 0.5))
  })
})
