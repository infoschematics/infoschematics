# Design editing — EDIT

Geometry, route, attachment, creation, removal, appearance, and complete preview behaviour in Design mode. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### EDIT-001 — A diagram supplies its editing rules

Studio MUST ask the current diagram for handles, guides, placement constraints, authored values and descriptions of changes. It MUST NOT infer domain-specific movement rules from rendered React elements.

_Conformance:_ conforming

_Verify:_ inspect `EditableDiagram` in `packages/view-model/src/editable.ts` and its use by `packages/view-studio/src/app/editor/use-editor.ts`. against this requirement.

_Evidence:_ `EditableDiagram` in `packages/view-model/src/editable.ts` and its use by `packages/view-studio/src/app/editor/use-editor.ts`.

### EDIT-002 — Keyboard nudging is exact

Keyboard nudging MUST move the current movable selection by the exact requested increment rather than passing the result through guide snapping. A larger modified increment MAY be offered.

_Conformance:_ conforming

_Verify:_ inspect `nudge` in `packages/view-studio/src/app/editor/use-editor.ts`. against this requirement.

_Evidence:_ `nudge` in `packages/view-studio/src/app/editor/use-editor.ts`.

### EDIT-003 — Every route change is represented

When a component movement, endpoint reattachment or direct route edit changes a route, the pending change set MUST include the resulting route points. It MUST NOT report an attachment whose rendered route still ends at the former coordinate.

_Conformance:_ conforming

_Verify:_ inspect derived changes, attachments and routes in `packages/view-studio/src/app/editor/use-editor.ts`. against this requirement.

_Evidence:_ derived changes, attachments and routes in `packages/view-studio/src/app/editor/use-editor.ts`.

### EDIT-004 — Port counts are editable per side

Studio MUST allow each side's port count to be edited independently. Changing one side MUST NOT replace counts on untouched sides.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/guides.test.ts` covers layering a side-specific count over the counts in force.

_Evidence:_ `packages/view-model/src/guides.test.ts` covers layering a side-specific count over the counts in force.

### EDIT-005 — A port shows whether it is used

While editing, a port MUST visually distinguish whether a flow currently terminates on it. The port identity SHOULD be available on demand without permanently adding all port labels to the canvas.

_Conformance:_ conforming

_Verify:_ inspect port classes and labels in `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/view-canvas/src/styles.css`. against this requirement.

_Evidence:_ port classes and labels in `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/view-canvas/src/styles.css`.

### EDIT-006 — A flow end can be reattached to an offered port

A producer MUST be able to drag a selected flow endpoint to any compatible port currently offered on the canvas. The candidate port MUST be indicated before release, and releasing without a valid candidate MUST NOT silently reattach the endpoint.

_Conformance:_ conforming

_Verify:_ inspect endpoint drag and `dropPort` state in `packages/view-canvas/src/InfoschematicDiagram.tsx`. against this requirement.

_Evidence:_ endpoint drag and `dropPort` state in `packages/view-canvas/src/InfoschematicDiagram.tsx`.

### EDIT-007 — Flow waypoints can be edited deliberately

A selected flow MUST expose its interior waypoints. Adding or removing a waypoint MUST require an explicit editing action so an ordinary selection click cannot alter the route.

_Conformance:_ conforming

_Verify:_ inspect waypoint actions in `packages/view-studio/src/app/editor/use-editor.ts` and `packages/view-canvas/src/InfoschematicDiagram.tsx`. against this requirement.

_Evidence:_ waypoint actions in `packages/view-studio/src/app/editor/use-editor.ts` and `packages/view-canvas/src/InfoschematicDiagram.tsx`.

### EDIT-008 — Artefact geometry follows kind constraints

Region, Fabric, Card and Overlay boxes MUST move and resize on both axes and respect View Model minima. Point MUST move as a coordinate and MUST NOT acquire box geometry. Flow MUST retain route-specific editing.

Reorder MUST change authored order only inside the selected kind. Studio MUST NOT expose cross-family z-order. Adapter interaction MUST direct movement to the composed Card and MUST NOT offer independent Adapter resize.

_Conformance:_ conforming

_Verify:_ Canvas interaction tests under `packages/view-canvas/src/` and Studio artefact-control tests cover six-kind selection, constraints, actions and Flow, Point or Adapter exclusions.

_Evidence:_ Canvas interaction tests under `packages/view-canvas/src/` and Studio artefact-control tests cover six-kind selection, constraints, actions and Flow, Point or Adapter exclusions.

### EDIT-009 — Removal remains reviewable

Removing an authored artefact MUST mark it as pending removal rather than making it disappear immediately. Flows that cannot remain valid without that artefact MUST be named in the change set. Repeating the removal action MUST be able to lift the mark before the set is applied.

_Conformance:_ conforming

_Verify:_ inspect removal drafts in `packages/view-studio/src/app/editor/use-editor.ts`. against this requirement.

