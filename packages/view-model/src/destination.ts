import type { ArtefactSelection, ArtefactSelectionSet } from './editable.ts'
import type { Box, Point } from './geometry.ts'
import type { InfoschematicRuntime } from './runtime.ts'

/**
 * Where a reader was sent, resolved against a document rather than against a browser.
 *
 * An [Infoschematic](../../../docs/reference/vocabulary.md#infoschematic) is embedded inside someone else's document,
 * and prose that refers to one part of it needs a way of saying which part. `ADR-INFOSCHEMATICS-005` puts the address
 * itself — the URL, the query parameter, the fragment — with the host, because the host owns routing and the Diagram
 * has no business knowing how a page spells things. What crosses the boundary is this: a destination naming an
 * authored identity, which the View Model turns into a viewport and a selection.
 *
 * The addressable set is an artefact code or a Scope id, and nothing else. A Scene is deliberately absent: Present
 * already selects a Scene through its own route, so a second way of naming one would be two addresses for one thing,
 * and they would disagree the first time either moved.
 *
 * Nothing here reads a viewport, a frame size, a pointer or a scale. The resolver answers from the document alone, so
 * the same address resolves to the same extent whatever the reader's window is doing, and the answer can be asserted
 * from a unit test with no browser at all. What an interactive view then does with the extent — how much of the
 * surface it fills, where it clamps — is the view's, because only the view knows how big it is.
 */
export type InfoschematicDestination =
  | Readonly<{ kind: 'artefact'; code: string }>
  | Readonly<{ kind: 'scope'; id: string }>

/** Convenience constructors, so a host spells a destination once rather than repeating the discriminant. */
export const artefactDestination = (code: string): InfoschematicDestination =>
  Object.freeze({ code, kind: 'artefact' as const })

export const scopeDestination = (id: string): InfoschematicDestination => Object.freeze({ id, kind: 'scope' as const })

/**
 * Why an address led nowhere.
 *
 * An address written in someone else's prose outlives the document it points into: a paragraph linking to `ADPT-01`
 * stays exactly as it was written when that Card is renamed or removed, and nobody editing the document sees the
 * paragraph. So a destination that does not resolve is an ordinary, expected condition and never an error — the
 * Diagram must still mount and still draw the whole document, exactly as it would with no address at all.
 *
 * The reason is carried rather than swallowed, because the host is the only party that can act on it: it knows which
 * page the link was on and can report the broken reference to whoever maintains that page.
 */
export type DestinationRefusal = 'unknown-artefact' | 'unknown-scope' | 'empty-scope' | 'unplaced-artefact'

/** An address that led somewhere: what to centre on, what to select, and what to call it. */
export type ResolvedDestination = Readonly<{
  outcome: 'resolved'
  destination: InfoschematicDestination
  /**
   * The authored extent the address names, in diagram coordinates.
   *
   * A Point has no extent, so its box is the zero-sized box at its coordinate rather than an invented radius: how far
   * around a Point is worth showing is a question about a surface, and this function does not have one.
   */
  extent: Box
  /** The diagram coordinate a viewport centres on: the middle of `extent`, resolved here so no caller recomputes it. */
  centre: Point
  /** What to call the destination when telling a reader who cannot see the viewport move. */
  label: string
  /**
   * What arriving selects, in the order `ADR-INFOSCHEMATICS-025` requires: the anchor first.
   *
   * An artefact destination selects one artefact. A Scope destination selects every element the Scope names, in the
   * authored order, so the anchor is the element the author put first rather than whichever happened to be leftmost.
   */
  selection: ArtefactSelectionSet
}>

/** An address that led nowhere, carrying the reason and a sentence a host can put in front of a person. */
export type RefusedDestination = Readonly<{
  outcome: 'refused'
  destination: InfoschematicDestination
  reason: DestinationRefusal
  message: string
}>

export type DestinationResolution = ResolvedDestination | RefusedDestination

/**
 * The collections a destination is resolved against.
 *
 * Structural rather than the whole runtime, so the resolver states what it reads. It also lets a test hand it a
 * document shape directly, which is how the degenerate cases — a Scope naming nothing that exists, a Flow with no
 * route — get proved rather than assumed unreachable.
 */
export type DestinationDocument = Pick<
  InfoschematicRuntime,
  | 'infoschematicCards'
  | 'infoschematicFabrics'
  | 'infoschematicFlows'
  | 'infoschematicPoints'
  | 'infoschematicRegions'
  | 'infoschematicScopes'
>

const boxCentre = (extent: Box): Point => ({
  x: extent.x + extent.width / 2,
  y: extent.y + extent.height / 2
})

const boundsOfPoints = (points: readonly Point[]): Box | null => {
  if (points.length === 0) return null
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { height: Math.max(...ys) - y, width: Math.max(...xs) - x, x, y }
}

const unionOf = (boxes: readonly Box[]): Box | null => {
  if (boxes.length === 0) return null
  const x = Math.min(...boxes.map((box) => box.x))
  const y = Math.min(...boxes.map((box) => box.y))
  const right = Math.max(...boxes.map((box) => box.x + box.width))
  const bottom = Math.max(...boxes.map((box) => box.y + box.height))
  return { height: bottom - y, width: right - x, x, y }
}

