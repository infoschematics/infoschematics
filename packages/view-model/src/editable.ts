import type { CardConfig } from '@infoschematics/domain-model/card'
import type { FabricConfig } from '@infoschematics/domain-model/fabric'
import type { FlowConfig } from '@infoschematics/domain-model/flow'
import type { GraphicConfig } from '@infoschematics/domain-model/graphic'
import type { PointConfig } from '@infoschematics/domain-model/point'
import type { RegionConfig } from '@infoschematics/domain-model/region'
import type { Box, Offset, Point } from './geometry.ts'
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
 * Here rather than beside the Infoschematic that draws it, because the editor holds
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

export type ArtefactKind = 'region' | 'fabric' | 'card' | 'point' | 'flow' | 'graphic'

type SelectionIdentity = Readonly<{
  /** Null where the authored kind has no code field. */
  code: string | null
  id: string
}>

export type ArtefactSelection =
  | (SelectionIdentity & Readonly<{ geometry: 'box'; kind: 'region' }>)
  | (SelectionIdentity & Readonly<{ geometry: 'box'; kind: 'fabric' }>)
  | (SelectionIdentity & Readonly<{ geometry: 'box'; kind: 'card' }>)
  | (SelectionIdentity & Readonly<{ geometry: 'box'; kind: 'graphic' }>)
  /* A Point is the one element whose position is a coordinate rather than an extent, so it carries its own geometry
     role rather than a box with two axes suppressed: `EDIT-008` requires that a Point never acquire box geometry, and
     a role the type system can discriminate is what makes that a compile error rather than a convention. */
  | (SelectionIdentity & Readonly<{ geometry: 'point'; kind: 'point' }>)
  | (SelectionIdentity & Readonly<{ geometry: 'route'; kind: 'flow' }>)

export type ArtefactCapability = 'create' | 'select' | 'move' | 'resize' | 'edit-properties' | 'remove' | 'reorder'

export type ArtefactCapabilities = Readonly<Record<ArtefactCapability, boolean>>

const capabilities = (move: boolean, resize: boolean): ArtefactCapabilities =>
  Object.freeze({
    create: true,
    'edit-properties': true,
    move,
    remove: true,
    reorder: true,
    resize,
    select: true
  })

/** Type-appropriate Design operations; Flow geometry stays with endpoint and waypoint tools. */
export const artefactCapabilities: Readonly<Record<ArtefactKind, ArtefactCapabilities>> = Object.freeze({
  card: capabilities(true, true),
  fabric: capabilities(true, true),
  flow: capabilities(false, false),
  graphic: capabilities(true, true),
  // A Point moves as a coordinate and has no extent to resize, per `EDIT-008`.
  point: capabilities(true, false),
  region: capabilities(true, true)
})

export const artefactCan = (kind: ArtefactKind, capability: ArtefactCapability): boolean =>
  artefactCapabilities[kind][capability]

/** Every kind a Design session can reach, in the order a control surface presents them. */
export const artefactKinds: readonly ArtefactKind[] = Object.freeze([
  'region',
  'fabric',
  'card',
  'point',
  'flow',
  'graphic'
] as const)

/**
 * Which visual element kinds the open Design session lets a Producer reach.
 *
 * A layer is a filter over interaction, not over the diagram: a closed layer keeps its elements drawn exactly as
 * authored and only stops them answering the pointer and the keyboard, so a Graphic laid across a Card can be edited
 * without moving either of them. Nothing here is authored, so nothing here is written back: the set belongs to the
 * session, and leaving Design restores every layer.
 */
export type InteractionLayers = ReadonlySet<ArtefactKind>

/** The state a Design session opens in: every kind interactive. */
export const everyInteractionLayer = (): InteractionLayers => new Set(artefactKinds)

/** Whether a kind answers interaction. An absent set is an unfiltered session rather than a closed one. */
export const interactionLayerOpen = (kind: ArtefactKind, layers?: InteractionLayers): boolean =>
  layers?.has(kind) ?? true