_Evidence:_ removal drafts in `packages/view-studio/src/app/editor/use-editor.ts`.

### EDIT-010 — A flow can be created between ports

Studio MAY create a flow by dragging from one port to another. Releasing anywhere other than a valid different port MUST create nothing. A newly created flow MUST enter the same selection, routing, editing and removal machinery as an authored flow.

Code allocation and allowed families MUST be supplied by the current Infoschematic rather than hard-coded by Studio.

_Conformance:_ conforming

_Verify:_ inspect creation state in `packages/view-studio/src/app/editor/use-editor.ts` and flow interaction in `packages/view-canvas/src/InfoschematicDiagram.tsx`. against this requirement.

_Evidence:_ creation state in `packages/view-studio/src/app/editor/use-editor.ts` and flow interaction in `packages/view-canvas/src/InfoschematicDiagram.tsx`.

### EDIT-011 — A card can be created with a valid default

Studio MAY create a card as one undoable action and allow its properties to be refined afterwards. A created card MUST have identity, placement and enough domain data to pass through the same selection, movement, port and removal machinery as an authored card.

Identity allocation, scope choice and default appearance MUST be supplied by the current Infoschematic rather than hard-coded by Studio.

_Conformance:_ conforming

_Verify:_ inspect `CreatedComponent` in `packages/view-model/src/editable.ts` and card creation state in `packages/view-studio/src/app/editor/use-editor.ts`. against this requirement.

_Evidence:_ `CreatedComponent` in `packages/view-model/src/editable.ts` and card creation state in `packages/view-studio/src/app/editor/use-editor.ts`.

### EDIT-012 — Moving a component carries attached presentation

Moving or resizing a Card or Fabric MUST carry every Flow route end attached to it to the effective position of its named port in the same preview frame. The nearest route run MAY change as required to remain orthogonal, but unrelated interior Waypoints and the opposite route end MUST remain stable. This invariant MUST hold for authored and newly created artefacts, with or without an existing route or attachment draft, and for pointer, keyboard and numeric placement.

When an Adapter or Wrapper Card derives its placement from another Card, moving either interactive representation MUST preserve the composition relationship rather than creating a second independent placement. A Flow attached to either constituent Card MUST follow the constituent Card whose port it names.

_Conformance:_ conforming

_Verify:_ run the dependent-geometry cases in `packages/view-model/src/artefact-draft.test.ts` and the rendered Canvas and Studio interaction suites.

_Evidence:_ `packages/view-model/src/artefact-draft.test.ts` covers authored, Adapter-attached, created, Waypoint-bearing and earlier-drafted routes; `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` and `packages/view-studio/src/app/App.browser.test.tsx` cover pointer, keyboard and numeric movement through rendered geometry and the reviewable change set.

### EDIT-013 — Library creation produces independent authored values

The Design Library MUST provide Card, Fabric and Flow templates. Instantiating a template MUST deep-copy its serialisable seed, allocate a fresh stable `id` and `code`, and create one ordinary typed operation. The created value MUST NOT contain Library metadata, template identity or provenance.

Card and Fabric creation MUST apply the current Scope and requested Canvas placement. Flow creation MUST require two valid, distinct endpoints and a selected Flow family, and MUST create an orthogonal route whose terminal points match the selected ports. Repeated instantiation MUST return independent nested values.

_Conformance:_ conforming

_Verify:_ `packages/view-studio/src/app/editor/library.test.ts`, `packages/view-studio/src/app/editor/artefact-factories.test.ts` and `packages/view-studio/src/app/editor/LibraryPanel.test.tsx`.

_Evidence:_ `packages/view-studio/src/app/editor/library.test.ts`, `packages/view-studio/src/app/editor/artefact-factories.test.ts` and `packages/view-studio/src/app/editor/LibraryPanel.test.tsx`.

### EDIT-014 — Design previews the complete materialised draft

Design MUST start from complete authored content rather than Audience filters and MUST materialise typed operations into a derived runtime for Canvas. Creates, movement, resize, property replacement, within-kind reorder and safe removal MUST be visible without mutating the host configuration. Existing component-offset, route, waypoint and attachment drafts MUST remain effective later overlays.

Rejected operations MUST leave their base output unchanged. Present MUST continue to resolve and render its active Sequence Overlay independently of Design's complete-content Overlay preview.

Draft projection MUST follow dependency order: effective component geometry, effective port geometry, endpoint attachment, interior route geometry, then route-label placement. A later draft layer MUST NOT restore an endpoint coordinate made stale by an earlier component move, resize or port-count change. Combining typed artefact operations with established draft fields MUST produce one coherent preview and one coherent change set rather than whichever representation happened to render last.

_Conformance:_ conforming

