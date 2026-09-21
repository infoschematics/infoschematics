# Drawing diagnostics — DRAW

What a valid document still gets wrong about the drawing it describes, reported so a person or an agent can repair one thing at a time. Part of the [Specifications corpus](index.md).

Validation answers whether a document is well formed; this answers whether the drawing it describes can be read. Both are needed, and neither substitutes for the other: a document can satisfy every type in the schema and still draw two [Cards](../reference/vocabulary.md#standard-card) on top of each other.

## User-observable behaviours

### DRAW-001 — Review without alteration

Reviewing an [Infoschematic](../reference/vocabulary.md#infoschematic) MUST report findings about the drawing it describes and MUST NOT change the document, move anything, or choose a repair. The geometry MUST be calculated in View Model, per [ADR-INFOSCHEMATICS-018](../decisions/ADR-INFOSCHEMATICS-018-keep-renderer-command-thin.md), so the interactive Diagram, Studio, the command and an authoring agent read one list rather than three approximations of it. Reviewing the same document twice MUST give the same answer, and a review MUST NOT depend on a clock, a viewport, or a host.

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

Two [artefacts](../reference/vocabulary.md#infoschematic-artefact) whose boxes intersect MUST be reported as an error, measured by the width, height and area they share. An [Adapter](../reference/vocabulary.md#adapter-card) and the Card it holds MUST be exempt, because overlapping is what an Adapter is per [ADR-INFOSCHEMATICS-036](../decisions/ADR-INFOSCHEMATICS-036-an-adapter-is-positioned-by-what-it-holds.md), and a [Fabric](../reference/vocabulary.md#fabric) MUST be exempt as a place rather than a neighbour.

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

A Flow label whose anchor falls on an artefact MUST be reported as an observation carrying the distance along the route and the position it resolved to. It is an observation because the drawing is still readable — the label is not — and the label's distance is the one thing an author can move without changing the drawing.

_Conformance:_ conforming

_Verify:_ pin a label at a distance that lands it on a Card and read the reported position; confirm the severity does not fail a gate.

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

## Quality properties

### DRAW-012 — No finding against a published document

Every Infoschematic this repository publishes MUST report no findings, and that MUST be asserted by a check that also proves it is still measuring something. A rule that fires on correct authored geometry costs every author who runs a check, and no fixture written beside the rule can catch it.

_Conformance:_ conforming

_Verify:_ review every published example, then break one on purpose and confirm the same walk reports it — a review that resolved to an empty rule set would otherwise satisfy the first half.

_Evidence:_ `scripts/example-drawings.test.ts`, which carries both the clean walk and the deliberately broken document.
