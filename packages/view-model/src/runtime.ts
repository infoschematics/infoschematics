import { defineInfoschematicModel, infoschematicModelOf } from '@infoschematics/domain-core'
import type {
  ArchitecturalScope,
  Callout,
  Card,
  DefinedInfoschematic,
  Fabric,
  InfoschematicInput,
  Operation,
  Overlay,
  SequencePresentation,
  SpecificationDocument
} from '@infoschematics/domain-model'
import type { PortId } from '@infoschematics/domain-model/ports'
import { adapterBoundsFor, adapterFloor } from './assembly.ts'
import { establishedInfoschematicOf } from './compatibility.ts'
import type { AttachedEnd, CreatedComponent, CreatedFlow } from './editable.ts'
import type { Box, Offset, Point } from './geometry.ts'
import { routeEndpoints, routePath } from './geometry.ts'
import { placeLabels } from './placement.ts'
import { auditPorts, minimumPortGap, type PortCounts, portsForBox } from './ports.ts'
import { joinedToPort, moveRouteEnds, normaliseRoute, routeBetweenPorts } from './routing.ts'
import { annotationLabelWidth, visualTokens } from './tokens.ts'

export type RuntimeCard = Card & {
  bounds: Box
  code: string
  detail: string
  domain?: string
  group: string
  kind: 'card'
  placement: { box: Box; ports?: PortCounts }
  ports?: PortCounts
  scope: string
  scopes: readonly string[]
  wraps?: string
}

export type RuntimeFabric = Omit<Fabric, 'kind'> & {
  bounds: Box
  code: string
  detail: string
  group: string
  kind: 'fabric'
  placement: { box: Box; ports?: PortCounts }
  ports?: PortCounts
  renderer?: Fabric['kind']
  scope: string
  scopes: readonly string[]
}

export type RuntimeFlow = {
  id: string
  code: string
  family: string
  /** Whether this Flow draws its own code permanently, overriding the Diagram's default. */
  identity?: boolean
  source: string
  target: string
  sourcePort: PortId
  targetPort: PortId
  bidirectional?: boolean
  conformsTo?: readonly string[]
  dashed?: boolean
  label?: { along: number }
  operation?: string
  over?: string
  points: readonly Point[]
  d: string
}

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

/** A Scene's request that a named Dynamic play, projected as the authored ids and policy with no timing attached. */
export type RuntimeSceneCue = {
  dynamic: string
  playback: 'once' | 'repeat'
  /** Which stage of the Scene's cascade plays it, counting from one. Resolved here so a View never reads an absence. */
  stage: number
}

export type RuntimeSequenceScene = {
  id: string
  code: string
  label: string
  description: string
  caption: string
  headline: string
  hold: number
  /** Dynamics this Scene asks for, in authored order. A View owns every timer; this says only which and how often. */
  cues: readonly RuntimeSceneCue[]
  components: readonly string[]
  flows: readonly string[]
  graphic?: Overlay
  callout?: Point
  calloutConfig?: Callout
  takeaways?: readonly string[]
  profile?: readonly string[]
  cover?: true
  logo?: string
  scene?: string
  short?: string
  title?: string
}

export type RuntimeSequence = {
  id: string
  code: string
  label: string
  description: string
  presentation: SequencePresentation
  scenes: readonly RuntimeSequenceScene[]
}

/** @deprecated Studio source editing removes these Sequence projections in TOOL-033. */
export type RuntimeStandaloneScene = RuntimeSequenceScene & { scene?: string; short?: string }
/** @deprecated Studio source editing removes these Sequence projections in TOOL-033. */
export type RuntimeExpandedScene = RuntimeSequenceScene & { scene?: string; short?: string }
/** @deprecated Studio source editing removes these Sequence projections in TOOL-033. */
export type RuntimeStory = {
  id: string
  code: string
  label: string
  question: string
  steps: readonly RuntimeSequenceScene[]
}
/** @deprecated Use RuntimeSequenceScene. */
export type RuntimeStoryScene = RuntimeSequenceScene & { scene?: string; short?: string; title?: string }

/** Safe readable fallback for timed Scenes without an authored duration. */
/** A point moved by an offset, for a draft that re-derives a run rather than bending it. */
export const defaultSceneDuration = 3100

export type RuntimeDrafts = {
  offsets?: ReadonlyMap<string, Offset>
  portCounts?: Readonly<Record<string, PortCounts>>
  created?: readonly CreatedComponent[]
}

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
    }
  }
}

