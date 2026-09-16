import {
  type Callout,
  type DefinedInfoschematic,
  type ElementSelection,
  type Infoschematic,
  type InfoschematicConfig,
  type JsonValue,
  rendererReferenceOf,
  type Scene
} from '@infoschematics/domain-model'

const legacyPorts = Object.freeze({ east: 7, north: 7, south: 7, west: 7 })
const standardPorts = Object.freeze({ east: 1, north: 1, south: 1, west: 1 })

const legacyPortsOf = (ports: Readonly<Record<string, number>> | undefined) =>
  ports && Object.keys(ports).length > 0 ? ports : legacyPorts

/** Generic callout candidates: three columns by five rows, ordered from the centre out. */
export const defaultCalloutPositions = Object.freeze([
  Object.freeze({ x: 0.5, y: 0.5 }),
  Object.freeze({ x: 0.5, y: 0.28 }),
  Object.freeze({ x: 0.5, y: 0.72 }),
  Object.freeze({ x: 0.5, y: 0.16 }),
  Object.freeze({ x: 0.5, y: 0.84 }),
  Object.freeze({ x: 0.26, y: 0.5 }),
  Object.freeze({ x: 0.74, y: 0.5 }),
  Object.freeze({ x: 0.26, y: 0.28 }),
  Object.freeze({ x: 0.74, y: 0.28 }),
  Object.freeze({ x: 0.26, y: 0.72 }),
  Object.freeze({ x: 0.74, y: 0.72 }),
  Object.freeze({ x: 0.26, y: 0.16 }),
  Object.freeze({ x: 0.74, y: 0.16 }),
  Object.freeze({ x: 0.26, y: 0.84 }),
  Object.freeze({ x: 0.74, y: 0.84 })
])

const propertiesOf = (
  properties: Readonly<Record<string, boolean | number | string>> | undefined
): Readonly<Record<string, JsonValue>> | undefined => properties

const calloutOf = (
  callout: InfoschematicConfig['themes'][number]['scenes'][number]['callout'],
  placement?: Callout['placement']
): Callout | undefined =>
  callout
    ? {
        body: callout.body,
        kind: callout.renderer ? rendererReferenceOf(callout.renderer) : undefined,
        placement: callout.at ? { at: callout.at } : placement,
        properties: propertiesOf(callout.properties),
        takeaways: callout.takeaways,
        title: callout.title
      }
    : undefined

/**
 * Project the established serialisable contract into the vocabulary-aligned model.
 *
 * This is deliberately one-way during the compatibility proof: existing authored
 * input remains valid and unchanged while consumers can inspect the future model.
 */
