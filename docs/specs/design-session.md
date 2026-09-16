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

Entering `design` or `direct` MUST stop Sequence playback and clear the active presentation focus without discarding Audience filters or Producer drafts. Returning to `present` MUST preserve Audience filters and MUST NOT restart playback or reactivate a previous Standalone or Sequence Scene.

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

The editing grid, ports and manipulation handles MUST be available while editing and MUST NOT appear in the ordinary presented view. The grid MUST be drawn beneath routes and artefacts so it cannot obscure the content it aligns. Its spacing MUST follow the Diagram's authored `gridSize`, and an authored size of `0` MUST suppress both the overlay and grid rounding while leaving alignment-guide snapping independently controllable.

_Conformance:_ conforming

_Verify:_ inspect the editing layers `edit-grid`, `audit-port` and `artefact-resize-handle` in `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/view-canvas/src/styles.css`, and the grid control in `packages/view-studio/src/app/editor/EditorTools.tsx`. against this requirement.

_Evidence:_ the editing layers `edit-grid`, `audit-port` and `artefact-resize-handle` in `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/view-canvas/src/styles.css`, and the grid control in `packages/view-studio/src/app/editor/EditorTools.tsx`.

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

_Verify:_ inspect selected and hovered state in `packages/view-studio/src/app/editor/use-editor.ts`, and the treatments `pointed` and `selected` in `packages/view-canvas/src/styles.css`. against this requirement.

_Evidence:_ selected and hovered state in `packages/view-studio/src/app/editor/use-editor.ts`, and the treatments `pointed` and `selected` in `packages/view-canvas/src/styles.css`.

### DESIGN-011 — A flow is selectable by its route

A producer MUST be able to select a flow by its rendered route rather than only through its label or a separate register. The interactive target SHOULD be wider than the visible stroke so a thin line remains practical to select.

_Conformance:_ conforming

_Verify:_ inspect flow interaction in `packages/view-canvas/src/InfoschematicDiagram.tsx` and pointer-target styles in `packages/view-canvas/src/styles.css`. against this requirement.

_Evidence:_ flow interaction in `packages/view-canvas/src/InfoschematicDiagram.tsx` and pointer-target styles in `packages/view-canvas/src/styles.css`.

### DESIGN-012 — A selected flow exposes both attachments

Selecting a flow MUST identify its source and target artefacts and ports. The attachment presentation MUST distinguish those ports from other ports on the same artefacts.

_Conformance:_ conforming

_Verify:_ inspect selected-flow derivation and attachment port rendering in `packages/view-canvas/src/InfoschematicDiagram.tsx`, and the attachment presentation in `packages/view-studio/src/app/editor/FlowEnds.tsx`. against this requirement.

_Evidence:_ selected-flow derivation and attachment port rendering in `packages/view-canvas/src/InfoschematicDiagram.tsx`, and the attachment presentation in `packages/view-studio/src/app/editor/FlowEnds.tsx`.

### DESIGN-013 — Fabrics participate as artefacts

A fabric with authored placement and ports MUST be selectable and editable through the same generic artefact capabilities as a card wherever those capabilities apply. Studio MUST NOT reduce a fabric to inert decoration merely because its renderer differs.

_Conformance:_ conforming

_Verify:_ inspect placeable handles in `packages/view-studio/src/app/editor/infoschematic-editable.ts`. against this requirement.

_Evidence:_ placeable handles in `packages/view-studio/src/app/editor/infoschematic-editable.ts`.

### DESIGN-014 — Design exposes the six-kind capability contract

Design MUST use discriminated Region, Fabric, Card, Flow, Point and Overlay selections shared with Canvas and View Model. Region, Fabric, Card and Overlay MUST be pointer-selectable and keyboard-selectable, movable, resizable, property-editable, removable and reorderable. Point MUST be pointer-selectable and keyboard-selectable, movable, property-editable, removable and reorderable, but MUST NOT expose box resize. Flow MUST be pointer-selectable and keyboard-selectable, property-editable, removable and reorderable, but MUST use endpoint and waypoint tools instead of generic move or resize.

The selected kind MUST determine the Properties controls. A stale or empty selection MUST render a total empty state rather than interpreting an identifier as another kind.

_Conformance:_ divergent

Every kind but Point holds. Point is declared pointer-selectable and keyboard-selectable, and no renderer in Canvas hit-tests one, so a Point can be neither pointed at nor reached; the rest of its capability contract is in place. Tracked as [Point interactivity in Design](../roadmap/INFOSCHEMATICS-TOOL-063-design-point-interactivity.md).

_Verify:_ inspect `packages/view-model/src/editable.ts`, `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/view-studio/src/app/editor/ArtefactControls.tsx`. against this requirement.

_Evidence:_ `packages/view-model/src/editable.ts`, `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/view-studio/src/app/editor/ArtefactControls.tsx`.

### DESIGN-018 — Design interaction is filterable by element kind

