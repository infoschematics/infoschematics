// Figures drawn over the whole stage, for the beats that argue about the
// diagram rather than describing it. Each carries the claim it makes as its
// own title rather than being hidden - the argument is the point of drawing it,
// so it should reach a reader who cannot see it. Both are drawn faint and behind nothing:
// they are annotation on the picture, not another thing in it, and a reader
// should be able to look past one at the lines underneath.

/**
 * Where the turn is drawn, chosen to clear the cards rather than to be exact.
 *
 * `tail` and `head` are how far each corner arrow reaches back along the edge
 * it came from and on along the edge it leaves by. They are short enough that
 * the four pieces never meet: the gaps are what stop the figure reading as a
 * border drawn around the stage, and the top gap is where the callout sits.
 */
const cycle = {
  x: 96,
  y: 150,
  width: 1520,
  height: 890,
  radius: 190,
  tail: 110,
  head: 130
}

/*
 * The coordination gap: three paths reaching one client, and nothing choosing
 * between them.
 *
 * Marked where the choice would be made if anything made it - at the client
 * that has to pick, and over the space above the carriers where the thing that
 * would decide is missing. A question mark rather than a cross, because the
 * paths are not faulty; nothing is asking which one to use.
 */
function Gap() {
  return (
    <g className="stage-overlay overlay-gap">
      <title>Nothing decides which of the available pathways to use</title>
      <circle className="gap-mark" cx="1580" cy="440" r="54" />
      <text className="gap-glyph" x="1580" y="462">
        ?
      </text>
      <circle className="gap-mark" cx="930" cy="800" r="54" />
      <text className="gap-glyph" x="930" y="822">
        ?
      </text>
      <path className="gap-tie" d="M1526 440H1240" />
      <path className="gap-tie" d="M930 746V620" />
    </g>
  )
}

/*
 * The turn that never stops, drawn as four corner arrows rather than a ring.
 *
 * A single closed outline had to be read as a loop before it said anything, and
 * at this size it read as a box around the stage instead. Four arrowheads all
 * pointing the same way round say the direction outright, and the gaps between
 * them say the figure continues past what is drawn - which is the claim the
 * beat makes: this keeps turning, and what it decides changes each time round.
 *
 * Oversized and low-contrast on purpose: at this weight it reads as the shape
 * of the whole thing, where anything thinner would read as another route to be
 * followed.
 */
function Cycle() {
  const { x, y, width, height, radius: r, tail, head } = cycle
  const right = x + width
  const bottom = y + height
  // Clockwise, each arrow arriving along one edge and leaving along the next.
  const corners = [
    `M${x} ${y + r + tail}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}H${x + r + head}`,
    `M${right - r - tail} ${y}H${right - r}A${r} ${r} 0 0 1 ${right} ${y + r}V${y + r + head}`,
    `M${right} ${bottom - r - tail}V${bottom - r}A${r} ${r} 0 0 1 ${right - r} ${bottom}H${right - r - head}`,
    `M${x + r + tail} ${bottom}H${x + r}A${r} ${r} 0 0 1 ${x} ${bottom - r}V${bottom - r - head}`
  ]
  return (
    <g className="stage-overlay overlay-cycle">
      <title>The federation keeps turning, adapting to demand as it changes</title>
      {corners.map((d) => (
        <path className="cycle-turn" d={d} key={d} markerEnd="url(#cycle-head)" />
      ))}
    </g>
  )
}

export function StageOverlay({ overlay }: { overlay?: string }) {
  return (
    <>
      <defs>
        {/* Oversized to match the turn it sits on: at the family heads' size it
            would read as another route rather than as the shape of the whole.
            `refX` sets the head back into the stroke it caps, so the two meet
            without a seam at the weight the corner arrows are drawn. */}
        <marker
          id="cycle-head"
          markerHeight="128"
          markerUnits="userSpaceOnUse"
          markerWidth="128"
          orient="auto-start-reverse"
          refX="20"
          refY="52"
        >
          <path className="cycle-head" d="M0,0 L0,104 L104,52 z" />
        </marker>
      </defs>
      {overlay === 'gap' ? <Gap /> : null}
      {overlay === 'cycle' ? <Cycle /> : null}
    </>
  )
}
