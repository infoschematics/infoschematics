import type { Box, Offset, Point } from './geometry.ts'
import type { Guide } from './guides.ts'
import type { PortCounts } from './ports.ts'

// What a diagram must provide to become editable. Nothing here knows what the
// diagram is of: the editor asks for handles, asks what a drop means, and asks
// how a stored change should be written back.
//
// Only labels are movable today. The other kinds are named because the shape of
// the interface has to survive them arriving, not because they exist yet - a
// diagram returning no handles of a kind simply cannot have that kind dragged.

/** Where an end of a flow has been moved to: a port on a component. */
/**
 * A re-attached end. The stamp is the line the model gave when the drop was
 * made: a port number names a place only under the count in force, so changing
 * a side's count leaves the number pointing somewhere the reader never chose.
 */
export type AttachedEnd = { component: string; port: string; from?: string }

/**
 * A flow the editor has made, which the model does not have yet.
 *
 * Only the two ends and the family, because that is all a flow cannot be
 * written down without. Everything else about it - where its label sits, what
 * it conforms to, which way its heads point - is authored afterwards against
 * the entry this creates, in the file where every other line's is.
 *
 * Here rather than beside the topology that draws it, because the editor holds
 * these and the editor knows nothing about this diagram. `family` is a plain
 * string for the same reason: which families exist is the model's business.
 */
export type CreatedFlow = {
  code: string
  family: string
  source: string
  sourcePort: string
  target: string
  targetPort: string
}

/**
 * A component the editor has made, which the model does not have yet.
 *
 * More than a created flow carries, because a component is more than its
 * ends. It has to answer both of the questions the model asks separately - what
 * it is, and where it sits - since a card that has one and not the other cannot
 * be drawn at all.
 *
 * `id` is here rather than left for the reader, unlike a created line's. A
 * flow's id names a relationship nobody has to refer to; a component's is
 * named by every line that meets it, so a card created and then joined to
 * something would hand back a change set describing two different names for the
 * same card. It is taken from what the reader calls the card, which is how every
 * authored id was arrived at.
 *
 * `group` and `scopes` are plain strings for the reason `family` is on a created
 * flow: which scopes exist is the model's business, not the editor's.
 */
export type CreatedComponent = {
  /**
   * Absent for an adapter, which has no position of its own: it has the
   * position of the card it clasps, so storing one would be a second answer to
   * a question that already has one, and the two would part company the first
   * time the card was dragged.
   */
  box?: Box
  code: string
  detail: string
  group: string
  id: string
  label: string
  ports: PortCounts
  scopes: readonly string[]
  /** The card this is drawn around, where it is an adapter rather than a card. */
  wraps?: string
}

export type HandleKind = 'component' | 'label' | 'lane' | 'port' | 'waypoint' | 'zone'

// What the position panel reads for a selection. Every box states all four
// numbers in the same order, whether or not each is editable - a lane spans
// its full width and a zone its lane's height, so those axes are fixed rather
// than absent, and the panel reads them against the geography they sit in
// rather than working them out. A route has no single point at all, only its
// endpoints and how many points its path runs through.
export type PlacementAxis = 'height' | 'width' | 'x' | 'y'

export type Placement =
  | { kind: 'box'; label: string; box: Box; editable: readonly PlacementAxis[] }
  | { kind: 'route'; label: string; from: string; to: string; points: number }
  | { kind: 'port'; label: string; at: Point; side: string; number: number; used: boolean }
  | { kind: 'waypoint'; label: string; at: Point; flow: string; index: number }

export type Handle = {
  /** Identity a change is recorded against, and what the model is keyed by. */
  key: string
  kind: HandleKind
  /** Where it sits now, in diagram units. */
  at: Point
}

export type Change = {
  key: string
  kind: HandleKind
  offset: Offset
  /** The line to write back into the model, ready to paste. */
  source: string
}

export type EditableDiagram = {
  handles: () => readonly Handle[]
  /** What this diagram offers to align against while a handle is being dragged. */
  guidesFor: (key: string) => readonly Guide[]
  /**
   * What dropping a handle at a point means, or undefined where the diagram
   * forbids the move. A diagram enforces its own constraints here rather than
   * the editor guessing at them.
   */
  offsetFor: (key: string, point: Point) => Offset | undefined
  /**
   * Where along its route a label has been dropped, for the kinds of handle
   * that live on a line rather than beside one. Undefined for everything else.
   */
  alongFor: (key: string, point: Point) => number | undefined
  /**
   * Where on a route a loose point falls, and which way that run travels. A
   * label lives on its line, so a drag is pulled onto the line before it is
   * snapped - snapping in free space and projecting afterwards lands it
   * somewhere neither the grid nor the line agreed with.
   */
  onRoute: (key: string, point: Point) => { at: Point; vertical: boolean } | undefined
  /**
   * The line the model would already write for this property, so a draft that
   * has come back round to what is authored can be recognised and dropped. A
   * change set is what is *different*; an edit undone by hand, or overtaken by
   * a change set that has since been applied, is not a change any more.
   */
  authored: (key: string, field: string) => string | undefined
  /** Whether anything on the stage answers to this key at all. */
  knows: (key: string) => boolean
  /**
   * Whether the model itself carries this key, as against the stage showing it.
   *
   * The two part company for exactly one kind of draft. A created thing is
   * folded onto the stage so that it can be dragged, selected and removed like
   * anything else, which makes `knows` say yes to it from the moment it is
   * made - and that is the wrong question to ask when deciding whether the
   * creation has been applied. This one asks the right one: the model has the
   * code, so the change set carrying it has landed and the draft is spent.
   */
  authors: (key: string) => boolean
  /**
   * Where each end meeting a component should sit once a side's count changes.
   *
   * A port number names a place only under the count in force, so keeping the
   * number moves the line: what a reader chose was the place. Every end on that
   * component is therefore re-seated on the port nearest where it already is.
   */
  reseat: (
    key: string,
    counts: PortCounts
  ) => readonly { code: string; component: string; end: 'source' | 'target'; port: string }[]
  /** How a stored offset is written back into the model. */
  describe: (key: string, offset: Offset) => Change | undefined
  /** How many ports each side of a component currently offers, where it has any. */
  portCountsFor: (key: string) => PortCounts | undefined
  /**
   * Changes that follow from others rather than being made directly - a route
   * carried by the component it is anchored to. Without these the change set
   * hands back a move and not what the move did to everything else.
   */
  derived: () => readonly Change[]
  /**
   * What the thing is called and what kind of thing it is, where it has either.
   *
   * Kept apart from `placementFor`, which answers where it sits: a diagram may
   * know one and not the other, and a panel showing a position has no business
   * inventing a name to go with it.
   */
  identityOf: (key: string) => Readonly<Partial<Record<string, string>>> | undefined
  /** Where selected thing sits, panel state. */
  placementFor: (key: string) => Placement | undefined
}

/** Changes in the order the diagram lists its handles, so output is stable. */
export const orderChanges = (diagram: EditableDiagram, changes: ReadonlyMap<string, Change>): readonly Change[] => {
  const ordered = diagram
    .handles()
    .map((handle) => changes.get(handle.key))
    .filter((change): change is Change => Boolean(change))
  return ordered.length === changes.size ? ordered : [...changes.values()]
}