export const infoschematicModelOf = (config: InfoschematicConfig): Infoschematic => {
  const definition = config.infoschematic
  const domains = definition.domains ?? []
  const primaryScopeCollections = new Set(definition.cards.filter((card) => !card.domain).map((card) => card.scope))
  const endpoints = [...definition.cards, ...definition.fabrics, ...definition.points]
  const elementId = new Map(endpoints.map(({ code, id }) => [id, code]))
  const flowId = new Map(definition.flows.map(({ code, id }) => [id, code]))
  const visibleId = (id: string) => elementId.get(id) ?? flowId.get(id) ?? id
  const visibleIds = new Set([...elementId.values(), ...flowId.values(), ...definition.graphics.map(({ id }) => id)])
  const scopeById = new Map(definition.scopes.map((scope) => [scope.id, scope]))
  const selectionOf = (
    focus:
      | {
          artefacts?: readonly string[]
          flows?: readonly string[]
          graphics?: readonly string[]
        }
      | undefined,
    graphics: readonly string[] = []
  ): ElementSelection | undefined => {
    if (!focus && graphics.length === 0) return undefined
    return {
      elements: [
        ...(focus?.artefacts ?? []).map(visibleId),
        ...(focus?.flows ?? []).map(visibleId),
        ...(focus?.graphics ?? []).map(visibleId),
        ...graphics.map(visibleId)
      ].filter((id) => visibleIds.has(id))
    }
  }

  const standaloneById = new Map(config.standaloneScenes.map((scene) => [scene.id, scene]))
  const storySceneOf = (
    storyId: string,
    scene: InfoschematicConfig['stories'][number]['scenes'][number],
    index: number
  ) => {
    const source = scene.sourceScene ? standaloneById.get(scene.sourceScene) : undefined
    return {
      callout: calloutOf(scene.callout, scene.anchor ? { element: visibleId(scene.anchor) } : undefined),
      description: source?.description,
      duration: scene.duration,
      focus: selectionOf(
        {
          artefacts: scene.focus?.artefacts ?? source?.focus.artefacts,
          flows: scene.focus?.flows ?? source?.focus.flows,
          graphics: scene.focus?.graphics ?? source?.focus.graphics
        },
        scene.graphic ? [scene.graphic] : []
      ),
      id: scene.id ?? `${storyId}-${index + 1}`,
      label: scene.title ?? source?.label ?? `Scene ${index + 1}`
    }
  }

  return {
    description: config.synopsis,
    diagram: {
      appearance: definition.appearance,
      bounds: definition.viewBox,
      gridSize: 10,
      calloutPositions: config.calloutPositions,
      cards: definition.cards.map((card) => ({
        adapts: card.wraps ? visibleId(card.wraps) : undefined,
        bounds: card.placement.box,
        collection: card.domain ?? card.scope,
        description: card.detail,
        id: card.code,
        label: card.label,
        ports: legacyPortsOf(card.placement.ports),
        stereotype: card.stereotype
      })),
      collections: [
        ...domains.map((domain) => ({
          appearance: { color: domain.color, fill: domain.fill },
          description: domain.description,
          id: domain.id,
          label: domain.label
        })),
        ...definition.scopes
          .filter((scope) => primaryScopeCollections.has(scope.id) && !domains.some((domain) => domain.id === scope.id))
          .map((scope) => ({
            appearance: {
              color: scope.color,
              fill: scope.fill,
              icon: scope.icon
            },
            description: scope.description,
            id: scope.id,
            label: scope.label
          }))
      ],
      fabrics: definition.fabrics.map((fabric) => {
        const scope = scopeById.get(fabric.scope)
        return {
          appearance: scope ? { color: scope.color, fill: scope.fill, icon: scope.icon } : undefined,
          bounds: fabric.placement.box,
          description: fabric.detail,
          id: fabric.code,
          kind: fabric.appearance?.renderer ? rendererReferenceOf(fabric.appearance.renderer) : undefined,
          label: fabric.label,
          ports: legacyPortsOf(fabric.placement.ports),
          properties: {
            ...fabric.appearance?.properties,
            ...(fabric.appearance?.caption ? { caption: fabric.appearance.caption } : {}),
            ...(fabric.appearance?.detail ? { detail: fabric.appearance.detail } : {})
          }
        }
      }),
      families: definition.flowFamilies.map((family) => ({
        appearance: { color: family.color },
        description: family.description,
        id: family.id,
        label: family.label
      })),
      flows: definition.flows.map((flow) => ({
        appearance: flow.dashed ? { line: 'dashed' as const } : undefined,
        direction: flow.bidirectional ? ('bidirectional' as const) : ('forward' as const),
        family: flow.family,
        id: flow.code,
        route: {
          labelAt: flow.label?.along,
          waypoints: flow.points.slice(1, -1)
        },
        source: { element: visibleId(flow.source), port: flow.sourcePort },
        target: { element: visibleId(flow.target), port: flow.targetPort }
      })),
      overlays: definition.graphics.map((graphic) => ({
        bounds: graphic.placement,
        id: graphic.id,
        kind: rendererReferenceOf(graphic.renderer),
        label: graphic.label ?? graphic.id,
        properties: propertiesOf(graphic.properties)
      })),
      points: definition.points.map((point) => {
        const scope = point.scopes.map((id) => scopeById.get(id)).find(Boolean)
        return {
          appearance: scope ? { color: scope.color, fill: scope.fill, icon: scope.icon } : undefined,
          at: point.point,
          id: point.code,
          label: point.label,
          ports: legacyPortsOf(point.ports)
        }
      }),
      regions: definition.regions.map((region) => ({
        appearance: {
          cornerRadius: region.box.radius,
          fill: region.fill,
          frame: region.frame,
          label: {
            mount: region.labelMount,
            offset: region.labelOffset,
            placement: region.labelPlacement
          }
        },
        bounds: {
          height: region.box.height,
          width: region.box.width,
          x: region.box.x,
          y: region.box.y
        },
        id: region.id,
        label: region.label
      }))
    },
    id: config.id ?? 'INFOSCHEMATIC',
    scopes: definition.scopes.map((scope) => ({
      appearance: scope.icon ? { icon: scope.icon } : undefined,
      description: scope.description,
      elements: [
        ...endpoints.filter((entry) => entry.scopes.includes(scope.id)).map((entry) => entry.code),
        ...definition.graphics.filter((entry) => entry.scopes?.includes(scope.id)).map((entry) => entry.id)
      ],
      id: scope.id,
      label: scope.label
    })),
    sequences: [
      ...(config.standaloneScenes.length > 0
        ? [
            {
              id: 'OVERVIEW',
              label: 'Overview',
              presentation: { callouts: false, display: 'expanded' as const, timed: false },
              scenes: config.standaloneScenes.map(
                (scene): Scene => ({
                  description: scene.description,
                  focus: selectionOf(scene.focus),
                  id: scene.code,
                  label: scene.label
                })
              )
            }
          ]
        : []),
      ...config.themes.map((theme) => ({
        description: theme.description,
        id: theme.id,
        label: theme.title,
        presentation: { callouts: true, display: 'expanded' as const, timed: false },
        scenes: theme.scenes.map((scene) => ({
          callout: calloutOf(scene.callout),
          description: scene.description,
          focus: selectionOf(scene.focus),
          id: scene.code,
          label: scene.label
        }))
      })),
      ...config.stories.map((story) => ({
        description: story.question,
        id: story.code,
        label: story.title,
        presentation: { callouts: true, display: 'collapsed' as const, timed: true },
        scenes: story.scenes.map((scene, index) => storySceneOf(story.code, scene, index))
      })),
      ...(config.sequences ?? []).map((sequence) => ({
        description: sequence.description,
        id: sequence.id,
        label: sequence.label,
        presentation: sequence.presentation,
        scenes: sequence.scenes.map((scene) => ({
          callout: calloutOf(scene.callout, scene.anchor ? { element: visibleId(scene.anchor) } : undefined),
          description: scene.description,
          duration: scene.duration,
          focus: selectionOf(scene.focus, scene.graphic ? [scene.graphic] : []),
          id: scene.id,
          label: scene.label
        }))
      }))
    ],
    subtitle: config.subtitle,
    title: config.title
  }
}

