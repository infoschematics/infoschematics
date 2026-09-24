# Design editing — EDIT

Geometry, route, attachment, creation, removal, appearance, and complete preview behaviour in the Design workspace. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### EDIT-001 — A diagram supplies its editing rules

Studio MUST ask the current diagram for handles, placement constraints, authored values and descriptions of changes. It MUST NOT infer domain-specific movement rules from rendered React elements.

_Conformance:_ conforming

_Verify:_ in Design, read where a handle and a placement constraint come from: each MUST arrive from the diagram's own editing description. Give one artefact kind a movement rule Studio infers from the rendered React element instead, and the rule survives a change to the diagram that should have withdrawn it — which is the failure this requirement forbids.

_Evidence:_ `EditableDiagram` in `packages/view-model/src/editable.ts` and its use by `packages/view-studio/src/app/editor/use-editor.ts`.

### EDIT-002 — Keyboard nudging is exact

Keyboard nudging MUST move the current movable selection by the exact requested increment rather than rounding the result to the authored grid. A larger modified increment MAY be offered.

_Conformance:_ conforming

_Verify:_ select a movable artefact, note its coordinate, and nudge it once by key. The coordinate MUST change by exactly the requested increment, with no grid rounding applied on top; a nudge that lands on a grid line instead of the increment fails the requirement.

_Evidence:_ `nudge` in `packages/view-studio/src/app/editor/use-editor.ts`.

### EDIT-003 — Every route change is represented

When a component movement, endpoint reattachment or direct route edit changes a route, the pending change set MUST include the resulting route points. It MUST NOT report an attachment whose rendered route still ends at the former coordinate.

_Conformance:_ conforming

_Verify:_ move a Card that a Flow attaches to, reattach a Flow end, and drag a Waypoint, reading the pending change set after each. Every one MUST list the resulting route points; a change set that records the new attachment while the route it reports still ends at the former coordinate fails the requirement.

_Evidence:_ derived changes, attachments and routes in `packages/view-studio/src/app/editor/use-editor.ts`.

### EDIT-004 — Port counts are editable per side

Studio MUST allow each side's port count to be edited independently. Changing one side MUST NOT replace counts on untouched sides.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-model test`, whose attachment-point cases layer a side-specific port count over the counts in force. Then change one side's count in Design and read the other three: a count edit that rewrites an untouched side fails the requirement.

_Evidence:_ `packages/view-model/src/ports.test.ts` covers layering a side-specific count over the counts in force.

### EDIT-005 — A port shows whether it is used

While editing, a port MUST visually distinguish whether a flow currently terminates on it. The port identity SHOULD be available on demand without permanently adding all port labels to the canvas.

_Conformance:_ conforming

_Verify:_ in Design, look at a port a Flow terminates on beside one nothing attaches to: the two MUST be visually distinguishable. Then ask for a port's identity and confirm it can be had on demand without every port label being left on the canvas.

_Evidence:_ port classes and labels in `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/view-canvas/src/styles.css`.

### EDIT-006 — A flow end can be reattached to an offered port

A producer MUST be able to drag a selected flow endpoint to any compatible port currently offered on the canvas. The candidate port MUST be indicated before release, and releasing without a valid candidate MUST NOT silently reattach the endpoint.

_Conformance:_ conforming

_Verify:_ drag a selected Flow endpoint over a compatible port and confirm the candidate is indicated before release; then release over empty canvas and over an incompatible target. Each MUST leave the endpoint where it was: a release with no valid candidate that quietly reattaches the Flow fails the requirement.

_Evidence:_ endpoint drag and `dropPort` state in `packages/view-canvas/src/InfoschematicDiagram.tsx`.

### EDIT-007 — Flow waypoints can be edited deliberately

A selected flow MUST expose its interior waypoints. Adding or removing a waypoint MUST require an explicit editing action so an ordinary selection click cannot alter the route.

_Conformance:_ conforming

_Verify:_ select a Flow and confirm its interior waypoints are exposed; then click the route the way a producer selects it and read the change set. Adding or removing a waypoint MUST take a deliberate editing action, so a selection click that alters the route fails the requirement.

_Evidence:_ waypoint actions in `packages/view-studio/src/app/editor/use-editor.ts` and `packages/view-canvas/src/InfoschematicDiagram.tsx`.

### EDIT-008 — Artefact geometry follows kind constraints

Region, Fabric, Card and Overlay boxes MUST move and resize on both axes and respect View Model minima. Point MUST move as a coordinate and MUST NOT acquire box geometry. Flow MUST retain route-specific editing.

