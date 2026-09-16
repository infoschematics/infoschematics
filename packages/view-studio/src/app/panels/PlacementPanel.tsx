import type { Placement, PlacementAxis } from '@infoschematics/view-model/editable'

const boxAxes: readonly PlacementAxis[] = ['x', 'y', 'width', 'height']

// Dragging cannot reliably land on a chosen coordinate, so a box states where it
// sits and lets the number be typed where the model allows it. Every box states
// all four numbers in the same order regardless of which are editable, so a
// region reads against the geography it sits in rather than making the
// reader work it out from what is missing. A route's position is its
// waypoints', so it states its endpoints and how many it has instead.
// Everything that is not a box states itself as plain rows. A port and a
// waypoint are positions rather than extents, so they say where they are and
// what they belong to rather than how big they are.
const coordinateAxes: readonly ('x' | 'y')[] = ['x', 'y']

/*
 * One placement number, typed where the model allows it.
 *
 * A box and a Point render the identical control, so it is stated once: a Point's coordinate is a position a
 * Producer may need exactly, and drag alone cannot land on it, which is the same reason a box offers the field.
 */
function PlacementNumber({
  axis,
  code,
  editable,
  onPlace,
  value
}: {
  axis: 'x' | 'y'
  code: string
  editable: boolean
  onPlace?: (axis: 'x' | 'y', value: number) => void
  value: number
}) {
  return (
    <div className="placement-row">
      <dt>{axis.toUpperCase()}</dt>
      <dd>
        {editable && onPlace ? (
          <input
            aria-label={`${code} ${axis}`}
            className="placement-input"
            onChange={(event) => onPlace(axis, Number(event.target.value))}
            step={10}
            type="number"
            value={value}
          />
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

const rowsFor = (placement: Exclude<Placement, { kind: 'box' | 'coordinate' }>) => {
  // A route's ends are its attachment rather than its extent, so they are shown
  // in the attachment set beside a card's port counts. What is left of a
  // route's dimensions is how many points it runs through.
  if (placement.kind === 'route') return [['POINTS', placement.points]] as const

  if (placement.kind === 'port') {
    return [
      ['SIDE', placement.side],
      ['NUMBER', placement.number],
      ['X', placement.at.x],
      ['Y', placement.at.y],
      ['IN USE', placement.used ? 'yes' : 'no']
    ] as const
  }

  return [
    ['CONNECTION', placement.flow],
    ['INDEX', placement.index],
    ['X', placement.at.x],
    ['Y', placement.at.y]
  ] as const
}

/*
 * What the selection is called, rather than how the editor addresses it.
 *
 * A Card is selected by its bare code, but everything the editor has to tell apart from a Card carries its
 * kind in the key - `point:POINT-A`. That prefix is the editor's business, and reading it out as part of a
 * field's name ("point:POINT-A x") says nothing a Producer needs. A Point is the first kind whose key is
 * prefixed and whose numbers are typed, so this is where the distinction first has to be drawn.
 */
const nameOf = (code: string) => code.slice(code.lastIndexOf(':') + 1)

export function PlacementPanel({
  code,
  onPlace,
  placement
}: {
  code: string
  onPlace?: (axis: 'x' | 'y', value: number) => void
  placement: Placement
}) {
  const name = nameOf(code)

  return (
    <div className="placement-panel">
      <dl className="placement-rows">
        {placement.kind === 'box'
          ? boxAxes.map((axis) =>
              axis === 'x' || axis === 'y' ? (
                <PlacementNumber
                  axis={axis}
                  code={name}
                  editable={placement.editable.includes(axis)}
                  key={axis}
                  onPlace={onPlace}
                  value={placement.box[axis]}
                />
              ) : (
                <div className="placement-row" key={axis}>
                  <dt>{axis.toUpperCase()}</dt>
                  <dd>{placement.box[axis]}</dd>
                </div>
              )
            )
          : placement.kind === 'coordinate'
            ? coordinateAxes.map((axis) => (
                <PlacementNumber
                  axis={axis}
                  code={name}
                  editable={placement.editable.includes(axis)}
                  key={axis}
                  onPlace={onPlace}
                  value={placement.at[axis]}
                />
              ))
            : (rowsFor(placement) as readonly (readonly [string, string | number])[]).map(([label, value]) => (
                <div className="placement-row" key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
      </dl>
    </div>
  )
}
