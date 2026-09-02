import { createContext, useContext } from 'react'
import type { InfoschematicConfig } from '@infoschematics/model/config'
import type { InterfaceConfig } from '@infoschematics/model/interface'
import type { LaneConfig } from '@infoschematics/model/lane'
import type { ScopeConfig } from '@infoschematics/model/scope'
import type { StoryConfig, StorySceneConfig } from '@infoschematics/model/story'
import type { ThematicSceneConfig } from '@infoschematics/model/theme'
import type { CreatedComponent } from '@infoschematics/core/editable'
import type { AttachedEnd, CreatedFlow } from '@infoschematics/core/editable'
import type { Box, Offset, Point } from '@infoschematics/core/geometry'
import { routeEndpoints, routePath } from '@infoschematics/core/geometry'
import { placeLabels } from '@infoschematics/core/placement'
import { auditPorts, minimumPortGap, type PortCounts } from '@infoschematics/core/ports'
import { moveRouteEnd, normaliseRoute, routeBetweenPorts } from '@infoschematics/core/routing'

export type RuntimeCard = InfoschematicConfig['infoschematic']['cards'][number] & {
  bounds: Box
  group: string
  kind: 'card'
  ports?: PortCounts
}

export type RuntimeFabric = InfoschematicConfig['infoschematic']['fabrics'][number] & {
  bounds: Box
  group: string
  kind: 'fabric'
  ports?: PortCounts
}

export type RuntimeFlow = InfoschematicConfig['infoschematic']['flows'][number] & { d: string }

export type RuntimeIdentity = {
  code: string
  conformsTo?: readonly string[]
  detail?: string
  group?: string
  id: string
  kind: 'card' | 'fabric' | 'point'
  label: string
  scopeRule?: 'all' | 'any'
  scopes: readonly string[]
  services?: readonly string[]
  wraps?: string
}

export type RuntimeStandaloneScene = {
  id: string
  code: string
  label: string
  short?: string
  description: string
  components: readonly string[]
  flows: readonly string[]
}

export type RuntimeStoryScene = Omit<StorySceneConfig, 'callout'> & {
  caption: string
  hold: number
  components: readonly string[]
  flows: readonly string[]
  overlay?: string
  callout?: Point
  takeaways?: readonly string[]
  scene?: string
}

export type RuntimeStory = {
  id: string
  code: string
  label: string
  short?: string
  question: string
  steps: readonly RuntimeStoryScene[]
}

export type RuntimeThemeScene = Omit<ThematicSceneConfig, 'callout' | 'description'> & {
  description: string
  headline: string
  components: readonly string[]
  flows: readonly string[]
  profile?: readonly string[]
  takeaways?: readonly string[]
  cover?: true
  logo?: string
  callout?: Point
}

type Drafts = {
  offsets?: ReadonlyMap<string, Offset>
  portCounts?: Readonly<Record<string, PortCounts>>
  created?: readonly CreatedComponent[]
}

const adapterGrip = 20
const adapterFloor = 40
const adapterReach = 0.5

const adapterBoundsFor = (held: Box): Box => ({
  height: held.height * (1 - adapterReach) + adapterFloor,
  width: held.width + adapterGrip * 2,
  x: held.x - adapterGrip,
  y: held.y + held.height * adapterReach,
})

const registerOf = (entries: readonly RuntimeIdentity[]) => {
  const byCode = new Map<string, RuntimeIdentity>()
  const byId = new Map<string, RuntimeIdentity>()
  for (const entry of entries) {
    if (!byCode.has(entry.code)) byCode.set(entry.code, entry)
    if (!byId.has(entry.id)) byId.set(entry.id, entry)
  }
  return {
    all: entries,
    byCode: (code: string) => byCode.get(code),
    byId: (id: string) => byId.get(id),
    cardAt: (code: string) => {
      const found = byCode.get(code)
      return found?.kind === 'card' ? found : undefined
    },
  }
}

const membershipVisible = (
  entry: { scopes: readonly string[]; scopeRule?: 'all' | 'any' },
  visibleScopes: ReadonlySet<string>,
) =>
  entry.scopeRule === 'all'
    ? entry.scopes.every((scope) => visibleScopes.has(scope))
    : entry.scopes.some((scope) => visibleScopes.has(scope))