export const toggleInteractionLayer = (layers: InteractionLayers, kind: ArtefactKind): InteractionLayers => {
  const next = new Set(layers)
  if (!next.delete(kind)) next.add(kind)
  return next
}

/**
 * The selection a closed layer leaves behind: none of it.
 *
 * Holding a selection whose kind can no longer be reached leaves handles on screen that nothing can operate, so
 * closing a layer clears what it was holding rather than stranding it.
 */
export const selectionWithinLayers = (
  selection: ArtefactSelection | null,
  layers?: InteractionLayers
): ArtefactSelection | null => (selection && interactionLayerOpen(selection.kind, layers) ? selection : null)

export const defineArtefactSelection = <T extends ArtefactSelection>(selection: T): T =>
  Object.freeze({ ...selection }) as T

/**
 * A Design selection in the order the Producer built it.
 *
 * The order is the contract: the first element is the anchor, and a group operation holds it still while the rest
 * move to it. So a Producer chooses the result by choosing what to click first, rather than by learning a rule
 * about which extent wins.
 *
 * One element is the ordinary case rather than a special one, which is why this is a list and not a second kind of
 * state kept beside the single selection.
 */
export type ArtefactSelectionSet = readonly ArtefactSelection[]

/** The same element, whatever geometry it is carrying. Identity is the kind and the id, because a code can be absent. */
export const sameArtefact = (left: ArtefactSelection, right: ArtefactSelection): boolean =>
  left.kind === right.kind && left.id === right.id

/**
 * Add an element to an additive selection, or take it back out.
 *
 * Adding always appends, so the anchor stays the element the Producer chose first. Removing keeps the order of what
 * is left, so taking the anchor out of a group promotes whatever was chosen next rather than leaving the group
 * without one.
 */
export const toggleArtefactSelection = (
  selection: ArtefactSelectionSet,
  artefact: ArtefactSelection
): ArtefactSelectionSet =>
  selection.some((held) => sameArtefact(held, artefact))
    ? selection.filter((held) => !sameArtefact(held, artefact))
    : [...selection, artefact]

/** The element a group operation holds still. */
export const selectionAnchor = (selection: ArtefactSelectionSet): ArtefactSelection | null => selection[0] ?? null

/**
 * Everything held whose layer is still open, in order.
 *
 * Interaction layers decide what a Producer can reach, so a group selection is filtered through the same set rather
 * than carrying a second notion of selectability: closing a layer takes its elements out of the group exactly as it
 * takes them out of a single selection.
 */
export const selectionSetWithinLayers = (
  selection: ArtefactSelectionSet,
  layers?: InteractionLayers
): ArtefactSelectionSet => selection.filter((artefact) => interactionLayerOpen(artefact.kind, layers))

/**
 * Which held elements a group geometry operation may move.
 *
 * Read out of the capability matrix rather than listed here, so a kind that cannot be moved cannot be aligned
 * either: a Flow runs between the ports it is attached to, and aligning its route directly would fight them.
 *
 * Route geometry is excluded by role as well as by capability, because that is the actual reason a Flow sits out: it
 * has no single extent to bring onto an edge. A Point has no extent either, but it does have one position, and every
 * edge and centre line of a zero-extent element resolves to that position - so a Point aligns and distributes exactly
 * as `ADR-INFOSCHEMATICS-031` reasons, and only geometry that is a path rather than a place is filtered out here.
 */
export const groupMovableSelection = (selection: ArtefactSelectionSet): ArtefactSelectionSet =>
  selection.filter((artefact) => artefact.geometry !== 'route' && artefactCan(artefact.kind, 'move'))

export type BoxGeometry = Readonly<{ box: Box; role: 'box' }>
/** A position with no extent. Nothing here is a size, which is what keeps a Point out of every resize path. */
export type PointGeometry = Readonly<{ at: Point; role: 'point' }>
export type RouteGeometry = Readonly<{
  points: readonly Point[]
  role: 'route'
}>
export type ArtefactGeometry = BoxGeometry | PointGeometry | RouteGeometry

