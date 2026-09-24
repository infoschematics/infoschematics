import { defineInfoschematicModel, infoschematicModelOf } from '@infoschematics/domain-core'
import type { DefinedInfoschematic, DocumentPromise, InfoschematicInput } from '@infoschematics/domain-model'
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
 * `ADR-INFOSCHEMATICS-017` puts the calculation in the library and the thin caller in the outlet — so the interactive
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

/** How much of two boxes is drawn in the same place, in diagram units. */
export type MeasuredOverlap = Readonly<{ area: number; height: number; width: number }>

/**
 * How much two boxes share, or nothing when they only touch or miss.
 *
 * This measures; it does not judge. The distinction is why it is exported rather than left module-private:
 * `artefacts-overlap` below is a *rule*, and a rule carries a judgement about when a drawing has become unreadable —
 * it deliberately excuses an Adapter over the Card it clasps and anything at all over a Fabric, because those are what
 * an Adapter and a Fabric are for. A creation surface asking "is there room for a new box here?" wants the opposite
 * conclusion from the same number: a new Card dropped onto the Message bus Fabric is precisely the case the rule
 * excuses and a placement search must not, because the Producer's first gesture would be to drag it back off.
 *
 * `ADR-INFOSCHEMATICS-036` says a checker measures and never repairs, and `ADR-INFOSCHEMATICS-042` reads that as
 * authority over the document rather than custody of geometry: asking how far two boxes intersect is not asking the
 * checker to move either of them. So the measurement is shared and the rule is not, and the alternative — a second
 * copy of this arithmetic inside an editor — is the silent drift `AGENTS.md` warns about.
 */
export const measuredOverlap = (left: Box, right: Box): MeasuredOverlap | undefined => {
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
 * An Adapter and the Card it holds are exempt because overlapping is what an Adapter is — `ADR-INFOSCHEMATICS-032`
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
      const shared = measuredOverlap(one.box, other.box)
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

/**
 * What the document promised about its own meaning, and whether it still holds.
 *
 * Everything above measures a drawing. This measures a claim: the author states where a reading may begin, where it
 * must end, which relationship must exist and which run of Flows must stay traceable, and an edit made months later
 * either keeps that or does not. Nothing here is geometry — the same boxes in the same places break a promise or keep
 * it depending only on what was declared — so none of it consults a bound, a route or a port.
 */

/**
 * A promise rule code is a sibling contract to `DrawingRuleCode` rather than a member of it.
 *
 * `DrawingRuleCode` is a public contract about a *drawing*, and the doc comment above says so: every code in it is a
 * measurement of geometry, and a pipeline allowlisting `artefacts-overlap` is saying something about layout. Folding
 * these codes into that union would quietly widen what the older name means for everything already keying off it. The
 * two unions share the finding shape instead, which is what makes a broken promise read like a geometric finding
 * without pretending to be one.
 */
export type PromiseRuleCode =
  | 'promise-origin-not-allowed'
  | 'promise-path-broken'
  | 'promise-relationship-missing'
  | 'promise-terminus-not-allowed'

/**
 * A broken promise carries the shape of a drawing finding, and only one severity.
 *
 * `DrawingSeverity` splits because a geometric finding is the checker's own judgement about a drawing and an author may
 * reasonably disagree: a cramped document is not a wrong one. A promise is the author's own assertion about the
 * document's meaning, so there is nobody left to disagree with — breaking one is unambiguously wrong, and an
 * observation that let it pass would make declaring anything decorative.
 */
export type PromiseFinding = Readonly<{
  /** The promise, then the authored identities that broke it, in the order the rule names them. */
  concerns: readonly string[]
  /** What the rule counted, so a caller can rank findings without re-deriving the graph. */
  measured: Readonly<Record<string, number>>
  /** One sentence naming the promise and what broke it, for a person reading a terminal. */
  reads: string
  /** The changes that would legally clear this finding, one of which is always withdrawing the promise. */
  repairs: readonly string[]
  rule: PromiseRuleCode
  severity: Extract<DrawingSeverity, 'error'>
}>

const promised = (
  rule: PromiseRuleCode,
  concerns: readonly string[],
  measured: Readonly<Record<string, number>>,
  reads: string,
  repairs: readonly string[]
): PromiseFinding => ({ concerns, measured, reads, repairs, rule, severity: 'error' })

/** One direction a Flow can be read in. A bidirectional Flow contributes both, because a reader may follow either. */
type FlowEdge = Readonly<{ from: string; to: string }>

/**
 * Every artefact a reading reaches from `starts`, following Flows in the direction they are drawn.
 *
 * Breadth-first over an explicit queue rather than recursion, because a document is free to describe a cycle and a
 * naive walk would never come back out of one. This is the traversal the repository did not have: `routing.ts`
 * computes the polyline a Flow is drawn along and answers nothing about what reaches what.
 */
const reachedFrom = (edges: readonly FlowEdge[], starts: readonly string[]): ReadonlySet<string> => {
  const leaving = new Map<string, string[]>()
  for (const edge of edges) leaving.set(edge.from, [...(leaving.get(edge.from) ?? []), edge.to])
  const reached = new Set(starts)
  const queue = [...reached]
  for (let index = 0; index < queue.length; index += 1) {
    const node = queue[index]
    for (const next of (node === undefined ? undefined : leaving.get(node)) ?? []) {
      if (reached.has(next)) continue
      reached.add(next)
      queue.push(next)
    }
  }
  return reached
}

type PromiseGraph = Readonly<{
  /** Every artefact a Flow can meet, in authored order, so findings come out in a stable sequence. */
  artefacts: readonly string[]
  arriving: ReadonlyMap<string, number>
  edges: readonly FlowEdge[]
  /** What an authored end stands for: a code for itself, a Scope for the artefacts it covers. */
  endsOf: (ends: readonly string[]) => readonly string[]
  leaving: ReadonlyMap<string, number>
}>

const tallied = (values: readonly string[]): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return counts
}

