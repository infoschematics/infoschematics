# Design session — DESIGN

Producer workspace state, selection, hover, editing visibility, inspection, and rendered Studio verification. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### DESIGN-001 — Production state is session state

Opening a Producer capability MUST be an explicit action that takes up the Producer's tools in a named workspace, `design` or `direct`. A fresh application session and every reload MUST begin not producing. Draft changes MAY survive reload, but neither production axis, nor selection, nor the active Direct target MUST be persisted.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-present test`, whose first case asserts a fresh session is not producing and has no Direct target; then, in a Playground served by `bun run self:dev`, enter Design, select an artefact, edit a property and reload. The session MUST come back not producing, with nothing selected and no Direct target, while the draft change MAY still be listed; a reload that restores either axis or the selection fails the requirement.

_Evidence:_ `packages/view-studio/src/app/editor/use-editor.ts` and `packages/view-studio/src/app/hooks/use-persistent-state.ts`.

### DESIGN-002 — Studio does not write authored source

Studio MUST NOT write repository source, a deployment service or an external data store by itself. It MUST consolidate edits into a change set that a host or producer can review and apply through a separately authorised workflow.

_Conformance:_ conforming

_Verify:_ enter Design in the Playground, make and keep an edit, then run `git status --short examples apps`. The working tree MUST be clean, because the edit belongs in the reviewable change set until a host applies it; a modified authored document, or an edit that reaches a data store without a separately authorised step, fails the requirement.

_Evidence:_ `packages/view-studio/src/app/editor/use-editor.ts` and `packages/view-studio/src/app/editor/ChangePane.tsx`.

### DESIGN-003 — Reasserting the current mode changes nothing

Setting Studio to the mode it already occupies MUST preserve Audience preferences, presentation activity, Producer selection and drafts. A transition to another mode MAY establish that mode's defaults only after applying the cleanup rules below.

_Conformance:_ conforming

_Verify:_ in Design, apply an Audience filter, start editing, select an artefact, then choose Design again. The filter, the draft and the selection MUST all survive; a reassertion that clears any of them fails the requirement.

_Evidence:_ mode transitions in `packages/view-studio/src/app/editor/use-editor.ts`.

### DESIGN-004 — Mode transitions clean up presentation activity

Entering `design` or `direct` MUST stop Sequence playback and clear the active presentation focus without discarding Audience filters or Producer drafts. Returning to `present` MUST preserve Audience filters and MUST NOT restart playback or reactivate a previous Standalone or Sequence Scene.

Audience preferences and filters, presentation focus and playback, and Producer editing state MUST remain separate state areas so a mode transition cannot reset unrelated state accidentally.