Reorder MUST change authored order only inside the selected kind. Studio MUST NOT expose cross-family z-order. Adapter interaction MUST direct movement to the composed Card and MUST NOT offer independent Adapter resize.

_Conformance:_ conforming

_Verify:_ run the geometry cases in `packages/view-model/src/editable-capabilities.test.ts` and `packages/view-studio/src/app/editor/artefact-operations.test.ts`; a Point reports the `point` geometry role rather than a box, and the resize operation cannot be constructed for one. Then run the Point cases in `packages/view-studio/src/app/App.browser.test.tsx`, which move it by key and by typed coordinate and read the coordinate back off the rendered mark.

_Evidence:_ `packages/view-model/src/editable.ts` gives a Point `PointGeometry` and excludes it from `ResizeArtefactOperation`, so a Point with a box is not a state the editor can reach; `packages/view-canvas/src/InfoschematicDiagram.tsx` offers it no resize handle; `packages/view-studio/src/app/editor/use-editor.ts` moves it by writing a coordinate; `docs/decisions/ADR-INFOSCHEMATICS-028-a-point-is-its-own-artefact-kind.md` records why it is a kind of its own rather than a part of the Flow that owns it.

### EDIT-009 — Removal remains reviewable

Removing an authored artefact MUST mark it as pending removal rather than making it disappear immediately. Flows that cannot remain valid without that artefact MUST be named in the change set. Repeating the removal action MUST be able to lift the mark before the set is applied.

_Conformance:_ conforming

_Verify:_ run the removal cases in `packages/view-studio/src/app/editor/artefact-operations.test.ts` and `packages/view-studio/src/app/App.browser.test.tsx`. Every kind a Flow can name as an endpoint carries its Flows off with it: a Point left out of that cascade read as a Region, was removed alone, and the Flow that named it stayed behind pointing at nothing.

_Evidence:_ removal drafts in `packages/view-studio/src/app/editor/use-editor.ts`; the cascade and its order in `packages/view-studio/src/app/editor/artefact-operations.ts`; the projection that carries dependent members out of the authored document in `packages/view-studio/src/app/editor/document-operations.ts`.

### EDIT-010 — A flow can be created between ports

Studio MAY create a flow by dragging from one port to another. Releasing anywhere other than a valid different port MUST create nothing. A newly created flow MUST enter the same selection, routing, editing and removal machinery as an authored flow.

Code allocation and allowed families MUST be supplied by the current Infoschematic rather than hard-coded by Studio.

_Conformance:_ conforming

_Verify:_ drag from one port to a different, valid port and confirm a Flow is created that then selects, routes, edits and removes like an authored one; release on the originating port, on empty canvas and on an incompatible target and confirm nothing is created. Read the created Flow's code and family: both MUST come from the current Infoschematic rather than a Studio constant.

_Evidence:_ creation state in `packages/view-studio/src/app/editor/use-editor.ts` and flow interaction in `packages/view-canvas/src/InfoschematicDiagram.tsx`.

### EDIT-011 — A card can be created with a valid default

Studio MAY create a card as one undoable action and allow its properties to be refined afterwards. A created card MUST have identity, placement and enough domain data to pass through the same selection, movement, port and removal machinery as an authored card.

Identity allocation, scope choice and default appearance MUST be supplied by the current Infoschematic rather than hard-coded by Studio.

_Conformance:_ conforming

_Verify:_ create a Card, then put it through selection, movement, a port-count change and removal without refining anything first: each MUST work on the defaults alone. Read its identity, scope and appearance against the current Infoschematic — values Studio hard-coded rather than took from the document fail the requirement — and confirm one undo removes the whole creation.

_Evidence:_ `CreatedComponent` in `packages/view-model/src/editable.ts` and card creation state in `packages/view-studio/src/app/editor/use-editor.ts`.

### EDIT-012 — Moving a component carries attached presentation

Moving or resizing a Card or Fabric MUST carry every Flow route end attached to it to the effective position of its named port in the same preview frame. The nearest route run MAY change as required to remain orthogonal, but unrelated interior Waypoints and the opposite route end MUST remain stable. This invariant MUST hold for authored and newly created artefacts, with or without an existing route or attachment draft, and for pointer, keyboard and numeric placement.

When an Adapter or Wrapper Card derives its placement from another Card, moving either interactive representation MUST preserve the composition relationship rather than creating a second independent placement. A Flow attached to either constituent Card MUST follow the constituent Card whose port it names.

