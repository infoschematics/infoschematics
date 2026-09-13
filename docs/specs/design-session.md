# Design session — DESIGN

Producer mode state, selection, hover, editing visibility, inspection, and rendered Studio verification. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### DESIGN-001 — Production mode is session state

Opening a Producer capability MUST be an explicit action that changes the transient `ProductionMode` to `design` or `direct`. A fresh application session and every reload MUST begin in `present`. Draft changes MAY survive reload, but `ProductionMode`, selection and the active Direct target MUST NOT be persisted.

_Conformance:_ conforming

_Verify:_ inspect `packages/view-studio/src/app/editor/use-editor.ts` and `packages/view-studio/src/app/hooks/use-persistent-state.ts`. against this requirement.

_Evidence:_ `packages/view-studio/src/app/editor/use-editor.ts` and `packages/view-studio/src/app/hooks/use-persistent-state.ts`.

### DESIGN-002 — Studio does not write authored source

Studio MUST NOT write repository source, a deployment service or an external data store by itself. It MUST consolidate edits into a change set that a host or producer can review and apply through a separately authorised workflow.

_Conformance:_ conforming

_Verify:_ inspect `packages/view-studio/src/app/editor/use-editor.ts` and `packages/view-studio/src/app/editor/ChangePane.tsx`. against this requirement.

_Evidence:_ `packages/view-studio/src/app/editor/use-editor.ts` and `packages/view-studio/src/app/editor/ChangePane.tsx`.

### DESIGN-003 — Reasserting the current mode changes nothing

Setting Studio to the mode it already occupies MUST preserve Audience preferences, presentation activity, Producer selection and drafts. A transition to another mode MAY establish that mode's defaults only after applying the cleanup rules below.

_Conformance:_ conforming

_Verify:_ inspect mode transitions in `packages/view-studio/src/app/editor/use-editor.ts`. against this requirement.

_Evidence:_ mode transitions in `packages/view-studio/src/app/editor/use-editor.ts`.

### DESIGN-004 — Mode transitions clean up presentation activity

Entering `design` or `direct` MUST stop Story playback and clear the active presentation focus without discarding Audience filters or Producer drafts. Returning to `present` MUST preserve Audience filters and MUST NOT restart playback or reactivate a previous Standalone Scene, Thematic Scene or Story.

Audience preferences and filters, presentation focus and playback, and Producer editing state MUST remain separate state areas so a mode transition cannot reset unrelated state accidentally.

_Verification: `packages/view-present/src/production.test.ts` covers all nine source-and-destination combinations; rendered application tests cover active-mode composition._

_Conformance:_ conforming

_Verify:_ inspect `reduceProduction` in `packages/view-present/src/production.ts`, composed by the Studio application. against this requirement.

_Evidence:_ `reduceProduction` in `packages/view-present/src/production.ts`, composed by the Studio application.

### DESIGN-005 — Producer modes use complete authored content

Design and Direct MUST derive their working Canvas from complete authored content rather than the Audience's Scope and Flow-family filters. Design MUST keep every editable artefact and Flow reachable. Direct MUST preview the focus of its own draft target without mutating active presentation focus.

_Conformance:_ conforming

_Verify:_ inspect active-mode composition in `packages/view-studio/src/app/App.tsx` and its Canvas derivation. against this requirement.

_Evidence:_ active-mode composition in `packages/view-studio/src/app/App.tsx` and its Canvas derivation.

### DESIGN-006 — Editing aids appear only while editing

The editing grid, ports and manipulation handles MUST be available while editing and MUST NOT appear in the ordinary presented view. The grid MUST be drawn beneath routes and artefacts so it cannot obscure the content it aligns.

_Conformance:_ conforming

_Verify:_ inspect editing layers in `packages/view-studio/src/app/InfoschematicDiagram.tsx` and `packages/view-studio/src/styles.css`. against this requirement.

_Evidence:_ editing layers in `packages/view-studio/src/app/InfoschematicDiagram.tsx` and `packages/view-studio/src/styles.css`.

### DESIGN-007 — Selection does not imply mutation

Selecting an artefact, flow, label, region, port or waypoint MUST NOT move or otherwise edit it. Selection and mutation MUST remain separate actions.

_Conformance:_ conforming

_Verify:_ inspect selection and handle contracts in `packages/view-model/src/editable.ts` and `packages/view-studio/src/app/editor/use-editor.ts`. against this requirement.

_Evidence:_ selection and handle contracts in `packages/view-model/src/editable.ts` and `packages/view-studio/src/app/editor/use-editor.ts`.

### DESIGN-008 — Selection can be cleared

A producer MUST be able to clear selection by choosing the canvas rather than another selectable thing.

_Conformance:_ conforming

_Verify:_ inspect `select` in `packages/view-studio/src/app/editor/use-editor.ts`. against this requirement.

_Evidence:_ `select` in `packages/view-studio/src/app/editor/use-editor.ts`.

### DESIGN-009 — The editor identifies the selected kind

The properties view MUST identify what kind of thing is selected before presenting placement or editable properties. An extent MUST state all four of `x`, `y`, `width` and `height`; fixed axes MAY be read-only rather than omitted.

_Conformance:_ conforming

_Verify:_ inspect `Placement` in `packages/view-model/src/editable.ts` and `packages/view-studio/src/app/panels/PlacementPanel.tsx`. against this requirement.

