import type { InfoschematicInput } from '@infoschematics/domain-model'
import { adapterBoundsFor } from './assembly.ts'
import { type Box, type Point, pointAlongRoute, routeLength, routePoints } from './geometry.ts'
import { createInfoschematicRuntime, type RuntimeFlow } from './runtime.ts'

/**
 * What is wrong with the drawing a definition describes, as findings a caller can act on.
 *
 * Validation answers whether a document is well formed. This answers whether the drawing it describes can be read: a
 * definition can satisfy every type in the schema and still put two Cards on top of each other, run a route back
 * across the Card it leaves, or push an element outside the view nobody can scroll to.
 *
 * The geometry lives here rather than in a command because View Model already owns every measurement involved —
 * `ADR-INFOSCHEMATICS-018` puts the calculation in the library and the thin caller in the outlet — so the interactive
 * Diagram, Studio, a build pipeline and an authoring agent read the same findings rather than three approximations of
 * them.
 *
 * A finding is written for a reader who has to change something. It carries a stable rule code, the authored
 * identities it concerns, the measurement that made it fire, and the repairs that are legal for that rule. A complaint
 * without a subject and a number is something an author learns to ignore, and something an agent cannot repair
 * against at all.
 */

/**
 * A rule code is a public contract from the moment anything depends on it: an agent's repair loop, a pipeline's
 * allowlist and Studio's own messages all key off these strings, so a rename is a breaking change and belongs in
 * `docs/specs/diagnostics.md` before it happens here.
 */
export type DrawingRuleCode =
  | 'artefact-outside-view'
  | 'artefacts-overlap'
  | 'flow-label-obstructed'
  | 'flow-label-off-route'
  | 'port-collision'
  | 'route-crosses-artefact'
  | 'route-re-enters-endpoint'

/**
 * An error says the drawing cannot be read as authored; an observation says it is tight or unusual and leaves the
 * judgement with the author.
 *
 * The distinction is the difference between a checker an author uses and one they silence: a document that is merely
 * cramped is not a document that is wrong, and a gate that refuses both teaches people to skip it.
 */
export type DrawingSeverity = 'error' | 'observation'

export type DrawingFinding = Readonly<{
  /** The authored identities this concerns, in the order the rule names them. */
  concerns: readonly string[]
  /** What the rule measured, in diagram units, so a caller can rank findings without re-deriving the geometry. */
  measured: Readonly<Record<string, number>>
  /** One sentence naming the subject and the measurement, for a person reading a terminal. */
  reads: string
  /** The changes that would legally clear this finding; never applied here, because a checker never moves anything. */
  repairs: readonly string[]
  rule: DrawingRuleCode
  severity: DrawingSeverity
}>

const severityOf: Readonly<Record<DrawingRuleCode, DrawingSeverity>> = {
  'artefact-outside-view': 'error',
  'artefacts-overlap': 'error',
  'flow-label-obstructed': 'observation',
  'flow-label-off-route': 'observation',
  'port-collision': 'error',
  'route-crosses-artefact': 'error',
  'route-re-enters-endpoint': 'error'
}

const round = (value: number) => Math.round(value * 100) / 100

const overlap = (left: Box, right: Box) => {
  const width = Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x)
  const height = Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y)
  return width > 0 && height > 0 ? { area: width * height, height, width } : undefined
}

const contains = (outer: Box, inner: Box) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height

const holds = (box: Box, at: Point) =>
  at.x >= box.x && at.x <= box.x + box.width && at.y >= box.y && at.y <= box.y + box.height

/**
 * A route is drawn to a port on the perimeter, so its first and last points sit exactly on the boundary of the boxes
 * it joins. Every box is therefore shrunk before a crossing is measured: without the margin, every well-drawn Flow in
 * every document would report that it touches both endpoints it was routed to.
 */
const perimeterTolerance = 1

const shrunk = (box: Box): Box => ({
  height: Math.max(0, box.height - perimeterTolerance * 2),
  width: Math.max(0, box.width - perimeterTolerance * 2),
  x: box.x + perimeterTolerance,
  y: box.y + perimeterTolerance
})

