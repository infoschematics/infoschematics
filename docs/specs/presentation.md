# Presentation — PRESENT

Audience-facing focus, filtering, controls, information, viewport use, zoom, pan, and overview navigation. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### PRESENT-001 — Production mode is explicit and transient

The interactive application MUST represent its current production mode as exactly one of `present`, `design` or `direct`. A new mount and every reload MUST start in `present`; the mode MUST NOT be persisted as an Audience preference or authored Infoschematic data.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-present`, then read `createProductionState` in `packages/view-present/src/production.ts`: the mode is one of `present`, `design`, or `direct`, never two and never none. Mount fresh and confirm it starts in `present`; switch to `direct`, reload, and confirm it is back in `present`. Then search the persisted Audience preferences and the authored document for the mode — a stored mode is what makes a reload land somewhere a reader did not ask for.

_Evidence:_ `ProductionMode` and `createProductionState` in `packages/view-present/src/production.ts`, composed by `packages/view-studio`.

### PRESENT-002 — Mode changes preserve preferences, not presentation activity

Audience preferences and filters, active Sequence focus and playback, and Producer editing state MUST remain independently owned. Entering `design` or `direct` MUST stop Sequence playback and clear the active Standalone or Sequence Scene while retaining Scope and Flow-family filters and other Audience preferences. Returning to `present` MUST retain those preferences and MUST NOT resume playback or restore cleared focus automatically.

Reasserting the current mode MUST leave all three state areas unchanged.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-present`, then walk every mode-to-mode transition with all three kinds of state set: Scope and Flow-family filters chosen, a Sequence playing with a Scene active, and Producer editing state in place. Entering `design` or `direct` must stop playback and clear the active Standalone or Sequence Scene while the filters and preferences stand; returning to `present` must keep the preferences and must not resume playback or restore the cleared focus by itself; reasserting the current mode must change none of the three.

_Evidence:_ `packages/view-present/src/production.test.ts` covers every mode-to-mode transition; rendered Studio tests cover the reload boundary.

### PRESENT-003 — Filter banks are individually controlled

Every Architectural Scope and Flow Family MUST have an independently toggleable presentation control. A new presentation MUST begin with every control selected. The vocabulary banks MUST NOT append show-all or hide-all actions as though those actions were another Scope or Family; resetting the presentation MAY restore the initial all-visible state outside those banks.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-present`, then open the filter banks on a new presentation: every Architectural Scope and Flow Family has its own toggle, and all of them start selected. Toggle one and confirm the others are unmoved. Then read the banks for a show-all or hide-all action — the vocabulary banks list Scopes and Families, so an action that is neither belongs outside them, where a presentation reset may still restore the all-visible state.

_Evidence:_ initial selection and individual toggle actions in `packages/view-present/src/presentation.ts`; controls in `packages/view-present/src/PresentationControls.tsx`, `packages/view-studio/src/app/panels/ProducerControls.tsx` and `packages/view-studio/src/app/panels/PanelRail.tsx`.

### PRESENT-004 — No Scene means full-strength rendering

When no Standalone Scene or Sequence Scene is active, every visible artefact and Flow MUST render without Scene dimming. Selecting one focus source MUST clear the other focus source.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-studio`, then present with no Standalone Scene and no Sequence Scene active and read the drawn opacity of every visible artefact and Flow: nothing may be dimmed when there is no Scene to dim it for. Then select a Standalone Scene while a Sequence Scene is active, and the reverse, and confirm the previous focus source is cleared rather than left alongside the new one.

_Evidence:_ focus precedence, `lightNothing` and Scene selection in `packages/view-studio/src/app/hooks/use-presentation.ts`; highlight classes in `packages/view-canvas/src/InfoschematicDiagram.tsx`.

### PRESENT-005 — Focus does not change geometry

Selecting, stepping or clearing a Scene MUST change emphasis without changing authored Card or Fabric placement, Flow routes, ports or label placement.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-studio`, then capture the resolved Card and Fabric placements, Flow routes, ports, and label placements with no Scene active; select a Scene, step it, and clear it; and diff the geometry at each stop against that first capture. Only emphasis may differ. Falsified by a Scene that moves anything, which is what a focus implementation that reaches into the runtime rather than into visibility and highlight sets does.

_Evidence:_ Present state is reduced to visibility and highlight sets in `packages/view-studio/src/app/hooks/use-presentation.ts`; geometry remains derived by `packages/view-model/src/runtime.ts` and consumed through `packages/view-canvas/src/runtime-context.tsx`.

### PRESENT-006 — Visibility is resolved before focus

Present MUST apply Scope and Flow-family filters before deriving Scene emphasis. An active Scene MUST NOT make a filtered artefact or Flow visible, and filtered content MUST NOT contribute to the resulting focus set.

Design and Direct MUST NOT use that filtered Audience projection as their editable content source.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-present`, then filter out a Scope and a Flow family whose members a Scene names as focused: the filtered artefacts and Flows must stay invisible, and the resulting focus set must not include them. Reverse the order in reading too — derive the Scene emphasis and confirm it was computed over the already-filtered content rather than over the whole document. Then enter Design and Direct and confirm their editable content is the authored document, not the Audience projection a filter just narrowed.