const membershipVisible = (
  entry: { scopes: readonly string[]; scopeRule?: 'all' | 'any' },
  visibleScopes: ReadonlySet<string>
) =>
  entry.scopes.length === 0 || entry.scopeRule === 'all'
    ? entry.scopes.every((scope) => visibleScopes.has(scope))
    : entry.scopes.some((scope) => visibleScopes.has(scope))

export type RuntimeScope = ArchitecturalScope & {
  color: string
  fill: string
  icon?: string
  prefix: string
}

export type RuntimeInterface = {
  id: string
  prefix: string
  label: string
  description: string
  kind: 'specification' | 'interface' | 'operation'
  parent: string
  owner: string
  hasDocument: boolean
  documents?: readonly SpecificationDocument[]
  contract?: string
  href?: string
  version?: string
  realisedBy?: readonly string[]
  operations?: readonly Operation[]
}

const specificationNodesOf = (model: DefinedInfoschematic): readonly RuntimeInterface[] =>
  model.specifications.flatMap((group) =>
    group.specifications.flatMap((specification) => {
      const specificationPath = `${group.id}/${specification.id}`
      const primaryDocument = specification.documents?.[0]
      const shared = {
        owner: specification.owner ?? '',
        hasDocument: specification.documents?.some(({ href }) => Boolean(href)) ?? false,
        documents: specification.documents,
        contract: primaryDocument?.code,
        href: primaryDocument?.href,
        version: primaryDocument?.version
      }
      return [
        {
          ...shared,
          description: specification.description ?? '',
          id: specificationPath,
          kind: 'specification' as const,
          label: specification.label,
          parent: group.id,
          prefix: specification.id,
          realisedBy: specification.realisedBy
        },
        ...(specification.interfaces ?? []).flatMap((interfaceEntry) => {
          const interfacePath = `${specificationPath}/${interfaceEntry.id}`
          return [
            {
              ...shared,
              description: interfaceEntry.description ?? '',
              id: interfacePath,
              kind: 'interface' as const,
              label: interfaceEntry.label,
              operations: interfaceEntry.operations,
              parent: specificationPath,
              prefix: interfaceEntry.id,
              realisedBy: interfaceEntry.realisedBy
            },
            ...(interfaceEntry.operations ?? []).map((operation) => ({
              ...shared,
              description: operation.description ?? '',
              id: `${interfacePath}/${operation.id}`,
              kind: 'operation' as const,
              label: operation.label,
              parent: interfacePath,
              prefix: operation.id,
              realisedBy: operation.realisedBy
            }))
          ]
        })
      ]
    })
  )

