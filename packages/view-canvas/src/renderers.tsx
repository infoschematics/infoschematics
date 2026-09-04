import type { FabricConfig } from '@infoschematics/domain-model/fabric'
import type { GraphicConfig } from '@infoschematics/domain-model/graphic'
import type { CalloutConfig } from '@infoschematics/domain-model/scene'
import type { Box } from '@infoschematics/view-model/geometry'
import type { ComponentType, ReactNode } from 'react'
import { createContext, useContext } from 'react'

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
  fabric: FabricConfig
  bounds: Box
}

export type GraphicRendererProps = {
  graphic: GraphicConfig
  /** Effective Design bounds, including an uncommitted move or resize. */
  bounds: Box
  viewBox: Box
}

export type CalloutRendererProps = {
  callout: CalloutConfig
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

type RendererDefinitionShape<Props> = Readonly<{
  key: string
  schemaVersion: number
  validateProperties: (properties: RendererProperties | undefined) => RendererValidationResult<RendererProperties>
  component: ComponentType<Props & { properties: never }>
}>

type RendererCollection<Props> =
  | readonly RendererDefinitionShape<Props>[]
  | Readonly<Record<string, ComponentType<Props>>>

const isDefinitionCollection = <Props,>(
  collection: RendererCollection<Props>
): collection is readonly RendererDefinitionShape<Props>[] => Array.isArray(collection)

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

const supportedSchemaVersion = 1
const emptyProperties: RendererProperties = Object.freeze({})

const diagnosticMessage = (diagnostic: Omit<RendererDiagnostic, 'message'>, detail: string): RendererDiagnostic => ({
  ...diagnostic,
  message: `${diagnostic.kind} renderer "${diagnostic.key}": ${detail}`
})

const freezeCollection = <Props,>(
  collection: RendererCollection<Props> | undefined,
  kind: RendererKind,
  onDiagnostic: RendererDiagnosticHandler | undefined
): RendererCollection<Props> | undefined => {
  if (!collection) return undefined

  if (!isDefinitionCollection(collection)) return Object.freeze({ ...collection })

  const keys = new Set<string>()
  const definitions = collection.map((definition) => {
    if (keys.has(definition.key)) {
      onDiagnostic?.(
        diagnosticMessage(
          { code: 'duplicate-key', kind, key: definition.key, schemaVersion: definition.schemaVersion },
          'duplicate registration ignored; the first definition wins'
        )
      )
    } else {
      keys.add(definition.key)
    }
    return Object.freeze({ ...definition })
  })

  return Object.freeze(definitions)
}

/**
 * Snapshots host registrations so later mutation of the input cannot change a
 * mounted Infoschematic. Literal keys and property-validator inference are
 * retained in the returned type.
 */
export function defineInfoschematicRenderers<const Renderers extends InfoschematicRenderers>(
  renderers: Renderers
): Readonly<Renderers> {
  const frozen = {
    ...renderers,
    fabrics: freezeCollection(renderers.fabrics, 'fabric', renderers.onDiagnostic),
    graphics: freezeCollection(renderers.graphics, 'graphic', renderers.onDiagnostic),
    callouts: freezeCollection(renderers.callouts, 'callout', renderers.onDiagnostic),
    scopeIcons: renderers.scopeIcons ? Object.freeze({ ...renderers.scopeIcons }) : undefined
  }
  return Object.freeze(frozen) as Readonly<Renderers>
}

const collectionFor = (
  renderers: InfoschematicRenderers,
  kind: RendererKind
): RendererCollection<unknown> | undefined => {
  if (kind === 'fabric') return renderers.fabrics as RendererCollection<unknown> | undefined
  if (kind === 'graphic') return renderers.graphics as RendererCollection<unknown> | undefined
  return renderers.callouts as RendererCollection<unknown> | undefined
}

export function resolveInfoschematicRenderer(
  renderers: InfoschematicRenderers,
  kind: 'fabric',
  key: string | undefined,
  properties: RendererProperties | undefined,
  artefactId?: string
): ResolvedRenderer<FabricRendererProps> | undefined
export function resolveInfoschematicRenderer(
  renderers: InfoschematicRenderers,
  kind: 'graphic',
  key: string | undefined,
  properties: RendererProperties | undefined,
  artefactId?: string
): ResolvedRenderer<GraphicRendererProps> | undefined
export function resolveInfoschematicRenderer(
  renderers: InfoschematicRenderers,
  kind: 'callout',
  key: string | undefined,
  properties: RendererProperties | undefined,
  artefactId?: string
): ResolvedRenderer<CalloutRendererProps> | undefined
export function resolveInfoschematicRenderer(
  renderers: InfoschematicRenderers,
  kind: RendererKind,
  key: string | undefined,
  properties: RendererProperties | undefined,
  artefactId?: string
): unknown {
  if (!key) return undefined

  const collection = collectionFor(renderers, kind)
  if (!collection) {
    renderers.onDiagnostic?.(
      diagnosticMessage({ artefactId, code: 'unknown-key', kind, key }, 'no matching definition is registered')
    )
    return undefined
  }

  if (!isDefinitionCollection(collection)) {
    const Component = collection[key]
    if (!Component) {
      renderers.onDiagnostic?.(
        diagnosticMessage({ artefactId, code: 'unknown-key', kind, key }, 'no matching definition is registered')
      )
      return undefined
    }
    return {
      Component: Component as ComponentType<unknown & { properties: RendererProperties }>,
      key,
      properties: properties ?? emptyProperties,
      schemaVersion: supportedSchemaVersion
    }
  }

  const definition = collection.find((candidate) => candidate.key === key)
  if (!definition) {
    renderers.onDiagnostic?.(
      diagnosticMessage({ artefactId, code: 'unknown-key', kind, key }, 'no matching definition is registered')
    )
    return undefined
  }

  if (definition.schemaVersion !== supportedSchemaVersion) {
    renderers.onDiagnostic?.(
      diagnosticMessage(
        { artefactId, code: 'unsupported-version', kind, key, schemaVersion: definition.schemaVersion },
        `schema version ${definition.schemaVersion} is unsupported; expected ${supportedSchemaVersion}`
      )
    )
    return undefined
  }

  let validation: RendererValidationResult
  try {
    validation = definition.validateProperties(properties)
  } catch (error) {
    validation = {
      valid: false,
      reason: error instanceof Error ? error.message : 'validator threw a non-Error value'
    }
  }

  if (!validation.valid) {
    renderers.onDiagnostic?.(
      diagnosticMessage(
        { artefactId, code: 'invalid-properties', kind, key, schemaVersion: definition.schemaVersion },
        validation.reason
      )
    )
    return undefined
  }

  return {
    Component: definition.component as ComponentType<unknown & { properties: RendererProperties }>,
    key,
    properties: validation.properties,
    schemaVersion: definition.schemaVersion
  }
}

const noRenderers = defineInfoschematicRenderers({})

export const InfoschematicRenderersContext = createContext<InfoschematicRenderers>(noRenderers)

export const useInfoschematicRenderers = () => useContext(InfoschematicRenderersContext)