const ids = (values: readonly { id: string }[]) => new Set(values.map(({ id }) => id))

const requireReference = (references: ReadonlySet<string>, value: string, context: string) => {
  if (!references.has(value)) throw new Error(`${context} references unknown id: ${value}`)
}

const validateSelection = (
  selection: ElementSelection | undefined,
  elementIds: ReadonlySet<string>,
  scopeIds: ReadonlySet<string>,
  context: string
) => {
  for (const element of selection?.elements ?? []) requireReference(elementIds, element, context)
  for (const scope of selection?.scopes ?? []) requireReference(scopeIds, scope, context)
}

const validateScene = (
  scene: Scene,
  elementIds: ReadonlySet<string>,
  scopeIds: ReadonlySet<string>,
  context: string
) => {
  validateSelection(scene.focus, elementIds, scopeIds, `${context} focus`)
  validateSelection(scene.visibility?.show, elementIds, scopeIds, `${context} show`)
  validateSelection(scene.visibility?.hide, elementIds, scopeIds, `${context} hide`)
  const placement = scene.callout?.placement
  if (placement && 'element' in placement) requireReference(elementIds, placement.element, `${context} callout`)
}

const portCount = (ports: { north?: number; east?: number; south?: number; west?: number }, id: string) => {
  const side = { E: 'east', N: 'north', S: 'south', W: 'west' }[id[0] ?? ''] as
    | 'north'
    | 'east'
    | 'south'
    | 'west'
    | undefined
  const number = Number(id.slice(1))
  if (!side || !Number.isInteger(number) || number < 1 || number > (ports[side] ?? 0)) return false
  return true
}

