import type { Box } from '@infoschematics/core/geometry'
import { type PortCounts, portCountsForSide, portOffsetsForSide, type Side } from '@infoschematics/core/ports'

// Opposites together: a reader setting a card's top usually sets its bottom
// next, and going round the compass put the two they are comparing apart.
const sides: [Side, string][] = [
  ['north', 'Top'],
  ['south', 'Bottom'],
  ['west', 'Left'],
  ['east', 'Right']
]

// What a selected component offers on each side. Counts are what the editor can
// change; positions follow from them, which is why attachment points are shown
// rather than dragged.
export function ComponentControls({
  box,
  counts,
  onChange
}: {
  /** The selected component's own box, since a fabric is not a card's size. */
  box: Box
  counts: PortCounts
  onChange: (side: Side, count: number) => void
}) {
  /*
   * A side takes only the counts it has room for, so the stepper moves between
   * those rather than by one - stepping to a number the side cannot take snaps
   * to something else and looks like nothing happened.
   *
   * Which counts those are is read from this component's own box. Assuming a
   * card's 160 by 80 offered a fabric counts its box cannot divide into: a 200
   * unit side has no seven, so asking for one gave back three, and the panel
   * and the stage both sat there unchanged.
   */
  const allowedOn = (side: Side) => portCountsForSide(side === 'east' || side === 'west' ? box.height : box.width)

  /*
   * How evenly a count sits on the grid. Ports are spread evenly and then each
   * moves to its nearest grid line, so most counts leave the gaps a little
   * uneven - a side divides exactly only at a count that shares a factor with
   * its length. Worth showing, because "eleven" says nothing about whether the
   * result will look regular and the reader is choosing on how it looks.
   */
  const evenness = (side: Side) => {
    const length = side === 'east' || side === 'west' ? box.height : box.width
    const offsets = portOffsetsForSide(length, counts[side])
    if (offsets.length < 2) return undefined
    const inOrder = [...offsets].sort((left, right) => left - right)
    const gaps = inOrder.slice(1).map((offset, index) => offset - inOrder[index])
    return Math.max(...gaps) === Math.min(...gaps) ? 'even' : `${Math.min(...gaps)}–${Math.max(...gaps)}`
  }

  const step = (side: Side, direction: number) => {
    const allowed = allowedOn(side)
    const at = allowed.indexOf(counts[side] ?? allowed.at(-1) ?? 1)
    const from = at === -1 ? allowed.length - 1 : at
    return allowed[Math.min(allowed.length - 1, Math.max(0, from + direction))]
  }

  return (
    <div className="component-controls">
      <dl className="port-counts">
        {sides.map(([side, label]) => (
          <div key={side}>
            <dt>{label}</dt>
            <dd>
              <button
                aria-label={`Fewer on the ${label.toLowerCase()}`}
                disabled={step(side, -1) === (counts[side] ?? 0)}
                onClick={() => onChange(side, step(side, -1))}
                type="button"
              >
                −
              </button>
              <input
                aria-label={`Points on the ${label.toLowerCase()}`}
                className="port-count"
                inputMode="numeric"
                max={allowedOn(side).at(-1)}
                min={0}
                onChange={(event) => {
                  const asked = Number(event.target.value)
                  // An empty field is on the way to a number, not a request for
                  // none: typing over "15" clears it before the 4 arrives, and
                  // taking that as zero would drop the side's ports mid-keystroke.
                  if (event.target.value === '' || !Number.isFinite(asked)) return
                  onChange(side, Math.min(Math.max(Math.trunc(asked), 0), allowedOn(side).at(-1) ?? 0))
                }}
                type="number"
                value={counts[side] ?? 0}
              />
              <button
                aria-label={`More on the ${label.toLowerCase()}`}
                disabled={step(side, 1) === (counts[side] ?? 0)}
                onClick={() => onChange(side, step(side, 1))}
                type="button"
              >
                +
              </button>
              <em className="port-spacing" title="Gap between neighbouring points, in grid units">
                {evenness(side) ?? ''}
              </em>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
