import { type RendererReferenceInput, rendererReferenceOf } from '@infoschematics/domain-model/renderer'
import type { ComponentType } from 'react'
import { createContext, useContext } from 'react'

import type {
  CalloutRendererProps,
  FabricRendererProps,
  GraphicRendererProps,
  InfoschematicRenderers,
  RendererCollection,
  RendererDefinitionShape,
  RendererDiagnostic,
  RendererDiagnosticHandler,
  RendererKind,
  RendererProperties,
  RendererValidationResult,
  ResolvedRenderer
} from './renderer-contract.ts'
import { standardFabricRenderers, standardGraphicRenderers } from './standard-renderers.tsx'

const isDefinitionCollection = <Props,>(
  collection: RendererCollection<Props>
): collection is readonly RendererDefinitionShape<Props>[] => Array.isArray(collection)

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

/* A standard definition, seen only as much of itself as resolution needs. The component's props are left opaque
   because the overload the caller chose is what fixes them, exactly as it does for a host registration. */
type StandardDefinition = Readonly<{
  key: string
  schemaVersion: number
  validateProperties: (properties: RendererProperties | undefined) => RendererValidationResult
  component: unknown
}>

/**
 * The standard catalogue, consulted only where a host has registered nothing under the key a document names.
 *
 * This is the whole of how the product offers a renderer without imposing one. A host collection is searched first
 * and answers first, so registering `satellite-link` replaces the standard treatment rather than competing with it;
 * the catalogue is reached at exactly the points this resolution would otherwise report `unknown-key`, which is why
 * an unregistered standard key now draws instead of falling back to the generic plane. `EXTEND-008` states the rule.
 *
 * A requested version the catalogue does not offer is a version mismatch and not a missing key, so it is reported as
 * one: resolution still never negotiates a version down.
 */
const standardFallback = (
  kind: RendererKind,
  key: string,
  requestedVersion: number,
  properties: RendererProperties | undefined,
  artefactId: string | undefined,
  onDiagnostic: RendererDiagnosticHandler | undefined
): unknown => {
  const collection: readonly StandardDefinition[] =
    kind === 'fabric' ? standardFabricRenderers : kind === 'graphic' ? standardGraphicRenderers : []
  const definition = collection.find((candidate) => candidate.key === key)
  if (!definition) {
    onDiagnostic?.(
      diagnosticMessage(
        { artefactId, code: 'unknown-key', key, kind, schemaVersion: requestedVersion },
        'no matching definition is registered'
      )
    )
    return undefined
  }
  if (definition.schemaVersion !== requestedVersion) {
    onDiagnostic?.(
      diagnosticMessage(
        { artefactId, code: 'unsupported-version', key, kind, schemaVersion: requestedVersion },
        `requested schema version ${requestedVersion} is not registered; available versions: ${definition.schemaVersion}`
      )
    )
    return undefined
  }
  const validation = definition.validateProperties(properties)
  if (!validation.valid) {
    onDiagnostic?.(
      diagnosticMessage(
        { artefactId, code: 'invalid-properties', key, kind, schemaVersion: definition.schemaVersion },
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
  if (!collection) return standardFallback(kind, key, requestedVersion, properties, artefactId, renderers.onDiagnostic)

  if (!isDefinitionCollection(collection)) {
    const Component = collection[key]
    if (!Component) return standardFallback(kind, key, requestedVersion, properties, artefactId, renderers.onDiagnostic)
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
  if (matchingKey.length === 0)
    return standardFallback(kind, key, requestedVersion, properties, artefactId, renderers.onDiagnostic)

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