/** The geometry a group operation can measure: an extent, or a coordinate standing in for one. */
export type MovableGeometry = Exclude<ArtefactGeometry, RouteGeometry>

export type ArtefactValueByKind = Readonly<{
  card: CardConfig
  fabric: FabricConfig
  flow: FlowConfig
  graphic: GraphicConfig
  point: PointConfig
  region: RegionConfig
}>

type SelectionFor<K extends ArtefactKind> = Extract<ArtefactSelection, { kind: K }>

export type CreateArtefactOperation<K extends ArtefactKind = ArtefactKind> = Readonly<{
  at: number
  operation: 'create'
  target: SelectionFor<K>
  value: ArtefactValueByKind[K]
}>

export type MoveArtefactOperation = Readonly<{
  geometry: MovableGeometry
  operation: 'move'
  target: Exclude<ArtefactSelection, { kind: 'flow' }>
}>

/* Resize is the one geometry operation a Point is excluded from by type rather than by capability flag. A Point has no
   extent to resize, so a resize carrying point geometry is not a rejected operation but an unwritable one. */
export type ResizeArtefactOperation = Readonly<{
  geometry: BoxGeometry
  operation: 'resize'
  target: Exclude<ArtefactSelection, { kind: 'flow' | 'point' }>
}>

export type ReorderArtefactOperation = Readonly<{
  from: number
  operation: 'reorder'
  target: ArtefactSelection
  to: number
}>

export type RemoveArtefactOperation = Readonly<{
  operation: 'remove'
  target: ArtefactSelection
}>

export type ArtefactOperation =
  | CreateArtefactOperation
  | MoveArtefactOperation
  | ResizeArtefactOperation
  | ReorderArtefactOperation
  | RemoveArtefactOperation

export type EditableArtefact = Readonly<{
  capabilities: ArtefactCapabilities
  geometry: ArtefactGeometry
  /** Adapters identify themselves but move through the Card they wrap. */
  movementTarget: ArtefactSelection
  selection: ArtefactSelection
}>

export type ResizeMinimum = Readonly<{ height?: number; width?: number }>

/* Every kind with an extent states the smallest one worth having. A Flow's geometry belongs to the ports it attaches
   to, and a Point has no extent at all, so neither can hold a minimum: the exclusion is what stops a caller asking. */
export const artefactResizeMinimums: Readonly<Record<Exclude<ArtefactKind, 'flow' | 'point'>, ResizeMinimum>> =
  Object.freeze({
    card: Object.freeze({ height: 40, width: 40 }),
    fabric: Object.freeze({ height: 40, width: 40 }),
    graphic: Object.freeze({ height: 20, width: 20 }),
    region: Object.freeze({ height: 20, width: 20 })
  })

const cloneFrozen = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry) => cloneFrozen(entry))) as T
  }
  if (value && typeof value === 'object') {
    return Object.freeze(
      Object.fromEntries(
        Object.entries(value).flatMap(([key, entry]) => (entry === undefined ? [] : [[key, cloneFrozen(entry)]]))
      )
    ) as T
  }
  return value
}

const validNumber = (value: number) => Number.isFinite(value)

const selectionMatchesValue = <K extends ArtefactKind>(target: SelectionFor<K>, value: ArtefactValueByKind[K]) => {
  if (target.id !== value.id) return false
  if (target.code === null) return true
  return 'code' in value && value.code === target.code
}

export const createArtefactOperation = <K extends ArtefactKind>(
  target: SelectionFor<K>,
  value: ArtefactValueByKind[K],
  at: number
): CreateArtefactOperation<K> | undefined => {
  if (!selectionMatchesValue(target, value) || !validNumber(at)) return undefined
  return cloneFrozen({
    at: Math.max(0, Math.trunc(at)),
    operation: 'create' as const,
    target,
    value
  })
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), Math.max(minimum, maximum))