const laneLabelX = (lane: LaneConfig) => lane.panel.x + 30
const laneLabelY = (lane: LaneConfig) => (lane.legend === 'bottom' ? lane.panel.y + lane.panel.height : lane.panel.y)

const lanePanelOutline = (lane: LaneConfig) => {
  const { x, y, width, height, radius } = lane.panel
  const label = laneLabelX(lane)
  const gapStart = Math.max(x + radius, label - 10)
  const gapEnd = label + lane.label.length * 10.4 + 10
  const bottom = y + height
  return lane.legend === 'bottom'
    ? [
        `M${gapStart} ${bottom}`,
        `H${x + radius}`,
        `A${radius} ${radius} 0 0 1 ${x} ${bottom - radius}`,
        `V${y + radius}`,
        `A${radius} ${radius} 0 0 1 ${x + radius} ${y}`,
        `H${x + width - radius}`,
        `A${radius} ${radius} 0 0 1 ${x + width} ${y + radius}`,
        `V${bottom - radius}`,
        `A${radius} ${radius} 0 0 1 ${x + width - radius} ${bottom}`,
        `H${gapEnd}`,
      ].join(' ')
    : [
        `M${gapEnd} ${y}`,
        `H${x + width - radius}`,
        `A${radius} ${radius} 0 0 1 ${x + width} ${y + radius}`,
        `V${bottom - radius}`,
        `A${radius} ${radius} 0 0 1 ${x + width - radius} ${bottom}`,
        `H${x + radius}`,
        `A${radius} ${radius} 0 0 1 ${x} ${bottom - radius}`,
        `V${y + radius}`,
        `A${radius} ${radius} 0 0 1 ${x + radius} ${y}`,
        `H${gapStart}`,
      ].join(' ')
}

