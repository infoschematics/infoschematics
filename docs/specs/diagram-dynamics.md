# Diagram Dynamics — DYNAMIC

Named authored Dynamics, host-owned occurrences, occurrence resolution, and non-motion interpretations. Part of the [Specifications corpus](index.md).

Flow signal occurrences themselves are specified in [Flow signals](flow-signals.md); this area specifies the authored vocabulary a host binds and how an occurrence of it reaches each renderer.

## User-observable behaviours

### DYNAMIC-001 — A Diagram declares the Dynamics it can express

A Diagram MAY declare named Diagram Dynamics under `diagram.dynamics`. Each declaration MUST carry a stable authored `id`, a human `label`, an optional `description`, and one `kind` from the finite vocabulary `signal-flow` or `emphasise-elements`. A `signal-flow` declaration MUST name one or more authored Flows; an `emphasise-elements` declaration MUST name one or more authored visual elements.

Validation MUST reject a duplicate Dynamic id, an empty target list, an unknown target identifier, and a target field belonging to another kind. Canonicalisation MUST retain authored declaration order and MUST store each target list sorted, so an authored reordering of targets does not change the canonical model.

A declaration MUST NOT carry a duration, easing, colour, selector, callback, timer, renderer component, event-source description, or any other rendering or runtime instruction. A document that declares no Dynamics MUST validate, serialise, and render exactly as it did before the vocabulary existed: the collection MUST be absent from compact serialisation and MUST leave every renderer's output unchanged.

_Conformance:_ conforming

_Verify:_ inspect the canonical types in `packages/domain-model/src/model.ts`, the schema and validation in `packages/domain-core/src/schema.ts` and `packages/domain-core/src/model.ts`, and serialisation field order in `packages/domain-core/src/serialise.ts` against this requirement.

_Evidence:_ canonical Dynamic types in `packages/domain-model/src/model.ts`, with duplicate, empty, unknown-target, and wrong-kind rejection and empty-collection serialisation covered by `packages/domain-core/src/model.test.ts`, `packages/domain-core/src/authoring.test.ts`, and the generated `packages/domain-core/schema/infoschematic.schema.json`.

### DYNAMIC-002 — A host says only that a named Dynamic happened

A View or renderer boundary MUST accept framework-neutral `DynamicOccurrence` values carrying one `dynamicId` and one host-owned `occurrenceKey`. Retaining the same pair across renders MUST NOT restart a completed occurrence; supplying a new occurrence key for the same Dynamic MUST permit replay. Withdrawing an occurrence MUST cancel it.

An occurrence naming a Dynamic the document does not declare MUST be ignored without diagnostics, output change, or instability. A repeated occurrence of the same Dynamic and key in one submission MUST resolve once.

Occurrences, keys, and any timers a renderer uses MUST remain host or View state and MUST NOT enter the authored Infoschematic or process-global state. Filtering, hover, focus, selection, and ordinary re-rendering MUST NOT synthesize occurrences.

_Conformance:_ conforming

_Verify:_ inspect the occurrence contract in `packages/view-model/src/dynamics.ts` and the Canvas, Present, and static renderer boundaries that accept it against this requirement.

_Evidence:_ occurrence resolution, deduplication, and unknown-Dynamic tests in `packages/view-model/src/dynamics.test.ts`; replay, hold, and cancellation across the Canvas boundary in `packages/view-canvas/src/Canvas.dynamics.test.tsx` and `packages/view-canvas/src/Canvas.dynamics.browser.test.tsx`.

### DYNAMIC-003 — Resolution reaches only what a renderer drew

View Model MUST resolve an occurrence against its declaration into renderer-facing Flow signals for `signal-flow` and element emphasis for `emphasise-elements`. A resolved Flow signal MUST be indistinguishable from one a host supplied directly through the `signals` boundary, so a Dynamic MUST NOT acquire a lifecycle that a directly supplied signal does not have.