/** Whether an axis-aligned segment passes through a box, measured at its ends and across its span. */
const segmentEnters = (box: Box, from: Point, to: Point) => {
  if (holds(box, from) || holds(box, to)) return true
  const horizontal = Math.abs(from.y - to.y) < Math.abs(from.x - to.x)
  if (horizontal) {
    const spans = Math.min(from.x, to.x) < box.x && Math.max(from.x, to.x) > box.x + box.width
    return spans && from.y > box.y && from.y < box.y + box.height
  }
  const spans = Math.min(from.y, to.y) < box.y && Math.max(from.y, to.y) > box.y + box.height
  return spans && from.x > box.x && from.x < box.x + box.width
}

const crossings = (box: Box, points: readonly Point[]) => {
  let count = 0
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]
    const to = points[index]
    if (from && to && segmentEnters(box, from, to)) count += 1
  }
  return count
}

type DrawnArtefact = Readonly<{ box: Box; code: string; holding?: string; kind: string }>

const found = (
  rule: DrawingRuleCode,
  concerns: readonly string[],
  measured: Readonly<Record<string, number>>,
  reads: string,
  repairs: readonly string[]
): DrawingFinding => ({ concerns, measured, reads, repairs, rule, severity: severityOf[rule] })

type Runtime = ReturnType<typeof createInfoschematicRuntime>

const drawnArtefactsOf = (runtime: Runtime): readonly DrawnArtefact[] => {
  const cardBoxes = new Map(runtime.infoschematicCards.map((card) => [card.code, card.bounds]))
  return [
    ...runtime.infoschematicCards.map((card) => {
      const held = card.wraps ? cardBoxes.get(card.wraps) : undefined
      return {
        box: held ? adapterBoundsFor(held) : card.bounds,
        code: card.code,
        kind: held ? 'Adapter' : 'Card',
        ...(card.wraps ? { holding: card.wraps } : {})
      }
    }),
    ...runtime.infoschematicFabrics.map((fabric) => ({ box: fabric.bounds, code: fabric.code, kind: 'Fabric' }))
  ]
}

/**
 * Two artefacts drawn on top of each other.
 *
 * An Adapter and the Card it holds are exempt because overlapping is what an Adapter is — `ADR-INFOSCHEMATICS-036`
 * makes it a grip on the thing it holds rather than a box with a position of its own. A Fabric is exempt as a place:
 * a Card drawn on a Fabric is an element sitting in the medium it uses, which is the Fabric's whole purpose.
 */
const overlapFindings = (artefacts: readonly DrawnArtefact[]): readonly DrawingFinding[] => {
  const findings: DrawingFinding[] = []
  for (let left = 0; left < artefacts.length; left += 1) {
    for (let right = left + 1; right < artefacts.length; right += 1) {
      const one = artefacts[left]
      const other = artefacts[right]
      if (!one || !other) continue
      if (one.kind === 'Fabric' || other.kind === 'Fabric') continue
      if (one.holding === other.code || other.holding === one.code) continue
      const shared = overlap(one.box, other.box)
      if (!shared) continue
      findings.push(
        found(
          'artefacts-overlap',
          [one.code, other.code],
          { area: round(shared.area), height: round(shared.height), width: round(shared.width) },
          `${one.kind} ${one.code} and ${other.kind} ${other.code} overlap by ${round(shared.width)} by ${round(shared.height)} units.`,
          [
            `Move ${one.code} or ${other.code} so their boxes do not intersect.`,
            'Make one of the two boxes smaller.',
            'Author an Adapter, if one of the two really does hold the other.'
          ]
        )
      )
    }
  }
  return findings
}

/** An artefact outside the authored view is drawn where nobody can reach it: the view is the whole drawing. */
const outsideViewFindings = (
  viewBox: Box,
  artefacts: readonly DrawnArtefact[],
  points: readonly Readonly<{ at: Point; id: string }>[]
): readonly DrawingFinding[] => [
  ...artefacts
    .filter((artefact) => !contains(viewBox, artefact.box))
    .map((artefact) =>
      found(
        'artefact-outside-view',
        [artefact.code],
        {
          height: round(artefact.box.height),
          width: round(artefact.box.width),
          x: round(artefact.box.x),
          y: round(artefact.box.y)
        },
        `${artefact.kind} ${artefact.code} is not inside the authored view, so part of it is never drawn.`,
        [
          `Move ${artefact.code} inside the view.`,
          'Widen the authored view to contain it.',
          'Remove it if it is no longer part of the drawing.'
        ]
      )
    ),
  ...points
    .filter((point) => !holds(viewBox, point.at))
    .map((point) =>
      found(
        'artefact-outside-view',
        [point.id],
        { x: round(point.at.x), y: round(point.at.y) },
        `Point ${point.id} is outside the authored view, so it is never drawn.`,
        [`Move ${point.id} inside the view.`, 'Widen the authored view to contain it.']
      )
    )
]