_Conformance:_ conforming

_Verify:_ run the dependent-geometry cases in `packages/view-model/src/artefact-draft.test.ts` and the rendered Canvas and Studio interaction suites.

_Evidence:_ `packages/view-model/src/artefact-draft.test.ts` covers authored, Adapter-attached, created, Waypoint-bearing and earlier-drafted routes; `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` and `packages/view-studio/src/app/App.browser.test.tsx` cover pointer, keyboard and numeric movement through rendered geometry and the reviewable change set.

### EDIT-013 — Library creation produces independent authored values

The Design Library MUST provide Card, Fabric, Flow and Point templates. Instantiating a template MUST deep-copy its serialisable seed, allocate a fresh stable `id` and `code`, and create one ordinary typed operation. The created value MUST NOT contain Library metadata, template identity or provenance.

Card and Fabric creation MUST apply the current Scope and requested Canvas placement. Point creation MUST apply the current Scope and take the requested Canvas placement as its coordinate; the seed MUST carry no extent, and a created Point MUST stand alone rather than requiring a Flow to complete it, as `ADR-INFOSCHEMATICS-028` records. Flow creation MUST require two valid, distinct endpoints and a selected Flow family, and MUST create an orthogonal route whose terminal points match the selected ports. Repeated instantiation MUST return independent nested values.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-studio test`, whose Library cases cover the seed copy, fresh `id` and `code` allocation, and the operation shape. Then instantiate one template twice and mutate a nested value in the first instance: the second MUST be unaffected, and neither created value MUST carry Library metadata, template identity or provenance. Instantiate a Flow template with fewer than two distinct endpoints, or without a Flow family, and creation MUST refuse. Delete the Point template from `libraryTemplates` in `packages/view-studio/src/app/editor/library.ts` and a Point creation case MUST fail, so a suite that only exercises the other three kinds is not read as covering this one.

_Evidence:_ `packages/view-studio/src/app/editor/library.test.ts`, `packages/view-studio/src/app/editor/artefact-factories.test.ts` and `packages/view-studio/src/app/editor/LibraryPanel.test.tsx`. The Point template's own branch is `instantiateLibraryTemplate`'s coordinate case in `packages/view-studio/src/app/editor/library.ts`; the Library cases do not reach it yet, so the fourth kind rests on the implementation rather than on a case.

### EDIT-014 — Design previews the complete materialised draft

Design MUST start from complete authored content rather than Audience filters and MUST materialise typed operations into a derived runtime for Canvas. Creates, movement, resize, property replacement, within-kind reorder and safe removal MUST be visible without mutating the host configuration. Existing component-offset, route, waypoint and attachment drafts MUST remain effective later overlays.

Rejected operations MUST leave their base output unchanged. Present MUST continue to resolve and render its active Sequence Overlay independently of Design's complete-content Overlay preview.

Draft projection MUST follow dependency order: effective component geometry, effective port geometry, endpoint attachment, interior route geometry, then route-label placement. A later draft layer MUST NOT restore an endpoint coordinate made stale by an earlier component move, resize or port-count change. Combining typed artefact operations with established draft fields MUST produce one coherent preview and one coherent change set rather than whichever representation happened to render last.

_Conformance:_ conforming

_Verify:_ in Design, apply an Audience filter and confirm the Design preview ignores it; then make a create, a move, a resize, a property replacement, a within-kind reorder and a removal, and confirm each is visible without the host configuration changing. Move a Card whose Flow has a route draft and a placed route label: the endpoint MUST follow the moved port rather than the draft restoring the stale coordinate, which is what the dependency order exists to prevent. Reject an operation and the base output MUST be unchanged.

_Evidence:_ composition in `packages/view-studio/src/app/App.tsx` and preview derivation in `packages/view-canvas/src/InfoschematicDiagram.tsx`.

### EDIT-015 — Removal plans make consequences explicit

Removing a Card or Fabric MUST include endpoint Flow removals before the owner. Applied Card removal MUST also account for Adapter Cards that wrap it. Removing a Region MUST NOT cascade to any other artefact. Studio MUST block Overlay removal while a Sequence Scene directly references the Overlay and expose the reason to the Producer.

The underlying materialiser MUST remain total when it receives a direct Overlay removal by clearing Sequence references and Scene focus entries atomically. This cleanup is a safety boundary, not permission for Studio to bypass the review block.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-studio test` and `bun run --filter=@infoschematics/view-model test`, whose removal cases cover the plans, the blocking rule and the materialised cascade. Then remove a Card a Flow attaches to and read the plan: the Flow removals MUST precede their owner. Remove a Region and nothing else MUST cascade. Remove an Overlay a Sequence Scene references directly and Studio MUST refuse with a stated reason, while the materialiser given that removal directly MUST still clear the Scene's references atomically rather than throwing.

