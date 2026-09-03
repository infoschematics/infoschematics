---
id: INFOSCHEMATICS-TOOL-005
area: TOOL
title: Complete production modes
theme: tool
horizon: next
status: in-progress
blocks: []
blocked_by: []
baseline_ref: 7925809c5af21241479d5ae2dfea0a83f1b2dc4f
---

## Goal

Make Present, Design and Direct explicit application modes with complete ownership of their settled production capabilities.

## Context

The vocabulary distinguishes the Audience-facing Present mode from the Producer's Design and Direct modes. Existing controls implement parts of each capability but still reflect the earlier theatre vocabulary and do not yet provide a coherent mode model, Theme authoring or Storyboard surface.

## Boundary

This item owns mode state, mode transitions and the division of production controls. It does not redesign the six artefact contracts, publish packages, or add a domain-specific Infoschematic.

## Current state

`usePresentation` stores Audience visibility, Scene focus, Story playback and a `designing` boolean together. `useEditor` separately uses `scenes`, `design` and `stories` as editor modes, while `DetailsPanel` treats those values as tabs. Standalone Scene and Story editing exist, but Theme authoring and one explicit Direct surface do not. The current mutual-exclusion logic prevents competing presentation focus, yet mode transitions, empty sequences and edit-versus-present state remain implicit across hooks and components.

## Steps

- [ ] Introduce an explicit transient `ProductionMode` union of `present`, `design` and `direct`, starting every application session in Present.
- [ ] Separate retained Audience preferences and filters from active presentation focus, Story playback and Producer editing state.
- [ ] Implement one tested mode-transition reducer: entering Design or Direct stops playback and hides presentation focus without discarding Audience filters; returning to Present restores filters but never resumes playback automatically.
- [ ] Make Design show the complete authored Infoschematic independently of Audience filtering so hidden artefacts cannot become uneditable.
- [ ] Consolidate Standalone Scene, Theme, Story, Callout and Storyboard authoring under Direct with a discriminated active-target state independent of the Scene currently shown in Present.
- [ ] Add Theme creation and Scene composition using the same draft, undo, discard and change-set conventions already used by Standalone Scenes and Stories.
- [ ] Enforce at most one active Standalone Scene, Thematic Scene or Story in Present, define Story precedence, and make all clear and step actions total at empty and stale selections.
- [ ] Permit empty Themes and Stories in Direct while disabling their activation in Present until they contain a valid Scene.
- [ ] Define Scope and Flow-family precedence once: Present filters visibility before Scene emphasis, while Design and Direct operate on complete authored content and preview their own draft focus.
- [ ] Replace ambiguous tabs and boolean props with mode-accurate labels, keyboard actions and accessibility state without persisting Producer mode across reloads.
- [ ] Add reducer, hook and rendered interaction tests covering every transition, empty collection, stale identifier, focus conflict and reload boundary.

## Files touched

- production-mode and presentation state modules under the owning interactive View package;
- current `packages/view-studio/src/app/hooks/use-presentation.ts`, editor Scene and Story hooks, and their tests until additive extraction changes the physical owner;
- `DetailsPanel.tsx`, `TitleBar.tsx`, `ProducerControls.tsx`, `PanelRail.tsx`, `SceneCallout.tsx`, keyboard help and focused styles;
- Domain Model or Domain Core only if Theme drafting exposes an existing contract gap;
- `docs/design/view-present.md`, `docs/design/view-studio.md`, `docs/specs/view-present.md`, `docs/specs/view-studio.md` and vocabulary only if clarification is required.

## Verify

Focused state tests must cover all nine mode-to-mode transitions and prove Present is the reload default. Rendered tests must prove only the controls for the active mode are reachable, empty Themes and Stories cannot start in Present, Direct drafts never alter current presentation focus, and returning to Present does not restart a Story. Existing Scene, Story, filtering and editing tests plus `bun run check` must pass.

## Dependencies / blocks

No hard dependency remains. The state and ownership contracts can be implemented in the current Studio package and move mechanically with Present and Studio if `INFOSCHEMATICS-TOOL-008` lands later; if additive Views already exist, the same plan applies directly to their final owners.

## Documentation impact

### Decision Records

No new decision is expected because the product vocabulary and additive ownership direction are already settled. Add one only if implementation changes those ownership rules.

### Specifications

Specify explicit mode transitions, focus mutual exclusion, empty-sequence guards, filter precedence, Direct draft isolation and non-persistence of Producer mode.

### Guides

Update Producer guidance when the final controls and mode transitions are demonstrable.

### Roadmap

Keep artefact editing in `INFOSCHEMATICS-TOOL-006`; capability gaps outside mode and presentation ownership become separate records.

## Discussion

### Session semantics

Mode transition owns active-state cleanup: leaving Present stops playback and clears presentation focus while retaining Audience filters. Present permits at most one Standalone Scene, Thematic Scene or Story; Design and Direct expose complete authored content and isolated drafts.