const promiseGraphOf = (model: DefinedInfoschematic): PromiseGraph => {
  const artefacts = [...model.diagram.cards, ...model.diagram.fabrics, ...model.diagram.points].map(
    (element) => element.id
  )
  const known = new Set(artefacts)
  const edges = model.diagram.flows.flatMap((flow): readonly FlowEdge[] => {
    const forward = { from: flow.source.element, to: flow.target.element }
    return flow.direction === 'bidirectional'
      ? [forward, { from: flow.target.element, to: flow.source.element }]
      : [forward]
  })
  const covers = new Map(model.scopes.map((scope) => [scope.id, scope.elements.filter((id) => known.has(id))]))
  return {
    arriving: tallied(edges.map((edge) => edge.to)),
    artefacts,
    edges,
    /*
     * A Scope may also cover a Region or an Overlay, and no reading is ever traced through one, so only the artefacts
     * survive. Domain Core has already refused an end that names neither an artefact nor a Scope, which is why an
     * unresolved name cannot reach here as a silently empty set.
     */
    endsOf: (ends) => [...new Set(ends.flatMap((end) => covers.get(end) ?? [end]))],
    leaving: tallied(edges.map((edge) => edge.from))
  }
}

/** An artefact a Flow leaves and none arrives at begins a reading; one no Flow touches at all begins nothing. */
const originFindings = (
  promise: Extract<DocumentPromise, { kind: 'origin' }>,
  graph: PromiseGraph
): readonly PromiseFinding[] => {
  const allowed = new Set(graph.endsOf(promise.allowed))
  return graph.artefacts
    .filter((code) => (graph.leaving.get(code) ?? 0) > 0 && (graph.arriving.get(code) ?? 0) === 0 && !allowed.has(code))
    .map((code) =>
      promised(
        'promise-origin-not-allowed',
        [promise.id, code],
        { allowed: allowed.size, leaving: graph.leaving.get(code) ?? 0 },
        `Promise ${promise.id} allows a reading to begin at ${allowed.size} artefacts, and ${code} begins one with ${graph.leaving.get(code) ?? 0} Flow leaving it and none arriving.`,
        [
          `Draw a Flow arriving at ${code}, so it no longer begins a reading.`,
          `Name ${code}, or a Scope covering it, among the origins ${promise.id} allows.`,
          `Withdraw promise ${promise.id} if the document no longer means it.`
        ]
      )
    )
}

/** An artefact a Flow arrives at and none leaves ends a reading. */
const terminusFindings = (
  promise: Extract<DocumentPromise, { kind: 'terminus' }>,
  graph: PromiseGraph
): readonly PromiseFinding[] => {
  const allowed = new Set(graph.endsOf(promise.allowed))
  return graph.artefacts
    .filter((code) => (graph.arriving.get(code) ?? 0) > 0 && (graph.leaving.get(code) ?? 0) === 0 && !allowed.has(code))
    .map((code) =>
      promised(
        'promise-terminus-not-allowed',
        [promise.id, code],
        { allowed: allowed.size, arriving: graph.arriving.get(code) ?? 0 },
        `Promise ${promise.id} allows a reading to end at ${allowed.size} artefacts, and ${code} ends one with ${graph.arriving.get(code) ?? 0} Flow arriving at it and none leaving.`,
        [
          `Draw a Flow leaving ${code}, so it no longer ends a reading.`,
          `Name ${code}, or a Scope covering it, among the terminals ${promise.id} allows.`,
          `Withdraw promise ${promise.id} if the document no longer means it.`
        ]
      )
    )
}