_Verify:_ inspect composition in `packages/view-studio/src/app/App.tsx` and preview derivation in `packages/view-canvas/src/InfoschematicDiagram.tsx`. against this requirement.

_Evidence:_ composition in `packages/view-studio/src/app/App.tsx` and preview derivation in `packages/view-canvas/src/InfoschematicDiagram.tsx`.

### EDIT-015 — Removal plans make consequences explicit

Removing a Card or Fabric MUST include endpoint Flow removals before the owner. Applied Card removal MUST also account for Adapter Cards that wrap it. Removing a Region MUST NOT cascade to any other artefact. Studio MUST block Overlay removal while a Sequence Scene directly references the Overlay and expose the reason to the Producer.

The underlying materialiser MUST remain total when it receives a direct Overlay removal by clearing Sequence references and Scene focus entries atomically. This cleanup is a safety boundary, not permission for Studio to bypass the review block.

_Conformance:_ conforming

_Verify:_ `packages/view-studio/src/app/editor/artefact-operations.test.ts` and `packages/view-model/src/artefact-draft.test.ts` cover removal plans, blocking and materialised cascades.

_Evidence:_ `packages/view-studio/src/app/editor/artefact-operations.test.ts` and `packages/view-model/src/artefact-draft.test.ts` cover removal plans, blocking and materialised cascades.

### EDIT-016 — Authored treatments are editable, and an optional one can be cleared

Every treatment a selected artefact authors MUST be editable through a typed control rather than only through free-text properties. A Region's frame style and opacity, fill, label placement, label mount and label offset are all such treatments.

Clearing an optional treatment MUST remove the authored member rather than write an empty or null value into the record, and MUST NOT be offered for a required one. A control value the artefact cannot carry MUST leave the artefact as it stands.

_Conformance:_ conforming

_Verify:_ `packages/view-studio/src/app/editor/region-treatments.test.ts` covers the control values, patches and clears, and `packages/view-studio/src/app/editor/artefact-operations.test.ts` covers member removal.

_Evidence:_ `packages/view-studio/src/app/editor/region-treatments.test.ts` covers the control values, patches and clears, and `packages/view-studio/src/app/editor/artefact-operations.test.ts` covers member removal.

### EDIT-017 — Port-count edits preserve attachments

Changing one side's port count MUST leave every attached Flow on a valid port of the same component. Where the former port position still exists, the Flow SHOULD retain that geometric position even if its port number changes. Where it does not, Studio MUST choose the nearest valid replacement deterministically and update both attachment identity and rendered route together. Reducing a side to zero ports MUST NOT leave a Flow claiming a port that is no longer offered; Studio MUST either require a valid replacement or surface a reviewable validation issue.

_Conformance:_ conforming

_Verify:_ inspect port reseating in `packages/view-studio/src/app/editor/infoschematic-editable.ts` and `packages/view-studio/src/app/editor/use-editor.ts`. against this requirement.

_Evidence:_ port reseating in `packages/view-studio/src/app/editor/infoschematic-editable.ts` and `packages/view-studio/src/app/editor/use-editor.ts`.

### EDIT-018 — Placement inputs have equivalent semantics

Pointer dragging, keyboard nudging and numeric placement MUST express the same movement of the same selected artefact and MUST produce equivalent effective geometry and dependent Flow projection. Their declared interaction policies MAY differ: pointer placement MAY use guides, keyboard movement MAY step by one unit of the authored `gridSize` when that size is non-zero, and numeric placement MAY be exact. Those policies MUST NOT select a different draft representation or omit dependent changes.

Zoom, pan, fit mode, panel layout and device-pixel ratio MUST NOT change the authored Canvas coordinate resulting from a pointer placement. A drag begun before a viewport change MUST either finish against one stable coordinate transform or cancel without recording a partial edit.

_Conformance:_ conforming

_Verify:_ inspect coordinate conversion in `packages/view-canvas/src/InfoschematicDiagram.tsx`, placement commands in `packages/view-studio/src/app/App.tsx`, and draft construction in `packages/view-studio/src/app/editor/use-editor.ts`. against this requirement.

_Evidence:_ coordinate conversion in `packages/view-canvas/src/InfoschematicDiagram.tsx`, placement commands in `packages/view-studio/src/app/App.tsx`, and draft construction in `packages/view-studio/src/app/editor/use-editor.ts`.

### EDIT-019 — Created artefacts enter the complete editing lifecycle

Once created, a Card, Fabric or Flow MUST support every operation its authored counterpart supports: selection, movement or route editing, property editing, attachment changes, removal, undo, redo, discard and deterministic change consolidation. Dependent geometry MUST resolve created identities and ports without relying on a register built only from authored configuration. Creating and then removing an artefact in one draft MUST leave no orphaned dependent operation.

_Conformance:_ conforming

_Verify:_ creation tests cover the full lifecycle after creation, including moving a created endpoint artefact and observing a connected created Flow.

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