Element emphasis MUST be applied only to elements the renderer actually drew. An occurrence MUST NOT reveal, unhide, or reposition content that Scope filtering, Scene focus, or output-detail policy excluded, and MUST NOT change authored geometry, routing, hit targets, selection behaviour, or any element's own output.

Resolution MUST remain pure and framework-neutral: no renderer reads authored Dynamic shorthand, and each renderer chooses its own treatment from the resolved occurrences.

_Conformance:_ conforming

_Verify:_ inspect `resolveDiagramDynamics` in `packages/view-model/src/dynamics.ts` and the emphasis layers in `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/render-svg/src/index.ts` against this requirement.

_Evidence:_ byte-identical resolved and directly supplied signal output, scope-hidden elements left unemphasised, and unchanged element output in `packages/view-canvas/src/Canvas.dynamics.test.tsx`, `packages/view-present/src/Present.dynamics.test.tsx`, and `packages/render-svg/src/index.test.ts`.

### DYNAMIC-004 — Static output stays quiet unless a caller asks

Deterministic still output MUST be byte-identical with no declared Dynamics, with an empty occurrence list, and with an occurrence naming an undeclared Dynamic. A caller MAY supply occurrences explicitly, and the renderer MUST then draw its still treatment for the resolved targets.

Still output MUST NOT contain animation, and MUST NOT vary with the occurrence key: two occurrences of the same Dynamic differing only by key MUST produce identical output. Emphasised elements MUST carry stable authored artefact identity together with the Dynamic id so a caller can locate the treatment, and the accessible description MUST state the occurred Dynamics' labels.

_Conformance:_ conforming

_Verify:_ inspect the still emphasis treatment and accessible description in `packages/render-svg/src/index.ts` against this requirement.

_Evidence:_ quiet-baseline, explicit-occurrence, key-independence, and accessible-description tests in `packages/render-svg/src/index.test.ts`.

### DYNAMIC-005 — A Producer can rehearse a document's Dynamics

Studio MUST offer a Producer one control per declared Dynamic while presenting, and MUST NOT offer the bank for a document that declares none. Activating a control MUST play that Dynamic exactly as a host binding its id would, through the same occurrence boundary and with a key that changes on each activation.

Rehearsal MUST NOT write to the authored document, MUST NOT persist across sessions, and MUST NOT change any Producer selection, mode, or editing state.

_Conformance:_ conforming

_Verify:_ inspect the Dynamics bank in `packages/view-studio/src/app/panels/ProducerControls.tsx` and its occurrence handling in `packages/view-studio/src/app/App.tsx` against this requirement.

_Evidence:_ rendered Studio rehearsal, replay, and retirement in `packages/view-studio/src/app/App.browser.test.tsx`, and the hosted bank in `apps/site/src/Playground.test.tsx`.

## Quality properties

### DYNAMIC-006 — Every Dynamic means something without motion

Each kind MUST have a full-motion treatment, a finite `prefers-reduced-motion` treatment that is still rather than travelling, and a deterministic non-motion interpretation in still output. Motion MUST NOT be the only carrier of a Dynamic's meaning.

An interactive renderer MUST announce each newly accepted occurrence once through a concise polite live region, and the announcement MUST state the Dynamic's own label rather than describing the graphic or listing the elements it touched. Re-rendering the same occurrence MUST NOT repeat the announcement; cancelling or completing an occurrence MUST NOT announce new activity. However many elements one occurrence touches, it MUST be announced once.

Emphasis graphics MUST be hidden from assistive technology and MUST NOT receive pointer events. Measurements shared between motion and still treatments MUST come from View Model visual tokens.

_Conformance:_ conforming

_Verify:_ inspect the emphasis tokens in `packages/view-model/src/tokens.ts`, the treatments in `packages/view-canvas/src/styles.css`, and the live regions in `packages/view-canvas/src/Canvas.tsx` against this requirement.

_Evidence:_ token-derived painted emphasis, retirement, announcement revisions, and reduced-motion treatment in `packages/view-canvas/src/Canvas.dynamics.test.tsx` and `packages/view-canvas/src/Canvas.dynamics.browser.test.tsx`.
