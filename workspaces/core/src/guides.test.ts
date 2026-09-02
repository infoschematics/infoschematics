import { describe, expect, it } from 'vitest'
import { guidesFrom, snapToGuides } from './guides.ts'
import { portCountsForSide, portOffsetsForSide, portsForBox } from './ports.ts'

const card = { height: 80, width: 160, x: 100, y: 200 }

describe('alignment guides', () => {
  it('offers both edges and the centre of every box, on both axes', () => {
    const guides = guidesFrom([card], [])

    expect(guides.filter((guide) => guide.axis === 'x').map((guide) => guide.at)).toEqual([100, 260, 180])
    expect(guides.filter((guide) => guide.axis === 'y').map((guide) => guide.at)).toEqual([200, 280, 240])
  })

  it('offers other handles to align against, and never repeats a guide', () => {
    const guides = guidesFrom([card], [{ x: 100, y: 500 }])

    expect(guides.filter((guide) => guide.axis === 'x' && guide.at === 100)).toHaveLength(1)
    expect(guides.find((guide) => guide.axis === 'y' && guide.at === 500)?.from).toBe('handle')
  })

  it('pulls a point onto the nearest guide within the threshold', () => {
    const guides = guidesFrom([card], [])
    const snapped = snapToGuides({ x: 178, y: 243 }, guides)

    expect(snapped.point).toEqual({ x: 180, y: 240 })
    expect(snapped.guides.map((guide) => guide.from)).toEqual(['centre', 'centre'])
  })

  it('leaves a point alone when nothing is near enough', () => {
    const snapped = snapToGuides({ x: 500, y: 900 }, guidesFrom([card], []))

    expect(snapped.point).toEqual({ x: 500, y: 900 })
    expect(snapped.guides).toEqual([])
  })

  // Snapping per axis is what lets a drag line up horizontally without being
  // hauled sideways to do it.
  it('snaps each axis on its own', () => {
    const snapped = snapToGuides({ x: 182, y: 900 }, guidesFrom([card], []))

    expect(snapped.point).toEqual({ x: 180, y: 900 })
    expect(snapped.guides).toHaveLength(1)
  })

  it('prefers the closer of two guides in range', () => {
    const guides = guidesFrom(
      [],
      [
        { x: 100, y: 0 },
        { x: 104, y: 0 }
      ]
    )

    expect(snapToGuides({ x: 103, y: 0 }, guides).point.x).toBe(104)
  })
})

