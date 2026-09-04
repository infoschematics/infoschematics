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
const rowsFor = (placement: Exclude<Placement, { kind: 'box' }>) => {
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

export function PlacementPanel({
  code,
  onPlace,
  placement
}: {
  code: string
  onPlace?: (axis: 'x' | 'y', value: number) => void
  placement: Placement
}) {
  return (
    <div className="placement-panel">
      <dl className="placement-rows">
        {placement.kind === 'box'
          ? boxAxes.map((axis) => (
              <div className="placement-row" key={axis}>
                <dt>{axis.toUpperCase()}</dt>
                <dd>
                  {(axis === 'x' || axis === 'y') && onPlace && placement.editable.includes(axis) ? (
                    <input
                      aria-label={`${code} ${axis}`}
                      className="placement-input"
                      onChange={(event) => onPlace(axis, Number(event.target.value))}
                      step={10}
                      type="number"
                      value={placement.box[axis]}
                    />
                  ) : (
                    placement.box[axis]
                  )}
                </dd>
              </div>
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