export const createInfoschematicRuntime = (input: InfoschematicInput) => {
  const config = defineInfoschematicModel('infoschematic' in input ? infoschematicModelOf(input) : input)
  const compatibilityConfig = 'infoschematic' in input ? input : establishedInfoschematicOf(config)
  const definition = config.diagram
  const establishedFlowPoints =
    'infoschematic' in input ? new Map(input.infoschematic.flows.map((flow) => [flow.code, flow.points])) : undefined
  const specificationNodes = specificationNodesOf(config)
  const scopesOf = (id: string) => config.scopes.filter((scope) => scope.elements.includes(id)).map((scope) => scope.id)
  const cards: RuntimeCard[] = definition.cards.map((card) => ({
    ...card,
    bounds: card.bounds,
    code: card.id,
    detail: card.description ?? '',
    domain: card.collection,
    group: card.collection ?? '',
    kind: 'card',
    placement: { box: card.bounds, ports: card.ports },
    scope: scopesOf(card.id)[0] ?? '',
    scopes: scopesOf(card.id),
    wraps: card.adapts ?? card.wraps
  }))
  const fabrics: RuntimeFabric[] = definition.fabrics.map((fabric) => ({
    ...fabric,
    bounds: fabric.bounds,
    code: fabric.id,
    detail: fabric.description ?? '',
    group: fabric.id,
    kind: 'fabric',
    placement: { box: fabric.bounds, ports: fabric.ports },
    renderer: fabric.kind,
    scope: scopesOf(fabric.id)[0] ?? '',
    scopes: scopesOf(fabric.id)
  }))
  /*
   * An Adapter is anchored to the Card it holds, never to its own authored `bounds` — `ADR-INFOSCHEMATICS-032`, and
   * the rule every drawn adapter already follows through `adapterBoundsFor`. This lookup read the authored box, so a
   * Flow leaving an adapter stayed where the adapter had been authored while the adapter itself went with the Card a
   * Producer moved, and the two came apart on screen.
   */
  const cardBoundsById = new Map(cards.map((card) => [card.id, card.bounds]))
  const drawnBounds = (card: RuntimeCard) => {
    const held = card.wraps ? cardBoundsById.get(card.wraps) : undefined
    return held ? adapterBoundsFor(held) : card.bounds
  }
  const endpointById = new Map<string, { box?: Box; at?: Point; ports?: PortCounts }>([
    ...cards.map((entry) => [entry.id, { box: drawnBounds(entry), ports: entry.ports }] as const),
    ...fabrics.map((entry) => [entry.id, { box: entry.bounds, ports: entry.ports }] as const),
    ...definition.points.map((entry) => [entry.id, { at: entry.at, ports: entry.ports }] as const)
  ])
  const portAt = (element: string, port: string): Point => {
    const endpoint = endpointById.get(element)
    if (!endpoint) throw new Error(`Unknown Flow endpoint: ${element}`)
    if (endpoint.at) return endpoint.at
    const found = endpoint.box ? portsForBox(endpoint.box, endpoint.ports).find(({ id }) => id === port) : undefined
    if (!found) throw new Error(`Unknown Port ${port} on ${element}`)
    return found.at
  }
  /*
   * A Flow with no waypoints is routed rather than read.
   *
   * Its two ports are all the document says, and joining them with a naked pair of points asserts that they happen
   * to line up. Nothing makes that true: a Producer may move either end off the other's axis, which `EDIT-018`
   * allows through three placement paths, and the naked run then fails `ROUTE-001` and takes the host down with it
   * — `COMPOSE-002`. `routeBetweenPorts` is the construction the editor already uses to draw a first route, and it
   * collapses to the straight run wherever the ports do line up, so a document that renders today renders the same.
   *
   * A route that carries waypoints is a shape someone drew, and every waypoint is kept exactly where it was
   * authored — deriving over it would be re-routing an authored route, which this does not do. Only the run that
   * reaches a port is repaired, by `joinedToPort` below, because that run is the one a move can invalidate.
   */
  const flows: RuntimeFlow[] = definition.flows.map((flow) => {
    const established = establishedFlowPoints?.get(flow.id)
    const waypoints = established ? established.slice(1, -1) : (flow.route?.waypoints ?? [])
    const points =
      waypoints.length > 0
        ? (established ??
          joinedToPort(
            'end',
            flow.target.port,
            joinedToPort('start', flow.source.port, [
              portAt(flow.source.element, flow.source.port),
              ...waypoints,
              portAt(flow.target.element, flow.target.port)
            ])
          ))
        : routeBetweenPorts(
            portAt(flow.source.element, flow.source.port),
            flow.source.port,
            portAt(flow.target.element, flow.target.port),
            flow.target.port
          )
    const realisedSpecifications = specificationNodes.filter((entry) => entry.realisedBy?.includes(flow.id))
    return {
      id: flow.id,
      code: flow.id,
      family: flow.family ?? '',
      source: flow.source.element,
      target: flow.target.element,
      sourcePort: flow.source.port,
      targetPort: flow.target.port,
      bidirectional: flow.direction === 'bidirectional' || undefined,
      conformsTo: realisedSpecifications.map((entry) => entry.id),
      dashed: flow.appearance?.line === 'dashed' || undefined,
      identity: flow.identity,
      label: flow.route?.labelAt === undefined ? undefined : { along: flow.route.labelAt },
      operation: realisedSpecifications.find((entry) => entry.kind === 'operation')?.prefix,
      points,
      d: routePath(points)
    }
  })
  const identities: RuntimeIdentity[] = [
    ...cards.map(({ placement: _placement, bounds: _bounds, ports: _ports, ...card }) => card),
    ...fabrics.map(
      ({ placement: _placement, bounds: _bounds, ports: _ports, appearance: _appearance, ...fabric }) => fabric
    ),
    ...definition.points.map((point) => ({
      code: point.id,
      detail: undefined,
      group: point.id,
      id: point.id,
      kind: 'point' as const,
      label: point.label,
      scopes: scopesOf(point.id)
    }))
  ]
  const register = registerOf(identities)
  const endpointCodes = new Map(identities.map(({ code, id }) => [id, code]))
  const endpointLabels = new Map(identities.map(({ id, label }) => [id, label]))
  const layout = Object.fromEntries(cards.map((card) => [card.id, card.bounds])) as Readonly<Record<string, Box>>
  const interfaceById = new Map(specificationNodes.map((entry) => [entry.id, entry]))

  const flowIds = new Set(flows.map(({ id }) => id))
  const overlayById = new Map(definition.overlays.map((overlay) => [overlay.id, overlay]))
  const overlayIds = new Set(overlayById.keys())
  const scopeElements = new Map(config.scopes.map((scope) => [scope.id, scope.elements]))
  const flowEndpoints = new Map(
    definition.flows.map((flow) => [flow.id, { source: flow.source.element, target: flow.target.element }])
  )
  const focusedElements = (scene: DefinedInfoschematic['sequences'][number]['scenes'][number]) => {
    const selection = scene.focus ?? scene.visibility?.show
    const scoped = new Set((selection?.scopes ?? []).flatMap((scope) => scopeElements.get(scope) ?? []))
    const derivedFlows = [...flowEndpoints]
      .filter(([, endpoints]) => scoped.has(endpoints.source) && scoped.has(endpoints.target))
      .map(([id]) => id)
    return [...new Set([...(selection?.elements ?? []), ...scoped, ...derivedFlows])]
  }
  const profileOf = (properties: Callout['properties']): readonly string[] | undefined => {
    const profile = properties?.profile
    if (Array.isArray(profile) && profile.every((entry) => typeof entry === 'string')) {
      return profile as readonly string[]
    }
    if (typeof profile !== 'string') return undefined
    try {
      const parsed: unknown = JSON.parse(profile)
      return Array.isArray(parsed) && parsed.every((entry) => typeof entry === 'string')
        ? (parsed as readonly string[])
        : undefined
    } catch {
      return undefined
    }
  }
  const sequences: RuntimeSequence[] = config.sequences.map((sequence) => ({
    code: sequence.id,
    description: sequence.description ?? '',
    id: sequence.id,
    label: sequence.label,
    presentation: sequence.presentation,
    scenes: sequence.scenes.map((scene) => {
      const elements = focusedElements(scene)
      const overlay = elements.find((id) => overlayIds.has(id))
      const properties = scene.callout?.properties
      return {
        id: scene.id,
        code: scene.id,
        label: scene.label,
        description: scene.description ?? scene.callout?.body ?? '',
        caption: scene.callout?.body ?? '',
        headline: scene.callout?.title ?? scene.label,
        hold: scene.duration ?? defaultSceneDuration,
        // Absence of a policy is `once`: the cue plays on entry, which is what a Scene naming a Dynamic asks for
        // without saying more. Absence of a stage is the first stage, so a Scene that names none has one stage and
        // plays it all on entry. Nothing here carries a duration, per `DYNAMIC-001`.
        cues: (scene.cues ?? []).map((cue) => ({
          dynamic: cue.dynamic,
          playback: cue.playback ?? 'once',
          stage: cue.stage ?? 1
        })),
        components: elements.filter((id) => !flowIds.has(id) && !overlayIds.has(id)),
        flows: elements.filter((id) => flowIds.has(id)),
        graphic: overlay ? overlayById.get(overlay) : undefined,
        callout: scene.callout?.placement && 'at' in scene.callout.placement ? scene.callout.placement.at : undefined,
        calloutConfig: scene.callout,
        takeaways: scene.callout?.takeaways,
        profile: profileOf(properties),
        cover: properties?.wide === true ? true : undefined,
        logo: typeof properties?.logo === 'string' ? properties.logo : undefined
      }
    })
  }))

  const registerWith = (created: readonly CreatedComponent[] = []) =>
    created.length === 0
      ? register
      : registerOf([
          ...register.all,
          ...created.map(
            (card): RuntimeIdentity => ({
              code: card.code,
              detail: card.detail,
              group: card.group,
              id: card.id,
              kind: 'card',
              label: card.label,
              scopes: card.scopes,
              wraps: card.wraps
            })
          )
        ])

  const placeables = (visibleScopes: ReadonlySet<string>, drafts?: RuntimeDrafts) => {
    const drafted = (box: Box, code: string) => {
      const offset = drafts?.offsets?.get(code)
      return offset ? { ...box, x: box.x + offset.dx, y: box.y + offset.dy } : box
    }
    const visibleCards = cards.filter((card) => membershipVisible(card, visibleScopes))
    const ordinary = new Map(
      visibleCards.filter((card) => !card.wraps).map((card) => [card.id, drafted(card.bounds, card.code)])
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
            ports: { ...card.ports, ...drafts?.portCounts?.[card.code] }
          }
        ]
      }),
      ...fabrics
        .filter((fabric) => membershipVisible(fabric, visibleScopes))
        .map((fabric) => ({
          box: drafted(fabric.bounds, fabric.code),
          code: fabric.code,
          id: fabric.id,
          ports: { ...fabric.ports, ...drafts?.portCounts?.[fabric.code] }
        }))
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
        ports: { ...card.ports, ...drafts?.portCounts?.[card.code] }
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
      /* The same construction the draft document reaches, so a move looks the same before and after it is
         committed - `ROUTE-002`. */
      const points = normaliseRoute(
        moveRouteEnds(
          flow.points,
          { source: flow.sourcePort, target: flow.targetPort },
          { source: sourceOffset, target: targetOffset }
        )
      )
      return { ...flow, d: routePath(points), points }
    })
  }

  const flowsAfterAttachments = (
    shownFlows: readonly RuntimeFlow[],
    attachments: ReadonlyMap<string, { source?: AttachedEnd; target?: AttachedEnd }>,
    portAt: (endpoint: string, port: string) => Point | undefined
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
      return {
        ...flow,
        ...ends,
        sourcePort: ports.source,
        targetPort: ports.target,
        d: routePath(points),
        points
      }
    })
  }

  const flowsAfterCreations = (
    shownFlows: readonly RuntimeFlow[],
    created: readonly CreatedFlow[],
    portAt: (endpoint: string, port: string) => Point | undefined
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
    portAt: (endpoint: string, port: string) => Point | undefined
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
    drafts?: ReadonlyMap<string, number>
  ) =>
    placeLabels({
      candidates: [0.5, 0.4, 0.6, 0.3, 0.7, 0.25, 0.75, 0.2, 0.8, 0.15, 0.85],
      drafts,
      label: {
        height: visualTokens.canvas.metrics.annotationHeight,
        width: Math.max(
          visualTokens.canvas.metrics.annotationWidth,
          ...shownFlows.map((flow) => annotationLabelWidth(flow.code))
        )
      },
      obstacles: cards.filter((card) => membershipVisible(card, visibleScopes)).map((card) => card.bounds),
      routes: shownFlows.map((flow) => ({
        d: flow.d,
        id: flow.id,
        key: flow.code,
        along: flow.label?.along
      }))
    })

  const specificationSections = config.specifications
    .map((group) => {
      const specificationPaths = group.specifications.map((specification) => `${group.id}/${specification.id}`)
      return {
        group: {
          id: group.id,
          label: group.label,
          note: group.description ?? '',
          owner: '',
          hasDocument: group.specifications.some((specification) =>
            specification.documents?.some(({ href }) => Boolean(href))
          ),
          specifications: specificationPaths
        },
        within: specificationNodes.filter((entry) =>
          specificationPaths.some((path) => entry.id === path || entry.id.startsWith(`${path}/`))
        )
      }
    })
    .filter((section) => section.within.length > 0)

  const realisedBySpecification = new Map(
    specificationNodes.map((entry) => [entry.id, entry.realisedBy ?? []] as const)
  )

  const flowsById = new Map(flows.map((flow) => [flow.id, flow]))
  const identitiesById = new Map(register.all.map((entry) => [entry.id, entry]))
  const flowsCarrying = (id: string) =>
    (realisedBySpecification.get(id) ?? []).flatMap((element) => {
      const flow = flowsById.get(element)
      return flow ? [flow] : []
    })
  const cardsOffering = (id: string) =>
    (realisedBySpecification.get(id) ?? []).flatMap((element) => {
      const identity = identitiesById.get(element)
      return identity?.kind === 'card' ? [identity] : []
    })
  const specificationsByElement = new Map<string, RuntimeInterface[]>()
  for (const entry of specificationNodes) {
    for (const element of entry.realisedBy ?? []) {
      specificationsByElement.set(element, [...(specificationsByElement.get(element) ?? []), entry])
    }
  }
  const unroutedInterfaces = specificationNodes.filter((entry) => (entry.realisedBy?.length ?? 0) === 0)
  const runtimeScopes: readonly RuntimeScope[] = config.scopes.map((scope) => ({
    ...scope,
    color: '#94a3b8',
    fill: '#0f172a',
    icon: scope.appearance?.icon,
    prefix: scope.id
  }))
  const runtimeCollections = definition.collections.map((collection) => ({
    color: collection.appearance?.color ?? '#94a3b8',
    description: collection.description,
    fill: collection.appearance?.fill ?? '#0f172a',
    id: collection.id,
    label: collection.label
  }))
  const runtimeFamilies = definition.families.map((family) => ({
    color: family.appearance?.color ?? '#94a3b8',
    description: family.description ?? '',
    id: family.id,
    label: family.label,
    prefix: family.id
  }))
  const runtimeRegions = definition.regions.map((region) => ({
    box: { ...region.bounds, radius: region.appearance?.cornerRadius },
    fill: region.appearance?.fill,
    frame: region.appearance?.frame,
    id: region.id,
    identity: region.identity,
    label: region.label,
    labelMount: region.appearance?.label?.mount,
    labelOffset: region.appearance?.label?.offset,
    labelPlacement: region.appearance?.label?.placement
  }))
  const sceneLogos = Object.fromEntries(
    sequences.flatMap((sequence) => sequence.scenes.flatMap((scene) => (scene.logo ? [[scene.id, scene.logo]] : [])))
  )
  const standaloneScenes = sequences.find((sequence) => sequence.id === 'OVERVIEW')?.scenes ?? []
  const expandedScenes = sequences
    .filter((sequence) => sequence.presentation.display === 'expanded' && sequence.id !== 'OVERVIEW')
    .flatMap((sequence) => sequence.scenes)
  const stories: readonly RuntimeStory[] = sequences
    .filter((sequence) => sequence.presentation.display === 'collapsed')
    .map((sequence) => ({
      code: sequence.code,
      id: sequence.id,
      label: sequence.label,
      question: sequence.description,
      steps: sequence.scenes.map((scene) => ({ ...scene, title: scene.headline }))
    }))

  return {
    compatibilityConfig,
    config,
    infoschematicViewBox: definition.bounds,
    infoschematicScopes: runtimeScopes,
    infoschematicCollections: runtimeCollections,
    infoschematicFamilies: runtimeFamilies,
    infoschematicRegions: runtimeRegions,
    infoschematicCards: cards,
    infoschematicFabrics: fabrics,
    infoschematicPoints: definition.points,
    infoschematicFlows: flows,
    infoschematicOverlays: definition.overlays,
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
      componentLayout: Object.fromEntries([...cards, ...fabrics].map((entry) => [entry.code, entry.placement])),
      endpointCodes,
      flowCodes: new Set(flows.map((flow) => flow.code)),
      regions: runtimeRegions,
      layout,
      register,
      registerWith,
      placeables,
      annotationLabelPositions,
      flowsAfterAttachments,
      flowsAfterMoves
    },
    infoschematicCardIsVisible: (card: RuntimeCard, scopes: ReadonlySet<string>) => membershipVisible(card, scopes),
    infoschematicFabricIsVisible: (fabric: RuntimeFabric, scopes: ReadonlySet<string>) =>
      membershipVisible(fabric, scopes),
    infoschematicAnnotationLabelPositions: annotationLabelPositions,
    infoschematicPortAudit: (shownFlows: readonly RuntimeFlow[]) => {
      const ports = shownFlows.flatMap((flow) => {
        const { start, end } = routeEndpoints(flow.d)
        return [
          {
            flow: flow.code,
            endpoint: flow.source,
            point: start,
            port: flow.sourcePort,
            terminal: 'source' as const
          },
          {
            flow: flow.code,
            endpoint: flow.target,
            point: end,
            port: flow.targetPort,
            terminal: 'target' as const
          }
        ]
      })
      return { findings: auditPorts(ports, minimumPortGap), ports }
    },
    infoschematicSpecificationSections: specificationSections,
    infoschematicFlowsCarrying: flowsCarrying,
    infoschematicCardsOffering: cardsOffering,
    infoschematicSpecificationsFor: (element: string) => specificationsByElement.get(element) ?? [],
    infoschematicUnroutedInterfaces: unroutedInterfaces,
    sequences,
    standaloneScenes,
    stories,
    expandedScenes,
    calloutPorts: definition.calloutPositions,
    sceneLogos,
    adapterFloor
  }
}

type CompleteInfoschematicRuntime = ReturnType<typeof createInfoschematicRuntime>
export type InfoschematicRuntime = Omit<CompleteInfoschematicRuntime, 'infoschematicSpecificationsFor'> &
  Partial<Pick<CompleteInfoschematicRuntime, 'infoschematicSpecificationsFor'>>