const moveGeometry = (geometry: MovableGeometry, offset: Offset, bounds?: Box): MovableGeometry | undefined => {
  if (!validNumber(offset.dx) || !validNumber(offset.dy)) return undefined

  /* A coordinate clamps to the diagram's own edges, where a box clamps to where its far edge would leave them. There
     is no extent to keep inside, so a Point may sit exactly on a boundary - which is where an entry or exit Point
     usually belongs. */
  if (geometry.role === 'point') {
    const x = geometry.at.x + offset.dx
    const y = geometry.at.y + offset.dy
    return cloneFrozen({
      at: {
        x: bounds ? clamp(x, bounds.x, bounds.x + bounds.width) : x,
        y: bounds ? clamp(y, bounds.y, bounds.y + bounds.height) : y
      },
      role: 'point' as const
    })
  }

  const x = geometry.box.x + offset.dx
  const y = geometry.box.y + offset.dy
  return cloneFrozen({
    box: {
      ...geometry.box,
      x: bounds ? clamp(x, bounds.x, bounds.x + bounds.width - geometry.box.width) : x,
      y: bounds ? clamp(y, bounds.y, bounds.y + bounds.height - geometry.box.height) : y
    },
    role: 'box' as const
  })
}

export const moveArtefactOperation = (
  target: ArtefactSelection,
  geometry: ArtefactGeometry,
  offset: Offset,
  bounds?: Box
): MoveArtefactOperation | undefined => {
  if (
    !artefactCan(target.kind, 'move') ||
    target.kind === 'flow' ||
    geometry.role === 'route' ||
    target.geometry !== geometry.role
  ) {
    return undefined
  }
  const moved = moveGeometry(geometry, offset, bounds)
  return moved ? cloneFrozen({ geometry: moved, operation: 'move' as const, target }) : undefined
}

const boundedSize = (wanted: number, minimum: number, available?: number) => {
  const floor = Math.max(1, minimum)
  if (available === undefined) return Math.max(floor, wanted)
  const ceiling = Math.max(1, available)
  return Math.min(Math.max(Math.min(floor, ceiling), wanted), ceiling)
}

export const resizeArtefactOperation = (
  target: ArtefactSelection,
  geometry: ArtefactGeometry,
  size: ResizeMinimum,
  bounds?: Box,
  minimum: ResizeMinimum = target.kind === 'flow' || target.kind === 'point' ? {} : artefactResizeMinimums[target.kind]
): ResizeArtefactOperation | undefined => {
  if (
    !artefactCan(target.kind, 'resize') ||
    target.kind === 'flow' ||
    target.kind === 'point' ||
    geometry.role !== 'box' ||
    target.geometry !== geometry.role ||
    (size.height !== undefined && !validNumber(size.height)) ||
    (size.width !== undefined && !validNumber(size.width))
  ) {
    return undefined
  }

  const resized: BoxGeometry = {
    box: {
      ...geometry.box,
      height: boundedSize(
        size.height ?? geometry.box.height,
        minimum.height ?? 1,
        bounds ? bounds.y + bounds.height - geometry.box.y : undefined
      ),
      width: boundedSize(
        size.width ?? geometry.box.width,
        minimum.width ?? 1,
        bounds ? bounds.x + bounds.width - geometry.box.x : undefined
      )
    },
    role: 'box'
  }

  return cloneFrozen({
    geometry: resized,
    operation: 'resize' as const,
    target
  })
}

export const reorderArtefactOperation = (
  target: ArtefactSelection,
  from: number,
  to: number,
  length: number
): ReorderArtefactOperation | undefined => {
  if (
    !artefactCan(target.kind, 'reorder') ||
    !validNumber(from) ||
    !validNumber(to) ||
    !validNumber(length) ||
    length <= 0
  ) {
    return undefined
  }
  const last = Math.max(0, Math.trunc(length) - 1)
  return cloneFrozen({
    from: clamp(Math.trunc(from), 0, last),
    operation: 'reorder' as const,
    target,
    to: clamp(Math.trunc(to), 0, last)
  })
}

export const removeArtefactOperation = (target: ArtefactSelection): RemoveArtefactOperation =>
  cloneFrozen({ operation: 'remove' as const, target })

