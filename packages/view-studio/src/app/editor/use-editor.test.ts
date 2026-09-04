import type { EditableDiagram } from '@infoschematics/view-model/editable'
import { describe, expect, it } from 'vitest'

/*
 * A component draft is an offset, so it only means anything against the
 * position it was measured from. Applying the change set carrying it moves the
 * model by that offset; the draft then sits there and moves the card a second
 * time on the next reload, which is what put SEED-01 at 880,610 after the set
 * that had just moved it to 840,550.
 */
const swept = (drafts: Record<string, { dx: number; dy: number; from?: string }>, authored: string) =>
  Object.fromEntries(Object.entries(drafts).filter(([, draft]) => draft.from === authored))

describe('sweeping drafts the model has overtaken', () => {
  it('drops one measured against a position the model has since left', () => {
    const drafts = { 'SEED-01': { dx: 40, dy: 60, from: 'SEED-01  ->  card(800, 490),' } }

    expect(swept(drafts, 'SEED-01  ->  card(840, 550),')).toEqual({})
  })

  it('keeps one measured against where the model still is', () => {
    const drafts = { 'SEED-01': { dx: 40, dy: 60, from: 'SEED-01  ->  card(840, 550),' } }

    expect(swept(drafts, 'SEED-01  ->  card(840, 550),')).toEqual(drafts)
  })

  it('drops one carrying no stamp, which predates the stamp being kept', () => {
    expect(swept({ 'SEED-01': { dx: 40, dy: 60 } }, 'SEED-01  ->  card(840, 550),')).toEqual({})
  })
})

// The interface has to offer the authored line, or none of the above is
// answerable from inside the hook.
describe('the editable interface', () => {
  it('reports what the model already says for a property', () => {
    const authored: EditableDiagram['authored'] = (key, field) =>
      field === 'card' ? `${key}  ->  card(1, 2),` : undefined

    expect(authored('STD-01', 'card')).toBe('STD-01  ->  card(1, 2),')
    expect(authored('STD-01', 'points')).toBeUndefined()
  })
})

/*
 * A port number names a place only under the count in force. Changing a side's
 * count renumbers it, so a draft made before the change points somewhere the
 * reader never chose - TEL-10's source read S5 on a side that now offers three.
 */
const sweptEnds = (
  ends: Record<string, { component: string; port: string; from?: string } | undefined>,
  authored: (end: string) => string | undefined
) => Object.fromEntries(Object.entries(ends).filter(([end, at]) => at && at.from === authored(end)))

describe('sweeping re-attached ends the numbering has left behind', () => {
  const authored = (end: string) =>
    end === 'source'
      ? "TEL-10  ->  source: 'transmission-management-scal', sourcePort: 'S2',"
      : "TEL-10  ->  target: 'telemetry', targetPort: 'N4',"

  it('drops an end whose number meant a different place when it was chosen', () => {
    const ends = {
      source: {
        component: 'transmission-management-scal',
        port: 'S5',
        from: "TEL-10  ->  source: 'transmission-management-scal', sourcePort: 'S4',"
      }
    }

    expect(sweptEnds(ends, authored)).toEqual({})
  })

  it('keeps the end still measured against what the model says', () => {
    const ends = {
      source: {
        component: 'transmission-management-scal',
        port: 'S5',
        from: "TEL-10  ->  source: 'transmission-management-scal', sourcePort: 'S2',"
      }
    }

    expect(sweptEnds(ends, authored)).toEqual(ends)
  })

  // One end spent and the other still a change: keeping the pair would offer
  // the spent one back alongside the live one.
  it('sweeps each end on its own', () => {
    const ends = {
      source: { component: 'transmission-management-scal', port: 'S5', from: authored('source') },
      target: { component: 'telemetry', port: 'N13', from: 'stale' }
    }

    expect(Object.keys(sweptEnds(ends, authored))).toEqual(['source'])
  })
})

/*
 * A port count is an absolute, so its value can show whether it has been
 * applied - but only if the sweep looks at it, and it was the one draft the
 * sweep did not touch. It survived every reload after a set had landed.
 */
const sweptCounts = (counts: Record<string, Record<string, number>>, authored: (key: string) => string | undefined) =>
  Object.fromEntries(
    Object.entries(counts).filter(([key, sides]) => {
      const stated = ['north', 'east', 'south', 'west']
        .filter((side) => sides[side] !== undefined)
        .map((side) => `${side}: ${sides[side]}`)
        .join(', ')
      return `${key}  ->  ports: { ${stated} },` !== authored(key)
    })
  )

describe('sweeping port counts the model has taken', () => {
  const authored = () => 'STD-01  ->  ports: { north: 0, south: 7 },'

  it('drops one the model now states', () => {
    expect(sweptCounts({ 'STD-01': { north: 0, south: 7 } }, authored)).toEqual({})
  })

  it('keeps one the model does not', () => {
    const counts = { 'STD-01': { north: 0, south: 15 } }

    expect(sweptCounts(counts, authored)).toEqual(counts)
  })
})

