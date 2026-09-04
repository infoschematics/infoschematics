# Studio View specification

Studio View adds Producer-facing editing to the lower interactive View contracts. It owns editing session drafts, but it does not own authored source or deployment decisions. `Studio` is the public component name and `App` remains a compatibility alias.

## Session

### EDIT-001 — Production mode is session state

Opening a Producer capability MUST be an explicit action that changes the transient `ProductionMode` to `design` or `direct`. A fresh application session and every reload MUST begin in `present`. Draft changes MAY survive reload, but `ProductionMode`, selection and the active Direct target MUST NOT be persisted.

_Implementation surface: `packages/view-studio/src/app/editor/use-editor.ts` and `packages/view-studio/src/app/hooks/use-persistent-state.ts`._

### EDIT-002 — Studio does not write authored source

Studio MUST NOT write repository source, a deployment service or an external data store by itself. It MUST consolidate edits into a change set that a host or producer can review and apply through a separately authorised workflow.

_Implementation surface: `packages/view-studio/src/app/editor/use-editor.ts` and `packages/view-studio/src/app/editor/ChangePane.tsx`._

### EDIT-064 — Reasserting the current mode changes nothing

Setting Studio to the mode it already occupies MUST preserve Audience preferences, presentation activity, Producer selection and drafts. A transition to another mode MAY establish that mode's defaults only after applying the cleanup rules below.

_Implementation surface: mode transitions in `packages/view-studio/src/app/editor/use-editor.ts`._

### EDIT-075 — Mode transitions clean up presentation activity

Entering `design` or `direct` MUST stop Story playback and clear the active presentation focus without discarding Audience filters or Producer drafts. Returning to `present` MUST preserve Audience filters and MUST NOT restart playback or reactivate a previous Standalone Scene, Thematic Scene or Story.

Audience preferences and filters, presentation focus and playback, and Producer editing state MUST remain separate state areas so a mode transition cannot reset unrelated state accidentally.

_Implementation surface: `reduceProduction` in `packages/view-present/src/production.ts`, composed by the Studio application._

_Verification: `packages/view-present/src/production.test.ts` covers all nine source-and-destination combinations; rendered application tests cover active-mode composition._

### EDIT-076 — Producer modes use complete authored content

Design and Direct MUST derive their working Canvas from complete authored content rather than the Audience's Scope and Flow-family filters. Design MUST keep every editable artefact and Flow reachable. Direct MUST preview the focus of its own draft target without mutating active presentation focus.

_Implementation surface: active-mode composition in `packages/view-studio/src/app/App.tsx` and its Canvas derivation._

## Direct

### EDIT-077 — Direct has a discriminated active target

Direct MUST represent its active authoring target as a discriminated value for exactly one Standalone Scene, Theme, Story, Callout or Storyboard. Every target MUST carry the stable identity required by its kind. A Callout target MUST identify its owning Theme or Story Scene. Mode selection, Direct target selection and Present focus MUST remain distinct operations.

A Callout storyboard MUST be associated with its selected presentation owner rather than introduced as another presentation-focus source.

_Implementation surface: `DirectTarget` and `reduceProduction` in `packages/view-present/src/production.ts`, composed by the Direct surface under `packages/view-studio/src/app`._

### EDIT-078 — Empty Themes and Stories remain authorable

Direct MUST permit creation and editing of a Theme or Story whose ordered Scene collection is empty. Those drafts MUST participate in the same undo, discard and reviewable change-set conventions as other Direct edits.

An empty Theme or Story MUST be identifiable as non-activatable, and Present MUST keep its activation action disabled until it contains a valid Scene. Editing or previewing the empty collection MUST NOT change presentation focus.

_Verification: Direct state and rendered-control tests cover empty creation, editing, undo, activation guards and the first valid Scene._

### EDIT-005 — Editing aids appear only while editing

The editing grid, ports and manipulation handles MUST be available while editing and MUST NOT appear in the ordinary presented view. The grid MUST be drawn beneath routes and artefacts so it cannot obscure the content it aligns.

