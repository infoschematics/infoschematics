import type {
  Callout,
  DefinedInfoschematic,
  ElementSelection,
  Infoschematic,
  InfoschematicConfig,
  Interface,
  JsonValue,
  Scene
} from '@infoschematics/domain-model'

const legacyPorts = Object.freeze({ east: 7, north: 7, south: 7, west: 7 })
const standardPorts = Object.freeze({ east: 1, north: 1, south: 1, west: 1 })

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
        kind: callout.renderer,
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
      ]
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
      focus: selectionOf(scene.focus ?? source?.focus, scene.graphic ? [scene.graphic] : []),
      id: scene.id ?? `${storyId}-${index + 1}`,
      label: scene.title ?? source?.label ?? `Scene ${index + 1}`
    }
  }

  const interfaces: Interface[] = definition.interfaces.map((entry) => ({
    description: entry.description,
    document: entry.contract || entry.href ? { href: entry.href, label: entry.contract } : undefined,
    id: entry.id,
    label: entry.label,
    operations: entry.operations
  }))

  return {
    description: config.synopsis,
    diagram: {
      appearance: definition.appearance,
      assemblies: definition.cards.flatMap((card) =>
        card.wraps
          ? [
              {
                adapter: card.code,
                id: `${card.code}-ASSEMBLY`,
                interface: visibleId(card.wraps),
                kind: 'adapter' as const
              }
            ]
          : []
      ),
      bounds: definition.viewBox,
      calloutPositions: config.calloutPositions,
      cards: definition.cards.map((card) => ({
        bounds: card.placement.box,
        collection: card.domain ?? card.scope,
        description: card.detail,
        id: card.code,
        interfaces: card.conformsTo,
        label: card.label,
        ports: card.placement.ports ?? legacyPorts,
        provides: card.services,
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
          kind: fabric.appearance?.renderer,
          label: fabric.label,
          ports: fabric.placement.ports ?? legacyPorts,
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
        interfaces: flow.conformsTo,
        operation: flow.operation,
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
        kind: graphic.renderer,
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
          ports: point.ports ?? legacyPorts
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
      })),
      sets: definition.scopes.map((scope) => ({
        description: scope.description,
        elements: [
          ...endpoints.filter((entry) => entry.scopes.includes(scope.id)).map((entry) => entry.code),
          ...definition.graphics.filter((entry) => entry.scopes?.includes(scope.id)).map((entry) => entry.id)
        ],
        id: scope.id,
        label: scope.label
      }))
    },
    id: config.id ?? 'INFOSCHEMATIC',
    specifications: definition.specificationGroups.map((group) => ({
      description: group.note,
      document:
        group.document === 'none'
          ? undefined
          : {
              ownership: group.document,
              label: group.label
            },
      id: group.id,
      interfaces: interfaces.filter(
        (entry) =>
          definition.interfaces.find((candidate) => candidate.id === entry.id)?.owner === group.owner &&
          definition.interfaces.find((candidate) => candidate.id === entry.id)?.document === group.document
      ),
      label: group.label,
      owner: group.owner
    })),
    stories: config.stories.map((story) => ({
      id: story.code,
      label: story.title,
      question: story.question,
      scenes: story.scenes.map((scene, index) => storySceneOf(story.code, scene, index))
    })),
    subtitle: config.subtitle,
    themes: [
      ...(config.standaloneScenes.length > 0
        ? [
            {
              id: 'OVERVIEW',
              label: 'Overview',
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
        scenes: theme.scenes.map((scene) => ({
          callout: calloutOf(scene.callout),
          description: scene.description,
          focus: selectionOf(scene.focus),
          id: scene.code,
          label: scene.label
        }))
      }))
    ],
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
  setIds: ReadonlySet<string>,
  context: string
) => {
  for (const element of selection?.elements ?? []) requireReference(elementIds, element, context)
  for (const set of selection?.sets ?? []) requireReference(setIds, set, context)
}

