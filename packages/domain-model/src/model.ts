import type { InfoschematicAppearanceConfig, RegionLabelPlacement } from './appearance.ts'
import type { Box, Point as Coordinate } from './geometry.ts'
import type { PortCounts, PortId } from './ports.ts'
import type { RegionFrameStyle, RegionLabelMount } from './region.ts'
import type { RendererReference } from './renderer.ts'

export type JsonValue = null | boolean | number | string | readonly JsonValue[] | { readonly [key: string]: JsonValue }

export type VisualIdentity = { color?: string; fill?: string; icon?: string }

export type FlowLineTreatment = 'solid' | 'dashed'

/** Shared semantic and visual identity for a kind of Card. */
export type CardCollection = {
  id: string
  label: string
  description?: string
  appearance?: VisualIdentity
}

/** Shared semantic and visual identity for a kind of Flow. */
export type FlowFamily = {
  id: string
  label: string
  description?: string
  appearance?: VisualIdentity & { line?: FlowLineTreatment }
}

/** Presentation-oriented architectural view over named Diagram elements. */
export type ArchitecturalScope = {
  id: string
  label: string
  description?: string
  elements: readonly string[]
  appearance?: { icon?: string }
}

export type Region = {
  id: string
  label: string
  bounds: Box
  /** Whether this element draws its own code permanently, overriding the Diagram's default. */
  identity?: boolean
  appearance?: {
    fill?: string
    cornerRadius?: number
    frame?: { style: RegionFrameStyle; opacity?: number }
    label?: {
      placement?: RegionLabelPlacement | 'none'
      mount?: RegionLabelMount
      offset?: number
    }
  }
}

export type Card = {
  id: string
  label: string
  description?: string
  stereotype?: string
  collection?: string
  /** Interface Card this Adapter Card adapts. */
  adapts?: string
  /** Card this Wrapper Card contains. */
  wraps?: string
  bounds: Box
  ports?: PortCounts
  /** Whether this element draws its own code permanently, overriding the Diagram's default. */
  identity?: boolean
}

export type Fabric = {
  id: string
  label: string
  description?: string
  bounds: Box
  ports?: PortCounts
  kind?: RendererReference
  properties?: Readonly<Record<string, JsonValue>>
  appearance?: VisualIdentity
  /** Whether this element draws its own code permanently, overriding the Diagram's default. */
  identity?: boolean
}

/** A lightweight visible source or sink where Flows enter or leave a Diagram. */
export type Point = {
  id: string
  label: string
  at: Coordinate
  ports?: PortCounts
  appearance?: VisualIdentity
  /** Whether this element draws its own code permanently, overriding the Diagram's default. */
  identity?: boolean
}

export type FlowEndpoint = { element: string; port: PortId }

export type Flow = {
  id: string
  family?: string
  /** Overrides the Family default without changing the Flow's semantic identity. */
  appearance?: { line?: FlowLineTreatment }
  source: FlowEndpoint
  target: FlowEndpoint
  direction?: 'forward' | 'bidirectional'
  /**
   * `labelAt` is a fraction of the route's length, `0` at the source and `1` at the target - the unit the schema
   * publishes and both renderers resolve. It is stated here because the name invites a distance in diagram units,
   * and a number typed without one reads as whichever the reader assumes.
   */
  route?: { waypoints?: readonly Coordinate[]; labelAt?: number }
  /** Whether this element draws its own code permanently, overriding the Diagram's default. */
  identity?: boolean
}

export type Overlay = {
  id: string
  label: string
  description?: string
  kind: RendererReference
  bounds?: Box
  properties?: Readonly<Record<string, JsonValue>>
}

export type ElementSelection = {
  elements?: readonly string[]
  scopes?: readonly string[]
}

export type Callout = {
  title?: string
  body: string
  takeaways?: readonly string[]
  placement?: { at: Coordinate } | { element: string }
  kind?: RendererReference
  properties?: Readonly<Record<string, JsonValue>>
}

/**
 * A Scene asking for a named Diagram Dynamic to play while it is the Scene an audience is looking at.
 *
 * The cue names the Dynamic, how often it plays and where it falls in the Scene's order, and nothing else: no
 * duration, no easing, no timer. `once` plays it on entry to the Scene, `repeat` plays it again while the Scene holds,
 * and absence means `once`. A statement that lasts is authored as `depicts: state` on the Dynamic itself, so it is not
 * a playback policy here.
 */
export type SceneCue = {
  dynamic: string
  playback?: 'once' | 'repeat'
  /**
   * Which stage of the Scene's cascade this cue belongs to, counting from one.
   *
   * A stage is an order and never a measurement: the Sequence the Scene sits in paces it, dividing a timed Scene's
   * hold between the stages and giving each stage one presenter step where the Sequence advances manually, per
   * `ADR-INFOSCHEMATICS-035`. Absence is stage one, so a Scene whose cues name no stage has a single stage and plays
   * all of them on entry exactly as it did before cascades existed.
   */
  stage?: number
}