/** Authored id lists are sets, so they are deduplicated and ordered rather than kept in the order they were typed. */
const sortedIds = (values: readonly string[]): readonly string[] =>
  [...new Set(values)].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))

const normaliseRealisedBy = <T extends { realisedBy?: readonly string[] }>(value: T): T =>
  value.realisedBy ? { ...value, realisedBy: sortedIds(value.realisedBy) } : value

/** Normalise and validate a directly authored canonical Infoschematic. */
export const defineInfoschematicModel = (input: Infoschematic): DefinedInfoschematic => {
  const model: DefinedInfoschematic = {
    ...input,
    diagram: {
      ...input.diagram,
      calloutPositions: input.diagram.calloutPositions ?? defaultCalloutPositions,
      cards: (input.diagram.cards ?? []).map((card) => ({
        ...card,
        ports: card.ports ?? standardPorts
      })),
      collections: input.diagram.collections ?? [],
      dynamics: (input.diagram.dynamics ?? []).map((dynamic) =>
        dynamic.kind === 'signal-flow'
          ? { ...dynamic, flows: sortedIds(dynamic.flows) }
          : { ...dynamic, elements: sortedIds(dynamic.elements) }
      ),
      fabrics: (input.diagram.fabrics ?? []).map((fabric) => ({
        ...fabric,
        ports: fabric.ports ?? standardPorts
      })),
      families: input.diagram.families ?? [],
      flows: (input.diagram.flows ?? []).map((flow) => ({
        ...flow,
        direction: flow.direction ?? 'forward',
        route: { ...flow.route, waypoints: flow.route?.waypoints ?? [] }
      })),
      overlays: input.diagram.overlays ?? [],
      points: (input.diagram.points ?? []).map((point) => ({
        ...point,
        ports: point.ports ?? standardPorts
      })),
      regions: input.diagram.regions ?? []
    },
    scopes: input.scopes ?? [],
    specifications: (input.specifications ?? []).map((group) => ({
      ...group,
      specifications: group.specifications.map((specification) =>
        normaliseRealisedBy({
          ...specification,
          interfaces: specification.interfaces?.map((interfaceEntry) =>
            normaliseRealisedBy({
              ...interfaceEntry,
              operations: interfaceEntry.operations?.map(normaliseRealisedBy)
            })
          )
        })
      )
    })),
    sequences: input.sequences ?? []
  }

  const visible = [
    ...model.diagram.regions,
    ...model.diagram.cards,
    ...model.diagram.fabrics,
    ...model.diagram.points,
    ...model.diagram.flows,
    ...model.diagram.overlays
  ]
  const seen = new Set<string>()
  for (const element of visible) {
    if (seen.has(element.id)) throw new Error(`Duplicate Diagram id: ${element.id}`)
    seen.add(element.id)
  }

  const cardIds = ids(model.diagram.cards)
  const endpointIds = ids([...model.diagram.cards, ...model.diagram.fabrics, ...model.diagram.points])
  const elementIds = ids(visible)
  const collectionIds = ids(model.diagram.collections)
  const familyIds = ids(model.diagram.families)
  const scopeIds = ids(model.scopes)
  const endpointById = new Map(
    [...model.diagram.cards, ...model.diagram.fabrics, ...model.diagram.points].map((element) => [element.id, element])
  )

  for (const card of model.diagram.cards) {
    if (card.collection) requireReference(collectionIds, card.collection, `Card ${card.id}`)
    if (card.adapts) requireReference(cardIds, card.adapts, `Card ${card.id} adapts`)
    if (card.wraps) requireReference(cardIds, card.wraps, `Card ${card.id} wraps`)
  }
  for (const flow of model.diagram.flows) {
    if (flow.family) requireReference(familyIds, flow.family, `Flow ${flow.id}`)
    for (const [terminal, endpoint] of [
      ['source', flow.source],
      ['target', flow.target]
    ] as const) {
      requireReference(endpointIds, endpoint.element, `Flow ${flow.id} ${terminal}`)
      const element = endpointById.get(endpoint.element)
      if (!element || !portCount(element.ports ?? standardPorts, endpoint.port)) {
        throw new Error(`Flow ${flow.id} ${terminal} references unavailable Port: ${endpoint.port}`)
      }
    }
  }
  const flowIds = ids(model.diagram.flows)
  const dynamicIds = new Set<string>()
  for (const dynamic of model.diagram.dynamics) {
    if (dynamicIds.has(dynamic.id)) throw new Error(`Duplicate Diagram Dynamic id: ${dynamic.id}`)
    dynamicIds.add(dynamic.id)
    const context = `Diagram Dynamic ${dynamic.id}`
    if (dynamic.kind === 'signal-flow') {
      // A Flow signal has no sustained treatment in any renderer, so the contract does not accept the claim that one
      // depicts a state: the field belongs to the other kind exactly as a target field does.
      if ('depicts' in dynamic) throw new Error(`${context} is a signal-flow Dynamic and cannot declare depicts`)
      if (dynamic.flows.length === 0) throw new Error(`${context} names no Flow to signal`)
      for (const flow of dynamic.flows) {
        // A Card id here would be a plausible mistake that silently resolved to nothing, so name the kind that is wrong.
        if (!flowIds.has(flow) && elementIds.has(flow))
          throw new Error(`${context} references a non-Flow element: ${flow}`)
        requireReference(flowIds, flow, context)
      }
      continue
    }
    if (dynamic.elements.length === 0) throw new Error(`${context} names no element to emphasise`)
    for (const element of dynamic.elements) requireReference(elementIds, element, context)
  }
  for (const scope of model.scopes) {
    for (const element of scope.elements) requireReference(elementIds, element, `Architectural Scope ${scope.id}`)
  }
  const specificationPaths = new Set<string>()
  const registerSpecificationPath = (path: string) => {
    if (specificationPaths.has(path)) throw new Error(`Duplicate Specification path: ${path}`)
    specificationPaths.add(path)
  }
  const validateRealisation = (realisedBy: readonly string[] | undefined, context: string) => {
    for (const element of realisedBy ?? []) requireReference(elementIds, element, context)
  }
  for (const group of model.specifications) {
    registerSpecificationPath(group.id)
    for (const specification of group.specifications) {
      const specificationPath = `${group.id}/${specification.id}`
      registerSpecificationPath(specificationPath)
      validateRealisation(specification.realisedBy, `Specification ${specificationPath}`)
      for (const interfaceEntry of specification.interfaces ?? []) {
        const interfacePath = `${specificationPath}/${interfaceEntry.id}`
        registerSpecificationPath(interfacePath)
        validateRealisation(interfaceEntry.realisedBy, `Interface ${interfacePath}`)
        for (const operation of interfaceEntry.operations ?? []) {
          const operationPath = `${interfacePath}/${operation.id}`
          registerSpecificationPath(operationPath)
          validateRealisation(operation.realisedBy, `Operation ${operationPath}`)
        }
      }
    }
  }
  for (const sequence of model.sequences) {
    const sceneIds = new Set<string>()
    for (const scene of sequence.scenes) {
      if (sceneIds.has(scene.id)) throw new Error(`Duplicate Scene id in Sequence ${sequence.id}: ${scene.id}`)
      sceneIds.add(scene.id)
      validateScene(scene, elementIds, scopeIds, `Sequence ${sequence.id} Scene ${scene.id}`)
    }
  }

  JSON.stringify(model)
  return model
}
