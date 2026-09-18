# Composition — COMPOSE

What two features must still promise when they are used together. Part of the [Specifications corpus](index.md).

Every requirement here names the two owning requirements whose composition it states, and states only the property that emerges between them — never what either feature promises alone. [`ADR-INFOSCHEMATICS-034`](../decisions/ADR-INFOSCHEMATICS-034-a-composition-is-its-own-requirement.md) records why a composition is a requirement of its own rather than a clause in the newer feature, and enumerates the contended resources these pairs are derived from.

## User-observable behaviours

### COMPOSE-001 — A Diagram treatment reaches every host that draws it

A visual treatment declared for an [Infoschematic](../reference/vocabulary.md#infoschematic) element MUST resolve on every host that mounts the interactive Diagram, whatever else that host's stylesheet chain imports. A host stylesheet MUST NOT redeclare a selector its own import chain already gives it, because the second declaration wins silently and only in that host.

`APPEAR-009` promises that shared treatment comes from one generated token set, and `DESIGN-015` promises the editor is tested as rendered. Neither promises that the treatment survives arriving at a second host, which is the composition: a rule written once in Canvas is drawn by Canvas, by Present through Canvas, and by Studio, which mounts the Diagram without mounting Canvas at all.

_Conformance:_ conforming

_Verify:_ assert the treatment through the host's own stylesheet rather than Canvas's, then reintroduce the collision: redeclare one Canvas selector in Studio's stylesheet and both halves MUST fail — the shadowing check on the selector, and the Studio treatment case on the resolved value. A case that reads the treatment from Canvas's stylesheet passes whatever the host does and proves nothing.

_Evidence:_ `scripts/stylesheet-shadowing.test.ts` fails when a stylesheet redeclares a selector its import chain already gives it, comparing one selector at a time with combinators flattened; `packages/view-studio/src/app/App.treatments.browser.test.tsx` asserts Canvas-owned treatments through Studio's own stylesheet, which is the only place the original defect was visible. The treatment rules live in `packages/view-canvas/src/styles.css` and the host chain that could shadow them in `packages/view-studio/src/styles.css`.

### COMPOSE-002 — A committed geometry edit leaves the document renderable

Where a geometry edit moves an artefact a [Flow](../reference/vocabulary.md#flow) is attached to, the [route](../reference/vocabulary.md#route) MUST be carried by the same bend-inserting calculation the draft preview uses, so the committed document cannot hold a route the renderer refuses to draw. No [Producer](../reference/vocabulary.md#producer) action MUST be able to unmount the host it is performed in: a geometry the renderer will not express MUST be prevented or reported, never thrown out of runtime construction.

`EDIT-018` promises pointer, keyboard and numeric placement produce equivalent geometry and dependent Flow projection; `ROUTE-001` promises a diagonal run is rejected rather than approximated. Composed, a legal move of a Card whose Flow is authored by its [ports](../reference/vocabulary.md#port) alone produces exactly the geometry `ROUTE-001` rejects, and the rejection is a thrown error in the render path rather than a refused edit.

_Conformance:_ conforming

Both derivations now reach that calculation: a Flow with no authored waypoints is routed between its two [ports](../reference/vocabulary.md#port) through the shared construction in the document itself, not joined by a naked pair of points, and a committed two-point move re-derives the run rather than bending it. A Flow that does carry authored waypoints is repaired the same way and the repair is now written down: the projection that turns a draft into a document edit emits the moved artefact's member and every dependent route the draft bent alongside it, rather than only the member the Producer named, so the document cannot keep a Card's new box beside the route's old waypoints.

_Verify:_ nudge, drag and type a Card off the axis of a Flow attached to it by ports alone, on a rendered surface rather than through the draft overlay alone. The host MUST still be mounted after each, and the route MUST have gained a bend. Repeat it against a Flow whose waypoints an author wrote, and read the emitted document: it MUST carry the repaired waypoints as well as the moved bounds. Prove neither case is vacuous by restoring the naked two-point derivation and by projecting only the named member: each MUST fail, which they do not if the assertion reads the preview's projection instead of the committed document's.

_Evidence:_ `createInfoschematicRuntime` in `packages/view-model/src/runtime.ts` routes every waypoint-free Flow through `routeBetweenPorts`, and `flowsAfterMoves` re-derives a two-point run from the moved ports rather than bending it; `dependentFlowDiff` in `packages/view-studio/src/app/editor/document-operations.ts` carries each authored route the draft repaired into the same document edit as the move that caused it, and writes nothing for a Flow the runtime derives from its ports. `packages/view-model/src/runtime.test.ts` asserts the derived route stays orthogonal for each side pairing and that draft and commit agree; `packages/view-studio/src/app/editor/document-operations.test.ts` moves a Card whose Flow carries authored waypoints and builds a runtime from the emitted document, which throws if the repair was dropped; and `packages/view-studio/src/app/App.browser.test.tsx` nudges, types and drags a Card on a rendered surface and asserts the host is still mounted with an orthogonal path.

### COMPOSE-003 — A document the contract accepts renders, or is refused as a result

Geometry the renderer cannot express MUST be refused where a caller can act on it: as a parse or validation issue naming the offending Flow and its ports, or by rendering something legible. It MUST NOT reach a caller as a thrown internal geometry error, on any published surface.

`AUTHOR-005` promises rejection is a discriminated result carrying issues rather than an exception; `ROUTE-001` promises a diagonal run is rejected. Composed, the rejection lands outside the shape `AUTHOR-005` defines, because the contract accepts a document whose Flow endpoints are not axis-aligned and the refusal happens later, in geometry, with nothing to attach an issue to.

_Conformance:_ conforming

Unaligned ports stay legal and the route bends: the derivation `COMPOSE-002` now shares means the document renders, and a geometry error that does survive — a diagonal an author wrote as waypoints — reaches the caller as one sentence naming the document and the run, with the validation status, rather than as a thrown internal error.

_Verify:_ author a document whose two-port Flow is not axis-aligned, validate it, then render it. Either the parse MUST return an issue whose path names that Flow, or the render MUST succeed; a non-zero exit carrying a stack trace satisfies neither. Prove the case is not vacuous by aligning the ports again, which MUST make it pass.

_Evidence:_ `packages/cli/src/index.test.ts` renders a document whose two-port Flow is not axis-aligned on the published surface and asserts the drawn route is orthogonal with a bend, and renders an authored diagonal to assert the command prints `Cannot render <document>: …` and no stack frame. The guard is in `renderDocument` in `packages/cli/src/index.ts`; the derivation that removes the common case is `createInfoschematicRuntime` in `packages/view-model/src/runtime.ts`.

### COMPOSE-004 — An announcement channel is silent when nothing was depicted

Where visibility filtering removes every element an accepted occurrence would have been drawn on, the polite live region MUST say nothing at all. A revision prefix with no sentence after it is not an announcement: it tells a reader that something happened and withholds what, which is worse than the silence the filter earned.

`DYNAMIC-006` promises each newly accepted occurrence is announced once, by the [Diagram Dynamic](../reference/vocabulary.md#diagram-dynamic)'s own label; `PRESENT-003` promises each filter bank is individually controlled, and `DYNAMIC-003` promises an occurrence reaches only what the renderer drew. Composed, the treatment obeys the filter and the announcement does not.

_Conformance:_ conforming

_Verify:_ switch off the filter bank that hides every element one Dynamic names, rehearse it, and read the live region: it MUST be empty. Then switch the bank on and rehearse again, which MUST announce the Dynamic once. Prove the case is not vacuous by restoring the unconditional revision prefix: the first half MUST fail.

_Evidence:_ `DiagramAnnouncements` in `packages/view-canvas/src/announcements.tsx` composes each sentence first and reads the revision counter only when a sentence follows it, for the signal half and the emphasis half alike; the drawn set both halves filter against is derived once by `drawnElementIds` in `packages/view-canvas/src/drawn-elements.ts`, which the Canvas passes from what it drew and Studio passes from what its own filters left. The cases are `packages/view-canvas/src/announcements.test.tsx`: a drawn set holding none of what the occurrence touches leaves both regions empty, one holding all of it announces the Flow and the Dynamic once each, one holding part of it announces only the half that was drawn, and a host that supplies no drawn set at all — its accepted set being its drawn set — announces both.

### COMPOSE-005 — A viewport keyboard control yields to the host's text entry

A window-level viewport control MUST NOT act on a keystroke that is going to a text-entry surface the host mounts, and MUST require the pointer to be over the Diagram it would move. A host that composes editing fields beside a Diagram MUST NOT have to know the Diagram's bindings to keep its own fields typeable.

`PRESENT-010` gives the Diagram keyboard zoom and fit; `EDIT-018` gives Studio numeric placement fields whose values include `-` and `+`. Composed, both claim the same keystroke, and the one that resolves it is whichever listener the event reaches — which is why the Diagram's own listener is the place the composition has to be settled.

_Conformance:_ conforming

_Verify:_ with the pointer resting over the Diagram, type a negative coordinate into a placement field in Design and confirm the `viewBox` is unchanged and the field holds what was typed. Then remove the text-entry guard from the Diagram's window listener: the case MUST fail. A case that types with the pointer away from the Diagram proves nothing, because the control declines on the pointer test alone.

_Evidence:_ the window `keydown` listener in `packages/view-canvas/src/InfoschematicDiagram.tsx` returns early for an event whose target is inside `input, textarea, select, [contenteditable="true"]` and for a pointer that is not over the Diagram; the placement fields it yields to are built in `packages/view-studio/src/app/panels/DetailsPanel.tsx`.

## Gaps

- The screen region a [Callout](../reference/vocabulary.md#callout) is placed in, against the panel dock that `DESIGN-021` opens over the same surface, has not been driven on a rendered surface and has no requirement here.
- Playback keys and artefact activation both claim `Space` and the arrow keys, but not at once: activation requires editing and the playback listener runs only while a [Sequence](../reference/vocabulary.md#sequence) plays, so the pair has no live claimant to state a requirement about today.
- `DESIGN-020`'s composition with `DESIGN-018` holds on the rendered surface — a held group of three released exactly as a single selection does when its layer closed — but the clause that states it has no rendered case of its own, and the case belongs to `DESIGN-015`'s matrix rather than here.