/*
 * Three ways a draft outlived the model catching up with it, all found in one
 * list of fourteen that would not clear however often it was applied.
 */
describe('drafts that would not sweep', () => {
  it('compares a port draft side by side, since it names only what it changed', () => {
    const authored = 'NET-05  ->  ports: { north: 0, east: 3, south: 11, west: 7 },'
    const draft: Record<string, number | undefined> = { north: 0, south: 11, west: 7 }

    // As a whole line the two can never match: the model states four sides and
    // the draft three.
    const stated = ['north', 'east', 'south', 'west']
      .filter((side) => draft[side] !== undefined)
      .map((side) => `${side}: ${draft[side]}`)
      .join(', ')
    expect(`NET-05  ->  ports: { ${stated} },`).not.toBe(authored)

    const differs = ['north', 'east', 'south', 'west'].some(
      (side) => draft[side] !== undefined && !authored.includes(`${side}: ${draft[side]}`)
    )
    expect(differs).toBe(false)
  })

  it('drops one whose key the model no longer has', () => {
    const knows = (key: string) => key === 'OTH-01'
    const drafts = { 'SDC-09': 10, 'OTH-01': 10 }

    expect(Object.keys(Object.fromEntries(Object.entries(drafts).filter(([key]) => knows(key))))).toEqual(['OTH-01'])
  })
})

/*
 * Ordered by arrival, a change sat wherever the reader happened to make it,
 * which is no order at all once there are forty of them.
 */
describe('editing what a thing is called', () => {
  const model: Record<string, string> = {
    'MS-01|family': "MS-01  ->  family: 'media-stream',",
    'STD-01|name': "STD-01  ->  label: 'Origin',"
  }
  const authored = (key: string, field: string) => model[`${key}|${field}`]

  // A card's name and a line's family are registry properties, so the line a
  // change hands back names the property the registry uses - `label` for what
  // the panel calls a name - rather than the field the editor keys it by.
  it('writes back the property the registry holds, not the field it is keyed by', () => {
    expect(authored('STD-01', 'name')).toBe("STD-01  ->  label: 'Origin',")
  })

  /*
   * Typing a name back to what the model already says is not a change. Without
   * this the set carries a line setting Origin to Origin, which pastes cleanly
   * and says nothing - and a reader cannot tell it from one that matters.
   */
  it('is not a change once it says what the model already says', () => {
    const typed = (value: string) => `STD-01  ->  label: '${value}',` === authored('STD-01', 'name')
    expect(typed('Origin')).toBe(true)
    expect(typed('Origin ')).toBe(false)
    expect(typed('Source')).toBe(false)
  })

  it('holds a family the same way', () => {
    expect(`MS-01  ->  family: 'media-stream',` === authored('MS-01', 'family')).toBe(true)
    expect(`MS-01  ->  family: 'telemetry',` === authored('MS-01', 'family')).toBe(false)
  })
})

describe('ordering the change list', () => {
  const parts = (key: string) => {
    const [, prefix = key, number = ''] = /^([A-Z]+)-(\d+)$/.exec(key) ?? []
    return { number: Number(number), prefix }
  }
  const rank = (field: string) => ['card', 'ports', 'source', 'target', 'points', 'label'].indexOf(field)
  const sorted = (changes: { field: string; key: string }[]) =>
    [...changes]
      .sort((left, right) => {
        const a = parts(left.key)
        const b = parts(right.key)
        return a.prefix.localeCompare(b.prefix) || a.number - b.number || rank(left.field) - rank(right.field)
      })
      .map((change) => `${change.key} ${change.field}`)

  it('reads a number as a number, so MS-2 comes before MS-10', () => {
    expect(
      sorted([
        { field: 'label', key: 'MS-10' },
        { field: 'label', key: 'MS-2' }
      ])
    ).toEqual(['MS-2 label', 'MS-10 label'])
  })

  it('groups a code together, widest property first', () => {
    expect(
      sorted([
        { field: 'label', key: 'STD-01' },
        { field: 'card', key: 'STD-01' },
        { field: 'ports', key: 'FAB-02' }
      ])
    ).toEqual(['FAB-02 ports', 'STD-01 card', 'STD-01 label'])
  })
})

/*
 * A label is placed as a share of its line, and the share has to be able to
 * give back the point the snap chose. Two places could not: a hundredth of the
 * longest route here is nine units, so pulling a label onto a grid line stored
 * something several units away from it and the snapping looked broken.
 */
describe('the precision a label share is kept to', () => {
  const longest = 920
  const away = (places: number, distance: number) =>
    Math.abs(Number((distance / longest).toFixed(places)) * longest - distance)

  it('lands within a tenth of a unit at four places', () => {
    for (const distance of [10, 137, 619, 913]) expect(away(4, distance), String(distance)).toBeLessThan(0.1)
  })

  it('would miss by units at two, which is what undid the snapping', () => {
    expect(away(2, 619)).toBeGreaterThan(1)
  })
})
