import type {
  Callout,
  DefinedInfoschematic,
  ElementSelection,
  InfoschematicConfig,
  InfoschematicInput,
  JsonValue,
  Scene
} from '@infoschematics/domain-model'
import type { PortCounts } from '@infoschematics/domain-model/ports'
import type { Box, Point } from './geometry.ts'
import { portsForBox } from './ports.ts'

const fallbackColor = '#64748b'
const fallbackFill = '#f8fafc'

const primitiveProperties = (properties: Readonly<Record<string, JsonValue>> | undefined) =>
  properties
    ? Object.fromEntries(
        Object.entries(properties).filter((entry): entry is [string, boolean | number | string] =>
          ['boolean', 'number', 'string'].includes(typeof entry[1])
        )
      )
    : undefined

const adapterBoundsFor = (held: Box): Box => ({
  height: held.height * 0.5 + 40,
  width: held.width + 40,
  x: held.x - 20,
  y: held.y + held.height * 0.5
})

const focusOf = (
  selection: ElementSelection | undefined,
  flowEndpoints: ReadonlyMap<string, { source: string; target: string }>,
  overlays: ReadonlySet<string>,
  scopeElements: ReadonlyMap<string, readonly string[]>
) => {
  const scopedElements = new Set((selection?.scopes ?? []).flatMap((scope) => scopeElements.get(scope) ?? []))
  const derivedFlows = [...flowEndpoints]
    .filter(([, endpoints]) => scopedElements.has(endpoints.source) && scopedElements.has(endpoints.target))
    .map(([id]) => id)
  const elements = [...(selection?.elements ?? []), ...scopedElements, ...derivedFlows].filter(
    (id, index, selected) => selected.indexOf(id) === index
  )
  return {
    artefacts: elements.filter((id) => !flowEndpoints.has(id) && !overlays.has(id)),
    flows: elements.filter((id) => flowEndpoints.has(id)),
    graphics: elements.filter((id) => overlays.has(id))
  }
}

const calloutOf = (callout: Callout | undefined) => {
  if (!callout) return undefined
  const placement = callout.placement
  return {
    anchor: placement && 'element' in placement ? placement.element : undefined,
    callout: {
      at: placement && 'at' in placement ? placement.at : undefined,
      body: callout.body,
      properties: primitiveProperties(callout.properties),
      renderer: callout.kind,
      takeaways: callout.takeaways,
      title: callout.title
    }
  }
}

/**
 * Adapt a canonical model into the established view contract while renderers
 * migrate independently. This is a view-boundary adapter, not an authored form.
 */
