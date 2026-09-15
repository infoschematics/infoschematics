---
id: INFOSCHEMATICS-TOOL-045
area: TOOL
title: Design interaction layers
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:03:15Z
updated_at: 2026-09-15T12:20:00Z
---

# Design interaction layers

## Goal

Let Producers choose which visual element types are interactive during Design work, and temporarily bring the selected element above competing content, so overlapping elements do not intercept or obstruct the intended edit.

## Context

An Infoschematic can place [Cards](../reference/vocabulary.md#standard-card), [Flows](../reference/vocabulary.md#flow), [Fabrics](../reference/vocabulary.md#fabric), [Points](../reference/vocabulary.md#point), [Regions](../reference/vocabulary.md#region), and [Graphics](../reference/vocabulary.md#graphic) on the same canvas. When their geometry overlaps, a Graphic or another incidental element can currently win hit testing or obscure the Card, Flow, or other element a Producer is trying to select and move.

The interaction model needs two related capabilities: a Design-session filter that determines which element types can be selected, and a temporary editing layer that presents the active selection and its handles above the rest of the diagram.

## Boundary

This item does not add authored z-index properties, reorder canonical model collections, change static SVG stacking, hide inactive element types by default, or define general-purpose layer composition. It does not make presentation callouts or runtime focus treatments editable diagram elements.

## Current state

Design mode can select and manipulate supported element types, but SVG paint order and pointer hit testing can make overlapping content compete for the same gesture. The Producer cannot restrict selection to a particular element type, and selection does not consistently establish a temporary foreground editing surface across every supported kind.

## Steps

- [x] Define Design-session interaction layers for Cards, Flows, Fabrics, Points, Regions, and Graphics, using canonical visual element terminology throughout the controls.
- [x] Add controls that let a Producer enable or disable selection and manipulation by element type while leaving disabled types visible.
- [x] Remove disabled element types from pointer and keyboard hit testing without changing their authored data or rendered appearance.
- [x] Render the selected element and its editing affordances in a temporary foreground layer until selection changes, clears, or Design mode ends.
- [x] Preserve the selected element's semantic relationships, including composition and connected port geometry, without promoting unrelated elements or changing canonical array order.
- [x] Cover overlapping-element selection, drag initiation, keyboard selection, layer toggles, selection changes, deselection, and Design-mode exit in browser interaction tests.
- [x] Update the Design interaction specification and Producer guidance with the layer and temporary-foreground behaviours.

## Files touched

- `packages/view-model/src/` for transient interaction-layer and selection projection state
- `packages/view-canvas/src/` for SVG hit testing and temporary foreground rendering
- `packages/view-studio/src/app/` for Producer controls and Design-session state
- focused browser-rendered interaction tests
- `docs/specs/design-session.md` and `docs/specs/design-editing.md`
- affected Producer guides under `docs/guides/`

## Verify

Run focused View Model, Canvas, and Studio tests plus `bun run self:check`. In a browser fixture with a Graphic crossing a Card and Flow, verify each element can be selected when its type is enabled, disabled types do not intercept pointer or keyboard interaction, the active selection appears above competing content during editing, and clearing selection restores the normal authored rendering order without a model change.

## Dependencies / blocks

No hard dependency is known. The design-editing regression contract has landed as `DESIGN-015` in [the Design session specification](../specs/design-session.md), whose rendered matrix lives in `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` and `packages/view-studio/src/app/App.browser.test.tsx`. Extend those suites with the layer cases so this work reuses their gesture, selection, viewport, and undo assertions rather than creating a parallel interaction harness.

## Documentation impact

### Decision Records

No new decision record is expected if interaction layers remain transient View state. Record a decision only if implementation introduces an authored stacking contract or changes renderer ownership.

### Specifications

Specify observable layer filtering, hit-testing, temporary foreground, keyboard parity, selection lifetime, and no-authored-mutation requirements in the Design editing feature area.

### Guides

Explain how Producers isolate an element type while editing dense diagrams and how to return all types to an interactive state.

### Roadmap

Coordinate toolbar placement with [Configurable design grid](INFOSCHEMATICS-TOOL-053-configurable-design-grid.md), which shares the Design control surface. This item owns the new interaction-layer controls and generalised foreground-selection behaviour; regressions in existing editing operations belong to the `DESIGN-015` matrix.

## Discussion

### Interaction layers

A layer is a transient Design filter over canonical visual element types, not another domain concept. Turning a layer off should make its elements inert while retaining enough visual context to edit the enabled layers accurately.

### Temporary foreground

Selection should change presentation order only for the duration of the edit. The selected element, its handles, and necessary editing chrome need to sit above competing diagram content so the Producer can see and manipulate the active target reliably.

### Authored order

Temporary promotion must not rewrite YAML ordering or create a persistent stacking field. Deselecting the element or leaving Design mode restores the renderer's ordinary deterministic order.

## Review

### Delivered

Design now carries one interaction layer per element kind, presented as five controls in the Design tools row: Regions, Fabrics, Cards, Flows, Graphics. Every session opens with all five interactive. Closing one leaves its elements drawn exactly as authored and stops them answering the pointer or the keyboard, so a Card resting over a Region can be worked without the Region catching the press, and the Region can be caught without shifting the Card off it first. Ports follow the Flow layer, which is what they exist to attach, so closing Flows hands a Card's own edge back to the Card.

The selection's resize handle and within-kind actions now draw in one temporary foreground layer above everything the diagram places, so a Region's corner handle is no longer buried under a Card that overlaps it. Closing a layer releases any selection it held, because those controls would otherwise be the only way back to an element that no longer answers.

### Summary of changes

`packages/view-model/src/editable.ts` adds the whole contract: `artefactKinds` (the five kinds a session can reach, in the order a control surface presents them), `InteractionLayers` as a `ReadonlySet<ArtefactKind>`, `everyInteractionLayer`, `interactionLayerOpen` — which reads an absent set as an unfiltered session rather than a closed one — `toggleInteractionLayer`, and `selectionWithinLayers`.

`packages/view-canvas/src/InfoschematicDiagram.tsx` takes an optional `layers` prop and resolves two helpers from it: `interactive(kind)` gates every `onPointerDown`, `onKeyDown`, `role` and `tabIndex` and withholds the selectable classes, and `inert(kind)` marks a closed kind `layer-inert`. `packages/view-canvas/src/styles.css` gives `layer-inert` and its descendants `pointer-events: none`, because withholding the handlers is not enough on its own: an element that still takes pointer events blocks whatever is beneath it with nothing listening. Keyboard reach has to go from the markup instead, since `pointer-events` leaves the tab order alone.

The same file replaces five duplicated per-kind affordance blocks with one `selectionControls` resolver and a trailing `<g className="infoschematic-foreground">`. Promoting the controls rather than the element is what keeps this free of side effects: no authored order changes, no stacking property exists to write or put back, and a Region's fill never paints over the Cards inside it. A selected Flow is the exception and needed no change — it already draws as a whole route above the Cards, so its controls travel with it. `ResizeHandle` lost its `renderOrigin` escape hatch, which existed only because the Card's handle used to render inside the Card's own translated group.

`packages/view-studio/src/app/editor/use-editor.ts` holds the set for the session — `useState`, never persisted, reset to every layer on entering or leaving Design — and reconciles the selection against it in an effect, so the rule that binds them applies wherever either changes rather than inside whichever control moved one. `EditorTools.tsx` maps `artefactKinds` over a `Record<ArtefactKind, …>` of label, hint and icon, so a sixth kind acquires its control by existing rather than by an edit here. A closed control is marked amber and an open one reads plain, because all five are pressed in the state a session opens in and five lit buttons would be the row's resting appearance.

`DESIGN-018` and `DESIGN-019` state the requirements, the `DESIGN-015` matrix gains the layer case, and `interaction-layer` is a vocabulary term.

### Verification

`bun run self:check` passed: 13/13 TypeScript projects, 92 node test files / 713 tests, 9 browser test files / 32 tests, no dependency violations, and the production site build. Confirmed `layer-inert` reaches the built `Playground` stylesheet, because Studio's CSS is what the deployed host loads.

The browser cases resolve each press through `document.elementFromPoint`, which sees `pointer-events` exactly as a pointer does. That is the only assertion that can tell a closed layer from one that merely stopped listening: a markup check passes for both, and the version that stopped listening is still standing in the way. Three cases: an open Flow layer offers its port over the Card edge beneath it, closing the Flow layer hands that same point back to the Card, and a closed Card layer leaves the Card drawn, untabbable and unselectable.

Rendered Studio in Chromium at 1440×900 in both states and looked at them. Open: five plain layer buttons beside the lit snap magnet, a selected Region with its three action buttons at the top right and its resize handle at the bottom right — both now drawn from the foreground layer and both correctly styled. Closed on Flows and Graphics: those two controls amber, the port dots at both Card edges gone, and the Flow, its arrowhead, its code chip and the Region's selection all otherwise identical.

### Outstanding concerns

`DESIGN-014` and this item's own plan name **Points** as a sixth kind. There is no sixth layer, because there is no Point interaction to filter: `ArtefactKind` has five members, and while `render-svg` draws a Point, no Canvas surface offers one a selection, a handle or a keyboard target. A Points control would have toggled nothing. Captured as [Point interactivity in Design](INFOSCHEMATICS-TOOL-063-design-point-interactivity.md) and recorded as a known exception on `DESIGN-018` rather than quietly delivering five and calling it six.

Producer guidance is deferred. `apps/site/content/studio.md` is the consumer-facing text that should explain isolating a kind in a dense diagram, and site prose is deliberately a separate follow-up in this batch; the specification and the vocabulary landed with the feature.

The Flow code chip keeps its place when the Flow layer closes and loses only its drag, because it is where a Flow's code is read as well as where its label is moved. A port is affordance only and goes entirely. That asymmetry is deliberate and stated in the code, but it is a judgement call a Producer may disagree with.

`packages/view-studio/src/styles.css` ends with `@import "@infoschematics/view-present/styles.css"`, which PostCSS warns about on every build because an `@import` must precede other statements. It is inlined anyway, so the product is correct, but the warning is noise and the position makes cascade order hard to reason about. Pre-existing and untouched here.

One harness note for the manual walkthrough: a document that sets no surface treatment renders `surface-neutral`, which paints a light backdrop in Studio's dark chrome. Visible in the screenshots above and unrelated to layers — the seeded documents all declare a surface.

### Post-change review

The first design promoted the selected _element_ into a foreground layer, which is what the item's wording suggests. Extracting four inline render blocks to make that possible would have been about four hundred lines, and it puts a selected Region's fill on top of the Cards inside it. Promoting only the controls is smaller, has no appearance consequence, and leaves the three obstruction problems each answered by the mechanism that fits: cross-kind by layers, same-kind by the existing sorts, and controls by the foreground layer. It also collapsed five duplicated affordance blocks into one resolver, so the next kind gets its handles by being resolvable rather than by a sixth copy.

Two things were found by trying to take the screenshot rather than by the suite. `toggleLayer` first read the layer set from the render that queued it, so two controls pressed inside one tick left only the later one's change — the functional updater fixed it. And the throwaway harness loaded Studio's stylesheet without Canvas's, which drew the promoted handles as unstyled black blobs; that turned out to be the harness rather than the product, but it is exactly the failure mode the repository guidance warns about, and no assertion in the suite would have distinguished them.

Gating `role` and `tabIndex` in the markup while gating pointer reach in CSS reads like two mechanisms for one idea, and it is: `pointer-events: none` removes an element from hit testing and leaves it in the tab order. Neither half is sufficient, and the split is stated in both files so a later reader does not remove one of them.

### Mini recap

A layer is a filter over what answers the Producer, never over what the diagram draws. Nothing is authored, nothing is written back, and every layer reopens when the session does — so the worst a Producer can do with this is have to press the control again.