export const createInfoschematicRuntime = (config: InfoschematicConfig) => {
  const definition = config.infoschematic
  const cards: RuntimeCard[] = definition.cards.map((card) => ({
    ...card,
    bounds: card.placement.box,
    group: card.scope,
    kind: 'card',
    ports: card.placement.ports,
  }))
  const fabrics: RuntimeFabric[] = definition.fabrics.map((fabric) => ({
    ...fabric,
    bounds: fabric.placement.box,
    group: fabric.scope,
    kind: 'fabric',
    ports: fabric.placement.ports,
  }))
  const flows: RuntimeFlow[] = definition.flows.map((flow) => ({ ...flow, d: routePath(flow.points) }))
  const identities: RuntimeIdentity[] = [
    ...cards.map(({ placement: _placement, bounds: _bounds, ports: _ports, ...card }) => card),
    ...fabrics.map(
      ({ placement: _placement, bounds: _bounds, ports: _ports, appearance: _appearance, ...fabric }) => fabric,
    ),
    ...definition.points.map((point) => ({ ...point, detail: undefined, kind: 'point' as const })),
  ]
  const register = registerOf(identities)
  const endpointCodes = new Map(identities.map(({ code, id }) => [id, code]))
  const endpointLabels = new Map(identities.map(({ id, label }) => [id, label]))
  const layout = Object.fromEntries(cards.map((card) => [card.id, card.bounds])) as Readonly<Record<string, Box>>
  const interfaceById = new Map(definition.interfaces.map((entry) => [entry.id, entry]))

  const standaloneScenes: RuntimeStandaloneScene[] = config.standaloneScenes.map((scene) => ({
    ...scene,
    components: scene.focus.artefacts ?? [],
    flows: scene.focus.flows ?? [],
  }))
  const standaloneById = new Map(standaloneScenes.map((scene) => [scene.id, scene]))
  const graphicById = new Map(definition.graphics.map((graphic) => [graphic.id, graphic]))
  const stories: RuntimeStory[] = config.stories.map((story: StoryConfig) => ({
    id: story.id,
    code: story.code,
    label: story.title,
    short: story.short,
    question: story.question ?? '',
    steps: story.scenes.map((scene) => {
      const source = scene.sourceScene ? standaloneById.get(scene.sourceScene) : undefined
      return {
        ...scene,
        caption: scene.callout?.body ?? '',
        hold: scene.duration ?? 0,
        components: scene.focus?.artefacts ?? source?.components ?? [],
        flows: scene.focus?.flows ?? source?.flows ?? [],
        overlay: scene.graphic ? (graphicById.get(scene.graphic)?.renderer ?? scene.graphic) : undefined,
        callout: scene.callout?.at,
        takeaways: scene.callout?.takeaways,
        scene: scene.sourceScene,
      }
    }),
  }))
  const thematicScenes: RuntimeThemeScene[] = config.themes.flatMap((theme) =>
    theme.scenes.map((scene) => {
      const properties = scene.callout?.properties
      let profile: readonly string[] | undefined
      if (typeof properties?.profile === 'string') {
        try {
          const parsed: unknown = JSON.parse(properties.profile)
          if (Array.isArray(parsed) && parsed.every((entry) => typeof entry === 'string')) profile = parsed
        } catch {
          profile = undefined
        }
      }
      return {
        ...scene,
        headline: scene.callout?.title ?? scene.label,
        description: scene.description ?? scene.callout?.body ?? '',
        components: scene.focus.artefacts ?? [],
        flows: scene.focus.flows ?? [],
        profile,
        takeaways: scene.callout?.takeaways,
        cover: properties?.wide === true ? true : undefined,
        logo: typeof properties?.logo === 'string' ? properties.logo : undefined,
        callout: scene.callout?.at,
      }
    }),
  )

  const registerWith = (created: readonly CreatedComponent[] = []) =>
    created.length === 0
      ? register
      : registerOf([
          ...register.all,
          ...created.map((card): RuntimeIdentity => ({
            code: card.code,
            detail: card.detail,
            group: card.group,
            id: card.id,
            kind: 'card',
            label: card.label,
            scopes: card.scopes,
            wraps: card.wraps,
          })),
        ])

  const placeables = (visibleScopes: ReadonlySet<string>, drafts?: Drafts) => {
    const drafted = (box: Box, code: string) => {
      const offset = drafts?.offsets?.get(code)
      return offset ? { ...box, x: box.x + offset.dx, y: box.y + offset.dy } : box
    }
    const visibleCards = cards.filter((card) => membershipVisible(card, visibleScopes))
    const ordinary = new Map(
      visibleCards.filter((card) => !card.wraps).map((card) => [card.id, drafted(card.bounds, card.code)]),
    )
    const authored = [
      ...visibleCards.flatMap((card) => {
        const held = card.wraps ? ordinary.get(card.wraps) : undefined
        if (card.wraps && !held) return []
        return [
          {
            box: held ? adapterBoundsFor(held) : (ordinary.get(card.id) ?? card.bounds),
            code: card.code,
            id: card.id,
            ports: { ...card.ports, ...drafts?.portCounts?.[card.code] },
          },
        ]
      }),
      ...fabrics
        .filter((fabric) => membershipVisible(fabric, visibleScopes))
        .map((fabric) => ({
          box: drafted(fabric.bounds, fabric.code),
          code: fabric.code,
          id: fabric.id,
          ports: { ...fabric.ports, ...drafts?.portCounts?.[fabric.code] },
        })),
    ]
    const created: typeof authored = []
    for (const card of drafts?.created ?? []) {
      if (!membershipVisible({ scopes: card.scopes }, visibleScopes)) continue
      const held = card.wraps ? [...authored, ...created].find((candidate) => candidate.id === card.wraps) : undefined
      if (card.wraps && !held) continue
      if (!held && !card.box) continue
      created.push({
        box: held ? adapterBoundsFor(held.box) : drafted(card.box as Box, card.code),
        code: card.code,
        id: card.id,
        ports: { ...card.ports, ...drafts?.portCounts?.[card.code] },
      })
    }
    return [...authored, ...created]
  }

  const flowVisible = (flow: RuntimeFlow, families: ReadonlySet<string>, scopes: ReadonlySet<string>) => {
    const endpointVisible = (id: string) => {
      const entry = register.byId(id)
      return entry ? membershipVisible(entry, scopes) : false
    }
    return families.has(flow.family) && endpointVisible(flow.source) && endpointVisible(flow.target)
  }

  const flowsAfterMoves = (shownFlows: readonly RuntimeFlow[], offsets: ReadonlyMap<string, Offset>) => {
    if (offsets.size === 0) return shownFlows
    return shownFlows.map((flow) => {
      const sourceOffset = offsets.get(endpointCodes.get(flow.source) ?? flow.source)
      const targetOffset = offsets.get(endpointCodes.get(flow.target) ?? flow.target)
      if (!sourceOffset && !targetOffset) return flow
      let points = flow.points
      if (sourceOffset) points = moveRouteEnd(points, 'start', sourceOffset)
      if (targetOffset) points = moveRouteEnd(points, 'end', targetOffset)
      points = normaliseRoute(points)
      return { ...flow, d: routePath(points), points }
    })
  }

  const flowsAfterAttachments = (
    shownFlows: readonly RuntimeFlow[],
    attachments: ReadonlyMap<string, { source?: AttachedEnd; target?: AttachedEnd }>,
    portAt: (endpoint: string, port: string) => Point | undefined,
  ) => {
    if (attachments.size === 0) return shownFlows
    return shownFlows.map((flow) => {
      const moved = attachments.get(flow.code)
      if (!moved) return flow
      let points = flow.points
      const ends = { source: flow.source, target: flow.target }
      const ports = { source: flow.sourcePort, target: flow.targetPort }
      for (const end of ['source', 'target'] as const) {
        const to = moved[end]
        if (!to) continue
        const at = portAt(to.component, to.port)
        const from = end === 'source' ? points[0] : points.at(-1)
        if (!at || !from) continue
        const sideways = to.port.startsWith('E') || to.port.startsWith('W')
        const rest = end === 'source' ? points.slice(1) : points.slice(0, -1)
        const neighbour = end === 'source' ? rest[0] : rest.at(-1)
        if (!neighbour) points = [at]
        else if (rest.length !== 1 && sideways === (from.y === neighbour.y)) {
          const led = sideways ? { ...neighbour, y: at.y } : { ...neighbour, x: at.x }
          points = end === 'source' ? [at, led, ...rest.slice(1)] : [...rest.slice(0, -1), led, at]
        } else {
          const clearance = 20
          const away =
            to.port[0] === 'N'
              ? { x: 0, y: -clearance }
              : to.port[0] === 'S'
                ? { x: 0, y: clearance }
                : to.port[0] === 'E'
                  ? { x: clearance, y: 0 }
                  : { x: -clearance, y: 0 }
          const clear = { x: at.x + away.x, y: at.y + away.y }
          const corner = sideways ? { x: clear.x, y: neighbour.y } : { x: neighbour.x, y: clear.y }
          points = end === 'source' ? [at, clear, corner, ...rest] : [...rest, corner, clear, at]
        }
        ends[end] = to.component
        ports[end] = to.port as typeof ports.source
      }
      points = normaliseRoute(points)
      return { ...flow, ...ends, sourcePort: ports.source, targetPort: ports.target, d: routePath(points), points }
    })
  }

  const flowsAfterCreations = (
    shownFlows: readonly RuntimeFlow[],
    created: readonly CreatedFlow[],
    portAt: (endpoint: string, port: string) => Point | undefined,
  ) => {
    if (created.length === 0) return shownFlows
    const made = created.flatMap((line) => {
      const from = portAt(line.source, line.sourcePort)
      const to = portAt(line.target, line.targetPort)
      if (!from || !to) return []
      const points = routeBetweenPorts(from, line.sourcePort, to, line.targetPort)
      return [{ ...line, d: routePath(points), id: line.code, points } as RuntimeFlow]
    })
    return made.length === 0 ? shownFlows : [...shownFlows, ...made]
  }

  const flowsAfterEdits = (
    shownFlows: readonly RuntimeFlow[],
    offsets: ReadonlyMap<string, Offset>,
    routeDrafts: Readonly<Record<string, readonly Point[]>>,
    attachments: ReadonlyMap<string, { source?: AttachedEnd; target?: AttachedEnd }>,
    portAt: (endpoint: string, port: string) => Point | undefined,
  ) => {
    const moved = flowsAfterAttachments(flowsAfterMoves(shownFlows, offsets), attachments, portAt)
    if (Object.keys(routeDrafts).length === 0) return moved
    return moved.map((flow) => {
      const drafted = routeDrafts[flow.code]
      return drafted ? { ...flow, d: routePath(drafted), points: drafted } : flow
    })
  }

  const annotationLabelPositions = (
    shownFlows: readonly RuntimeFlow[],
    visibleScopes: ReadonlySet<string>,
    drafts?: ReadonlyMap<string, number>,
  ) =>
    placeLabels({
      candidates: [0.5, 0.4, 0.6, 0.3, 0.7, 0.25, 0.75, 0.2, 0.8, 0.15, 0.85],
      drafts,
      label: { height: 20, width: 48 },
      obstacles: cards.filter((card) => membershipVisible(card, visibleScopes)).map((card) => card.bounds),
      routes: shownFlows.map((flow) => ({ d: flow.d, id: flow.id, key: flow.code, along: flow.label?.along })),
    })

  const specificationSections = definition.specificationGroups
    .map((group) => ({
      group,
      within: definition.interfaces.filter((entry) => entry.owner === group.owner && entry.document === group.document),
    }))
    .filter((section) => section.within.length > 0)

  const flowsCarrying = (id: string) => flows.filter((flow) => flow.conformsTo?.includes(id))
  const cardsOffering = (id: string) =>
    register.all.filter((entry) => entry.kind === 'card' && entry.conformsTo?.includes(id))
  const unroutedInterfaces = definition.interfaces.filter(
    (entry) => flowsCarrying(entry.id).length === 0 && cardsOffering(entry.id).length === 0,
  )

  return {
    config,
    infoschematicViewBox: definition.viewBox,
    infoschematicScopes: definition.scopes,
    infoschematicFamilies: definition.flowFamilies,
    infoschematicLanes: definition.lanes,
    infoschematicCards: cards,
    infoschematicFabrics: fabrics,
    infoschematicFlows: flows,
    infoschematicRegister: register,
    infoschematicRegisterWith: registerWith,
    infoschematicEndpointCodes: endpointCodes,
    infoschematicEndpointLabels: endpointLabels,
    infoschematicLayout: layout,
    infoschematicInterfaceById: interfaceById,
    infoschematicPlaceables: placeables,
    infoschematicFlowIsVisible: flowVisible,
    flowsAfterCreations,
    flowsAfterEdits,
    editableModel: {
      componentLayout: Object.fromEntries(
        [...definition.cards, ...definition.fabrics].map((entry) => [entry.code, entry.placement]),
      ),
      endpointCodes,
      flowCodes: new Set(flows.map((flow) => flow.code)),
      lanes: definition.lanes,
      layout,
      register,
      registerWith,
      placeables,
      annotationLabelPositions,
      flowsAfterAttachments,
      flowsAfterMoves,
    },
    infoschematicCardIsVisible: (card: RuntimeCard, scopes: ReadonlySet<string>) => membershipVisible(card, scopes),
    infoschematicFabricIsVisible: (fabric: RuntimeFabric, scopes: ReadonlySet<string>) =>
      membershipVisible(fabric, scopes),
    infoschematicAnnotationLabelPositions: annotationLabelPositions,
    infoschematicLaneLabelX: laneLabelX,
    infoschematicLaneLabelY: laneLabelY,
    infoschematicLanePanelOutline: lanePanelOutline,
    infoschematicPortAudit: (shownFlows: readonly RuntimeFlow[]) => {
      const ports = shownFlows.flatMap((flow) => {
        const { start, end } = routeEndpoints(flow.d)
        return [
          { flow: flow.code, endpoint: flow.source, point: start, port: flow.sourcePort, terminal: 'source' as const },
          { flow: flow.code, endpoint: flow.target, point: end, port: flow.targetPort, terminal: 'target' as const },
        ]
      })
      return { findings: auditPorts(ports, minimumPortGap), ports }
    },
    infoschematicSpecificationSections: specificationSections,
    infoschematicFlowsCarrying: flowsCarrying,
    infoschematicCardsOffering: cardsOffering,
    infoschematicUnroutedInterfaces: unroutedInterfaces,
    stories,
    standaloneScenes,
    thematicScenes,
    calloutPorts: config.calloutPositions,
    themeLogos: Object.fromEntries(thematicScenes.flatMap((scene) => (scene.logo ? [[scene.id, scene.logo]] : []))),
    adapterFloor,
    telemetryPlaneTop: fabrics.find((fabric) => fabric.appearance?.renderer === 'telemetry-plane')?.bounds.y ?? 0,
  }
}

export type InfoschematicRuntime = ReturnType<typeof createInfoschematicRuntime>

export const InfoschematicContext = createContext<InfoschematicRuntime | null>(null)

export const useInfoschematic = () => {
  const runtime = useContext(InfoschematicContext)
  if (!runtime) throw new Error('Infoschematic components must be rendered within App')
  return runtime
}

export type RuntimeScope = ScopeConfig
export type RuntimeInterface = InterfaceConfig
