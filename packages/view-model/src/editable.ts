import type { CardConfig } from '@infoschematics/domain-model/card'
import type { FabricConfig } from '@infoschematics/domain-model/fabric'
import type { FlowConfig } from '@infoschematics/domain-model/flow'
import type { GraphicConfig } from '@infoschematics/domain-model/graphic'
import type { RegionConfig } from '@infoschematics/domain-model/region'
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

export type ArtefactKind = 'region' | 'fabric' | 'card' | 'flow' | 'graphic'

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
  region: capabilities(true, true)
})

export const artefactCan = (kind: ArtefactKind, capability: ArtefactCapability): boolean =>
  artefactCapabilities[kind][capability]

export const defineArtefactSelection = <T extends ArtefactSelection>(selection: T): T =>
  Object.freeze({ ...selection }) as T

export type BoxGeometry = Readonly<{ box: Box; role: 'box' }>
export type RouteGeometry = Readonly<{
  points: readonly Point[]
  role: 'route'
}>
export type ArtefactGeometry = BoxGeometry | RouteGeometry

export type ArtefactValueByKind = Readonly<{
  card: CardConfig
  fabric: FabricConfig
  flow: FlowConfig
  graphic: GraphicConfig
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
  geometry: Exclude<ArtefactGeometry, RouteGeometry>
  operation: 'move'
  target: Exclude<ArtefactSelection, { kind: 'flow' }>
}>

export type ResizeArtefactOperation = Readonly<{
  geometry: Exclude<ArtefactGeometry, RouteGeometry>
  operation: 'resize'
  target: Exclude<ArtefactSelection, { kind: 'flow' }>
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

export const artefactResizeMinimums: Readonly<Record<Exclude<ArtefactKind, 'flow'>, ResizeMinimum>> = Object.freeze({
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

const moveGeometry = (
  geometry: Exclude<ArtefactGeometry, RouteGeometry>,
  offset: Offset,
  bounds?: Box
): Exclude<ArtefactGeometry, RouteGeometry> | undefined => {
  if (!validNumber(offset.dx) || !validNumber(offset.dy)) return undefined

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
  minimum: ResizeMinimum = target.kind === 'flow' ? {} : artefactResizeMinimums[target.kind]
): ResizeArtefactOperation | undefined => {
  if (
    !artefactCan(target.kind, 'resize') ||
    target.kind === 'flow' ||
    geometry.role === 'route' ||
    target.geometry !== geometry.role ||
    (size.height !== undefined && !validNumber(size.height)) ||
    (size.width !== undefined && !validNumber(size.width))
  ) {
    return undefined
  }

  const resized: Exclude<ArtefactGeometry, RouteGeometry> = {
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

export type HandleKind = 'component' | 'label' | 'port' | 'region' | 'waypoint'

// What the position panel reads for a selection. Every box states all four
// numbers in the same order, whether or not each is editable, and the panel
// reads them against the geography they sit in rather than working them out.
// A route has no single point at all, only its endpoints and how many points
// its path runs through.
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
  /** Resolves a legacy Canvas key once, before downstream structured editing. */
  selectionFor: (key: string) => EditableArtefact | undefined
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

const kindDependencyOrder: Readonly<Record<ArtefactKind, number>> = {
  region: 0,
  fabric: 1,
  card: 2,
  graphic: 3,
  flow: 4
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
