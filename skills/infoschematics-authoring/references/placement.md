# Placement method

Infoschematics has no automatic layout. Placement is authored, so choose it the way a careful author would — from the representation pattern — and let the checker judge the result. Notation for every value below is the canonical YAML convention named in [the source map](sources.md#what-to-read).

## Contents

- [Lanes from the pattern](#lanes-from-the-pattern)
- [Sizes and spacing](#sizes-and-spacing)
- [Ports and Flows](#ports-and-flows)
- [Regions and the canvas](#regions-and-the-canvas)

## Lanes from the pattern

Turn the reading order into a grid of lanes before assigning a single coordinate:

- a **pipeline or workflow** reads along one axis: one column per stage, left to right, and a second row only for a branch, a side input, or a return;
- an **architecture** reads by boundary: one lane per boundary or tier (outside, edge, compute, storage), with external dependencies outside the main Region;
- an **entity context** reads from the centre: the subject in the middle cell, neighbours in the cells around it, grouped by what they exchange with it.

Give each part a cell — column and row — and derive its position from the cell. Parts that a Flow joins directly belong in neighbouring cells, so the route between them is short and straight.

## Sizes and spacing

- Use one Card size for every Card of the same rank, and a multiple of the grid for every number — the examples use a `gridSize` of `10` and Cards of `180` to `240` by `120`.
- Leave a gutter between cells wide enough for a Flow and its label to pass: at least `60` between Cards in a row and `60` between rows, more where several Flows share the gutter or a label must sit in it.
- Keep a margin of at least `30` between a part and the edge of the canvas or of the Region holding it.

Writing positions as `column × pitch + margin` keeps everything aligned without reasoning about individual numbers; state the pitch once and apply it.

## Ports and Flows

- Ports are counted per side, and a `link` names a side and a one-based index on it; the canonical YAML convention is authoritative for the notation.
- Declare ports only on the sides Flows use, and only as many as the Flows need. A Flow along the reading order leaves its source on the trailing side and enters its target on the leading side — east to west for left to right.
- When two Flows meet the same side of one part, give them separate ports rather than one shared port.
- Add `waypoints` only when a straight or default route would cross another part; route through a gutter, not across a Card.
- Give a Flow a `family` so its colour and legend say what it carries, and declare each Family once.
- Fabric artwork needs more room for its label than a Card of the same height; widen a Fabric whose label or description the render shows cut short rather than shortening the words.

## Regions and the canvas

- A Region's bounds enclose its parts with the margin above on every side, and leave room for its own label.
- Set `diagram.bounds` last, to the extent of everything placed plus the margin; a canvas much larger than its content reads as unfinished, and one smaller than it puts parts outside the view.