/**
 * A route that comes back across the box it started from, or cuts through the box it arrives at.
 *
 * This is the failure `INFOSCHEMATICS-TOOL-111` was raised for: the drawing stays valid and reads as though the Flow
 * passes through its own endpoint, which is the one thing a reader is certain it does not do.
 */
const endpointCrossingFindings = (
  flows: readonly RuntimeFlow[],
  boxes: ReadonlyMap<string, Box>
): readonly DrawingFinding[] =>
  flows.flatMap((flow) => {
    const points = routePoints(flow.d)
    return (['source', 'target'] as const).flatMap((terminal) => {
      const endpoint = flow[terminal]
      const box = boxes.get(endpoint)
      if (!box) return []
      const count = crossings(shrunk(box), points)
      if (count === 0) return []
      return [
        found(
          'route-re-enters-endpoint',
          [flow.code, endpoint],
          { crossings: count },
          `Flow ${flow.code} runs across its ${terminal} ${endpoint} rather than clear of it.`,
          [
            `Route ${flow.code} from a port on the side facing its ${terminal === 'source' ? 'target' : 'source'}.`,
            `Add a waypoint that takes ${flow.code} clear of ${endpoint} before it turns.`,
            `Move ${endpoint} so the direct route does not pass through it.`
          ]
        )
      ]
    })
  })

/** A route drawn through an artefact it has nothing to do with reads as a connection nobody authored. */
const artefactCrossingFindings = (
  flows: readonly RuntimeFlow[],
  artefacts: readonly DrawnArtefact[]
): readonly DrawingFinding[] =>
  flows.flatMap((flow) => {
    const points = routePoints(flow.d)
    return artefacts.flatMap((artefact) => {
      if (artefact.kind === 'Fabric') return []
      if (artefact.code === flow.source || artefact.code === flow.target) return []
      if (artefact.holding === flow.source || artefact.holding === flow.target) return []
      const count = crossings(shrunk(artefact.box), points)
      if (count === 0) return []
      return [
        found(
          'route-crosses-artefact',
          [flow.code, artefact.code],
          { crossings: count },
          `Flow ${flow.code} is drawn through ${artefact.kind} ${artefact.code}, which it neither leaves nor reaches.`,
          [
            `Add a waypoint that takes ${flow.code} around ${artefact.code}.`,
            `Move ${artefact.code} clear of the route.`,
            `Choose ports for ${flow.code} on the sides that face each other.`
          ]
        )
      ]
    })
  })

/**
 * A Flow's label sitting on an artefact is unreadable wherever the text itself ends up.
 *
 * `along` is a fraction of the route's length, which is what `placeLabels` resolves it as and therefore what both
 * renderers draw. This read it as an absolute distance until `INFOSCHEMATICS-TOOL-120`, so it measured a point the
 * reader never sees - for a route 200 units long, `0.5` was checked half a unit from the source port rather than at
 * the midpoint. The checker has to resolve an authored value exactly as the drawing does, or it is answering about a
 * different drawing.
 */
const flowLabelFindings = (
  flows: readonly RuntimeFlow[],
  artefacts: readonly DrawnArtefact[]
): readonly DrawingFinding[] =>
  flows.flatMap((flow) => {
    const along = flow.label?.along
    if (along === undefined) return []
    const at = pointAlongRoute(flow.d, along * routeLength(flow.d))
    return artefacts.flatMap((artefact) => {
      if (artefact.kind === 'Fabric') return []
      if (!holds(shrunk(artefact.box), at)) return []
      return [
        found(
          'flow-label-obstructed',
          [flow.code, artefact.code],
          { along: round(along), x: round(at.x), y: round(at.y) },
          `Flow ${flow.code}'s label falls on ${artefact.kind} ${artefact.code}.`,
          [
            `Move ${flow.code}'s label along its route.`,
            `Route ${flow.code} clear of ${artefact.code}.`,
            'Drop the label if the Flow reads without it.'
          ]
        )
      ]
    })
  })

