import type {
  ArtefactCapabilities,
  ArtefactSelection,
  AttachedEnd,
  Change,
  CreatedComponent,
  EditableDiagram,
  Handle,
  Placement,
} from '@infoschematics/view-model/editable'
import {
  artefactCapabilities,
  artefactResizeMinimums,
  defineArtefactSelection,
} from '@infoschematics/view-model/editable'
import type { Box } from '@infoschematics/view-model/geometry'
import { alongRoute, type Offset, type Point, projectOntoRoute, routeLength } from '@infoschematics/view-model/geometry'
import { guidesFrom } from '@infoschematics/view-model/guides'
import { type PortCounts, type PortId, portsForBox } from '@infoschematics/view-model/ports'
import type { LaneConfig } from '@infoschematics/domain-model/lane'
import type { FabricConfig } from '@infoschematics/domain-model/fabric'
import type { GraphicConfig } from '@infoschematics/domain-model/graphic'
type InfoschematicScopeId = string

type AuthoredEditableArtefacts = Readonly<{
  fabrics?: readonly FabricConfig[]
  graphics?: readonly GraphicConfig[]
}>

const adapterCapabilities = (canMove: boolean): ArtefactCapabilities =>
  Object.freeze({
    ...artefactCapabilities.card,
    move: canMove,
    resize: false,
  })

type InfoschematicFlow = {
  code: string
  d: string
  family: string
  id: string
  label?: { along: number }
  points: readonly Point[]
  source: string
  sourcePort: PortId
  target: string
  targetPort: PortId
}

const boxCentreOf = (box: Box): Point => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 })

// This diagram's side of the editable interface. Labels are keyed by flow
// code, because that is what a reader sees on the Infoschematic and what a change has to
// name when it is pasted onto a flow definition.

const sideNames: Record<string, string> = { E: 'east', N: 'north', S: 'south', W: 'west' }

/*
 * A card's authored box, by id.
 *
 * The layout is keyed by the ids the model authored; the register is keyed by
 * plain strings, because a created card has an id no closed union can list yet.
 * The cast is that difference, stated once at the boundary where the two meet
 * rather than at each place they touch.
 */
type EditableModel = {
  componentLayout: Readonly<Record<string, { box: Box; ports?: PortCounts }>>
  endpointCodes: ReadonlyMap<string, string>
  flowCodes: ReadonlySet<string>
  lanes: readonly LaneConfig[]
  layout: Readonly<Record<string, Box>>
  register: { byCode: (code: string) => unknown }
  registerWith: (created: readonly CreatedComponent[]) => {
    cardAt: (
      code: string,
    ) => { code: string; detail?: string; group?: string; id: string; label: string; wraps?: string } | undefined
  }
  placeables: (
    scopes: ReadonlySet<string>,
    drafts?: { created?: readonly CreatedComponent[]; offsets?: ReadonlyMap<string, Offset> },
  ) => readonly { box: Box; code: string; id: string; ports?: PortCounts }[]
  annotationLabelPositions: (
    flows: readonly InfoschematicFlow[],
    scopes: ReadonlySet<string>,
    labels?: ReadonlyMap<string, number>,
  ) => ReadonlyMap<string, Point>
  flowsAfterAttachments: (
    flows: readonly InfoschematicFlow[],
    attachments: ReadonlyMap<string, { source?: AttachedEnd; target?: AttachedEnd }>,
    portAt: (endpoint: string, port: string) => Point | undefined,
  ) => readonly InfoschematicFlow[]
  flowsAfterMoves: (
    flows: readonly InfoschematicFlow[],
    drafts: ReadonlyMap<string, Offset>,
  ) => readonly InfoschematicFlow[]
}