_Evidence:_ `packages/view-studio/src/app/editor/artefact-operations.test.ts` and `packages/view-model/src/artefact-draft.test.ts` cover removal plans, blocking and materialised cascades.

### EDIT-016 — Authored treatments are editable, and an optional one can be cleared

Every treatment a selected artefact authors MUST be editable through a typed control rather than only through free-text properties. A Region's frame style and opacity, fill, label placement, label mount and label offset are all such treatments.

Clearing an optional treatment MUST remove the authored member rather than write an empty or null value into the record, and MUST NOT be offered for a required one. A control value the artefact cannot carry MUST leave the artefact as it stands.

_Conformance:_ conforming

_Verify:_ in Design, select a Region and edit its frame style, opacity, fill, label placement, label mount and label offset through their own controls rather than free text; then clear an optional one and read the authored record. The member MUST be gone rather than set to an empty or null value, no clear MUST be offered for a required treatment, and a control value the artefact cannot carry MUST leave it as it stands.

_Evidence:_ `packages/view-studio/src/app/editor/region-treatments.test.ts` covers the control values, patches and clears, and `packages/view-studio/src/app/editor/artefact-operations.test.ts` covers member removal.

### EDIT-017 — Port-count edits preserve attachments

Changing one side's port count MUST leave every attached Flow on a valid port of the same component. Where the former port position still exists, the Flow SHOULD retain that geometric position even if its port number changes. Where it does not, Studio MUST choose the nearest valid replacement deterministically and update both attachment identity and rendered route together. Reducing a side to zero ports MUST NOT leave a Flow claiming a port that is no longer offered; Studio MUST either require a valid replacement or surface a reviewable validation issue.

_Conformance:_ conforming

_Verify:_ attach a Flow to a middle port, then change that side's count up and down. The Flow MUST stay on a valid port of the same artefact, holding its geometric position where that position still exists, and its port identity and rendered route MUST move together. Reduce the side to zero: a Flow left claiming a port no longer offered fails the requirement, so Studio MUST either take a valid replacement or raise a reviewable validation issue.

_Evidence:_ port reseating in `packages/view-studio/src/app/editor/infoschematic-editable.ts` and `packages/view-studio/src/app/editor/use-editor.ts`.

### EDIT-018 — Placement inputs have equivalent semantics

Pointer dragging, keyboard nudging and numeric placement MUST express the same movement of the same selected artefact and MUST produce equivalent effective geometry and dependent Flow projection. Their declared interaction policies MAY differ: pointer placement MAY round to the authored `gridSize` when that size is non-zero, keyboard movement MAY step by one unit of it, and numeric placement MAY be exact. Those policies MUST NOT select a different draft representation or omit dependent changes.

Zoom, pan, fit mode, panel layout and device-pixel ratio MUST NOT change the authored Canvas coordinate resulting from a pointer placement. A drag begun before a viewport change MUST either finish against one stable coordinate transform or cancel without recording a partial edit. A pointer drag MUST translate the artefact by the distance the pointer travelled, carrying the offset at which the press landed inside it; placing the artefact's origin at the pointer instead MUST NOT be accepted, because the jump it causes is the size of the artefact rather than the size of the gesture.

_Conformance:_ conforming

_Verify:_ move one artefact the same distance three ways — pointer drag, keyboard nudge, typed coordinate — and compare the effective geometry and the dependent Flow projection after each: they MUST agree, and each MUST record the dependent changes. Then zoom, pan and change fit mode and panel layout, and repeat the pointer placement: the authored coordinate MUST be the same one. Change the viewport mid-drag and the drag MUST either complete against one transform or cancel without recording a partial edit. Press a wide artefact near one edge and drag it a short distance: it MUST move by that distance and MUST NOT recentre itself under the pointer.

_Evidence:_ coordinate conversion in `packages/view-canvas/src/InfoschematicDiagram.tsx`, placement commands in `packages/view-studio/src/app/App.tsx`, and draft construction in `packages/view-studio/src/app/editor/use-editor.ts`; the grab offset held for the length of a drag in `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx`.

### EDIT-019 — Created artefacts enter the complete editing lifecycle