_Verification: `packages/view-present/src/production.test.ts` covers all nine source-and-destination combinations; rendered application tests cover active-mode composition._

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-present test`, whose transition table covers all nine source-and-destination pairs and asserts that returning to Present neither resumes playback nor reactivates a Scene. Make `reduceProduction` carry playback across an entry into `design`, or drop an Audience filter on the way in, and those cases fail; the rendered half is an entry into Design while a Sequence plays, which MUST stop the playback and leave the filters standing.

_Evidence:_ `reduceProduction` in `packages/view-present/src/production.ts`, composed by the Studio application.

### DESIGN-005 — A Producer controls what they draw

Which [Architectural Scopes](../reference/vocabulary.md#scope) and which [Flow families](../reference/vocabulary.md#flow-family) are drawn is a question about the Diagram rather than about presenting it, so the bank that answers it MUST be offered whether or not a Producer is producing, and in either workspace, and its state MUST carry across any move on either axis unchanged. A Producer MUST NOT filter their working Canvas by a control the workspace withholds: a filter nothing on screen can change is worse company for an editing surface than no filter at all. Design MUST therefore keep every editable artefact and Flow reachable from the Design Canvas itself, by showing which Scopes and families are currently hidden and letting a [Producer](../reference/vocabulary.md#producer) restore them there.

Playback belongs to the Audience's view. A Producer workspace MUST NOT run the view through [Scene](../reference/vocabulary.md#scene) focus, and MUST NOT offer [Sequence](../reference/vocabulary.md#sequence) or [Diagram Dynamic](../reference/vocabulary.md#diagram-dynamic) playback, because those states belong to a presentation the Producer is in the middle of authoring. Direct MUST preview the focus of its own draft target without mutating active presentation focus.

_Conformance:_ conforming

_Verify:_ hide a Scope in the Audience view, then enter Design: the Scope bank MUST be present with that Scope reading as off, and turning it back on MUST return every artefact in it to the Design Canvas as editable. A Design Canvas that filters by a bank it does not offer fails the requirement, and so does one that silently draws everything while the bank still reads as off. In the same mode the Sequence and Dynamic banks MUST be absent. In Direct, draft a Scene focus and confirm the presented focus behind it does not move.

_Evidence:_ `reduceProduction` in `packages/view-present/src/production.ts` admits visibility actions in any mode and holds the rest to Present; `packages/view-studio/src/app/hooks/use-presentation.ts` derives visible content from presentation state without substituting complete content for a Producer; `packages/view-studio/src/app/panels/ProducerControls.tsx` gates only the playback banks on Present; `packages/view-studio/src/app/App.browser.test.tsx` covers the banks operating in Design and the Sequence bank returning with Present.

### DESIGN-006 — Editing aids appear only while editing

The editing grid, ports and manipulation handles MUST be available while editing and MUST NOT appear in the ordinary presented view. The grid MUST be drawn beneath routes and artefacts so it cannot obscure the content it aligns. Its spacing MUST follow the Diagram's authored `gridSize`, and an authored size of `0` MUST suppress both the overlay and grid rounding, leaving placement exact.

_Conformance:_ conforming

_Verify:_ compare one document presented and in Design. Grid, ports and handles MUST be absent in `present` and available in Design, and the grid MUST paint beneath routes and artefacts rather than over them. Author `gridSize: 0` and both the overlay and grid rounding MUST stop, leaving a dragged artefact where the pointer left it.

_Evidence:_ the editing layers `edit-grid`, `audit-port` and `artefact-resize-handle` in `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/view-canvas/src/styles.css`, and the grid control in `packages/view-studio/src/app/editor/EditorTools.tsx`.

### DESIGN-007 — Selection does not imply mutation

Selecting an artefact, flow, label, region, port or waypoint MUST NOT move or otherwise edit it. Selection and mutation MUST remain separate actions.

_Conformance:_ conforming

_Verify:_ select each of an artefact, a flow, a label, a region, a port and a waypoint in turn, then read the change set. It MUST stay empty, because selecting is not editing; a selection that records a change, or nudges what it selected, fails the requirement.

_Evidence:_ selection and handle contracts in `packages/view-model/src/editable.ts` and `packages/view-studio/src/app/editor/use-editor.ts`.

### DESIGN-008 — Selection can be cleared

A producer MUST be able to clear selection by choosing the canvas rather than another selectable thing.

_Conformance:_ conforming

_Verify:_ select an artefact, then press the canvas away from anything selectable. The selection MUST clear; a canvas press that leaves the previous selection standing fails the requirement.

_Evidence:_ `select` in `packages/view-studio/src/app/editor/use-editor.ts`.

### DESIGN-009 — The editor identifies the selected kind

The properties view MUST identify what kind of thing is selected before presenting placement or editable properties. An extent MUST state all four of `x`, `y`, `width` and `height`; fixed axes MAY be read-only rather than omitted.

_Conformance:_ conforming

_Verify:_ select a Card, a Region, a Flow and a Point in turn and read the properties view. Each MUST name the kind it has selected before offering placement, and a box extent MUST show all four of `x`, `y`, `width` and `height` — read-only on a fixed axis rather than dropped.

_Evidence:_ `Placement` in `packages/view-model/src/editable.ts` and `packages/view-studio/src/app/panels/PlacementPanel.tsx`.

### DESIGN-010 — Hover and selection use related, distinct treatments

Every selectable kind SHOULD use one visual treatment family for pointing and selection. Pointing and selection MUST remain distinguishable because pointing is transient while selection persists.

_Conformance:_ conforming

_Verify:_ point at an artefact and then select it, and look at the two treatments together. They MUST read as one family and MUST stay distinguishable; treatments that render identically fail the requirement, as does a pointing treatment that outlives the pointer.

_Evidence:_ selected and hovered state in `packages/view-studio/src/app/editor/use-editor.ts`, and the treatments `pointed` and `selected` in `packages/view-canvas/src/styles.css`.

### DESIGN-011 — A flow is selectable by its route

A producer MUST be able to select a flow by its rendered route rather than only through its label or a separate register. The interactive target SHOULD be wider than the visible stroke so a thin line remains practical to select.

_Conformance:_ conforming

_Verify:_ press a Flow on its route, well away from its label, and confirm it selects; then press a unit or two off the visible stroke and confirm it still selects. A Flow reachable only through its label, or only by hitting the stroke exactly, fails the requirement.

_Evidence:_ flow interaction in `packages/view-canvas/src/InfoschematicDiagram.tsx` and pointer-target styles in `packages/view-canvas/src/styles.css`.

### DESIGN-012 — A selected flow exposes both attachments

Selecting a flow MUST identify its source and target artefacts and ports. The attachment presentation MUST distinguish those ports from other ports on the same artefacts.

_Conformance:_ conforming

_Verify:_ select a Flow and read its properties. Both the source and the target artefact and port MUST be named, and those two ports MUST be presented differently from the other ports on the same artefacts; attachment ports that render like every other port fail the requirement.

_Evidence:_ selected-flow derivation and attachment port rendering in `packages/view-canvas/src/InfoschematicDiagram.tsx`, and the attachment presentation in `packages/view-studio/src/app/editor/FlowEnds.tsx`.

### DESIGN-013 — Fabrics participate as artefacts

A fabric with authored placement and ports MUST be selectable and editable through the same generic artefact capabilities as a card wherever those capabilities apply. Studio MUST NOT reduce a fabric to inert decoration merely because its renderer differs.

_Conformance:_ conforming

_Verify:_ select an authored Fabric that has placement and ports, and exercise the generic artefact capabilities against it — move, resize, edit properties, remove, reorder — then do the same to a Card. A Fabric that answers fewer of them than a Card fails the requirement.

_Evidence:_ placeable handles in `packages/view-studio/src/app/editor/infoschematic-editable.ts`.

### DESIGN-014 — Design exposes the six-kind capability contract

Design MUST use discriminated Region, Fabric, Card, Flow, Point and Overlay selections shared with Canvas and View Model. Region, Fabric, Card and Overlay MUST be pointer-selectable and keyboard-selectable, movable, resizable, property-editable, removable and reorderable. Point MUST be pointer-selectable and keyboard-selectable, movable, property-editable, removable and reorderable, but MUST NOT expose box resize. Flow MUST be pointer-selectable and keyboard-selectable, property-editable, removable and reorderable, but MUST use endpoint and waypoint tools instead of generic move or resize.

The selected kind MUST determine the Properties controls. A stale or empty selection MUST render a total empty state rather than interpreting an identifier as another kind.

_Conformance:_ conforming

A Point carries the third geometry role rather than a box, which is what `ADR-INFOSCHEMATICS-028` settles: it is a sixth kind of its own, so it moves as a coordinate and offers no box resize to withhold.

_Verify:_ run the Point cases in `packages/view-studio/src/app/App.browser.test.tsx`. They aim a press eight units off a Point's centre and resolve it through `elementFromPoint`, so a Point that is drawn but cannot be reached fails rather than passing on its presence in the tree; deleting the widened target circle from `packages/view-canvas/src/InfoschematicDiagram.tsx` fails that one case.

_Evidence:_ `packages/view-model/src/editable.ts` declares the six-kind contract and gives a Point `move` without `resize`; `packages/view-canvas/src/InfoschematicDiagram.tsx` draws its press target, its selection treatment and its within-kind actions; `packages/view-studio/src/app/editor/infoschematic-editable.ts` resolves a `point:` key to that selection and to a `coordinate` placement; `packages/view-studio/src/app/editor/ArtefactControls.tsx` and `packages/view-studio/src/app/panels/PlacementPanel.tsx` present the properties and the typed coordinate.

### DESIGN-018 — Design interaction is filterable by element kind

Design MUST let a Producer choose, per element kind, whether elements of that kind answer interaction, and MUST open every session with every kind interactive. Closing a kind MUST remove its elements from pointer hit testing and from keyboard reach, and MUST leave their authored data, their place in the document, and their rendered appearance unchanged. An affordance that exists only to operate a kind — a Card port, which exists to attach a Flow — MUST follow that kind's layer rather than its host's.

A selection whose kind is closed MUST be released, because its own controls would otherwise be the only way to reach an element that no longer answers. The chosen filter is session state: it MUST NOT be written to authored source, and it MUST reset to every kind interactive whenever the Design session opens or closes.

_Conformance:_ conforming

All six kinds Canvas hit-tests are each filterable, and each layer withholds interaction a Producer could otherwise have had. A closed Point layer is the narrowest case: its press target is not drawn at all rather than drawn and ignored, so there is nothing under the pointer to take a press that nothing would answer.

_Verify:_ run the Chromium layer cases in `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` and `packages/view-studio/src/app/App.browser.test.tsx`. They resolve each press through `elementFromPoint`, so a closed kind that merely stopped listening while still taking pointer events fails.

_Evidence:_ `packages/view-model/src/editable.ts` defines the layer set and the selection rule; `packages/view-canvas/src/InfoschematicDiagram.tsx` withholds the selectable classes, the `role`, and the `tabIndex` of a closed kind and marks it `layer-inert`; `packages/view-canvas/src/styles.css` takes `layer-inert` out of hit testing; `packages/view-studio/src/app/editor/EditorTools.tsx` presents one control per kind and `use-editor.ts` holds the set for the session only.

### DESIGN-019 — A selection's controls draw above the diagram

While an element is selected, its resize handle and within-kind actions MUST be rendered above every element the diagram places, and MUST return to the ordinary order as soon as the selection changes, clears, or the Design workspace is left. Nothing about this promotion MAY be authored, and it MUST NOT change the canonical order of any authored array.

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

### DESIGN-021 — Taking up a Producer's tools opens the panel dock

Taking up the Producer's tools MUST leave the [Details panel](../reference/vocabulary.md#details-panel) dock open and the entered workspace's own controls reachable as rendered. The compact collapsed rail belongs to a reader who is not producing under `PRESENT-009` and MUST NOT be offered as a Producer's working surface, so a Producer MUST NOT be left on a collapsed dock.

The dock MUST open as a transient consequence of the transition and MUST NOT rewrite the persisted collapse preference. Collapsing the dock while producing MUST hold for the rest of that occupancy, across re-renders and selection changes. Putting the tools down MUST restore the persisted preference unchanged, so a visit to Design MUST NOT alter how the document opens for a reader, and a reload MUST restore that preference and no part of the producing that opened the dock, as `DESIGN-001` requires. Moving to the other workspace is a further entry and MAY open the dock again. Per-workspace memory of a Producer's collapse is not required.

Either transition MUST leave the dock on the entered workspace's own panel. Transient panel state that names a surface shared between workspaces, such as the authored-source view, MUST NOT survive the transition and take priority over the entered workspace's controls.

_Conformance:_ conforming

_Verify:_ run the dock cases in `packages/view-studio/src/app/App.browser.test.tsx`, which load `packages/view-studio/src/styles.css` and assert reachability through `offsetParent` rather than presence, because the collapsed dock hides a mounted panel rather than unmounting it.

_Evidence:_ `packages/view-studio/src/app/App.tsx` holds the persisted preference beside a transient dock override, sets the override whenever either axis moves while producing, drops it when the tools go down, and routes the panel toggle to whichever of the two the current position owns; `packages/view-studio/src/app/panels/PanelRail.tsx` renders nothing while producing; `packages/view-studio/src/app/panels/DetailsPanel.tsx` resets its authored-source view when either axis moves; `packages/view-studio/src/app/App.browser.test.tsx` covers Present to Design, a collapse made inside Design surviving a selection change, Design to Direct, Direct to Present with the `localStorage` preference read back directly, and a fresh mount; `docs/decisions/ADR-INFOSCHEMATICS-026-panels-follow-the-mode.md` records the preference model and the rejected alternative.

### DESIGN-022 — A design session resolves in the reader's colour scheme, and the reader may choose it

Studio MUST render its whole surface — title bar, panels, editors, and the frame around the Diagram — in whichever colour scheme is resolved, naming chrome roles rather than colours of its own. Every role MUST be answered in both schemes, so no panel is painted in one while the rest is painted in the other, and type over an accented or selected plane MUST move with the plane beneath it rather than staying a fixed ink.

Studio MUST offer a colour-scheme control in its title bar. It MUST carry an accessible name saying which scheme it moves to, MUST report the current scheme through `aria-pressed`, and MUST be operable from the keyboard, following the toggle conventions `DESIGN-005` already establishes for that bank. "Mode" is taken by `ADR-INFOSCHEMATICS-026`, so the control MUST say colour scheme.

Resolution order MUST be an explicit host choice, then the reader's stored choice, then the operating system, per [ADR-INFOSCHEMATICS-037](../decisions/ADR-INFOSCHEMATICS-037-a-palette-belongs-to-a-colour-scheme-not-an-outlet.md). A choice MUST survive a reload, and while none is stored the surface MUST keep following the operating system as it changes.

_Conformance:_ conforming

_Verify:_ run the Chromium cases in `packages/view-studio/src/app/App.schemes.browser.test.tsx`, which assert painted colour rather than resolved custom properties, because a role that resolves and is never painted from leaves the surface exactly as it was. Ask the runner for each preference rather than reading a rule out of the stylesheet. Falsified by a colour written into `packages/view-studio/src/styles.css`, by a pressed control whose type does not move with its plane, or by a stored choice the operating system overrides.

_Evidence:_ `packages/view-studio/src/app/App.schemes.browser.test.tsx` covers the resolved chrome, the control in the Appearance bank, the repaint on use, and emphatic type against the selected wash; `packages/view-canvas/src/colour-scheme.ts` holds the resolution order and the storage; `packages/view-canvas/src/ColourScheme.browser.test.tsx` covers the control's name, state, keyboard operation, and persistence; `scripts/stylesheet-literals.test.ts` holds the zero-literal floor.

## Quality properties

### DESIGN-015 — The rendered editor is tested

Studio MUST have rendered interaction tests covering both read-only and editing-capable composition. Model-only and static-markup tests MUST NOT be the sole verification for controls whose behaviour depends on rendered layering, pointer capture, coordinate conversion or interaction between draft layers.

At minimum, the rendered regression matrix MUST exercise selection and clearing, hover, pointer movement, keyboard movement, numeric placement, resize, within-kind reorder, property editing and clearing, creation, pending removal, port-count changes, Flow endpoint attachment, Waypoint and segment editing, route-label placement, undo, redo, individual change removal, whole-draft discard, closing and reopening an interaction layer, additive and range selection, moving a held group as one, each align and distribute operation, and reversing a whole group operation with one undo. Geometry cases MUST assert both what Canvas renders and what the reviewable change set records. Each dependent-geometry case MUST cover a plain authored route, a route with interior Waypoints, an existing route draft and a newly created Flow. At least one movement case MUST run while zoomed and panned.

Where a kind's press target is not the shape it paints — a Flow's route, a Point's mark — at least one case MUST aim a press at a coordinate on the Infoschematic and resolve it through the browser's own hit testing, rather than dispatching an event at an element already found in the tree. Presence in the tree is not reach: it says nothing about what a pointer would land on.

_Conformance:_ conforming

_Verify:_ run the Chromium suites in `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` and `packages/view-studio/src/app/App.browser.test.tsx`.

_Evidence:_ `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` exercises native coordinate conversion, pointer lifecycle, viewport movement, selection, hover, resize, reorder, pending removal, Flow attachment, Waypoint and segment gestures, route-label placement and dependent route projection; `packages/view-studio/src/app/App.browser.test.tsx` exercises keyboard and numeric movement, port counts, creation, property replacement and clearing, undo, redo, individual change removal and whole-draft discard against rendered SVG and the change list, and resolves a press aimed eight units off a Point's centre through `elementFromPoint` before moving that Point by key and by typed coordinate and removing it with the Flow attached to it.

### DESIGN-016 — Register rows align without wrapping identity

Info and specification register rows MUST align identity, title, and detail columns consistently, and an authored identifier MUST NOT wrap within its identity column.

_Conformance:_ conforming

_Verify:_ render narrow and wide Details panels with short and long identifiers and compare column alignment.

_Evidence:_ `packages/view-studio/src/app/panels/ModelRegister.tsx`, `SpecificationTree.tsx`, and the shared Studio styles use explicit identity columns.

### DESIGN-017 — Embedded instances stay independent

A host document MAY mount several inline Canvases over different authored Infoschematics at once. Hover, selection, accessible naming, authored artefact identity, and rendered appearance MUST resolve per instance even when two documents author the same codes, and mounting or unmounting one instance MUST NOT change another's rendered state or listeners. A remounted instance MUST behave as a fresh mount.

Rendered appearance includes the SVG definitions a rendering makes for itself. Because a `url(#…)` reference resolves to the first matching element in document order rather than the nearest one, every `marker` and `pattern` a Canvas defines MUST carry an identifier distinct from a sibling instance's, without the host having to configure anything. The default MUST be unique per mount within a React root, which is what "mount several inline Canvases" means; a host that instead assembles one document out of separately rendered passes MAY supply its own prefix, because no render pass can see another's identifiers.

_Conformance:_ conforming

_Verify:_ run the Chromium host-fixture suite; it fails when identity, naming, or appearance leaks across instances. Confirm the appearance half by removing the per-mount prefix from `InfoschematicDiagram`: the second instance then reads the first instance's Flow-family colour off the arrowhead it resolves, and the finer-gridded Diagram reads the coarser Diagram's tile pitch.

_Evidence:_ `packages/view-canvas/src/InfoschematicDiagram.host.browser.test.tsx` mounts two deliberately code-colliding documents in one host, exercises per-instance hover and selection, unmounts and remounts one instance while the other stays live, and asserts appearance per instance: the arrowhead each Flow resolves is defined inside its own instance and carries that instance's family colour, and each authored grid resolves to a pattern inside its own instance at its own authored pitch. `packages/view-canvas/src/InfoschematicDiagram.resources.test.tsx` covers disjoint identifiers across two Canvases in one tree, a closed reference loop, and the host-supplied prefix.

## Gaps

- Three compositions this area takes part in are recorded in [Composition](composition.md): `DESIGN-015` with `APPEAR-009` as `COMPOSE-001`, and `DESIGN-017` with `STATIC-015` enumerated but left with the divergence `INFOSCHEMATICS-TOOL-058` tracks. `DESIGN-020`'s clause about a closing interaction layer holds on the rendered surface but still has no case of its own in `DESIGN-015`'s matrix.
