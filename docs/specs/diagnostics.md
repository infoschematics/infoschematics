# Drawing diagnostics — DRAW

What a valid document still gets wrong about the drawing it describes, reported so a person or an agent can repair one thing at a time. Part of the [Specifications corpus](index.md).

Validation answers whether a document is well formed; this answers whether the drawing it describes can be read. Both are needed, and neither substitutes for the other: a document can satisfy every type in the schema and still draw two [Cards](../reference/vocabulary.md#standard-card) on top of each other.

## User-observable behaviours

### DRAW-001 — Review without alteration

Reviewing an [Infoschematic](../reference/vocabulary.md#infoschematic) MUST report findings about the drawing it describes and MUST NOT change the document, move anything, or choose a repair. The geometry MUST be calculated in View Model, per [ADR-INFOSCHEMATICS-017](../decisions/ADR-INFOSCHEMATICS-017-the-renderer-command-is-thin-and-its-input-is-inert.md), so the interactive Diagram, Studio, the command and an authoring agent read one list rather than three approximations of it. Reviewing the same document twice MUST give the same answer, and a review MUST NOT depend on a clock, a viewport, or a host.

_Conformance:_ conforming

_Verify:_ review one document twice through `reviewInfoschematicDrawing`, compare the two lists, and confirm the model is unchanged — then look for a second implementation of any rule outside View Model, which is the failure this requirement exists to prevent.

_Evidence:_ `packages/view-model/src/diagnostics.ts` and `packages/view-model/src/diagnostics.test.ts`.

### DRAW-002 — A finding a reader can act on

Every finding MUST carry a stable rule code, the authored identities it concerns in the order the rule names them, the measurement that made it fire in diagram units, one sentence naming subject and measurement, the repairs that would legally clear it, and its severity. Rule codes are append-only public contract: renaming one is a breaking change and MUST be recorded here before it is made.

_Conformance:_ conforming

_Verify:_ assert the fields of a known finding against a document broken on purpose, and read one finding's sentence out loud — a complaint with no subject and no number is one an author learns to ignore.

_Evidence:_ `packages/view-model/src/diagnostics.test.ts`, which asserts code, identities and measurement for every rule rather than a count.

### DRAW-003 — Deterministic order

Findings MUST be ordered by rule code and then by the identities they concern, so two callers rank one document the same way and a repair loop sees a repaired finding leave the list rather than the list reshuffle around it.

_Conformance:_ conforming

_Verify:_ review a document carrying several findings of different rules, and compare the emitted order with the sorted rule-and-subject sequence.

_Evidence:_ `packages/view-model/src/diagnostics.test.ts`.

### DRAW-004 — Severity and what it gates

An error MUST mean the drawing cannot be read as authored; an observation MUST mean it is tight or unusual and leave the judgement with the author. Only an error MUST fail a gate. A document whose findings are all observations MUST pass.

_Conformance:_ conforming

_Verify:_ gate a document whose only finding is an observation and confirm it passes, then gate one carrying an error and confirm it does not.

_Evidence:_ `drawingIsUnreadable` in `packages/view-model/src/diagnostics.ts`, exercised in `packages/view-model/src/diagnostics.test.ts` and through the command in `packages/cli/src/index.test.ts`.

### DRAW-005 — `artefacts-overlap`

Two [artefacts](../reference/vocabulary.md#infoschematic-artefact) whose boxes intersect MUST be reported as an error, measured by the width, height and area they share. An [Adapter](../reference/vocabulary.md#adapter-card) and the Card it holds MUST be exempt, because overlapping is what an Adapter is per [ADR-INFOSCHEMATICS-032](../decisions/ADR-INFOSCHEMATICS-032-an-adapter-card-is-positioned-by-what-it-holds.md), and a [Fabric](../reference/vocabulary.md#fabric) MUST be exempt as a place rather than a neighbour.

_Conformance:_ conforming

_Verify:_ overlap two Cards and read the reported extent, then author a correct Adapter and a Card on a Fabric and confirm neither is reported.

_Evidence:_ `packages/view-model/src/diagnostics.test.ts`, whose cases include the Adapter exemption.

### DRAW-006 — `artefact-outside-view`

An artefact whose box is not wholly inside the authored view, or a [Point](../reference/vocabulary.md#point) outside it, MUST be reported as an error carrying its position and size. The view is the whole drawing: there is nothing to scroll to.

_Conformance:_ conforming

_Verify:_ move one artefact outside the authored bounds and confirm the finding names it and reports where it went; repeat with a Point.

_Evidence:_ `packages/view-model/src/diagnostics.test.ts` and `scripts/example-drawings.test.ts`.

### DRAW-007 — `route-re-enters-endpoint`

A [Flow](../reference/vocabulary.md#flow) whose [route](../reference/vocabulary.md#route) runs back across the artefact it leaves, or cuts through the one it arrives at, MUST be reported as an error counting the crossings. Boxes are shrunk by one unit before crossings are measured, because a route meets a [port](../reference/vocabulary.md#port) on the perimeter and every correctly drawn Flow touches both endpoints it was routed to.

_Conformance:_ conforming

_Verify:_ author [waypoints](../reference/vocabulary.md#waypoint) that take a Flow back over its own source and confirm the count, then review every published document and confirm no correctly drawn Flow is reported.

_Evidence:_ `packages/view-model/src/diagnostics.test.ts` and `scripts/example-drawings.test.ts`.

### DRAW-008 — `route-crosses-artefact`

A Flow drawn through an artefact it neither leaves nor reaches MUST be reported as an error counting the crossings, because it reads as a connection nobody authored. The Flow's own source and target MUST be excluded, as MUST an Adapter holding either of them, and a Fabric MUST be excluded because a route across a Fabric is a route across the medium it uses.

_Conformance:_ conforming

_Verify:_ place a third Card in a route's way and confirm the finding names both; then confirm a route over a Fabric and a route past its own Adapter are not reported.

_Evidence:_ `packages/view-model/src/diagnostics.test.ts` and `scripts/example-drawings.test.ts`.

### DRAW-009 — `flow-label-obstructed`

A Flow label whose anchor falls on an artefact MUST be reported as an observation carrying the authored share of route length and the position it resolved to. That anchor MUST be the position the renderers draw, resolved from the share as `ROUTE-013` requires; a rule that resolves it in another unit measures a point the reader never sees. It is an observation because the drawing is still readable — the label is not — and the label's position is the one thing an author can move without changing the drawing.

_Conformance:_ conforming

_Verify:_ pin a label at a share that lands it on a Card and read the reported position; confirm it is the midpoint of the route rather than a fraction of a unit from its source, and that the severity does not fail a gate.

_Evidence:_ `packages/view-model/src/diagnostics.test.ts` and `packages/cli/src/index.test.ts`.

### DRAW-010 — `port-collision`

Two Flows meeting one endpoint at the same port MUST be reported as an error, measured as the distance between the two arrival points. The measurement MUST come from the same audit the interactive Diagram uses, so the two cannot drift apart.

Port spacing beyond collision MUST NOT be reported from a document. A route's endpoint is derived from the port it names, and a side offers only ports it has room for at the minimum gap, so two distinct authored ports are never closer than that gap: the `crowded` and `misassigned` severities describe a route whose endpoint has been moved away from the port it names, which only an editing host produces, and they remain Studio's live audit rather than a document rule that could never fire.

_Conformance:_ conforming

_Verify:_ point two Flows at one port and confirm the reported distance is zero; then read `portOffsetsForSide` and confirm no authored pair of distinct ports on one side can fall inside `minimumPortGap`.

_Evidence:_ `auditPorts` and `minimumPortGap` in `packages/view-model/src/ports.ts`, reported through `packages/view-model/src/diagnostics.ts` and exercised in `packages/view-model/src/diagnostics.test.ts`.

### DRAW-011 — Findings a caller can consume either way

A caller MUST be able to read findings as prose naming subject, measurement and repairs, or as machine-readable data carrying the same fields, and the two MUST describe the same review of the same document. An unresolved review MUST be reported as what it is rather than presented as a clean result.

_Conformance:_ conforming

_Verify:_ check one broken document both ways and compare what each form says about it, then confirm the prose form names every finding the data form carries.

_Evidence:_ `packages/cli/src/index.test.ts`, whose cases compare the prose and `--json` forms of one document.

## Declared readings

A drawing rule measures geometry the author did not state. These rules measure something the author did state: what the document promises about its own meaning, per [ADR-INFOSCHEMATICS-040](../decisions/ADR-INFOSCHEMATICS-040-a-document-promises-what-it-means-and-a-checker-holds-it-to-it.md). They keep the `DRAW` series because a requirement id is a stable citation rather than a claim about what the finding measures, and because they are answered by the same review surface in the same finding shape.

### DRAW-014 — A promise is reviewed apart from the drawing, and always as an error

Reviewing promises MUST report findings in the same shape as a drawing finding — rule code, concerned identities, measurement, sentence, repairs, severity — while carrying its own rule codes rather than extending the drawing series, because a promise is not a fact about the layout: the same geometry keeps or breaks it depending only on what was declared. Every promise finding MUST be an error. A drawing finding may be an observation because it is the checker's judgement and an author may reasonably disagree with it; a promise is the author's own assertion, so there is nobody left to disagree. A document that declares nothing MUST report nothing and MUST stay exactly as valid as it was before promises existed. Every repair offered MUST include withdrawing the promise, because retiring a claim the document no longer makes is a legitimate repair and a checker that hid it would be prescribing the design.

_Conformance:_ conforming

_Verify:_ review a document that declares nothing and confirm both the promise list and the drawing list are unchanged by adding declarations that hold; then confirm no promise rule code appears in `DrawingRuleCode`.

_Evidence:_ `PromiseFinding`, `PromiseRuleCode` and `promisesAreBroken` in `packages/view-model/src/diagnostics.ts`, exercised in `packages/view-model/src/diagnostics.test.ts`.

### DRAW-015 — `promise-origin-not-allowed`

An artefact that a Flow leaves and no Flow arrives at begins a reading. Where an `origin` promise is declared, every such artefact MUST be named by that promise, directly or through a [Scope](../reference/vocabulary.md#scope) covering it, and each one that is not MUST be reported with the promise's id, the offending code, the number of artefacts the promise allows, and the number of Flows leaving it. An artefact no Flow touches MUST NOT be reported, because it takes no part in any reading and complaining about it would complain about the legend rather than the explanation.

_Conformance:_ conforming

_Verify:_ declare the origins of a document that already reads, confirm nothing fires, then delete the Flow arriving at one interior artefact and read back the code it now names.

_Evidence:_ `promise-origin-not-allowed` in `packages/view-model/src/diagnostics.ts`, with the untouched-artefact case held in `packages/view-model/src/diagnostics.test.ts`.

### DRAW-016 — `promise-terminus-not-allowed`

An artefact that a Flow arrives at and no Flow leaves ends a reading. Where a `terminus` promise is declared, every such artefact MUST be named by that promise or by a Scope covering it, and each one that is not MUST be reported with the promise's id, the offending code, the number of artefacts allowed, and the number of Flows arriving at it. A bidirectional Flow MUST be read in both directions, so an artefact reachable only over one is neither an origin nor a terminus.

_Conformance:_ conforming

_Verify:_ point a bidirectional Flow at a leaf artefact and confirm it is reported as neither end, then make the same Flow one-way and confirm the terminus rule fires.

_Evidence:_ `promise-terminus-not-allowed` in `packages/view-model/src/diagnostics.ts` and its cases in `packages/view-model/src/diagnostics.test.ts`.

### DRAW-017 — `promise-relationship-missing`

A `relationship` promise MUST hold when one Flow runs directly from any artefact its `from` stands for to any artefact its `to` stands for, and MUST otherwise be reported with the promise's id, both authored ends, and the number of Flows found running the other way. Counting the reversal is required rather than optional: swapping two endpoints is the likeliest way this breaks, and a finding reporting only absence would send an author looking for a Flow that is already drawn.

_Conformance:_ conforming

_Verify:_ reverse the endpoints of the Flow a declared relationship rests on and confirm the finding reports one Flow running the other way rather than none at all.

_Evidence:_ `promise-relationship-missing` in `packages/view-model/src/diagnostics.ts` and the reversed-endpoint case in `packages/view-model/src/diagnostics.test.ts`.

### DRAW-018 — `promise-path-broken`

A `path` promise MUST hold when some run of Flows, of any length, leads from an artefact its `from` stands for to an artefact its `to` stands for, and MUST otherwise be reported with the promise's id, both authored ends, how many artefacts the walk reached, and how many it had to reach. The walk MUST follow a bidirectional Flow both ways and MUST terminate on a document describing a cycle, which is why it is a breadth-first traversal over an explicit queue and not a recursive descent.

_Conformance:_ conforming

_Verify:_ declare a path across a document whose Flows form a loop, confirm the review returns rather than recurses, then remove one Flow in the middle of the run and read back how far the walk got.

_Evidence:_ `promise-path-broken` and `reachedFrom` in `packages/view-model/src/diagnostics.ts`, with the cycle and severed-Flow cases in `packages/view-model/src/diagnostics.test.ts`.

## Quality properties

### DRAW-012 — No finding against a published document

Every Infoschematic this repository publishes MUST report no findings, and that MUST be asserted by a check that also proves it is still measuring something. A rule that fires on correct authored geometry costs every author who runs a check, and no fixture written beside the rule can catch it.

_Conformance:_ conforming

_Verify:_ review every published example, then break one on purpose and confirm the same walk reports it — a review that resolved to an empty rule set would otherwise satisfy the first half.

_Evidence:_ `scripts/example-drawings.test.ts`, which carries both the clean walk and the deliberately broken document.

### DRAW-013 — `flow-label-off-route`

A `labelAt` outside `0`–`1` MUST be reported as an observation carrying the authored value, the route's length, and the share that value would have meant had it been a distance in diagram units. It is an observation rather than an error because the drawing still reads — the label is clamped to an end rather than absent — which is precisely why the confusion is worth reporting: nothing else tells an author that the number they wrote is in the wrong unit.

_Conformance:_ conforming

_Verify:_ author `labelAt: 180` on a route three hundred and sixty units long and read the suggested share back; then author `labelAt: 0.5` on the same route and confirm nothing is reported, because a rule that fires on correct authored geometry costs every author who runs the checker.

_Evidence:_ `packages/view-model/src/diagnostics.test.ts` holds both directions, and `scripts/example-drawings.test.ts` asserts the published set reports nothing.
