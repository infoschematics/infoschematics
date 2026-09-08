import type {
  Callout,
  ElementSelection,
  Infoschematic,
  InfoschematicConfig,
  Interface,
  JsonValue,
  Scene
} from '@infoschematics/domain-model'

const legacyPorts = Object.freeze({ east: 7, north: 7, south: 7, west: 7 })

const propertiesOf = (
  properties: Readonly<Record<string, boolean | number | string>> | undefined
): Readonly<Record<string, JsonValue>> | undefined => properties

const calloutOf = (callout: InfoschematicConfig['themes'][number]['scenes'][number]['callout']): Callout | undefined =>
  callout
    ? {
        body: callout.body,
        kind: callout.renderer,
        placement: callout.at ? { at: callout.at } : undefined,
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
  const endpoints = [...definition.cards, ...definition.fabrics, ...definition.points]
  const elementId = new Map(endpoints.map(({ code, id }) => [id, code]))
  const flowId = new Map(definition.flows.map(({ code, id }) => [id, code]))
  const visibleId = (id: string) => elementId.get(id) ?? flowId.get(id) ?? id
  const scopeById = new Map(definition.scopes.map((scope) => [scope.id, scope]))

  const selectionOf = (
    focus: { artefacts?: readonly string[]; flows?: readonly string[]; graphics?: readonly string[] } | undefined
  ): ElementSelection | undefined => {
    if (!focus) return undefined
    return {
      elements: [
        ...(focus.artefacts ?? []).map(visibleId),
        ...(focus.flows ?? []).map(visibleId),
        ...(focus.graphics ?? []).map(visibleId)
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
      callout: calloutOf(scene.callout),
      description: source?.description,
      duration: scene.duration,
      focus: selectionOf(scene.focus ?? source?.focus),
      id: scene.id ?? `${storyId}-${index + 1}`,
      label: scene.title ?? source?.label ?? `Scene ${index + 1}`
    }
  }

  const interfaces: Interface[] = definition.interfaces.map((entry) => ({
    description: entry.description,
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
      cards: definition.cards.map((card) => ({
        bounds: card.placement.box,
        collection: card.domain ?? card.scope,
        description: card.detail,
        id: card.code,
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
          .filter((scope) => !domains.some((domain) => domain.id === scope.id))
          .map((scope) => ({
            appearance: { color: scope.color, fill: scope.fill, icon: scope.icon },
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
          properties: propertiesOf(fabric.appearance?.properties)
        }
      }),
      families: definition.flowFamilies.map((family) => ({
        appearance: { color: family.color },
        description: family.description,
        id: family.id,
        label: family.label
      })),
      flows: definition.flows.map((flow) => ({
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
        bounds: region.box,
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