const validateScene = (scene: Scene, elementIds: ReadonlySet<string>, setIds: ReadonlySet<string>, context: string) => {
  validateSelection(scene.focus, elementIds, setIds, `${context} focus`)
  validateSelection(scene.visibility?.show, elementIds, setIds, `${context} show`)
  validateSelection(scene.visibility?.hide, elementIds, setIds, `${context} hide`)
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

/** Normalise and validate a directly authored canonical Infoschematic. */
export const defineInfoschematicModel = (input: Infoschematic): DefinedInfoschematic => {
  const model: DefinedInfoschematic = {
    ...input,
    diagram: {
      ...input.diagram,
      assemblies: input.diagram.assemblies ?? [],
      calloutPositions: input.diagram.calloutPositions ?? [],
      cards: (input.diagram.cards ?? []).map((card) => ({
        ...card,
        ports: card.ports ?? standardPorts
      })),
      collections: input.diagram.collections ?? [],
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
      regions: input.diagram.regions ?? [],
      sets: input.diagram.sets ?? []
    },
    specifications: input.specifications ?? [],
    stories: input.stories ?? [],
    themes: input.themes ?? []
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
  for (const element of [...visible, ...model.diagram.assemblies]) {
    if (seen.has(element.id)) throw new Error(`Duplicate Diagram id: ${element.id}`)
    seen.add(element.id)
  }

  const cardIds = ids(model.diagram.cards)
  const endpointIds = ids([...model.diagram.cards, ...model.diagram.fabrics, ...model.diagram.points])
  const elementIds = ids(visible)
  const collectionIds = ids(model.diagram.collections)
  const familyIds = ids(model.diagram.families)
  const setIds = ids(model.diagram.sets)
  const interfaceIds = ids(model.specifications.flatMap((specification) => specification.interfaces))
  const endpointById = new Map(
    [...model.diagram.cards, ...model.diagram.fabrics, ...model.diagram.points].map((element) => [element.id, element])
  )

  for (const card of model.diagram.cards) {
    if (card.collection) requireReference(collectionIds, card.collection, `Card ${card.id}`)
    for (const contract of card.interfaces ?? []) requireReference(interfaceIds, contract, `Card ${card.id}`)
  }
  for (const assembly of model.diagram.assemblies) {
    if (assembly.kind === 'adapter') {
      requireReference(cardIds, assembly.adapter, `Assembly ${assembly.id}`)
      requireReference(cardIds, assembly.interface, `Assembly ${assembly.id}`)
    } else {
      requireReference(cardIds, assembly.wrapper, `Assembly ${assembly.id}`)
      requireReference(cardIds, assembly.wrapped, `Assembly ${assembly.id}`)
    }
  }
  for (const flow of model.diagram.flows) {
    if (flow.family) requireReference(familyIds, flow.family, `Flow ${flow.id}`)
    for (const contract of flow.interfaces ?? []) requireReference(interfaceIds, contract, `Flow ${flow.id}`)
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
  for (const set of model.diagram.sets) {
    for (const element of set.elements) requireReference(elementIds, element, `Set ${set.id}`)
  }
  for (const theme of model.themes) {
    const sceneIds = new Set<string>()
    for (const scene of theme.scenes) {
      if (sceneIds.has(scene.id)) throw new Error(`Duplicate Scene id in Theme ${theme.id}: ${scene.id}`)
      sceneIds.add(scene.id)
      validateScene(scene, elementIds, setIds, `Theme ${theme.id} Scene ${scene.id}`)
    }
  }
  for (const story of model.stories) {
    const sceneIds = new Set<string>()
    for (const scene of story.scenes) {
      if (sceneIds.has(scene.id)) throw new Error(`Duplicate Scene id in Story ${story.id}: ${scene.id}`)
      sceneIds.add(scene.id)
      validateScene(scene, elementIds, setIds, `Story ${story.id} Scene ${scene.id}`)
    }
  }

  JSON.stringify(model)
  return model
}
