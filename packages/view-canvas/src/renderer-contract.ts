/**
 * The renderer contract's types, stated apart from the resolution that reads them.
 *
 * Resolution reaches the standard catalogue where a host registers nothing, and the catalogue's definitions are typed
 * by this same contract — so with the types declared beside the resolver the two modules would each import the other.
 * The contract is the thing both depend on, so it is its own module and neither owns the other.
 */
import type { Callout, Overlay } from '@infoschematics/domain-model'
import type { Box } from '@infoschematics/view-model/geometry'
import type { RuntimeFabric } from '@infoschematics/view-model/runtime'
import type { ComponentType, ReactNode } from 'react'

export type RendererKind = 'fabric' | 'graphic' | 'callout'

export type RendererProperties = Readonly<Record<string, boolean | number | string>>

export type RendererValidationResult<Properties extends RendererProperties = RendererProperties> =
  | Readonly<{ valid: true; properties: Properties }>
  | Readonly<{ valid: false; reason: string }>

export type RendererDefinition<Props, Properties extends RendererProperties = RendererProperties> = Readonly<{
  key: string
  schemaVersion: number
  validateProperties: (properties: RendererProperties | undefined) => RendererValidationResult<Properties>
  component: ComponentType<Props & { properties: Properties }>
}>

export type FabricRendererProps = {
  fabric: RuntimeFabric
  bounds: Box
}

export type GraphicRendererProps = {
  graphic: Overlay
  /** Effective Design bounds, including an uncommitted move or resize. */
  bounds: Box
  viewBox: Box
}

export type CalloutRendererProps = {
  callout: Callout
  children: ReactNode
}

export type FabricRendererDefinition<Properties extends RendererProperties = RendererProperties> = RendererDefinition<
  FabricRendererProps,
  Properties
>

export type GraphicRendererDefinition<Properties extends RendererProperties = RendererProperties> = RendererDefinition<
  GraphicRendererProps,
  Properties
>

export type CalloutRendererDefinition<Properties extends RendererProperties = RendererProperties> = RendererDefinition<
  CalloutRendererProps,
  Properties
>

export type RendererDiagnosticCode = 'unknown-key' | 'unsupported-version' | 'invalid-properties' | 'duplicate-key'

export type RendererDiagnostic = Readonly<{
  code: RendererDiagnosticCode
  kind: RendererKind
  key: string
  schemaVersion?: number
  artefactId?: string
  message: string
}>

export type RendererDiagnosticHandler = (diagnostic: RendererDiagnostic) => void

export type ScopeIconRenderer = ComponentType<{ 'aria-hidden': true; size: number }>

export type RendererDefinitionShape<Props> = Readonly<{
  key: string
  schemaVersion: number
  validateProperties: (properties: RendererProperties | undefined) => RendererValidationResult<RendererProperties>
  component: ComponentType<Props & { properties: never }>
}>

export type RendererCollection<Props> =
  | readonly RendererDefinitionShape<Props>[]
  | Readonly<Record<string, ComponentType<Props>>>

/**
 * Host-owned renderer registrations for one mounted Infoschematic.
 *
 * Arrays are the versioned, validated contract. Component-only records remain
 * a compatibility bridge and are treated as schema version 1 definitions that
 * accept the authored properties unchanged.
 */
export type InfoschematicRenderers = Readonly<{
  definitions?: ComponentType
  fabrics?: RendererCollection<FabricRendererProps>
  graphics?: RendererCollection<GraphicRendererProps>
  callouts?: RendererCollection<CalloutRendererProps>
  scopeIcons?: Readonly<Record<string, ScopeIconRenderer>>
  onDiagnostic?: RendererDiagnosticHandler
}>

export type ResolvedRenderer<Props, Properties extends RendererProperties = RendererProperties> = Readonly<{
  Component: ComponentType<Props & { properties: Properties }>
  key: string
  schemaVersion: number
  properties: Properties
}>