_Implementation surface: editing layers in `packages/view-studio/src/app/InfoschematicDiagram.tsx` and `packages/view-studio/src/styles.css`._

## Selection

### EDIT-034 — Selection does not imply mutation

Selecting an artefact, flow, label, region, port or waypoint MUST NOT move or otherwise edit it. Selection and mutation MUST remain separate actions.

_Implementation surface: selection and handle contracts in `packages/view-model/src/editable.ts` and `packages/view-studio/src/app/editor/use-editor.ts`._

### EDIT-035 — Selection can be cleared

A producer MUST be able to clear selection by choosing the canvas rather than another selectable thing.

_Implementation surface: `select` in `packages/view-studio/src/app/editor/use-editor.ts`._

### EDIT-036 — The editor identifies the selected kind

The properties view MUST identify what kind of thing is selected before presenting placement or editable properties. An extent MUST state all four of `x`, `y`, `width` and `height`; fixed axes MAY be read-only rather than omitted.

_Implementation surface: `Placement` in `packages/view-model/src/editable.ts` and `packages/view-studio/src/app/panels/PlacementPanel.tsx`._

### EDIT-061 — Hover and selection use related, distinct treatments

Every selectable kind SHOULD use one visual treatment family for pointing and selection. Pointing and selection MUST remain distinguishable because pointing is transient while selection persists.

_Implementation surface: selected and hovered state in `packages/view-studio/src/app/editor/use-editor.ts` and styles in `packages/view-studio/src/styles.css`._

### EDIT-030 — A flow is selectable by its route

A producer MUST be able to select a flow by its rendered route rather than only through its label or a separate register. The interactive target SHOULD be wider than the visible stroke so a thin line remains practical to select.

_Implementation surface: flow interaction in `packages/view-studio/src/app/InfoschematicDiagram.tsx` and pointer-target styles in `packages/view-studio/src/styles.css`._

### EDIT-041 — A selected flow exposes both attachments

Selecting a flow MUST identify its source and target artefacts and ports. The attachment presentation MUST distinguish those ports from other ports on the same artefacts.

_Implementation surface: selected-flow derivation in `packages/view-studio/src/app/App.tsx` and port rendering in `packages/view-studio/src/app/InfoschematicDiagram.tsx`._

### EDIT-050 — Fabrics participate as artefacts

A fabric with authored placement and ports MUST be selectable and editable through the same generic artefact capabilities as a card wherever those capabilities apply. Studio MUST NOT reduce a fabric to inert decoration merely because its renderer differs.

_Implementation surface: placeable handles in `packages/view-studio/src/app/editor/infoschematic-editable.ts`._

### EDIT-079 — Design exposes the five-kind capability contract

Design MUST use discriminated Region, Fabric, Card, Flow and Graphic selections shared with Canvas and View Model. Region, Fabric, Card and Graphic MUST be pointer-selectable and keyboard-selectable, movable, resizable, property-editable, removable and reorderable. Flow MUST be pointer-selectable and keyboard-selectable, property-editable, removable and reorderable, but MUST use endpoint and waypoint tools instead of generic move or resize.

The selected kind MUST determine the Properties controls. A stale or empty selection MUST render a total empty state rather than interpreting an identifier as another kind.

_Implementation surface: `packages/view-model/src/editable.ts`, `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/view-studio/src/app/editor/ArtefactControls.tsx`._

## Editing

### EDIT-008 — A diagram supplies its editing rules

Studio MUST ask the current diagram for handles, guides, placement constraints, authored values and descriptions of changes. It MUST NOT infer domain-specific movement rules from rendered React elements.

_Implementation surface: `EditableDiagram` in `packages/view-model/src/editable.ts` and its use by `packages/view-studio/src/app/editor/use-editor.ts`._

### EDIT-011 — Keyboard nudging is exact

Keyboard nudging MUST move the current movable selection by the exact requested increment rather than passing the result through guide snapping. A larger modified increment MAY be offered.

