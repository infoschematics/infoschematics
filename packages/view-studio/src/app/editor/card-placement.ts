import { measuredOverlap } from '@infoschematics/view-model/diagnostics'
import type { Box } from '@infoschematics/view-model/geometry'

/**
 * Where a newly created Card lands.
 *
 * The middle of the Infoschematic, stepped along for each Card already made this session so a second does not hide the
 * first. It is put somewhere visible rather than somewhere correct — a Card belongs where its architecture puts it,
 * which is a judgement, and dragging it there is a gesture the editor already has. `INFOSCHEMATICS-TOOL-125` did not
 * overturn that and this is not automatic layout: nothing here reads a Flow, a Scope or a neighbour's meaning, and the
 * Producer is still expected to move what they made.
 *
 * What the reasoning never covered is landing *on top of* something. Opening the Playground and making a Card put it
 * squarely over the Message bus Fabric, so the Producer's first action was to drag it off something rather than to
 * place it. Visible and overlapping is not visible.
 *
 * So the stepped centre became the first candidate rather than the only one, and the search steps outward from it
 * until it finds a box that is clear and still inside the view. When nothing is clear the stepped centre is what comes
 * back, because a dense document must still produce a Card somebody can see and drag rather than no Card at all.
 */

/**
 * How far apart successive candidates are tried, in diagram units.
 *
 * The same twenty units the stepped centre already moves by, so every candidate keeps the stepped position's parity
 * and a search that finds nothing lands exactly where the old placement would have.
 */
const searchStep = 20

/**
 * How far out the search will go, in candidates.
 *
 * Bounded rather than open, because the cost is the ring count squared and a view box is not a budget: a document with
 * an enormous authored bound would otherwise spend the Producer's click walking empty space it can already see is
 * empty.
 */
const searchLimit = 60

/** Whether an artefact drawn here would sit wholly inside the view. A box outside it is drawn where nobody can reach. */
const within = (viewBox: Box, candidate: Box) =>
  candidate.x >= viewBox.x &&
  candidate.y >= viewBox.y &&
  candidate.x + candidate.width <= viewBox.x + viewBox.width &&
  candidate.y + candidate.height <= viewBox.y + viewBox.height

/**
 * Whether a candidate box is clear of everything already claimed.
 *
 * The measurement comes from View Model's checker rather than from a second copy of the arithmetic here — that is what
 * `ADR-INFOSCHEMATICS-042` settles. The *rule* stays there: `artefacts-overlap` excuses a Card drawn on a Fabric
 * because a Fabric is a place, and this must not, since the Message bus is the exact thing a new Card kept landing on.
 */
const clearOf = (candidate: Box, occupied: readonly Box[]) =>
  occupied.every((taken) => measuredOverlap(candidate, taken) === undefined)

/**
 * The offsets at one step out from the centre, nearest first.
 *
 * A ring rather than a spiral so the order is stated rather than emergent: every offset whose furthest axis is exactly
 * `ring` steps away, sorted by true distance so a diagonal is tried after the straight neighbours it is further than,
 * and by axis after that so the same document always produces the same placement.
 */
const ringOffsets = (ring: number): readonly Readonly<{ dx: number; dy: number }>[] => {
  const offsets: { dx: number; dy: number }[] = []
  for (let row = -ring; row <= ring; row += 1) {
    for (let column = -ring; column <= ring; column += 1) {
      if (Math.max(Math.abs(row), Math.abs(column)) !== ring) continue
      offsets.push({ dx: column * searchStep, dy: row * searchStep })
    }
  }
  return offsets.sort(
    (one, other) =>
      one.dx * one.dx + one.dy * one.dy - (other.dx * other.dx + other.dy * other.dy) ||
      one.dy - other.dy ||
      one.dx - other.dx
  )
}

/**
 * The position the placement has always used: the middle of the view, stepped once per Card made this session.
 *
 * Kept as a named thing rather than inlined because it is now two things at once — the first candidate the search
 * tries, and the fallback it returns when no candidate is clear.
 */
export const steppedCentre = (viewBox: Box, made: number): Box => ({
  height: 80,
  width: 160,
  x: viewBox.x + viewBox.width / 2 - 80 + made * searchStep,
  y: viewBox.y + viewBox.height / 2 - 40 + made * searchStep
})

/**
 * Room for a new Card: the stepped centre if it is clear, otherwise the nearest candidate outward that is.
 *
 * `occupied` is everything already claimed — the artefacts the document draws and the boxes the pending edits have
 * taken — because a Card made twice before either creation is written has to avoid the first one as surely as it
 * avoids an authored Fabric.
 */
export const roomForCard = (viewBox: Box, made: number, occupied: readonly Box[]): Box => {
  const fallback = steppedCentre(viewBox, made)
  if (clearOf(fallback, occupied)) return fallback
  const rings = Math.min(searchLimit, Math.ceil(Math.max(viewBox.width, viewBox.height) / 2 / searchStep))
  for (let ring = 1; ring <= rings; ring += 1) {
    for (const offset of ringOffsets(ring)) {
      const candidate = { ...fallback, x: fallback.x + offset.dx, y: fallback.y + offset.dy }
      if (within(viewBox, candidate) && clearOf(candidate, occupied)) return candidate
    }
  }
  return fallback
}