/** Which edge or centre of the anchor the rest of a group is brought to. */
export type AlignEdge = 'bottom' | 'centre-x' | 'centre-y' | 'left' | 'right' | 'top'

export type DistributeAxis = 'horizontal' | 'vertical'

const noOffset: Offset = { dx: 0, dy: 0 }

const alignedOffset = (anchor: Box, box: Box, edge: AlignEdge): Offset => {
  switch (edge) {
    case 'left':
      return { dx: anchor.x - box.x, dy: 0 }
    case 'centre-x':
      return { dx: anchor.x + anchor.width / 2 - (box.x + box.width / 2), dy: 0 }
    case 'right':
      return { dx: anchor.x + anchor.width - (box.x + box.width), dy: 0 }
    case 'top':
      return { dx: 0, dy: anchor.y - box.y }
    case 'centre-y':
      return { dx: 0, dy: anchor.y + anchor.height / 2 - (box.y + box.height / 2) }
    case 'bottom':
      return { dx: 0, dy: anchor.y + anchor.height - (box.y + box.height) }
  }
}

/**
 * What it takes to bring every box onto one edge or centre of the anchor, in the order the boxes arrived.
 *
 * Each offset moves on one axis only, so aligning a column of Cards to the left never also moves them up or down:
 * the Producer asked about one coordinate and only that one changes. The anchor's own offset is zero, which is what
 * makes the operation safe to repeat - aligning an already-aligned group is a no-op rather than a drift.
 */
export const alignOffsets = (anchor: Box, boxes: readonly Box[], edge: AlignEdge): readonly Offset[] =>
  boxes.map((box) => alignedOffset(anchor, box, edge))

/**
 * The extent a group geometry operation measures, for a geometry that may not have one.
 *
 * A Point is a place rather than a size, so it is measured as a zero-extent box at its coordinate. Every edge and
 * centre line of that box is the Point's own coordinate, so aligning a Point to any edge puts the Point on the
 * anchor's named line; and distribute counts it as one participant occupying none of the space the others share,
 * which is what equalising the gaps around a thing with no width means. `ADR-INFOSCHEMATICS-031` works both through.
 *
 * This is a measurement, not a geometry: nothing here is written back, so a Point never acquires a box.
 */
export const movableBox = (geometry: MovableGeometry): Box =>
  geometry.role === 'box' ? geometry.box : { height: 0, width: 0, x: geometry.at.x, y: geometry.at.y }

/**
 * What it takes to space a run of boxes evenly, in the order the boxes arrived.
 *
 * The two outermost boxes stay where they are and everything between them is spread through the space they leave,
 * so distributing never grows or shrinks the run: the Producer positions the ends and the operation fills in
 * between. Gaps are equalised rather than centres, because a run of boxes of different widths reads as evenly
 * spaced when the space between them is equal.
 *
 * Positions round to whole units. Even spacing rarely divides exactly, and a Producer would rather two gaps differed
 * by one unit than have the authored model carry `x: 213.33333333333334`.
 */
export const distributeOffsets = (boxes: readonly Box[], axis: DistributeAxis): readonly Offset[] => {
  const offsets: Offset[] = boxes.map(() => noOffset)
  // Two boxes are already as evenly spaced as two boxes can be, and one has nothing to be spaced against.
  if (boxes.length < 3) return offsets

  const horizontal = axis === 'horizontal'
  const ordered = boxes
    .map((box, index) => ({
      index,
      size: horizontal ? box.width : box.height,
      start: horizontal ? box.x : box.y
    }))
    .sort((left, right) => left.start - right.start || left.index - right.index)

  const first = ordered[0]
  const last = ordered[ordered.length - 1]
  if (!first || !last) return offsets

  const span = last.start + last.size - first.start
  const occupied = ordered.reduce((total, entry) => total + entry.size, 0)
  const gap = (span - occupied) / (ordered.length - 1)

  let at = first.start
  for (const entry of ordered) {
    const delta = Math.round(at) - entry.start
    offsets[entry.index] = horizontal ? { dx: delta, dy: 0 } : { dx: 0, dy: delta }
    at = at + entry.size + gap
  }

  return offsets
}

