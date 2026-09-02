import { useInfoschematic } from '../infoschematic-context.tsx'

/*
 * Which family a new line belongs to, asked at the drop.
 *
 * Asked rather than defaulted, and asked before the line exists rather than
 * offered as a correction afterwards, because the family is not decoration: it
 * issues the code the line will be known by and the colour it will be read by.
 * A line created in the wrong family and moved later leaves its code behind in
 * the wrong series, which ADR-INFOSCHEMATICS-003 will not renumber.
 *
 * It appears where the drag was let go, which is where the reader is looking.
 * Anywhere else - a panel, a modal - and the answer is given somewhere other
 * than the question was asked.
 */
export function FamilyChoice({
  at,
  onChoose,
  onCancel,
}: {
  at: { x: number; y: number }
  onChoose: (family: string) => void
  onCancel: () => void
}) {
  const { infoschematicFamilies } = useInfoschematic()
  return (
    <>
      {/* Anywhere else calls the choice off, so there is no way to be left with
          a picker and no idea how to be rid of it. */}
      <button aria-label="Cancel the new flow" className="family-choice-backdrop" onClick={onCancel} type="button" />
      <div className="family-choice" style={{ left: at.x, top: at.y }}>
        <p>New flow</p>
        {infoschematicFamilies.map((family) => (
          <button key={family.id} onClick={() => onChoose(family.id)} type="button">
            <span className="family-choice-swatch" style={{ background: family.color }} />
            <b>{family.prefix}</b>
            {family.label}
          </button>
        ))}
      </div>
    </>
  )
}