Once created, a Card, Fabric, Flow or Point MUST support every operation its authored counterpart supports: selection, movement or route editing, property editing, attachment changes, removal, undo, redo, discard and deterministic change consolidation. Dependent geometry MUST resolve created identities and ports without relying on a register built only from authored configuration. Creating and then removing an artefact in one draft MUST leave no orphaned dependent operation.

_Conformance:_ conforming

_Verify:_ create a Card and a Flow attached to it, then move the created Card and watch the created Flow: the route MUST follow, which is the case that proves dependent geometry resolves created identities and ports rather than a register built from authored configuration alone. Put each created artefact through property editing, attachment changes, removal, undo, redo and discard; then create and remove an artefact within one draft and confirm the change set carries no orphaned dependent operation.

_Evidence:_ creation tests cover the full lifecycle after creation, including moving a created endpoint artefact and observing a connected created Flow.

### EDIT-020 — Authored source remains host-owned

In document mode, Studio MUST accept one opaque validated authored document, emit only fully validated edit, source, model, and inverse results, and leave acceptance, persistence, and conflict handling to the host.

_Conformance:_ conforming

_Verify:_ `packages/view-studio/src/app/App.test.tsx` covers mutually exclusive source props and host acknowledgement; `packages/view-studio/src/app/editor/document-operations.test.ts` covers validated projection and rejection.

_Evidence:_ `StudioProps` in `packages/view-studio/src/app/App.tsx` separates established `config` input from authored `document` input, while `StudioDocumentChangeHandler` in `packages/view-studio/src/app/editor/document-operations.ts` exposes validated results without a persistence API.

### EDIT-021 — Studio edits retain authored representation

Studio MUST project supported typed artefact operations through stable document paths without replacing unrelated source, including preserving compact versus structured Flow fields and comments inside an edited Flow.

_Conformance:_ conforming

_Verify:_ `packages/view-studio/src/app/editor/document-operations.test.ts` covers five artefact kinds, create, remove, reorder, geometry and property edits, collateral Scope membership, compact and structured Flows, comments, and accepted-document acknowledgement.

_Evidence:_ `projectStudioDocumentOperations` in `packages/view-studio/src/app/editor/document-operations.ts` reads the retained source shape and emits granular `link`, `waypoints`, `labelAt`, or structured route operations as appropriate.

### EDIT-022 — Structured and source edits share document history

In document mode, Studio MUST present valid structured edits and whole-source replacements as one undoable and redoable retained-document timeline while leaving persistence and replacement acceptance to the host.

_Conformance:_ conforming

_Verify:_ `packages/view-studio/src/app/editor/document-history.test.ts` covers timeline branching and acknowledgement; `packages/view-studio/src/app/App.browser.test.tsx` covers source replacement, undo and redo through a host-controlled document.

_Evidence:_ `useDocumentTimeline` records structured document results from `AppContent`, records validated Source-tab replacements, and emits prior or later validated documents through `onDocumentReplace`.

### EDIT-023 — Creation is offered from one place

In Design, Studio MUST offer the creation of every directly creatable element kind from a single labelled group, and MUST keep a creation whose precondition is unmet present and disabled with the precondition stated rather than withdrawing it. Every creation offered MUST reach the document by the same route — a create operation the projection carries — whichever surface offers it, so no surface holds a creation the document is never told about.

_Conformance:_ conforming

_Verify:_ `packages/view-studio/src/app/editor/ArtefactControls.test.tsx` asserts the four creations appear in the one `Create an element` group in a fixed order, and that Adapter is disabled with its precondition in the title while Card is not; `packages/view-studio/src/app/panels/DetailsPanel.artefacts.test.tsx` asserts the Canvas toolbar carries no creation control; `packages/view-studio/src/app/App.browser.test.tsx` asserts a Card made from the control reaches the document the host holds and leaves again on undo, which is the route rather than the offering.

_Evidence:_ `packages/view-studio/src/app/editor/ArtefactControls.tsx` renders Card, Adapter, Region and Graphic in one `role="group"` under `CREATE`; `packages/view-studio/src/app/editor/EditorTools.tsx` carries selection and route tools only; `packages/view-studio/src/app/editor/LibraryPanel.tsx` names its entries as starting points that produce one of those kinds. All four reach `editor.createArtefact` and are projected by `projectStudioDocumentOperations`, landing at the index `nextArtefactIndex` computes for every surface alike, per [`ADR-INFOSCHEMATICS-038`](../decisions/ADR-INFOSCHEMATICS-038-a-creation-reaches-the-document-by-one-route.md). Card and Adapter previously wrote a `cards` draft map the projection never read, so the change pane counted creations the document never received.