export const infoschematicEditable = (
  model: EditableModel,
  flows: readonly InfoschematicFlow[],
  visibleScopes: ReadonlySet<InfoschematicScopeId>,
  drafts: ReadonlyMap<string, Offset>,
  labels: ReadonlyMap<string, number> = new Map(),
  attachments: ReadonlyMap<string, { source?: AttachedEnd; target?: AttachedEnd }> = new Map(),
  // Cards made in the editor. Defaulted so every existing caller and every test
  // keeps working unchanged; supplied by the app, which is the only place that
  // holds drafts.
  createdCards: readonly CreatedComponent[] = [],
  authoredArtefacts: AuthoredEditableArtefacts = {},
): EditableDiagram => {
  const register = model.registerWith(createdCards)
  /*
   * Where a card was before this session moved it.
   *
   * The authored layout for an authored card, and the creation itself for a
   * created one - which is the same thing said twice, since a created card's
   * box *is* what was written down for it. Without the second half a created
   * card has no origin to measure a drag against, so it draws and cannot be
   * dragged: on the Infoschematic and inert, which is worse than absent.
   */
  const originOf = (card: { code: string; id: string }): Box | undefined =>
    model.layout[card.id] ?? createdCards.find((made) => made.code === card.code)?.box
  const placeables = (scopes: ReadonlySet<InfoschematicScopeId>, more?: { offsets?: ReadonlyMap<string, Offset> }) =>
    model.placeables(scopes, { created: createdCards, ...more })
  // Where a port is, worked out here rather than passed in: the editable knows
  // every placeable already, and asking the caller would make it depend on the
  // hook that depends on it.
  const portAt = (endpoint: string, port: string) => {
    const placeable = placeables(visibleScopes).find((candidate) => candidate.id === endpoint)
    return placeable && portsForBox(placeable.box, placeable.ports).find((candidate) => candidate.id === port)?.at
  }

  const positions = model.annotationLabelPositions(flows, visibleScopes, labels)
  const byCode = new Map<string, InfoschematicFlow>(flows.map((flow) => [flow.code, flow]))

  // A dragged component reports where the drag has put it, not where the model
  // still says it is - so the panel, the guides and the handles all agree with
  // what is on screen mid-drag.
  const boxFor = (code: string, box: Box): Box => {
    const offset = drafts.get(code)
    return offset ? { ...box, x: box.x + offset.dx, y: box.y + offset.dy } : box
  }

  const usedPorts = new Set(
    flows.flatMap((flow) => [`${flow.source}:${flow.sourcePort}`, `${flow.target}:${flow.targetPort}`]),
  )

  // Geometry from the placeables and kind from the register, which is the whole
  // point of the pair: this used to read the box out of the layout table by an
  // id it got from the service list, making three sources agree by hand.
  // Fabrics are left out because a guide is something a card aligns to.
  const cards = placeables(visibleScopes)
    .filter((placeable) => register.cardAt(placeable.code))
    .map((placeable) => boxFor(placeable.code, placeable.box))

  const cardSelection = (card: { code: string; id: string }) =>
    defineArtefactSelection({
      code: card.code,
      geometry: 'box' as const,
      id: card.id,
      kind: 'card' as const,
    })

  const componentSelectionFor = (code: string) => {
    const card = register.cardAt(code)
    if (card) {
      const origin = originOf(card)
      if (!origin) return undefined
      const selection = cardSelection(card)
      if (!card.wraps) {
        return {
          capabilities: artefactCapabilities.card,
          geometry: { box: boxFor(code, origin), role: 'box' as const },
          movementTarget: selection,
          selection,
        }
      }

      const wrappedCode = model.endpointCodes.get(card.wraps)
      const wrapped = wrappedCode ? register.cardAt(wrappedCode) : undefined
      const movementTarget = wrapped ? cardSelection(wrapped) : selection
      return {
        capabilities: adapterCapabilities(Boolean(wrapped)),
        geometry: { box: boxFor(code, origin), role: 'box' as const },
        movementTarget,
        selection,
      }
    }

    const authored = authoredArtefacts.fabrics?.find(
      (fabric) => fabric.code === code,
    )
    const placeable = placeables(visibleScopes).find(
      (candidate) => candidate.code === code,
    )
    if (!authored && !placeable) return undefined
    const box = authored?.placement.box ?? placeable?.box
    if (!box) return undefined
    const selection = defineArtefactSelection({
      code: authored?.code ?? code,
      geometry: 'box' as const,
      id: authored?.id ?? placeable?.id ?? code,
      kind: 'fabric' as const,
    })
    return {
      capabilities: artefactCapabilities.fabric,
      geometry: { box: boxFor(code, box), role: 'box' as const },
      movementTarget: selection,
      selection,
    }
  }

  const selectionFor = (key: string) => {
    if (key.startsWith('port:')) {
      const [, code] = key.split(':')
      return componentSelectionFor(code)
    }
    if (key.startsWith('waypoint:')) {
      const [, code] = key.split(':')
      const flow = byCode.get(code)
      if (!flow) return undefined
      const selection = defineArtefactSelection({
        code: flow.code,
        geometry: 'route' as const,
        id: flow.id,
        kind: 'flow' as const,
      })
      return {
        capabilities: artefactCapabilities.flow,
        geometry: { points: flow.points, role: 'route' as const },
        movementTarget: selection,
        selection,
      }
    }
    if (key.startsWith('lane:')) {
      const lane = model.lanes.find(
        (candidate) => candidate.id === key.slice('lane:'.length),
      )
      if (!lane) return undefined
      const selection = defineArtefactSelection({
        code: null,
        geometry: 'lane' as const,
        id: lane.id,
        kind: 'lane' as const,
      })
      return {
        capabilities: artefactCapabilities.lane,
        geometry: { height: lane.height, role: 'lane' as const, y: lane.y },
        movementTarget: selection,
        selection,
      }
    }
    if (key.startsWith('zone:')) {
      const [, laneId, zoneId] = key.split(':')
      const lane = model.lanes.find((candidate) => candidate.id === laneId)
      const zone = lane?.zones.find((candidate) => candidate.id === zoneId)
      if (!lane || !zone) return undefined
      const selection = defineArtefactSelection({
        code: null,
        geometry: 'zone' as const,
        id: zone.id,
        kind: 'zone' as const,
        laneId: lane.id,
      })
      return {
        capabilities: artefactCapabilities.zone,
        geometry: {
          laneId: lane.id,
          role: 'zone' as const,
          width: zone.width,
          x: zone.x,
        },
        movementTarget: selection,
        selection,
      }
    }
    if (key.startsWith('graphic:')) {
      const graphic = authoredArtefacts.graphics?.find(
        (candidate) => candidate.id === key.slice('graphic:'.length),
      )
      if (!graphic) return undefined
      const selection = defineArtefactSelection({
        code: null,
        geometry: 'box' as const,
        id: graphic.id,
        kind: 'graphic' as const,
      })
      const box = graphic.placement ?? {
        height: artefactResizeMinimums.graphic.height ?? 1,
        width: artefactResizeMinimums.graphic.width ?? 1,
        x: 0,
        y: 0,
      }
      return {
        capabilities: artefactCapabilities.graphic,
        geometry: { box, role: 'box' as const },
        movementTarget: selection,
        selection,
      }
    }

    const flow = byCode.get(key)
    if (flow) {
      const selection = defineArtefactSelection({
        code: flow.code,
        geometry: 'route' as const,
        id: flow.id,
        kind: 'flow' as const,
      })
      return {
        capabilities: artefactCapabilities.flow,
        geometry: { points: flow.points, role: 'route' as const },
        movementTarget: selection,
        selection,
      }
    }

    return componentSelectionFor(key)
  }

  return {
    selectionFor,
    // A label aligns to the cards and to every label but itself, which is what
    // makes rows and columns of codes line up rather than nearly line up.
    // A label can only travel along the run it sits on, so only guides on that
    // axis can do anything - offering the other kind would show a line the drop
    // could never reach. A component travels both ways and gets both.
    guidesFor: (key: string) => {
      const flow = byCode.get(key)
      const at = flow && positions.get(flow.id)
      const along = flow && at ? projectOntoRoute(flow.d, at).vertical : undefined
      const all = guidesFrom(
        // A component does not align against itself; its own edges would pin it
        // where it already is.
        flow ? cards : cards.filter((card) => card !== boxFor(key, card)),
        flows.flatMap((other) => {
          const at = positions.get(other.id)
          return at && other.code !== key ? [at] : []
        }),
      )

      // Along a horizontal run only x can move, and the reverse on a vertical
      // one, so the guides that could never be reached are dropped.
      if (along === undefined) return all
      return all.filter((guide) => guide.axis === (along ? 'y' : 'x'))
    },

    handles: (): readonly Handle[] => [
      ...flows.flatMap((flow) => {
        const at = positions.get(flow.id)
        return at ? [{ at, key: flow.code, kind: 'label' as const }] : []
      }),
      // A component is a handle so it can be selected and inspected. A service
      // card can also be dragged; a fabric cannot yet, since resizing is not
      // built, so offsetFor refuses a fabric's code and a drag on it records
      // nothing.
      ...placeables(visibleScopes).map((service) => ({
        at: boxCentreOf(boxFor(service.code, service.box)),
        key: service.code,
        kind: 'component' as const,
      })),
      // Lanes and zones are geography, not components - they are handles only so
      // the panel can be told what a reader clicked, never so one can be dragged.
      // Every port and every interior waypoint is a handle, so the panel can be
      // told what was clicked. A port is not draggable - it is chosen, not
      // placed - so offsetFor refuses it.
      ...placeables(visibleScopes).flatMap((placeable) =>
        portsForBox(boxFor(placeable.code, placeable.box), placeable.ports).map((port) => ({
          at: port.at,
          key: `port:${placeable.code}:${port.id}`,
          kind: 'port' as const,
        })),
      ),
      ...flows.flatMap((flow) =>
        flow.points.slice(1, -1).map((point, offset) => ({
          at: point,
          key: `waypoint:${flow.code}:${offset + 1}`,
          kind: 'waypoint' as const,
        })),
      ),
      ...model.lanes.map((lane) => ({
        at: { x: lane.panel.x + lane.panel.width / 2, y: lane.panel.y + lane.panel.height / 2 },
        key: `lane:${lane.id}`,
        kind: 'lane' as const,
      })),
      ...model.lanes.flatMap((lane) =>
        lane.zones.map((zone) => ({
          at: { x: zone.x + zone.width / 2, y: lane.y + lane.height / 2 },
          key: `zone:${lane.id}:${zone.id}`,
          kind: 'zone' as const,
        })),
      ),
    ],

    // A label lives on its line, so its drop is a distance along it rather than
    // an offset from anywhere.
    /*
     * Reported to four places, which is what it takes for the share to give
     * back the point it was measured from.
     *
     * Two places sounded tidy and quietly undid the snapping: a hundredth of
     * the longest line here is nine units, so a label pulled exactly onto a
     * grid line or a guide was stored as the nearest hundredth and drawn up to
     * four and a half units away from it. Four places puts that under a tenth
     * of a unit, which no one can see and nothing has to work around.
     */
    alongFor: (key: string, point: Point): number | undefined => {
      const flow = byCode.get(key)
      if (!flow) return undefined
      const length = routeLength(flow.d)
      return length === 0 ? 0 : Number((alongRoute(flow.d, point) / length).toFixed(4))
    },

    authored: (key: string, field: string) => {
      const flow = byCode.get(key)
      if (flow) {
        // What a line carries is its own property rather than its geometry, so
        // it is written back to the registry beside its ends, not to the layout
        // beside its points.
        if (field === 'family') return `${key}  ->  family: '${flow.family}',`
        if (field === 'points')
          return `${key}  ->  points: [${flow.points.map((point) => `{ x: ${point.x}, y: ${point.y} }`).join(', ')}],`
        if (field === 'label' && flow.label) return `${key}  ->  label: { along: ${flow.label.along} },`
        if (field === 'source' || field === 'target')
          return `${key}  ->  ${field}: '${flow[field]}', ${field}Port: '${flow[`${field}Port`]}',`
        return undefined
      }

      /*
       * A card's name, its subtitle and the scope it belongs to. All three sit
       * in the registry rather than the layout, and all three are read from the
       * service entry rather than from the placeable, which carries geometry.
       */
      const card = register.cardAt(key)
      if (card) {
        if (field === 'name') return `${key}  ->  label: '${card.label}',`
        if (field === 'detail') return `${key}  ->  detail: '${card.detail}',`
        if (field === 'group') return `${key}  ->  group: '${card.group}',`
      }

      const placeable = placeables(visibleScopes).find((candidate) => candidate.code === key)
      const placement = model.componentLayout[key]
      if (!placeable || !placement) return undefined
      // The effective box, not the one written down: an adapter's follows from
      // the card it clasps, so the layout entry is not what the change describes
      // and comparing against it never matched.
      if (field === 'card') return `${key}  ->  card(${placeable.box.x}, ${placeable.box.y}),`
      if (field === 'ports') {
        const counts = placeable.ports as Record<string, number | undefined>
        return `${key}  ->  ports: { ${(['north', 'east', 'south', 'west'] as const)
          .filter((side) => counts[side] !== undefined)
          .map((side) => `${side}: ${counts[side]}`)
          .join(', ')} },`
      }
      return undefined
    },

    reseat: (key: string, counts: PortCounts) => {
      const placeable = placeables(visibleScopes).find((candidate) => candidate.code === key)
      if (!placeable) return []
      const after = portsForBox(placeable.box, { ...placeable.ports, ...counts })
      const before = portsForBox(placeable.box, placeable.ports)

      return flows.flatMap((flow) =>
        (['source', 'target'] as const).flatMap((end) => {
          if (flow[end] !== placeable.id) return []
          const was = before.find((port) => port.id === flow[`${end}Port`])
          if (!was) return []
          const nearest = [...after].sort(
            (left, right) =>
              Math.hypot(left.at.x - was.at.x, left.at.y - was.at.y) -
              Math.hypot(right.at.x - was.at.x, right.at.y - was.at.y),
          )[0]
          if (!nearest || nearest.id === flow[`${end}Port`]) return []
          return [{ code: flow.code, component: placeable.id, end, port: nearest.id }]
        }),
      )
    },

    knows: (key: string) => byCode.has(key) || placeables(visibleScopes).some((candidate) => candidate.code === key),

    // Read from the authored registry rather than from the flows passed
    // in, because those are the effective ones and a created line is among
    // them. This is the one place that has to tell the two apart.
    /*
     * Deliberately the authored register, not the effective one.
     *
     * `register` above has the created cards folded in, which is right for
     * every other question - they are on the Infoschematic and must behave like it.
     * This is the one question where that is exactly wrong: a created card
     * would report that the model already carries it, and the sweep would drop
     * the draft that is the only record of it the moment it was made.
     */
    authors: (key: string) => model.flowCodes.has(key) || model.register.byCode(key) !== undefined,

    onRoute: (key: string, point: Point) => {
      const flow = byCode.get(key)
      return flow ? projectOntoRoute(flow.d, point) : undefined
    },

    offsetFor: (key: string, point: Point): Offset | undefined => {
      if (byCode.has(key)) return undefined

      const card = register.cardAt(key)
      if (!card) return undefined
      // An adapter has no position of its own - it has the position of the card
      // it clasps - so a drag on one records nothing and the card is what moves.
      // Refusing here is how the diagram states a constraint the editor should
      // not have to know about.
      if (card.wraps) return undefined
      const box = originOf(card)
      if (!box) return undefined
      const centre = boxCentreOf(box)
      return { dx: Math.round(point.x - centre.x), dy: Math.round(point.y - centre.y) }
    },

    portCountsFor: (key: string) => {
      const service = placeables(visibleScopes).find((candidate) => candidate.code === key)
      if (!service) return undefined
      const derived = portsForBox(service.box, service.ports)
      const count = (side: string) => derived.filter((port) => port.id.startsWith(side)).length
      return { east: count('E'), north: count('N'), south: count('S'), west: count('W') }
    },

    describe: (key: string, offset: Offset): Change | undefined => {
      const card = register.cardAt(key)
      if (!card) return undefined
      const box = originOf(card)
      if (!box) return undefined
      return { key, kind: 'component', offset, source: `${key}  ->  card(${box.x + offset.dx}, ${box.y + offset.dy}),` }
    },

    // A moved component takes its routes with it on screen, so the change set
    // has to hand those routes back too - otherwise pasting a move leaves every
    // line that met the component still meeting where it used to be.
    /*
     * The routes an edit has redrawn, whichever edit did it.
     *
     * This only followed component moves, so re-attaching an end handed back
     * the port it now names and never the line that reaches it - and pasting
     * that gave a name and a coordinate describing different places. An
     * attachment moves geometry exactly as a move does, so it is asked the same
     * question: is this route still the one the model has?
     */
    derived: (): readonly Change[] => {
      if (drafts.size === 0 && attachments.size === 0) return []
      const after = model.flowsAfterAttachments(model.flowsAfterMoves(flows, drafts), attachments, portAt)

      return after.flatMap((flow, index) => {
        if (flow === flows[index]) return []
        const list = flow.points.map((point) => `{ x: ${point.x}, y: ${point.y} }`).join(', ')
        return [
          {
            key: flow.code,
            kind: 'label' as const,
            offset: { dx: 0, dy: 0 },
            source: `${flow.code}  ->  points: [${list}],`,
          },
        ]
      })
    },

    /*
     * A card's name, subtitle and scope, or a line's family, as authored. The
     * panel shows these where nothing has been typed over them, so an untouched
     * field reads what the diagram reads.
     */
    identityOf: (key: string) => {
      const flow = byCode.get(key)
      if (flow) return { family: flow.family }

      const card = register.cardAt(key)
      if (!card) return undefined
      return { detail: card.detail, group: card.group, name: card.label }
    },

    placementFor: (key: string): Placement | undefined => {
      if (key.startsWith('port:')) {
        const [, code, portId] = key.split(':')
        const placeable = placeables(visibleScopes).find((candidate) => candidate.code === code)
        const port = placeable && portsForBox(boxFor(code, placeable.box), placeable.ports).find((p) => p.id === portId)
        if (!port) return undefined
        return {
          kind: 'port',
          label: 'Port',
          at: port.at,
          side: sideNames[portId[0]] ?? portId[0],
          number: Number(portId.slice(1)),
          used: usedPorts.has(`${placeable.id}:${portId}`),
        }
      }

      if (key.startsWith('waypoint:')) {
        const [, code, position] = key.split(':')
        const flow = byCode.get(code)
        const index = Number(position)
        const at = flow?.points[index]
        if (!at) return undefined
        return { kind: 'waypoint', label: 'Waypoint', at, flow: code, index }
      }

      if (key.startsWith('lane:')) {
        const lane = model.lanes.find((candidate) => candidate.id === key.slice('lane:'.length))
        if (!lane) return undefined
        // A lane spans the full panel width, so x and width are read against
        // the geography rather than typed - only its own vertical strip moves.
        return {
          kind: 'box',
          label: 'Lane',
          box: { x: lane.panel.x, y: lane.y, width: lane.panel.width, height: lane.height },
          editable: [],
        }
      }

      if (key.startsWith('zone:')) {
        const [, laneId, zoneId] = key.split(':')
        const lane = model.lanes.find((candidate) => candidate.id === laneId)
        const zone = lane?.zones.find((candidate) => candidate.id === zoneId)
        if (!lane || !zone) return undefined
        // A zone fills its lane's full height, so y and height come from the
        // lane it sits in rather than being its own.
        return {
          kind: 'box',
          label: 'Zone',
          box: { x: zone.x, y: lane.y, width: zone.width, height: lane.height },
          editable: [],
        }
      }

      const flow = byCode.get(key)
      if (flow) {
        return {
          kind: 'route',
          label: 'Flow',
          from: `${model.endpointCodes.get(flow.source) ?? flow.source}:${flow.sourcePort}`,
          to: `${model.endpointCodes.get(flow.target) ?? flow.target}:${flow.targetPort}`,
          points: flow.points.length,
        }
      }

      const service = placeables(visibleScopes).find((candidate) => candidate.code === key)
      if (!service) return undefined
      const box = boxFor(key, service.box)
      // A service card can be dragged; a fabric cannot yet, since resizing is
      // not built - the spec gap is stated in the empty editable list rather
      // than left to be inferred from what offsetFor happens to refuse.
      // Asked of the register by name. Scanning the service list said the same
      // thing by omission - a fabric is simply not in it - which reads as a
      // lookup that failed rather than a question that was answered.
      const card = register.cardAt(key)
      if (!card) return { kind: 'box', label: 'Fabric', box, editable: [] }
      // An adapter is placed by the card it clasps, so its own numbers are read
      // rather than typed: moving it means moving that card.
      return card.wraps
        ? { kind: 'box', label: 'Adapter', box, editable: [] }
        : { kind: 'box', label: 'Standard card', box, editable: ['x', 'y'] }
    },
  }
}