_Implementation surface: `nudge` in `packages/view-studio/src/app/editor/use-editor.ts`._

### EDIT-017 — Every route change is represented

When a component movement, endpoint reattachment or direct route edit changes a route, the pending change set MUST include the resulting route points. It MUST NOT report an attachment whose rendered route still ends at the former coordinate.

_Implementation surface: derived changes, attachments and routes in `packages/view-studio/src/app/editor/use-editor.ts`._

### EDIT-018 — Port counts are editable per side

Studio MUST allow each side's port count to be edited independently. Changing one side MUST NOT replace counts on untouched sides.

_Verification: `packages/view-model/src/guides.test.ts` covers layering a side-specific count over the counts in force._

### EDIT-013 — A port shows whether it is used

While editing, a port MUST visually distinguish whether a flow currently terminates on it. The port identity SHOULD be available on demand without permanently adding all port labels to the canvas.

_Implementation surface: port classes and labels in `packages/view-studio/src/app/InfoschematicDiagram.tsx` and `packages/view-studio/src/styles.css`._

### EDIT-042 — A flow end can be reattached to an offered port

A producer MUST be able to drag a selected flow endpoint to any compatible port currently offered on the canvas. The candidate port MUST be indicated before release, and releasing without a valid candidate MUST NOT silently reattach the endpoint.

_Implementation surface: endpoint drag and `dropPort` state in `packages/view-studio/src/app/InfoschematicDiagram.tsx`._

### EDIT-031 — Flow waypoints can be edited deliberately

A selected flow MUST expose its interior waypoints. Adding or removing a waypoint MUST require an explicit editing action so an ordinary selection click cannot alter the route.

_Implementation surface: waypoint actions in `packages/view-studio/src/app/editor/use-editor.ts` and `packages/view-studio/src/app/InfoschematicDiagram.tsx`._

### EDIT-080 — Artefact geometry follows kind constraints

Region, Fabric, Card and Graphic boxes MUST move and resize on both axes and respect View Model minima. Flow MUST retain route-specific editing.

Reorder MUST change authored order only inside the selected kind. Studio MUST NOT expose cross-family z-order. Adapter interaction MUST direct movement to the wrapped Card and MUST NOT offer independent Adapter resize.

_Verification: Canvas interaction tests under `packages/view-canvas/src/` and Studio artefact-control tests cover five-kind selection, constraints, actions and Flow or Adapter exclusions._

## Undo and drafts

### EDIT-028 — Every draft edit can be undone

Studio MUST offer undo and redo for every draft-changing action. One pointer gesture MUST form one undo step even when it produces many pointer events. A discrete command MUST form its own step.

_Implementation surface: checkpoints, gesture closure, undo and redo in `packages/view-studio/src/app/editor/use-editor.ts`._

### EDIT-040 — Change actions form one control group

Undo, redo, discard and change-set export SHOULD be presented together because they all operate on the same pending set. A disabled action SHOULD remain visible and communicate why it does not currently apply.

_Implementation surface: `packages/view-studio/src/app/editor/ChangePane.tsx` and `packages/view-studio/src/app/editor/EditorTools.tsx`._

### EDIT-029 — Undo history is not persisted

Draft data MAY survive reload, but undo and redo history MUST be scoped to the current mounted editing session.

_Implementation surface: draft persistence and in-memory history in `packages/view-studio/src/app/editor/use-editor.ts`._

### EDIT-060 — Drafts already reflected by the model are dropped

A pending change whose value the authored model now states MUST be removed. A draft naming a thing the model no longer knows MUST also be removed. Each endpoint and each port-count side MUST be compared independently where one may have caught up without the other.

_Verification: `packages/view-studio/src/app/editor/use-editor.test.ts` covers spent component, endpoint and port-count drafts, partial endpoint changes and missing model keys._

### EDIT-081 — Typed operations share one atomic draft lifecycle

Typed artefact operations MUST persist in the same serialisable draft envelope as route, attachment, label, port and text changes. One pointer gesture MUST produce one history snapshot; one discrete operation MUST produce one snapshot. Undo, redo, discard and review MUST observe the same atomic draft value.

