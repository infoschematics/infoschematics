import type { InfoschematicAppearanceConfig, RegionLabelPlacement } from './appearance.ts'
import type { Box, Point as Coordinate } from './geometry.ts'
import type { PortCounts, PortId } from './ports.ts'
import type { RegionFrameStyle, RegionLabelMount } from './region.ts'

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
  interfaces?: readonly string[]
  provides?: readonly string[]
}

export type Fabric = {
  id: string
  label: string
  description?: string
  bounds: Box
  ports?: PortCounts
  kind?: string
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
  operation?: string
  interfaces?: readonly string[]
  direction?: 'forward' | 'bidirectional'
  route?: { waypoints?: readonly Coordinate[]; labelAt?: number }
}

export type Overlay = {
  id: string
  label: string
  description?: string
  kind: string
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
  kind?: string
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

export type Theme = {
  id: string
  label: string
  description?: string
  scenes: readonly Scene[]
}

export type StoryScene = Scene & { duration?: number }

export type Story = {
  id: string
  label: string
  description?: string
  question?: string
  scenes: readonly StoryScene[]
}

export type Interface = {
  id: string
  label: string
  description?: string
  document?: { label?: string; href?: string }
  operations?: readonly { id: string; summary: string }[]
}

export type Specification = {
  id: string
  label: string
  description?: string
  owner?: string
  document?: { ownership: 'ours' | 'theirs'; label?: string; href?: string }
  interfaces: readonly Interface[]
}

export type Diagram = {
  bounds: Box
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
  themes?: readonly Theme[]
  stories?: readonly Story[]
  specifications?: readonly Specification[]
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

export type DefinedInfoschematic = Omit<
  Infoschematic,
  'diagram' | 'scopes' | 'specifications' | 'stories' | 'themes'
> & {
  diagram: DefinedDiagram
  scopes: readonly ArchitecturalScope[]
  specifications: readonly Specification[]
  stories: readonly Story[]
  themes: readonly Theme[]
}