/** One addressable artefact: its selection, its label, and the extent that stands for it. */
type Addressable = Readonly<{ extent: Box | null; label: string; selection: ArtefactSelection }>

/**
 * Every artefact an address can name, keyed by the code an author would write.
 *
 * A Region is keyed by its id because a Region carries no separate code — `ArtefactSelection` records that as a null
 * code, and the id is what an author has to refer to it by. Cards, Fabrics and Flows use their code, which the runtime
 * makes equal to their id. A Point is keyed by its id for the same reason as a Region.
 *
 * Overlays are absent, and that is a decision rather than an omission. An Overlay's bounds are optional, and without
 * them it covers the whole drawing; arriving at a thing that is everywhere is arriving nowhere, and two Overlays that
 * both omit bounds would resolve to the same extent as each other and as the document.
 *
 * A Flow is labelled by its code because a Flow has no label of its own — its authored `label` is a position along the
 * route, not a name — so the code is the only thing a reader could be told they arrived at.
 */
const addressableIn = (document: DestinationDocument): ReadonlyMap<string, Addressable> => {
  const entries = new Map<string, Addressable>()
  for (const region of document.infoschematicRegions)
    entries.set(region.id, {
      extent: region.box,
      label: region.label,
      selection: { code: null, geometry: 'box', id: region.id, kind: 'region' }
    })
  for (const fabric of document.infoschematicFabrics)
    entries.set(fabric.code, {
      extent: fabric.bounds,
      label: fabric.label,
      selection: { code: fabric.code, geometry: 'box', id: fabric.id, kind: 'fabric' }
    })
  for (const card of document.infoschematicCards)
    entries.set(card.code, {
      extent: card.bounds,
      label: card.label,
      selection: { code: card.code, geometry: 'box', id: card.id, kind: 'card' }
    })
  for (const point of document.infoschematicPoints)
    entries.set(point.id, {
      extent: { height: 0, width: 0, x: point.at.x, y: point.at.y },
      label: point.label,
      selection: { code: point.id, geometry: 'point', id: point.id, kind: 'point' }
    })
  for (const flow of document.infoschematicFlows)
    entries.set(flow.code, {
      extent: boundsOfPoints(flow.points),
      label: flow.code,
      selection: { code: flow.code, geometry: 'route', id: flow.id, kind: 'flow' }
    })
  return entries
}

const refuse = (
  destination: InfoschematicDestination,
  reason: DestinationRefusal,
  message: string
): RefusedDestination => Object.freeze({ destination, message, outcome: 'refused' as const, reason })

const arrive = (
  destination: InfoschematicDestination,
  extent: Box,
  label: string,
  selection: ArtefactSelectionSet
): ResolvedDestination =>
  Object.freeze({
    centre: boxCentre(extent),
    destination,
    extent,
    label,
    outcome: 'resolved' as const,
    selection
  })

/**
 * Turn an address into a place in a document.
 *
 * Total: every input returns a resolution, and none throws. The failure cases are the ones a link in old prose
 * actually meets — a code that no longer exists, a Scope that was emptied, an element that was never placed — and each
 * names itself so a host can say which.
 */
export const resolveDestination = (
  document: DestinationDocument,
  destination: InfoschematicDestination
): DestinationResolution => {
  const addressable = addressableIn(document)

  if (destination.kind === 'artefact') {
    const entry = addressable.get(destination.code)
    if (!entry)
      return refuse(destination, 'unknown-artefact', `No artefact in this Infoschematic is coded ${destination.code}.`)
    if (!entry.extent)
      return refuse(destination, 'unplaced-artefact', `${destination.code} exists but has no position to arrive at.`)
    return arrive(destination, entry.extent, entry.label, [entry.selection])
  }

  const scope = document.infoschematicScopes.find((candidate) => candidate.id === destination.id)
  if (!scope) return refuse(destination, 'unknown-scope', `No Scope in this Infoschematic is named ${destination.id}.`)

  const members = scope.elements.flatMap((code) => {
    const entry = addressable.get(code)
    return entry?.extent ? [{ entry, extent: entry.extent }] : []
  })
  const extent = unionOf(members.map((member) => member.extent))
  if (!extent)
    return refuse(destination, 'empty-scope', `Scope ${destination.id} names no artefact that is placed in it.`)

  return arrive(
    destination,
    extent,
    scope.label,
    members.map((member) => member.entry.selection)
  )
}

/**
 * What a reader who cannot see the viewport move is told they arrived at.
 *
 * Here rather than in a view, for the reason `detailBandAnnouncement` is: the sentence is a property of the thing that
 * happened and not of the framework that drew it, so a second outlet cannot word it differently. It says the document
 * did not change because a viewport moving and a selection appearing are exactly what an edit looks like to someone
 * reading through a screen reader, and nothing else on the page would tell them otherwise.
 */
export const arrivalAnnouncement = (arrival: ResolvedDestination): string =>
  arrival.selection.length === 1
    ? `Moved to ${arrival.label}, now selected. The document has not changed.`
    : `Moved to ${arrival.label}, ${arrival.selection.length} elements now selected. The document has not changed.`