The change set MUST order creates before updates and updates before removals. Creation MUST order containers before dependants; removal MUST order dependants before owners. Updates MUST use stable kind, owner, authored index, field and identity order rather than event arrival order.

_Implementation surface: `packages/view-studio/src/app/editor/editor-draft.ts`, `packages/view-studio/src/app/editor/artefact-operations.ts`, `packages/view-studio/src/app/editor/source-changes.ts` and `packages/view-studio/src/app/editor/use-editor.ts`._

## Change consolidation

### EDIT-019 — Changes accumulate in one set

Every draft adjustment MUST appear in one reviewable change set. The producer MUST be able to discard the whole set in one action.

_Implementation surface: `pending`, `changeCount` and `discard` in `packages/view-studio/src/app/editor/use-editor.ts`._

### EDIT-052 — One pending change can be dropped

Each independently authored pending change MUST be removable without discarding unrelated changes. Removing that pending change MUST itself be undoable. A derived change MUST remain attached to the change from which it follows.

_Implementation surface: pending origins and `drop` in `packages/view-studio/src/app/editor/use-editor.ts`._

### EDIT-056 — A change names what it describes

Every pending change MUST identify the artefact or flow it describes. Selecting a change SHOULD select the described thing, and pointing at either SHOULD make their relationship visible.

_Implementation surface: `PendingChange`, selection and hover in `packages/view-studio/src/app/editor/use-editor.ts`._

### EDIT-058 — Changes are consolidated by property

The change set MUST contain at most one effective entry for a property of an authored thing. A later draft of the same property MUST replace the earlier draft. Entries MUST be ordered deterministically by code and property rather than by time of arrival.

_Verification: `packages/view-studio/src/app/editor/use-editor.test.ts` covers natural code ordering and property grouping._

## Creation and removal

### EDIT-067 — Removal remains reviewable

Removing an authored artefact MUST mark it as pending removal rather than making it disappear immediately. Flows that cannot remain valid without that artefact MUST be named in the change set. Repeating the removal action MUST be able to lift the mark before the set is applied.

_Implementation surface: removal drafts in `packages/view-studio/src/app/editor/use-editor.ts`._

### EDIT-068 — A flow can be created between ports

Studio MAY create a flow by dragging from one port to another. Releasing anywhere other than a valid different port MUST create nothing. A newly created flow MUST enter the same selection, routing, editing and removal machinery as an authored flow.

Code allocation and allowed families MUST be supplied by the current Infoschematic rather than hard-coded by Studio.

_Implementation surface: creation state in `packages/view-studio/src/app/editor/use-editor.ts` and flow interaction in `packages/view-studio/src/app/InfoschematicDiagram.tsx`._

### EDIT-069 — A card can be created with a valid default

Studio MAY create a card as one undoable action and allow its properties to be refined afterwards. A created card MUST have identity, placement and enough domain data to pass through the same selection, movement, port and removal machinery as an authored card.

Identity allocation, scope choice and default appearance MUST be supplied by the current Infoschematic rather than hard-coded by Studio.

_Implementation surface: `CreatedComponent` in `packages/view-model/src/editable.ts` and card creation state in `packages/view-studio/src/app/editor/use-editor.ts`._

### EDIT-071 — Moving a component carries attached presentation

Moving a component MUST carry route ends attached to it. When a wrapping card derives its placement from a wrapped card, moving either interactive representation MUST preserve that containment relationship rather than creating a second independent placement.

_Implementation surface: derived changes in `packages/view-model/src/editable.ts` and `packages/view-studio/src/app/editor/use-editor.ts`._

### EDIT-082 — Library creation produces independent authored values

The Design Library MUST provide Card, Fabric and Flow templates. Instantiating a template MUST deep-copy its serialisable seed, allocate a fresh stable `id` and `code`, and create one ordinary typed operation. The created value MUST NOT contain Library metadata, template identity or provenance.