export type HandleKind = 'component' | 'label' | 'port' | 'region' | 'waypoint'

// What the position panel reads for a selection. Every box states all four
// numbers in the same order, whether or not each is editable, and the panel
// reads them against the geography they sit in rather than working them out.
// A route has no single point at all, only its endpoints and how many points
// its path runs through.
export type PlacementAxis = 'height' | 'width' | 'x' | 'y'

export type Placement =
  | { kind: 'box'; label: string; box: Box; editable: readonly PlacementAxis[] }
  /* A Point states the two numbers it has and no others. This is its own case rather than a box with width and
     height suppressed, so the panel never has to decide whether an absent extent is zero or unknown. */
  | { kind: 'coordinate'; label: string; at: Point; editable: readonly Extract<PlacementAxis, 'x' | 'y'>[] }
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
  /** Resolves a legacy Canvas key once, before downstream structured editing. */
  selectionFor: (key: string) => EditableArtefact | undefined
  handles: () => readonly Handle[]
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
   * rounded - rounding in free space and projecting afterwards lands it
   * somewhere the line does not agree with.
   */
  onRoute: (key: string, point: Point) => { at: Point; vertical: boolean } | undefined
  /**
   * The line the model would already write for this property, so a draft that
   * has come back round to what is authored can be recognised and dropped. A
   * change set is what is *different*; an edit undone by hand, or overtaken by
   * a change set that has since been applied, is not a change any more.
   */
  authored: (key: string, field: string) => string | undefined
  /** Whether anything on the rendered Infoschematic answers to this key at all. */
  knows: (key: string) => boolean
  /**
   * Whether the model itself carries this key, as against the rendered Infoschematic showing it.
   *
   * The two part company for exactly one kind of draft. A created thing is
   * folded onto the canvas so that it can be dragged, selected and removed like
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

/* A Point sits before a Flow because a Flow may attach to one: creating the Flow first would reference an endpoint the
   document does not have yet, and removing runs the same order in reverse, so the Flow leaves before its Point does. */
const kindDependencyOrder: Readonly<Record<ArtefactKind, number>> = {
  region: 0,
  fabric: 1,
  card: 2,
  point: 3,
  graphic: 4,
  flow: 5
}

const operationOrder: Readonly<Record<ArtefactOperation['operation'], number>> = {
  create: 0,
  move: 1,
  resize: 2,
  reorder: 3,
  remove: 4
}

/**
 * Orders creates from containers to dependants and removals in reverse. Other
 * edits retain fixed kind depth, then stable authored identity and operation.
 */
export const orderArtefactOperations = (operations: readonly ArtefactOperation[]): readonly ArtefactOperation[] =>
  Object.freeze(
    operations
      .map((operation, arrival) => ({ arrival, operation }))
      .sort((left, right) => {
        const leftPhase = operationOrder[left.operation.operation]
        const rightPhase = operationOrder[right.operation.operation]
        if (leftPhase !== rightPhase) return leftPhase - rightPhase

        const leftKind = kindDependencyOrder[left.operation.target.kind]
        const rightKind = kindDependencyOrder[right.operation.target.kind]
        const dependencyOrder = left.operation.operation === 'remove' ? rightKind - leftKind : leftKind - rightKind
        if (dependencyOrder !== 0) return dependencyOrder

        const leftIdentity = left.operation.target.code ?? left.operation.target.id
        const rightIdentity = right.operation.target.code ?? right.operation.target.id
        const byIdentity = leftIdentity < rightIdentity ? -1 : leftIdentity > rightIdentity ? 1 : 0
        if (byIdentity !== 0) return byIdentity

        const leftId = left.operation.target.id
        const rightId = right.operation.target.id
        const byId = leftId < rightId ? -1 : leftId > rightId ? 1 : 0
        if (byId !== 0) return byId

        return left.arrival - right.arrival
      })
      .map(({ operation }) => operation)
  )