export const establishedInfoschematicOf = (input: InfoschematicInput): InfoschematicConfig => {
  if ('infoschematic' in input) return input
  const model: DefinedInfoschematic = input
  const diagram = model.diagram
  const scopeElements = new Map(model.scopes.map((scope) => [scope.id, scope.elements]))
  const memberships = new Map<string, string[]>()
  for (const scope of model.scopes) {
    for (const element of scope.elements) {
      memberships.set(element, [...(memberships.get(element) ?? []), scope.id])
    }
  }
  const scopes = model.scopes.map((scope) => ({
    color: fallbackColor,
    description: scope.description ?? '',
    fill: fallbackFill,
    id: scope.id,
    label: scope.label,
    prefix: scope.id
  }))
  const scopesOf = (id: string) => memberships.get(id) ?? []
  const compositionByCard = new Map(
    diagram.cards.flatMap((card) => {
      const held = card.adapts ?? card.wraps
      return held ? [[card.id, held] as const] : []
    })
  )
  const cardById = new Map(diagram.cards.map((card) => [card.id, card]))
  const placedBox = (id: string) => {
    const card = cardById.get(id)
    if (!card) return undefined
    const held = compositionByCard.get(id)
    return held ? adapterBoundsFor(cardById.get(held)?.bounds ?? card.bounds) : card.bounds
  }
  const endpointById = new Map<string, { box: Box; ports?: PortCounts } | { point: Point }>([
    ...diagram.cards.map(
      (element) =>
        [
          element.id,
          {
            box: placedBox(element.id) ?? element.bounds,
            ports: element.ports
          }
        ] as const
    ),
    ...diagram.fabrics.map((element) => [element.id, { box: element.bounds, ports: element.ports }] as const),
    ...diagram.points.map((element) => [element.id, { point: element.at }] as const)
  ])
  const portAt = (element: string, port: string) => {
    const endpoint = endpointById.get(element)
    if (!endpoint) throw new Error(`Unknown Flow endpoint: ${element}`)
    if ('point' in endpoint) return endpoint.point
    const found = endpoint.box ? portsForBox(endpoint.box, endpoint.ports).find(({ id }) => id === port) : undefined
    if (!found) throw new Error(`Unknown Port ${port} on ${element}`)
    return found.at
  }
  const flowEndpoints = new Map(
    diagram.flows.map((flow) => [flow.id, { source: flow.source.element, target: flow.target.element }])
  )
  const overlayIds = new Set(diagram.overlays.map(({ id }) => id))
  const sceneOf = (scene: Scene) => ({
    callout: calloutOf(scene.callout)?.callout,
    code: scene.id,
    description: scene.description,
    focus: focusOf(scene.focus ?? scene.visibility?.show, flowEndpoints, overlayIds, scopeElements),
    id: scene.id,
    label: scene.label
  })

  return {
    calloutPositions: diagram.calloutPositions,
    id: model.id,
    infoschematic: {
      appearance: diagram.appearance,
      cards: diagram.cards.map((card) => ({
        code: card.id,
        conformsTo: card.interfaces,
        detail: card.description ?? '',
        domain: card.collection,
        id: card.id,
        label: card.label,
        placement: { box: card.bounds, ports: card.ports },
        scope: scopesOf(card.id)[0] ?? '',
        scopeRule: compositionByCard.has(card.id) && scopesOf(card.id).length > 1 ? 'all' : undefined,
        scopes: scopesOf(card.id),
        services: card.provides,
        stereotype: card.stereotype,
        wraps: compositionByCard.get(card.id)
      })),
      domains: diagram.collections.map((collection) => ({
        color: collection.appearance?.color ?? fallbackColor,
        description: collection.description,
        fill: collection.appearance?.fill ?? fallbackFill,
        id: collection.id,
        label: collection.label
      })),
      fabrics: diagram.fabrics.map((fabric) => {
        const properties = primitiveProperties(fabric.properties)
        return {
          appearance: fabric.kind
            ? {
                caption: typeof properties?.caption === 'string' ? properties.caption : undefined,
                detail: typeof properties?.detail === 'string' ? properties.detail : undefined,
                properties,
                renderer: fabric.kind
              }
            : undefined,
          code: fabric.id,
          detail: fabric.description ?? '',
          id: fabric.id,
          label: fabric.label,
          placement: { box: fabric.bounds, ports: fabric.ports },
          scope: scopesOf(fabric.id)[0] ?? '',
          scopes: scopesOf(fabric.id)
        }
      }),
      flowFamilies: diagram.families.map((family) => ({
        color: family.appearance?.color ?? fallbackColor,
        description: family.description ?? '',
        id: family.id,
        label: family.label,
        prefix: family.id
      })),
      flows: diagram.flows.map((flow) => ({
        bidirectional: flow.direction === 'bidirectional' || undefined,
        code: flow.id,
        conformsTo: flow.interfaces,
        dashed:
          (flow.appearance?.line ?? diagram.families.find(({ id }) => id === flow.family)?.appearance?.line) ===
            'dashed' || undefined,
        family: flow.family ?? '',
        id: flow.id,
        label: flow.route?.labelAt === undefined ? undefined : { along: flow.route.labelAt },
        operation: flow.operation,
        points: [
          portAt(flow.source.element, flow.source.port),
          ...(flow.route?.waypoints ?? []),
          portAt(flow.target.element, flow.target.port)
        ],
        source: flow.source.element,
        sourcePort: flow.source.port,
        target: flow.target.element,
        targetPort: flow.target.port
      })),
      graphics: diagram.overlays.map((overlay) => ({
        id: overlay.id,
        label: overlay.label,
        placement: overlay.bounds,
        properties: primitiveProperties(overlay.properties),
        renderer: overlay.kind,
        scopes: scopesOf(overlay.id)
      })),
      interfaces: model.specifications.flatMap((specification) =>
        specification.interfaces.map((contract) => ({
          contract: contract.document?.label,
          description: contract.description ?? '',
          document: specification.document?.ownership ?? ('none' as const),
          href: contract.document?.href ?? specification.document?.href,
          id: contract.id,
          label: contract.label,
          operations: contract.operations,
          owner: specification.owner ?? '',
          prefix: contract.id
        }))
      ),
      points: diagram.points.map((point) => ({
        code: point.id,
        id: point.id,
        label: point.label,
        point: point.at,
        ports: point.ports,
        scopes: scopesOf(point.id)
      })),
      regions: diagram.regions.map((region) => ({
        box: { ...region.bounds, radius: region.appearance?.cornerRadius },
        fill: region.appearance?.fill,
        frame: region.appearance?.frame,
        id: region.id,
        label: region.label,
        labelMount: region.appearance?.label?.mount,
        labelOffset: region.appearance?.label?.offset,
        labelPlacement: region.appearance?.label?.placement
      })),
      scopes,
      specificationGroups: model.specifications.map((specification) => ({
        document: specification.document?.ownership ?? 'none',
        id: specification.id,
        label: specification.label,
        note: specification.description ?? '',
        owner: specification.owner ?? ''
      })),
      viewBox: diagram.bounds
    },
    standaloneScenes: [],
    stories: model.stories.map((story) => ({
      code: story.id,
      id: story.id,
      question: story.question,
      scenes: story.scenes.map((scene) => ({
        ...calloutOf(scene.callout),
        duration: scene.duration,
        focus: focusOf(scene.focus ?? scene.visibility?.show, flowEndpoints, overlayIds, scopeElements),
        graphic: (scene.focus?.elements ?? []).find((id) => overlayIds.has(id)),
        id: scene.id,
        title: scene.label
      })),
      title: story.label
    })),
    subtitle: model.subtitle,
    synopsis: model.description,
    themes: model.themes.map((theme) => ({
      description: theme.description,
      id: theme.id,
      scenes: theme.scenes.map(sceneOf),
      title: theme.label
    })),
    title: model.title
  }
}
