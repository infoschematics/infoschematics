---
id: INFOSCHEMATICS-TOOL-131
area: TOOL
title: Split presenting from workspace
theme: tool
horizon: now
status: ready
blocks: [INFOSCHEMATICS-TOOL-129]
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T19:45:00Z
updated_at: 2026-09-22T19:45:00Z
---

# Split presenting from workspace

## Goal

Whether a Producer is working and which set of tools they are working with become two separate answers, so presenting a drawing no longer discards the workspace they were in.

## Context

`packages/view-present/src/production.ts:3` types `ProductionMode` as `'present' | 'design' | 'direct'`, and `PRESENT-001` requires the application to be in exactly one of the three. Two independent things are riding in that enum.

The first is a capability boundary. `docs/reference/vocabulary.md:105` draws it as a role: a Producer shapes, controls and presents the product, and an Audience "experiences the product without receiving editorial capability". Present is not a way of working — it is the absence of the producer's tools.

The second is an arrangement of those tools. Design and Direct are two tasks over the same document with the same capability, differing in which panels and which interaction layers are in front of the Producer. That is what an editing application normally calls a workspace, and it is what `ADR-INFOSCHEMATICS-028` already says in its title: panels follow the mode.

Collapsing the two costs something concrete. Because the enum holds one value, entering Present overwrites the Producer's workspace, so a Producer directing a Sequence who presents it and comes back lands in Design and has to find their way to Direct again. The type shows the seam directly: `PresentProductionState` and `DesignProductionState` are structurally identical, both pinning `directTarget: null`, and differ only in the literal they carry. A boundary that changes what a reader may do and a preference about panel layout have no business being the same field.

## Boundary

The two axes and everything that reads them: the state model, the attribute, the host props, the specification requirements and the vocabulary. It includes retaining the workspace across a visit to Present, because that is the behaviour the split exists to deliver — a rename that still forgets would be ceremony.

It does not redesign either workspace, add a third, or change what Design and Direct can each do. It does not touch authored data: `PRESENT-001` already forbids production mode from being persisted, an Audience preference, or authored Infoschematic data, and no example document contains it, so there is nothing to migrate in the five documents.

It does not deliver the colour model. Freeing the word `mode` is a consequence and is why this is urgent, but `INFOSCHEMATICS-TOOL-129` spends it.

## Current state

`ProductionMode` is a three-valued union in `packages/view-present/src/production.ts`, with `ProductionState` a discriminated union of three shapes and `ProductionAction` carrying a `set-mode` action over the same three values. `createProductionState` starts every mount in `present`, which `PRESENT-001` requires and which stays true.

Around twenty-five files in `packages/` and `apps/` read the mode. Studio's `App.tsx`, `PanelRail.tsx`, `TitleBar.tsx` and `DetailsPanel.tsx` branch on it, `PanelRail` rendering nothing outside Present per `PRESENT-009`. It reaches the DOM as `data-production-mode`, asserted at `apps/site/src/Playground.test.tsx:13`, and it is a prop on the Canvas component, passed as `mode="design"` at `apps/site/src/visual-guide/DemoFrame.tsx:70`.

## Steps

- [ ] Replace `ProductionMode` with two fields on `ProductionState`: whether the application is producing, and which workspace — `design` or `direct` — the Producer is in. Keep the workspace while presenting rather than discarding it, so returning resumes where the Producer left.
- [ ] Keep `directTarget` where it belongs, on the Direct workspace, so the structural duplication between the present and design shapes goes with the enum.
- [ ] Replace the `set-mode` action with actions that move each axis independently, and keep every mount starting as not producing, which `PRESENT-001` requires.
- [ ] Split `data-production-mode` into an attribute per axis, and update the assertions that read it.
- [ ] Take the Canvas prop with it, so a host says what it means in the same two terms rather than passing a word that no longer exists.
- [ ] Update Studio's panel branching so each decision reads the axis it actually depends on — the rail's Present-only rule is a capability question, and the dock's contents are a workspace question, and `ADR-INFOSCHEMATICS-028` conflates them only because the enum did.
- [ ] Retire the word `mode` from this axis across code, attributes, specifications and guide copy, leaving it free.

## Files touched

`packages/view-present/src/production.ts` and its tests; `packages/view-studio/src/app/App.tsx`, `panels/PanelRail.tsx`, `panels/TitleBar.tsx`, `panels/DetailsPanel.tsx`, `panels/ProductionControls.test.tsx`, `hooks/use-presentation.ts` and the browser suites; the Canvas prop in `packages/view-canvas/src`; `apps/site/src/Playground.test.tsx` and `visual-guide/DemoFrame.tsx`; `docs/specs/presentation.md`, `docs/specs/design-editing.md`, `docs/reference/vocabulary.md`, `docs/design/view-studio.md`; `ADR-INFOSCHEMATICS-028`.

## Verify

`bun run self:check`, with `scripts/vocabulary-citations.test.ts` proving no document cites a retired term.

The behaviour that has to be shown is the one the split exists for, and no unit assertion reaches it: in a real browser, enter Direct, present, return, and confirm the Producer is back in Direct rather than in Design. Capture that to `reports/` per `AGENTS.md`. Confirm too that a fresh mount still starts not producing, and that reloading from Direct returns to a presenting state, because `PRESENT-001` requires both and an axis that is retained in session is exactly the kind of state that leaks into storage by accident.

## Dependencies / blocks

Blocks `INFOSCHEMATICS-TOOL-129`, which needs the word `mode` for a drawing's light or dark rendering and cannot take it while this axis holds it.

Nothing blocks this. It is adjacent to the Theme-to-Sequence vocabulary drift — `DirectTarget` still carries `kind: 'theme'` — which is a separate record and not a prerequisite.

## Documentation impact

### Decision Records

`ADR-INFOSCHEMATICS-028` is amended in place, keeping `status: current`. Its reasoning survives — the panel dock opens for producer work and the rail belongs to Present — but it was written against one enum, and it reads as a choice between two fixes where the split makes both true of different axes.

### Specifications

`PRESENT-001` in `docs/specs/presentation.md` states the two axes, what a fresh mount is, and that neither is persisted or authored. `PRESENT-009` and `DESIGN-021` are restated against the axis each actually governs.

### Guides

`docs/design/view-studio.md` is written around production modes and needs the same split. Public site copy that names the modes follows.

### Roadmap

`INFOSCHEMATICS-TOOL-129` proceeds once this lands. The Theme-to-Sequence drift is captured separately.

## Discussion

Raised on 2026-09-22 out of the colour work, from the owner's observation that an editing application usually calls this a workspace. Testing that word against the three values is what exposed the defect: it fits Design and Direct exactly and does not fit Present at all, because Present is not an arrangement of tools but the absence of them.

That makes it the same defect the colour work started from. `PaintScheme` put an authored treatment and a reader's context in one enum, and `ProductionMode` puts a capability boundary and a panel arrangement in one enum. In both cases the union looked complete because every value was reachable, and in both cases the cost only shows up as a combination nobody can express — a blueprint that follows the reader, a Producer who presents without losing their workspace.

The one genuinely open choice is how the capability axis is spelled, and it should be settled with the code in front of you rather than here.

### Adoption

Adopted into Now on 2026-09-22 and treated as urgent at the owner's direction, because it holds a word `INFOSCHEMATICS-TOOL-129` needs. The owner confirmed it is not a change to the authored documents.