Card and Fabric creation MUST apply the current Scope and requested Canvas placement. Flow creation MUST require two valid, distinct endpoints and a selected Flow family, and MUST create an orthogonal route whose terminal points match the selected ports. Repeated instantiation MUST return independent nested values.

_Verification: `packages/view-studio/src/app/editor/library.test.ts`, `packages/view-studio/src/app/editor/artefact-factories.test.ts` and `packages/view-studio/src/app/editor/LibraryPanel.test.tsx`._

### EDIT-083 — Design previews the complete materialised draft

Design MUST start from complete authored content rather than Audience filters and MUST materialise typed operations into a derived runtime for Canvas. Creates, movement, resize, property replacement, within-kind reorder and safe removal MUST be visible without mutating the host configuration. Existing component-offset, route, waypoint and attachment drafts MUST remain effective later overlays.

Rejected operations MUST leave their base output unchanged. Present MUST continue to resolve and render its active Story Graphic independently of Design's complete-content Graphic preview.

_Implementation surface: composition in `packages/view-studio/src/app/App.tsx` and preview derivation in `packages/view-canvas/src/InfoschematicDiagram.tsx`._

### EDIT-084 — Removal plans make consequences explicit

Removing a Card or Fabric MUST include endpoint Flow removals before the owner. Applied Card removal MUST also account for Adapter Cards that wrap it. Removing a Region MUST NOT cascade to any other artefact. Studio MUST block Graphic removal while a Story Scene directly references the Graphic and expose the reason to the Producer.

The underlying materialiser MUST remain total when it receives a direct Graphic removal by clearing Story references and Scene focus entries atomically. This cleanup is a safety boundary, not permission for Studio to bypass the review block.

_Verification: `packages/view-studio/src/app/editor/artefact-operations.test.ts` and `packages/view-model/src/artefact-draft.test.ts` cover removal plans, blocking and materialised cascades._

## Host rendering

### EDIT-072 — Hosts supply visual implementations

Studio MUST accept host-owned renderer configuration separately from `InfoschematicConfig` and pass it through the lower View contracts. Fabric, Graphic, Callout, shared SVG definition and Scope icon implementations MUST NOT be stored in authored configuration or imported from a particular realisation by the reusable package. Studio MUST NOT create a second renderer registry contract alongside Canvas and Present.

_Implementation surface: compatibility exports in `packages/view-studio/src/index.ts`; the owning registry and context are in `packages/view-canvas/src/renderers.tsx`._

### EDIT-073 — Fabrics retain a generic fallback

Every visible authored Fabric MUST render independently. A configured renderer receives the Fabric and its effective edited bounds; an absent or unknown renderer key MUST use the generic bounds-driven Fabric rendering rather than coupling visibility to another Fabric or known key.

_Verification: renderer and Canvas integration tests under `packages/view-canvas/src/` cover configured, unknown, unsupported and invalid Fabric renderers._

### EDIT-074 — Story Graphics resolve through authored data

A Story Graphic reference MUST resolve to a Graphic in the serialisable Infoschematic definition before Studio invokes the matching host renderer. An unresolved reference MUST NOT be treated as a renderer key or produce embedded fallback narrative.

_Verification: Canvas integration tests under `packages/view-canvas/src/` cover resolved and unresolved Story Graphic references and accessible fallback rendering._

## Verification

### EDIT-059 — The rendered editor is tested

Studio MUST have a rendered component test covering both read-only and editing-capable composition. Model-only tests MUST NOT be the sole verification for controls whose behaviour depends on rendered layering or pointer interaction.

_Verification: `packages/view-studio/src/app/App.test.tsx` renders the application against blank and structural configurations. Pointer interaction coverage remains a gap below._

## Gaps

- Most interaction requirements are represented in implementation but do not yet have rendered interaction tests.
- Studio currently derives persistence keys from Infoschematic identity and provides no host-owned persistence policy or storage-adapter contract.
- Accessible keyboard operation, focus management and announcements for selection, creation, removal and undo require explicit requirements and tests.