### EDIT-024 — A created element answers to one name

A coded element Studio creates MUST carry a single identity, and that identity MUST be its code: the `id` the creating operation names MUST be the code the element is drawn under, so every selection, move, resize and property edit made against what is drawn reaches the operation that made it. That code MUST be allocated against the whole document register rather than against one surface's own record of what it has made, so two surfaces cannot issue the same name.

_Conformance:_ conforming

_Verify:_ `packages/view-studio/src/app/editor/library.test.ts` asserts the allocator issues `id` equal to `code` while avoiding both authored sets; `packages/view-studio/src/app/App.browser.test.tsx` drags a Card added from the Library and asserts it follows the pointer, comes to rest where it was dropped, and is named in the written record.

_Evidence:_ `createLibraryIdentityAllocator` in `packages/view-studio/src/app/editor/library.ts` issues one string as both fields; `createCard` in `packages/view-studio/src/app/App.tsx` allocates through `nextCodeIn` over `infoschematicRegister.all`, which is the same register; `infoschematicModelOf` in `packages/domain-core/src/model.ts` publishes an element's code as its `id`, which is why a second name was never visible to anything that matched against what was drawn.

### EDIT-025 — A creation names only what the document declares

An element Studio creates MUST take its Collection from the document — the Collection of what is selected, or the first the document declares — and MUST omit it where the document declares none; a template MUST be placed at the position it is given while keeping its own size.

_Conformance:_ conforming

_Verify:_ `packages/view-studio/src/app/editor/library.test.ts` asserts the given Collection is named, that none is written where none is given, and that a Square card placed in a wider rectangle keeps its 120 by 120; `packages/view-studio/src/app/App.browser.test.tsx` asserts a Card added from the Library reaches the written record, which only a projection the document accepts can do.

_Evidence:_ `detailsArtefactContexts` in `packages/view-studio/src/app/panels/DetailsPanel.tsx` supplies `collection`, and `instantiateLibraryTemplate` in `packages/view-studio/src/app/editor/library.ts` writes `domain` only when it has one and places through `placedBox`. Naming a Scope as though it were a Collection made a document `projectStudioDocumentOperations` rejected whole, so nothing was written at all.

### EDIT-026 — A created element is placed clear of what is already drawn

An element Studio creates MUST be placed clear of the artefacts already drawn where the view allows it: the position offered MUST NOT overlap an authored artefact at its current drawn position, nor a box a pending edit has already claimed. Where no clear position is available inside the view, Studio MUST still place the element somewhere visible rather than refusing to create it.

The placement is provisional in every case. It states nothing about where the element belongs, which is a judgement about architecture the [Producer](../reference/vocabulary.md#producer) makes by dragging it; Studio MUST NOT lay the document out.

_Conformance:_ conforming

_Verify:_ create a Card into a document whose centre is occupied, and read where it lands: it MUST overlap nothing drawn and MUST sit wholly inside the view. Create a second before writing the first and the second MUST avoid the first, which is still only pending. Occupy the whole view and one MUST still be created. `packages/view-studio/src/app/editor/card-placement.test.ts` holds each case, and `packages/view-studio/src/app/App.browser.test.tsx` asserts it through rendered geometry.

_Evidence:_ `roomForCard` in `packages/view-studio/src/app/editor/card-placement.ts` searches outward from the stepped view-box centre and falls back to it; `pendingArtefactBoxes` in `packages/view-studio/src/app/editor/artefact-operations.ts` supplies what the pending edits have claimed; the overlap test is `measuredOverlap` in `packages/view-model/src/diagnostics.ts`, shared with the `artefacts-overlap` rule but not with its exemptions, per [`ADR-INFOSCHEMATICS-042`](../decisions/ADR-INFOSCHEMATICS-042-share-the-measurement-never-the-rule.md). The rule excuses a Card drawn on a [Fabric](../reference/vocabulary.md#fabric) and the placement must not, because the Message bus is what a new Card kept landing on.

## Gaps

- `EDIT-018`'s compositions are recorded in [Composition](composition.md): with `ROUTE-001` as `COMPOSE-002`, where a committed move of a Card can leave a route the renderer refuses, and with `PRESENT-010` as `COMPOSE-005`, over the keystrokes a placement field and the Diagram's zoom control both claim.