describe('attachment points', () => {
  // One sits in the middle, three split the side into quarters, seven into
  // eighths - the series a side may take, each level halving the last.
  it('subdivides a side rather than filling it from one end', () => {
    expect(portOffsetsForSide(80, 1)).toEqual([40])
    expect(portOffsetsForSide(80, 3)).toEqual([40, 20, 60])
    expect(portOffsetsForSide(160, 3)).toEqual([80, 40, 120])
  })

  // Port one is always the most central, so adding ports never renumbers the
  // ones above it into a different place.
  it('numbers from the centre outwards', () => {
    expect(portOffsetsForSide(80, 3)).toEqual([40, 20, 60])
    expect(portOffsetsForSide(160, 7)).toEqual([80, 60, 100, 40, 120, 20, 140])
  })

  // An odd count has a true midpoint and port one takes it. An even count has
  // none, so port one is the nearer of the two either side - still the most
  // central place a route can meet the side.
  it('puts port one as near the middle as the count allows', () => {
    for (const length of [80, 160]) {
      for (const count of portCountsForSide(length).filter(Boolean)) {
        const offsets = portOffsetsForSide(length, count)
        const nearest = Math.min(...offsets.map((offset) => Math.abs(offset - length / 2)))
        expect(Math.abs(offsets[0] - length / 2), `${length} at ${count}`).toBe(nearest)
      }
    }
  })

  // Every count the side has room for, not only those dividing it exactly. The
  // ceiling is a port on each interior grid line; a side half as long reaches
  // it half as far up.
  it('allows every count a side has room for, and none at all', () => {
    expect(portCountsForSide(160)).toEqual(Array.from({ length: 16 }, (_, index) => index))
    expect(portCountsForSide(80)).toEqual(Array.from({ length: 8 }, (_, index) => index))
  })

  // Spread evenly, then each port moves to the nearest grid line: the spacing
  // stays as even as the grid allows, and no port lands between lines.
  it('spreads a count evenly and lands every port on the grid', () => {
    for (const length of [80, 160, 200]) {
      for (const count of portCountsForSide(length).filter(Boolean)) {
        const offsets = portOffsetsForSide(length, count)
        expect(offsets, `${length} at ${count}`).toHaveLength(count)
        expect(
          offsets.every((offset) => offset % 10 === 0),
          `${length} at ${count}`
        ).toBe(true)
        expect(new Set(offsets).size, `${length} at ${count}`).toBe(count)
      }
    }
  })

  // A side with no ports is a side nothing may meet, which the model should be
  // able to say rather than being forced to offer at least one.
  it('gives a side no ports when none are asked for', () => {
    expect(portOffsetsForSide(160, 0)).toEqual([])
    expect(portsForBox(card, { east: 0 }).filter((port) => port.id.startsWith('E'))).toEqual([])
  })

  // A count is honoured exactly where the side has room for it, and takes the
  // side's ceiling where it does not. Asking is no longer rounded up to the
  // next permitted step, because every step below the ceiling is permitted.
  it('gives exactly the count asked for, up to what the side holds', () => {
    expect(portOffsetsForSide(160, 5)).toHaveLength(5)
    expect(portOffsetsForSide(80, 2)).toHaveLength(2)
    expect(portOffsetsForSide(80, 4)).toHaveLength(4)
    expect(portOffsetsForSide(160, 99)).toHaveLength(15)
    expect(portOffsetsForSide(80)).toHaveLength(7)
  })

  it('puts every port on its own edge', () => {
    const ports = portsForBox(card)

    expect(ports.filter((port) => port.id.startsWith('N')).every((port) => port.at.y === card.y)).toBe(true)
    expect(ports.filter((port) => port.id.startsWith('E')).every((port) => port.at.x === card.x + card.width)).toBe(
      true
    )
    // Seven fit down an 80-unit side, and an odd count puts port one exactly
    // halfway.
    expect(ports.find((port) => port.id === 'E1')?.at).toEqual({ x: card.x + card.width, y: card.y + 40 })
    expect(portsForBox(card, { east: 3 }).find((port) => port.id === 'E1')?.at).toEqual({
      x: card.x + card.width,
      y: card.y + card.height / 2
    })
  })

  it('honours a per-side count', () => {
    const ports = portsForBox(card, { east: 1, west: 3 })

    expect(ports.filter((port) => port.id.startsWith('E'))).toHaveLength(1)
    expect(ports.filter((port) => port.id.startsWith('W'))).toHaveLength(3)
  })

  // Every port the diagram already names has to exist, or the editor would show
  // fewer places than the model uses.
  it('covers the deepest port the topology actually uses', () => {
    const ports = portsForBox(card).map((port) => port.id)

    for (const id of ['N3', 'E4', 'S4', 'W3']) expect(ports).toContain(id)
  })
})

// A draft names only the side that changed, so it has to be layered over the
// counts already in force. Replacing them instead lets an unmentioned side fall
// back to whatever fits, which silently changes a side nobody touched.
describe('layering a port count over the counts in force', () => {
  // Counts that differ from the default on every side, or replacing them would
  // land on the default and look like layering had worked.
  const declared = { east: 1, north: 15, south: 5, west: 3 }
  const sides = (counts: Parameters<typeof portsForBox>[1]) => {
    const ports = portsForBox(card, counts)
    return (['N', 'E', 'S', 'W'] as const).map((side) => ports.filter((port) => port.id.startsWith(side)).length)
  }

  it('changes only the side the draft names', () => {
    expect(sides({ ...declared, ...{ north: 3 } })).toEqual([3, 1, 5, 3])
  })

  it('would change a side nobody touched if the draft replaced them', () => {
    expect(sides({ north: 3 })).not.toEqual([3, 1, 5, 3])
  })
})