Design MUST let a Producer choose, per element kind, whether elements of that kind answer interaction, and MUST open every session with every kind interactive. Closing a kind MUST remove its elements from pointer hit testing and from keyboard reach, and MUST leave their authored data, their place in the document, and their rendered appearance unchanged. An affordance that exists only to operate a kind — a Card port, which exists to attach a Flow — MUST follow that kind's layer rather than its host's.

A selection whose kind is closed MUST be released, because its own controls would otherwise be the only way to reach an element that no longer answers. The chosen filter is session state: it MUST NOT be written to authored source, and it MUST reset to every kind interactive whenever the Design session opens or closes.

_Conformance:_ conforming

The five kinds Canvas hit-tests are each filterable. Point is filterable vacuously, because no renderer in Canvas hit-tests a Point and so there is no Point interaction for a layer to withhold; that gap belongs to `DESIGN-014`, which records it, and is tracked as [Point interactivity in Design](../roadmap/INFOSCHEMATICS-TOOL-063-design-point-interactivity.md).

_Verify:_ run the Chromium layer cases in `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` and `packages/view-studio/src/app/App.browser.test.tsx`. They resolve each press through `elementFromPoint`, so a closed kind that merely stopped listening while still taking pointer events fails.

_Evidence:_ `packages/view-model/src/editable.ts` defines the layer set and the selection rule; `packages/view-canvas/src/InfoschematicDiagram.tsx` withholds the selectable classes, the `role`, and the `tabIndex` of a closed kind and marks it `layer-inert`; `packages/view-canvas/src/styles.css` takes `layer-inert` out of hit testing; `packages/view-studio/src/app/editor/EditorTools.tsx` presents one control per kind and `use-editor.ts` holds the set for the session only.

### DESIGN-019 — A selection's controls draw above the diagram

While an element is selected, its resize handle and within-kind actions MUST be rendered above every element the diagram places, and MUST return to the ordinary order as soon as the selection changes, clears, or Design mode ends. Nothing about this promotion MAY be authored, and it MUST NOT change the canonical order of any authored array.

_Conformance:_ conforming

_Verify:_ inspect the rendered document order for a selected Region that an overlapping Card would otherwise cover; the controls MUST follow every `data-artefact-id` group.

_Evidence:_ `packages/view-canvas/src/InfoschematicDiagram.tsx` resolves the selection's controls once and draws them in a trailing `infoschematic-foreground` group; `packages/view-canvas/src/InfoschematicDiagram.editing.test.tsx` asserts the order for every non-Flow kind. A selected Flow already draws as a whole route above the Cards, so its controls travel with it.

### DESIGN-020 — A Design selection may hold several elements