_Evidence:_ `Placement` in `packages/view-model/src/editable.ts` and `packages/view-studio/src/app/panels/PlacementPanel.tsx`.

### DESIGN-010 — Hover and selection use related, distinct treatments

Every selectable kind SHOULD use one visual treatment family for pointing and selection. Pointing and selection MUST remain distinguishable because pointing is transient while selection persists.

_Conformance:_ conforming

_Verify:_ inspect selected and hovered state in `packages/view-studio/src/app/editor/use-editor.ts` and styles in `packages/view-studio/src/styles.css`. against this requirement.

_Evidence:_ selected and hovered state in `packages/view-studio/src/app/editor/use-editor.ts` and styles in `packages/view-studio/src/styles.css`.

### DESIGN-011 — A flow is selectable by its route

A producer MUST be able to select a flow by its rendered route rather than only through its label or a separate register. The interactive target SHOULD be wider than the visible stroke so a thin line remains practical to select.

_Conformance:_ conforming

_Verify:_ inspect flow interaction in `packages/view-studio/src/app/InfoschematicDiagram.tsx` and pointer-target styles in `packages/view-studio/src/styles.css`. against this requirement.

_Evidence:_ flow interaction in `packages/view-studio/src/app/InfoschematicDiagram.tsx` and pointer-target styles in `packages/view-studio/src/styles.css`.

### DESIGN-012 — A selected flow exposes both attachments

Selecting a flow MUST identify its source and target artefacts and ports. The attachment presentation MUST distinguish those ports from other ports on the same artefacts.

_Conformance:_ conforming

_Verify:_ inspect selected-flow derivation in `packages/view-studio/src/app/App.tsx` and port rendering in `packages/view-studio/src/app/InfoschematicDiagram.tsx`. against this requirement.

_Evidence:_ selected-flow derivation in `packages/view-studio/src/app/App.tsx` and port rendering in `packages/view-studio/src/app/InfoschematicDiagram.tsx`.

### DESIGN-013 — Fabrics participate as artefacts

A fabric with authored placement and ports MUST be selectable and editable through the same generic artefact capabilities as a card wherever those capabilities apply. Studio MUST NOT reduce a fabric to inert decoration merely because its renderer differs.

_Conformance:_ conforming

_Verify:_ inspect placeable handles in `packages/view-studio/src/app/editor/infoschematic-editable.ts`. against this requirement.

_Evidence:_ placeable handles in `packages/view-studio/src/app/editor/infoschematic-editable.ts`.

### DESIGN-014 — Design exposes the six-kind capability contract

Design MUST use discriminated Region, Fabric, Card, Flow, Point and Overlay selections shared with Canvas and View Model. Region, Fabric, Card and Overlay MUST be pointer-selectable and keyboard-selectable, movable, resizable, property-editable, removable and reorderable. Point MUST be pointer-selectable and keyboard-selectable, movable, property-editable, removable and reorderable, but MUST NOT expose box resize. Flow MUST be pointer-selectable and keyboard-selectable, property-editable, removable and reorderable, but MUST use endpoint and waypoint tools instead of generic move or resize.

The selected kind MUST determine the Properties controls. A stale or empty selection MUST render a total empty state rather than interpreting an identifier as another kind.

_Conformance:_ conforming

_Verify:_ inspect `packages/view-model/src/editable.ts`, `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/view-studio/src/app/editor/ArtefactControls.tsx`. against this requirement.

_Evidence:_ `packages/view-model/src/editable.ts`, `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/view-studio/src/app/editor/ArtefactControls.tsx`.

## Quality properties

### DESIGN-015 — The rendered editor is tested

Studio MUST have rendered interaction tests covering both read-only and editing-capable composition. Model-only and static-markup tests MUST NOT be the sole verification for controls whose behaviour depends on rendered layering, pointer capture, coordinate conversion or interaction between draft layers.

At minimum, the rendered regression matrix MUST exercise selection and clearing, hover, pointer movement, keyboard movement, numeric placement, resize, within-kind reorder, property editing and clearing, creation, pending removal, port-count changes, Flow endpoint attachment, Waypoint and segment editing, route-label placement, undo, redo, individual change removal and whole-draft discard. Geometry cases MUST assert both what Canvas renders and what the reviewable change set records. Each dependent-geometry case MUST cover a plain authored route, a route with interior Waypoints, an existing route draft and a newly created Flow. At least one movement case MUST run while zoomed and panned.

_Conformance:_ divergent

_Verify:_ rendered tests under `packages/view-canvas/src/` and `packages/view-studio/src/app/` drive interaction events and inspect resulting SVG geometry and change-set state.

_Evidence:_ rendered tests under `packages/view-canvas/src/` and `packages/view-studio/src/app/` drive interaction events and inspect resulting SVG geometry and change-set state.

### DESIGN-016 — Register rows align without wrapping identity

Info and specification register rows MUST align identity, title, and detail columns consistently, and an authored identifier MUST NOT wrap within its identity column.

_Conformance:_ conforming

_Verify:_ render narrow and wide Details panels with short and long identifiers and compare column alignment.

_Evidence:_ `packages/view-studio/src/app/panels/ModelRegister.tsx`, `SpecificationTree.tsx`, and the shared Studio styles use explicit identity columns.
