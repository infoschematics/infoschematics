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
}

/** A lightweight visible source or sink where Flows enter or leave a Diagram. */
export type Point = {
  id: string
  label: string
  at: Coordinate
  ports?: PortCounts
  appearance?: VisualIdentity
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
  route?: { waypoints?: readonly Coordinate[]; labelAt?: number }
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

export type Scene = {
  id: string
  label: string
  description?: string
  visibility?: { show?: ElementSelection; hide?: ElementSelection }
  focus?: ElementSelection
  callout?: Callout
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
  'calloutPositions' | 'cards' | 'collections' | 'fabrics' | 'families' | 'flows' | 'overlays' | 'points' | 'regions'
> & {
  calloutPositions: readonly Coordinate[]
  cards: readonly Card[]
  collections: readonly CardCollection[]
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
