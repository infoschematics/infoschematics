---
id: INFOSCHEMATICS-TOOL-133
area: TOOL
title: Restore scene-scoped presentation intent
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 52d3f2e8b2cfaedccdb30bbb533c20788dae7803
created_at: 2026-09-22T22:33:00Z
updated_at: 2026-09-22T23:22:44Z
---

# Restore scene-scoped presentation intent

## Goal

A host can request Scene-scoped Graphics in interactive presentation, and a Scene with explanatory Callout content remains directly activatable even when it intentionally focuses no Diagram elements.

## Context

`ADR-INFOSCHEMATICS-037` correctly made authored Overlays diagram-scoped by default, while retaining Scene scoping as an explicit caller choice for static output. Interactive Canvas exposes no equivalent choice, so consumers whose Graphics explain particular walkthrough steps now draw every Graphic continuously. Separately, Studio disables a Scene selector unless its focus or Dynamics change the Diagram. A Callout-only introductory Scene therefore appears but cannot be selected until another Scene activates its Sequence.

The 5G-EMERGE IBC 2026 consumer demonstrates both regressions after adopting current main: its coordination-gap and adaptation-cycle Graphics belong to two Demo Scenes, while its first Partners Scene deliberately has an empty focus and a complete Callout.

## Boundary

Add an interactive host option matching the existing `all`, `scene`, and `none` Graphic visibility vocabulary, preserving `all` as the default and keeping every authored Graphic available in Design. Treat a resolved Scene Callout as sufficient activation content in both Studio control surfaces through one shared rule. Do not infer persistence from whether a Graphic is referenced, change authored schemas, or change static-rendering defaults.

## Current state

`InfoschematicDiagram` always unions `config.diagram.overlays` with the active Scene Graphic. `PresentProps` and `StudioProps` offer no Graphic visibility policy. `PanelRail.tsx` and `ProducerControls.tsx` duplicate an activation predicate limited to valid components, flows, and Dynamic cues; neither considers `calloutConfig`.

## Steps

- [x] Add a typed interactive Graphic visibility option, defaulting to `all`, and thread it through Canvas, Present, and Studio.
- [x] In `scene` mode draw only the active Scene Graphic outside Design; in `none` mode draw none outside Design; keep all authored Graphics available in Design.
- [x] Extract one Scene activation predicate and count a resolved Callout alongside valid focus and Dynamic content.
- [x] Cover default, Scene-scoped, suppressed, and Design Graphic rendering plus Callout-only activation in both control surfaces.
- [x] Apply the option in the 5G-EMERGE host and verify its authored Demo and Partners Sequences.

## Files touched

`packages/view-canvas/src/Canvas.tsx`, `packages/view-canvas/src/InfoschematicDiagram.tsx` and tests; `packages/view-present/src/Present.tsx`; `packages/view-studio/src/app/App.tsx`, shared Scene activation helper, `PanelRail.tsx`, `ProducerControls.tsx` and tests; `docs/specs/diagram-elements.md`. Consumer application change remains in the 5G-EMERGE repository.

## Verify

Run focused View Canvas, View Present, and View Studio tests; run `bun run self:check`; rebuild the linked 5G-EMERGE consumer and confirm no Graphic before Demo playback, only `gap` at `DEMO-4`, only `cycle` at `DEMO-11`, and immediate activation of the 5G-EMERGE Partners Scene.

## Dependencies / blocks

None. The implementation extends the explicit Scene-scoping exception already recorded by `ADR-INFOSCHEMATICS-037` and does not depend on the pending production-workspace split.

## Documentation impact

### Decision Records

Retain `ADR-INFOSCHEMATICS-037` unchanged: diagram-scoped remains the default, while Scene scoping remains an explicit host request.

### Specifications

Clarify `DIAGRAM-011` with the interactive caller option and its Design exception.

### Guides

No public guide change: the Studio activation correction and host option require no authored-format migration.

### Roadmap

Record delivery evidence and the consumer verification here; do not create a second item for the 5G-EMERGE application of the upstream option.

## Review

### Delivered

From immutable baseline `52d3f2e8b2cfaedccdb30bbb533c20788dae7803`, delivered the approved interactive host policy and shared Scene activation rule without changing the authored schema, static-rendering defaults, or `ADR-INFOSCHEMATICS-037`.

### Summary of changes

View Canvas now exposes `GraphicVisibility` with `all`, `scene`, and `none`; Present and Studio carry the host choice to the Diagram while Design keeps every authored Graphic available. Studio's compact and expanded Sequence controls share one activation predicate that accepts a resolved Callout. `DIAGRAM-011` and focused regression cases record both behaviours. The 5G-EMERGE host opts into `scene`.

### Verification

`bun run test --filter=@infoschematics/view-canvas --filter=@infoschematics/view-present --filter=@infoschematics/view-studio` passed 98, 47, and 130 tests respectively. `bun run self:check` passed the full upstream build, typecheck, unit, browser, schema, boundary, unused-export, example, and script gates. In the consumer, `bun run self:typecheck`, 20 tests, and `bun run ki:site:build` passed. Interactive verification against the authored document showed no initial Overlay, only `gap` at Demo 4 of 11, only `cycle` at Demo 11 of 11, and immediate 5G-EMERGE activation as Partners 1 of 9.

### Outstanding concerns

None within the approved boundary. Publication and consumer deployment remain separate explicit actions after review.

### Post-change review

The implementation preserves the diagram-scoped default, makes the already-decided Scene-scoped exception available to interactive hosts, and fixes the disabled Callout-only selector without broadening what counts as content beyond the resolved Scene contract. Regression risk is bounded by explicit default and Design cases plus the full browser suite. Ready for acceptance review.

### Mini recap

Scene-owned walkthrough graphics and Callout-only partner introductions now work through reusable upstream behaviour; the IBC host contains only the one-line policy selection. No additional durable learning route is required beyond the updated specification and this delivery record.

## Done

Accepted 2026-09-23 by Kris Brown on the review packet above.

## Discussion

Captured and adopted into Now on 2026-09-22 from the consumer owner's explicit instruction to deliver the two migration repairs. One item owns them because both are omissions at the same interactive Scene-presentation boundary and share the same consumer verification pass; neither changes the document contract.