Design MUST allow several elements to be held at once, MUST keep them in the order they were taken, and MUST treat the first as the [selection anchor](../reference/vocabulary.md#selection-anchor). A single selection MUST remain the one-element case of the same selection, so every control that acts on the selection acts on the anchor. Adding one element to the group, and taking one back out, MUST be available by pointer and by keyboard; a range gesture that gathers everything it covers MAY be pointer-only.

Only kinds the capability matrix records as movable MAY take part in a group geometry operation, so a Flow held in the group MUST be left to the ports it is attached to rather than aligned directly. An element whose [interaction layer](../reference/vocabulary.md#interaction-layer) closes MUST leave the group exactly as it leaves a single selection.

Align MUST offer left, horizontal centre, right, top, vertical centre and bottom. Each MUST bring every other participant onto that edge or centre line of the anchor, MUST leave the anchor where it is, and MUST NOT move any participant on the other axis. Distribute MUST offer horizontal and vertical spacing, MUST equalise the gaps between participants, and MUST leave the two outermost participants where they are. Two participants MUST be required to align and three to distribute; a control that cannot act MUST be disabled rather than absent.

Every group operation MUST record ordinary coordinate changes that a later editor can change freely, MUST NOT persist any alignment relationship, and MUST be reversible in one undo step. The reviewable change set MAY list one row per changed element, because a row names the authored source a review has to read.

_Conformance:_ conforming

_Verify:_ run the group cases in `packages/view-model/src/editable-capabilities.test.ts`, `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` and `packages/view-studio/src/app/App.browser.test.tsx`.

_Evidence:_ `packages/view-model/src/editable.ts` holds the ordered selection set, reads participation from `artefactCapabilities`, and computes `alignOffsets` and `distributeOffsets` as pure geometry; `packages/view-canvas/src/InfoschematicDiagram.tsx` adds Shift to a press and to Enter, sweeps a range band over the geometry it drew, and marks non-anchor members `group-held`; `packages/view-studio/src/app/editor/use-editor.ts` records every participant's move inside one checkpoint; `packages/view-studio/src/app/editor/EditorTools.tsx` presents the six align and two distribute controls.

### DESIGN-021 — Entering a Producer mode opens the panel dock

Entering `design` or `direct` MUST leave the [Details panel](../reference/vocabulary.md#details-panel) dock open and the entered mode's own controls reachable as rendered. The compact collapsed rail is a Present affordance under `PRESENT-009` and MUST NOT be offered as a Producer mode's working surface, so a Producer mode MUST NOT be entered onto a collapsed dock.

The dock MUST open as a transient consequence of the transition and MUST NOT rewrite the persisted collapse preference. Collapsing the dock while a Producer mode is current MUST hold for the rest of that occupancy, across re-renders and selection changes. Returning to `present` MUST restore the persisted preference unchanged, so a visit to a Producer mode MUST NOT alter how Present opens for that document, and a reload MUST restore that preference and no part of the mode that opened the dock, as `DESIGN-001` requires. Entering the other Producer mode is a further entry and MAY open the dock again. Per-mode memory of a Producer's collapse is not required.

A mode transition MUST leave the dock on the entered mode's own panel. Transient panel state that names a surface shared between modes, such as the authored-source view, MUST NOT survive the transition and take priority over the entered mode's controls.

_Conformance:_ conforming

_Verify:_ run the dock cases in `packages/view-studio/src/app/App.browser.test.tsx`, which load `packages/view-studio/src/styles.css` and assert reachability through `offsetParent` rather than presence, because the collapsed dock hides a mounted panel rather than unmounting it.

_Evidence:_ `packages/view-studio/src/app/App.tsx` holds the persisted preference beside a transient dock override, sets the override on entry to a Producer mode, drops it on entry to `present`, and routes the panel toggle to whichever of the two the current mode owns; `packages/view-studio/src/app/panels/PanelRail.tsx` stays Present-only; `packages/view-studio/src/app/panels/DetailsPanel.tsx` resets its authored-source view when the mode changes; `packages/view-studio/src/app/App.browser.test.tsx` covers Present to Design, a collapse made inside Design surviving a selection change, Design to Direct, Direct to Present with the `localStorage` preference read back directly, and a fresh mount; `docs/decisions/ADR-INFOSCHEMATICS-028-panels-follow-the-mode.md` records the preference model and the rejected alternative.

## Quality properties

### DESIGN-015 — The rendered editor is tested

Studio MUST have rendered interaction tests covering both read-only and editing-capable composition. Model-only and static-markup tests MUST NOT be the sole verification for controls whose behaviour depends on rendered layering, pointer capture, coordinate conversion or interaction between draft layers.

At minimum, the rendered regression matrix MUST exercise selection and clearing, hover, pointer movement, keyboard movement, numeric placement, resize, within-kind reorder, property editing and clearing, creation, pending removal, port-count changes, Flow endpoint attachment, Waypoint and segment editing, route-label placement, undo, redo, individual change removal, whole-draft discard, closing and reopening an interaction layer, additive and range selection, moving a held group as one, each align and distribute operation, and reversing a whole group operation with one undo. Geometry cases MUST assert both what Canvas renders and what the reviewable change set records. Each dependent-geometry case MUST cover a plain authored route, a route with interior Waypoints, an existing route draft and a newly created Flow. At least one movement case MUST run while zoomed and panned.

_Conformance:_ conforming

_Verify:_ run the Chromium suites in `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` and `packages/view-studio/src/app/App.browser.test.tsx`.

_Evidence:_ `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` exercises native coordinate conversion, pointer lifecycle, viewport movement, selection, hover, resize, reorder, pending removal, Flow attachment, Waypoint and segment gestures, route-label placement and dependent route projection; `packages/view-studio/src/app/App.browser.test.tsx` exercises keyboard and numeric movement, port counts, creation, property replacement and clearing, undo, redo, individual change removal and whole-draft discard against rendered SVG and the change list.

### DESIGN-016 — Register rows align without wrapping identity

Info and specification register rows MUST align identity, title, and detail columns consistently, and an authored identifier MUST NOT wrap within its identity column.

_Conformance:_ conforming

_Verify:_ render narrow and wide Details panels with short and long identifiers and compare column alignment.

_Evidence:_ `packages/view-studio/src/app/panels/ModelRegister.tsx`, `SpecificationTree.tsx`, and the shared Studio styles use explicit identity columns.

### DESIGN-017 — Embedded instances stay independent

A host document MAY mount several inline Canvases over different authored Infoschematics at once. Hover, selection, accessible naming, and authored artefact identity MUST resolve per instance even when two documents author the same codes, and mounting or unmounting one instance MUST NOT change another's rendered state or listeners. A remounted instance MUST behave as a fresh mount.

_Conformance:_ divergent

Interaction, identity, and accessible naming do resolve per instance. Rendered appearance does not: renderer-internal SVG `defs` identifiers are document-global, so two instances sharing a Flow-family or grid identifier both resolve to the first definition in the document, which is one instance's rendering changing with another's presence. Tracked as [Scoped renderer definition identity](../roadmap/INFOSCHEMATICS-TOOL-058-scoped-renderer-definition-identity.md).

_Verify:_ run the Chromium host-fixture suite; it fails when identity or naming leaks across instances, which can be confirmed by giving both fixtures the same title and Card labels.

_Evidence:_ `packages/view-canvas/src/InfoschematicDiagram.host.browser.test.tsx` mounts two deliberately code-colliding documents in one host, exercises per-instance hover and selection, and unmounts and remounts one instance while the other stays live.
