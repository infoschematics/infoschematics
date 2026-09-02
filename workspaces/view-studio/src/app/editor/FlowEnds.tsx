/*
 * Where a flow's two ends are attached.
 *
 * The counterpart of a card's port counts, and shown in the same place for the
 * same reason: attachment is the third thing worth knowing about anything on
 * the Infoschematic, after what it is and where it sits. A card offers ports; a line
 * lands on two of them.
 *
 * Read rather than typed. An end is moved by dragging it onto a port, which is
 * the gesture that can see whether the port is free and where the line will
 * run; a port named into a field can do neither.
 */
export function FlowEnds({ from, to }: { from: string; to: string }) {
  return (
    <div className="placement-panel">
      <dl className="placement-rows">
        {[
          ['SOURCE', from],
          ['TARGET', to]
        ].map(([label, value]) => (
          <div className="placement-row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