_Evidence:_ presentation derivation in `packages/view-present/src/presentation.ts` and compatible integrated derivation in `packages/view-studio/src/app/hooks/use-presentation.ts`.

### PRESENT-007 — Info is derived from the model

Info MUST derive its Card, Fabric and Flow register from the current Infoschematic runtime rather than duplicate those entries in view-owned content. A Flow row MUST identify its endpoints and represented interface relationship where one exists.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-studio`, then change an authored Card label, a Flow family, and a Flow endpoint and reopen Info without reloading: each row must already say the new thing, because the register is read from the runtime rather than kept beside it. Confirm every Flow row names both endpoints, and names the represented interface relationship where the document states one. Falsified by a register entry that survives the removal of the artefact it describes.

_Evidence:_ `packages/view-studio/src/app/panels/ModelRegister.tsx` reads the runtime register, scopes, families, interfaces and endpoint labels.

### PRESENT-008 — Keyboard help reflects presentation controls

Present View MUST expose in-view keyboard help for Sequence stepping and exit, plus automatic-advance control for timed Sequences. The corresponding Callout actions MUST also be available as labelled buttons.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-studio`, then present a Sequence and open the in-view keyboard help: stepping and exit must both be listed, and a timed Sequence must additionally list its automatic-advance control. Then do each of those from the Callout with a pointer instead — every action the help names must also exist as a labelled button, so the keyboard is a shortcut rather than the only way through.

_Evidence:_ `packages/view-studio/src/app/panels/ShortcutOverlay.tsx`, `packages/view-studio/src/app/panels/SceneCallout.tsx` and global presentation-key handling in `packages/view-studio/src/app/App.tsx`.

### PRESENT-009 — The Infoschematic can take the available canvas

Present View MUST offer a collapsed layout in which the Infoschematic panel takes the space otherwise occupied by expanded Producer controls and Details. The collapsed layout MUST retain reachable Architectural Scope, Flow Family and Sequence controls, and the stable title bar MUST retain controls for restoring panels and leaving full screen.

The collapsed layout is a Present affordance. The compact rail MUST NOT be presented as a Producer mode's working surface, and a Producer mode MUST NOT be left on it: `DESIGN-021` states what entering `design` or `direct` does to the panel dock. Reachable means reachable as rendered — a control hidden by the collapsed layout MUST NOT be accepted as evidence for this requirement merely because it remains in the document.

_Conformance:_ conforming

_Verify:_ inspect collapsed state and full-screen handling in `packages/view-studio/src/app/App.tsx`; compact controls in `packages/view-studio/src/app/panels/PanelRail.tsx`; persistent mode controls in `packages/view-studio/src/app/panels/TitleBar.tsx`; run the dock cases in `packages/view-studio/src/app/App.browser.test.tsx`, which load Studio's own stylesheet and assert reachability rather than presence.

_Evidence:_ collapsed state and full-screen handling in `packages/view-studio/src/app/App.tsx`; compact controls in `packages/view-studio/src/app/panels/PanelRail.tsx`; persistent mode controls in `packages/view-studio/src/app/panels/TitleBar.tsx`; `packages/view-studio/src/app/App.browser.test.tsx` finds the rail's Scope, Family and Sequence controls reachable in Present and no rail at all in a Producer mode; `docs/decisions/ADR-INFOSCHEMATICS-028-panels-follow-the-mode.md` records why the rail stays Present-only.

### PRESENT-010 — Zoom follows pointer and resets to fit

The Canvas MUST zoom in and out around the pointer when it is over the Diagram, MUST provide equivalent toolbar controls, and MUST reset to fit with the zero control.

_Conformance:_ conforming

_Verify:_ exercise pointer-centred zoom, toolbar zoom, and reset against the viewport state.

_Evidence:_ `packages/view-canvas/src/viewport.test.ts` covers viewport zoom and fit calculations.

### PRESENT-011 — Zoomed diagrams can be panned

When the Diagram is zoomed beyond fit, the Audience MUST be able to pan it without changing authored geometry.

_Conformance:_ conforming

_Verify:_ drag a zoomed Canvas and confirm only viewport state changes.

_Evidence:_ `packages/view-canvas/src/InfoschematicDiagram.tsx` owns transient pan gestures.

### PRESENT-012 — Minimap navigates the visible extent

A zoomed Canvas configured with a minimap MUST show the whole Diagram and current viewport extent and MUST support click, drag, and keyboard repositioning.

_Conformance:_ conforming

_Verify:_ zoom until the minimap appears, then navigate it by pointer and keyboard at each supported corner.

_Evidence:_ `packages/view-canvas/src/viewport.test.ts` covers minimap clamping and `InfoschematicDiagram.tsx` exposes the interactive overview.

## Gaps

- End-to-end keyboard operation and focus management do not yet have dedicated interaction coverage.
- Focusing a Flow does not yet include both endpoint elements automatically.