/**
 * A label position that is not a position on the route.
 *
 * `labelAt` is a fraction, so anything outside `0`-`1` is clamped to an end and the label is drawn against a port
 * rather than where it was authored. This exists because the unit invites exactly one mistake: `labelAt` is named
 * after a position, so an author reaches for a distance in diagram units, writes `180`, and gets a drawing that
 * still reads - the label is near a line end rather than absent, which is why the confusion survived four published
 * documents and a checker. An observation rather than an error: the drawing can be read, but not as authored.
 */
const flowLabelRangeFindings = (flows: readonly RuntimeFlow[]): readonly DrawingFinding[] =>
  flows.flatMap((flow) => {
    const along = flow.label?.along
    if (along === undefined || (along >= 0 && along <= 1)) return []
    const length = routeLength(flow.d)
    return [
      found(
        'flow-label-off-route',
        [flow.code],
        { along: round(along), length: round(length), suggested: round(Math.min(Math.max(along / length, 0), 1)) },
        `Flow ${flow.code}'s label is placed at ${round(along)} along a route measured in fractions, so it is drawn at its ${along < 0 ? 'source' : 'target'}.`,
        [
          `Give ${flow.code} a labelAt between 0 and 1.`,
          `Divide a distance in diagram units by the route's length of ${round(length)}.`,
          'Drop labelAt to have the label placed automatically.'
        ]
      )
    ]
  })

/**
 * Two Flows meeting an endpoint at the same place.
 *
 * `auditPorts` is the measurement, so the interactive Diagram's port audit and this checker agree by construction
 * rather than by two approximations of the same rule. Only its `collision` severity is reported here, and the reason
 * is what a document can express: a route's endpoint is derived from the port it names, and `portOffsetsForSide`
 * snaps every offer to a multiple of `minimumPortGap` and refuses a count that repeats one, so two distinct ports on
 * one side are never closer than that gap. `crowded` and `misassigned` therefore describe a route whose endpoint has
 * been moved away from the port it names, which only an editing host produces; Studio's own audit owns them, and
 * claiming them here would be a rule that can never fire.
 */
const portFindings = (runtime: Runtime): readonly DrawingFinding[] => {
  const { findings } = runtime.infoschematicPortAudit(runtime.infoschematicFlows)
  return findings
    .filter((entry) => entry.severity === 'collision')
    .map((entry) =>
      found(
        'port-collision',
        [entry.endpoint, entry.left.flow, entry.right.flow],
        { distance: round(entry.distance) },
        `Flows ${entry.left.flow} and ${entry.right.flow} both meet ${entry.endpoint} at port ${entry.left.port}.`,
        [
          `Give ${entry.left.flow} or ${entry.right.flow} a different port on ${entry.endpoint}.`,
          `Offer ${entry.endpoint} more ports on that side so the two have room.`,
          `Enlarge ${entry.endpoint} so its ports spread further apart.`
        ]
      )
    )
}

const order = (finding: DrawingFinding) => [finding.rule, ...finding.concerns].join('\t')

/**
 * Review the drawing a definition describes and report what is wrong with it, in a deterministic order.
 *
 * Nothing is moved and nothing is written: a finding says what would make the drawing readable and leaves the choice
 * to whoever is authoring it, which is what keeps this a checker rather than the automatic layout the product
 * deliberately does not have.
 */
export const reviewInfoschematicDrawing = (input: InfoschematicInput): readonly DrawingFinding[] => {
  const runtime = createInfoschematicRuntime(input)
  const artefacts = drawnArtefactsOf(runtime)
  const boxes = new Map(artefacts.map((artefact) => [artefact.code, artefact.box]))
  const flows = runtime.infoschematicFlows
  const points = runtime.infoschematicPoints.map((point) => ({ at: point.at, id: point.id }))
  return [
    ...overlapFindings(artefacts),
    ...outsideViewFindings(runtime.infoschematicViewBox, artefacts, points),
    ...endpointCrossingFindings(flows, boxes),
    ...artefactCrossingFindings(flows, artefacts),
    ...flowLabelFindings(flows, artefacts),
    ...flowLabelRangeFindings(flows),
    ...portFindings(runtime)
  ].sort((one, other) => order(one).localeCompare(order(other)))
}

/** Whether findings should fail a gate: an error always does, an observation never does. */
export const drawingIsUnreadable = (findings: readonly DrawingFinding[]) =>
  findings.some((entry) => entry.severity === 'error')