export type Scene = {
  id: string
  label: string
  description?: string
  visibility?: { show?: ElementSelection; hide?: ElementSelection }
  focus?: ElementSelection
  callout?: Callout
  cues?: readonly SceneCue[]
}

export type SequencePresentation = {
  display: 'expanded' | 'collapsed'
  timed: boolean
  callouts: boolean
}

export type SequenceScene = Scene & { duration?: number }

export type Sequence = {
  id: string
  label: string
  description?: string
  presentation: SequencePresentation
  scenes: readonly SequenceScene[]
}

type Realising = { realisedBy?: readonly string[] }

export type Operation = Realising & {
  id: string
  label: string
  description?: string
}

export type Interface = Realising & {
  id: string
  label: string
  description?: string
  operations?: readonly Operation[]
}

export type SpecificationDocument = {
  code?: string
  href?: string
  version?: string
}

export type Specification = Realising & {
  id: string
  label: string
  description?: string
  owner?: string
  documents?: readonly SpecificationDocument[]
  interfaces?: readonly Interface[]
}

export type SpecificationGroup = {
  id: string
  label: string
  description?: string
  specifications: readonly Specification[]
}

/** Shared identity of a named Diagram Dynamic: what changed, not how a renderer depicts it. */
export type DiagramDynamicIdentity = {
  id: string
  label: string
  description?: string
}

/** A finite signal carried over authored Flows. */
export type SignalFlowDynamic = DiagramDynamicIdentity & {
  kind: 'signal-flow'
  flows: readonly string[]
}

/**
 * Whether a Dynamic reports something that happened or describes a state that lasts.
 *
 * This is a property of the change, not of its depiction: an author states which one they mean, and every renderer
 * decides for itself how long it paints an event and how it sustains a state. Absence is an event.
 */
export type DiagramDynamicDepiction = 'event' | 'state'

/** Emphasis on authored visual elements, reporting an event by default or describing a state that lasts. */
export type EmphasiseElementsDynamic = DiagramDynamicIdentity & {
  kind: 'emphasise-elements'
  elements: readonly string[]
  /** `state` holds the emphasis until the host withdraws the occurrence; absent or `event` retires it as before. */
  depicts?: DiagramDynamicDepiction
}

/**
 * A named semantic change an audience should perceive.
 *
 * The declaration names the meaning and its authored targets; a host binds it by id and each renderer chooses a
 * treatment, so motion, a still emphasis, and an announcement are interpretations of one authored concept rather than
 * separate authored instructions.
 */
export type DiagramDynamic = SignalFlowDynamic | EmphasiseElementsDynamic

export type Diagram = {
  bounds: Box
  /** Diagram-unit lattice used by authoring and rendering; zero disables it. */
  gridSize: number
  appearance?: InfoschematicAppearanceConfig
  calloutPositions?: readonly Coordinate[]
  collections?: readonly CardCollection[]
  families?: readonly FlowFamily[]
  regions?: readonly Region[]
  cards?: readonly Card[]
  fabrics?: readonly Fabric[]
  points?: readonly Point[]
  flows?: readonly Flow[]
  overlays?: readonly Overlay[]
  dynamics?: readonly DiagramDynamic[]
}

export type Infoschematic = {
  id: string
  title: string
  subtitle?: string
  description?: string
  diagram: Diagram
  scopes?: readonly ArchitecturalScope[]
  sequences?: readonly Sequence[]
  specifications?: readonly SpecificationGroup[]
}

export type DefinedDiagram = Omit<
  Diagram,
  | 'calloutPositions'
  | 'cards'
  | 'collections'
  | 'dynamics'
  | 'fabrics'
  | 'families'
  | 'flows'
  | 'overlays'
  | 'points'
  | 'regions'
> & {
  calloutPositions: readonly Coordinate[]
  cards: readonly Card[]
  collections: readonly CardCollection[]
  dynamics: readonly DiagramDynamic[]
  fabrics: readonly Fabric[]
  families: readonly FlowFamily[]
  flows: readonly Flow[]
  overlays: readonly Overlay[]
  points: readonly Point[]
  regions: readonly Region[]
}

export type DefinedInfoschematic = Omit<Infoschematic, 'diagram' | 'scopes' | 'sequences' | 'specifications'> & {
  diagram: DefinedDiagram
  scopes: readonly ArchitecturalScope[]
  specifications: readonly SpecificationGroup[]
  sequences: readonly Sequence[]
}