/**
 * A required relationship is one Flow running directly between the two ends.
 *
 * A Flow found running the other way is counted and reported, because reversing an endpoint is the single most likely
 * way this breaks and a finding that said only `0` would leave the author looking for a Flow that is already there.
 */
const relationshipFindings = (
  promise: Extract<DocumentPromise, { kind: 'relationship' }>,
  graph: PromiseGraph
): readonly PromiseFinding[] => {
  const from = new Set(graph.endsOf(promise.from))
  const to = new Set(graph.endsOf(promise.to))
  if (graph.edges.some((edge) => from.has(edge.from) && to.has(edge.to))) return []
  const reversed = graph.edges.filter((edge) => to.has(edge.from) && from.has(edge.to)).length
  return [
    promised(
      'promise-relationship-missing',
      [promise.id, ...promise.from, ...promise.to],
      { ends: to.size, reversed, starts: from.size },
      `Promise ${promise.id} requires a Flow from ${promise.from.join(' or ')} to ${promise.to.join(' or ')}, and the document draws none${reversed > 0 ? `, though ${reversed} runs the other way` : ''}.`,
      [
        `Draw a Flow from ${promise.from.join(' or ')} to ${promise.to.join(' or ')}.`,
        `Turn a Flow already drawn between them the way ${promise.id} reads.`,
        `Withdraw promise ${promise.id} if the document no longer means it.`
      ]
    )
  ]
}

/** A required path is any run of Flows, of any length, that a reader can still follow from one end to the other. */
const pathFindings = (
  promise: Extract<DocumentPromise, { kind: 'path' }>,
  graph: PromiseGraph
): readonly PromiseFinding[] => {
  const from = graph.endsOf(promise.from)
  const to = graph.endsOf(promise.to)
  const reached = reachedFrom(graph.edges, from)
  if (to.some((code) => reached.has(code))) return []
  return [
    promised(
      'promise-path-broken',
      [promise.id, ...promise.from, ...promise.to],
      { ends: to.length, reached: reached.size, starts: from.length },
      `Promise ${promise.id} requires a path from ${promise.from.join(' or ')} to ${promise.to.join(' or ')}, and following every Flow from ${from.length} starting artefacts reaches ${reached.size} artefacts without reaching any of the ${to.length} it must.`,
      [
        `Restore the Flow the path was traced through, so ${promise.to.join(' or ')} is reachable again.`,
        `Draw another run of Flows from ${promise.from.join(' or ')} to ${promise.to.join(' or ')}.`,
        `Withdraw promise ${promise.id} if the document no longer means it.`
      ]
    )
  ]
}

/**
 * Review what a definition promises about its own meaning and report every promise it no longer keeps.
 *
 * A document that promises nothing returns an empty list, which is not a special case here: there is nothing to walk.
 * Like the drawing review, nothing is moved and nothing is written — the finding says what would restore the reading
 * and leaves the choice, including withdrawing the promise, to whoever is authoring it.
 */
export const reviewInfoschematicPromises = (input: InfoschematicInput): readonly PromiseFinding[] => {
  const model = defineInfoschematicModel('infoschematic' in input ? infoschematicModelOf(input) : input)
  const graph = promiseGraphOf(model)
  return model.promises
    .flatMap((promise): readonly PromiseFinding[] => {
      if (promise.kind === 'origin') return originFindings(promise, graph)
      if (promise.kind === 'terminus') return terminusFindings(promise, graph)
      if (promise.kind === 'relationship') return relationshipFindings(promise, graph)
      return pathFindings(promise, graph)
    })
    .sort((one, other) => promiseOrder(one).localeCompare(promiseOrder(other)))
}

const promiseOrder = (finding: PromiseFinding) => [finding.rule, ...finding.concerns].join('\t')

/** Whether findings should fail a gate. Every broken promise does, because the author is the one who declared it. */
export const promisesAreBroken = (findings: readonly PromiseFinding[]) => findings.length > 0
