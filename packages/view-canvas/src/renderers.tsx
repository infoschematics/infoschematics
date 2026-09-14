import type { Callout, Overlay } from '@infoschematics/domain-model'
import { type RendererReferenceInput, rendererReferenceOf } from '@infoschematics/domain-model/renderer'
import type { Box } from '@infoschematics/view-model/geometry'
import type { RuntimeFabric } from '@infoschematics/view-model/runtime'
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

const componentSchemaVersion = 1
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

  const definitionsByReference = new Set<string>()
  const definitions = collection.map((definition) => {
    const reference = `${definition.key}\u0000${definition.schemaVersion}`
    if (definitionsByReference.has(reference)) {
      onDiagnostic?.(
        diagnosticMessage(
          { code: 'duplicate-key', kind, key: definition.key, schemaVersion: definition.schemaVersion },
          'duplicate registration ignored; the first definition wins'
        )
      )
    } else {
      definitionsByReference.add(reference)
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
  reference: RendererReferenceInput | undefined,
  properties: RendererProperties | undefined,
  artefactId?: string
): ResolvedRenderer<FabricRendererProps> | undefined
export function resolveInfoschematicRenderer(
  renderers: InfoschematicRenderers,
  kind: 'graphic',
  reference: RendererReferenceInput | undefined,
  properties: RendererProperties | undefined,
  artefactId?: string
): ResolvedRenderer<GraphicRendererProps> | undefined
export function resolveInfoschematicRenderer(
  renderers: InfoschematicRenderers,
  kind: 'callout',
  reference: RendererReferenceInput | undefined,
  properties: RendererProperties | undefined,
  artefactId?: string
): ResolvedRenderer<CalloutRendererProps> | undefined
export function resolveInfoschematicRenderer(
  renderers: InfoschematicRenderers,
  kind: RendererKind,
  authoredReference: RendererReferenceInput | undefined,
  properties: RendererProperties | undefined,
  artefactId?: string
): unknown {
  if (!authoredReference) return undefined
  const { key, version: requestedVersion } = rendererReferenceOf(authoredReference)

  const collection = collectionFor(renderers, kind)
  if (!collection) {
    renderers.onDiagnostic?.(
      diagnosticMessage(
        { artefactId, code: 'unknown-key', kind, key, schemaVersion: requestedVersion },
        'no matching definition is registered'
      )
    )
    return undefined
  }

  if (!isDefinitionCollection(collection)) {
    const Component = collection[key]
    if (!Component) {
      renderers.onDiagnostic?.(
        diagnosticMessage(
          { artefactId, code: 'unknown-key', kind, key, schemaVersion: requestedVersion },
          'no matching definition is registered'
        )
      )
      return undefined
    }
    if (requestedVersion !== componentSchemaVersion) {
      renderers.onDiagnostic?.(
        diagnosticMessage(
          { artefactId, code: 'unsupported-version', kind, key, schemaVersion: requestedVersion },
          `requested schema version ${requestedVersion} is not registered; component-only renderers support version ${componentSchemaVersion}`
        )
      )
      return undefined
    }
    return {
      Component: Component as ComponentType<unknown & { properties: RendererProperties }>,
      key,
      properties: properties ?? emptyProperties,
      schemaVersion: componentSchemaVersion
    }
  }

  const matchingKey = collection.filter((candidate) => candidate.key === key)
  if (matchingKey.length === 0) {
    renderers.onDiagnostic?.(
      diagnosticMessage(
        { artefactId, code: 'unknown-key', kind, key, schemaVersion: requestedVersion },
        'no matching definition is registered'
      )
    )
    return undefined
  }

  const definition = matchingKey.find((candidate) => candidate.schemaVersion === requestedVersion)
  if (!definition) {
    const registeredVersions = [...new Set(matchingKey.map(({ schemaVersion }) => schemaVersion))].sort((a, b) => a - b)
    renderers.onDiagnostic?.(
      diagnosticMessage(
        { artefactId, code: 'unsupported-version', kind, key, schemaVersion: requestedVersion },
        `requested schema version ${requestedVersion} is not registered; available versions: ${registeredVersions.join(', ')}`
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
