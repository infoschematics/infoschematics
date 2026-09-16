# Presentation — PRESENT

Audience-facing focus, filtering, controls, information, viewport use, zoom, pan, and overview navigation. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### PRESENT-001 — Production mode is explicit and transient

The interactive application MUST represent its current production mode as exactly one of `present`, `design` or `direct`. A new mount and every reload MUST start in `present`; the mode MUST NOT be persisted as an Audience preference or authored Infoschematic data.

_Conformance:_ conforming

_Verify:_ inspect `ProductionMode` and `createProductionState` in `packages/view-present/src/production.ts`, composed by `packages/view-studio`. against this requirement.

_Evidence:_ `ProductionMode` and `createProductionState` in `packages/view-present/src/production.ts`, composed by `packages/view-studio`.

### PRESENT-002 — Mode changes preserve preferences, not presentation activity

Audience preferences and filters, active Sequence focus and playback, and Producer editing state MUST remain independently owned. Entering `design` or `direct` MUST stop Sequence playback and clear the active Standalone or Sequence Scene while retaining Scope and Flow-family filters and other Audience preferences. Returning to `present` MUST retain those preferences and MUST NOT resume playback or restore cleared focus automatically.

Reasserting the current mode MUST leave all three state areas unchanged.

_Conformance:_ conforming

_Verify:_ `packages/view-present/src/production.test.ts` covers every mode-to-mode transition; rendered Studio tests cover the reload boundary.

_Evidence:_ `packages/view-present/src/production.test.ts` covers every mode-to-mode transition; rendered Studio tests cover the reload boundary.

### PRESENT-003 — Filter banks are individually controlled

Every Architectural Scope and Flow Family MUST have an independently toggleable presentation control. A new presentation MUST begin with every control selected. The vocabulary banks MUST NOT append show-all or hide-all actions as though those actions were another Scope or Family; resetting the presentation MAY restore the initial all-visible state outside those banks.

_Conformance:_ conforming

_Verify:_ inspect initial selection and individual toggle actions in `packages/view-present/src/presentation.ts`; controls in `packages/view-present/src/PresentationControls.tsx`, `packages/view-studio/src/app/panels/ProducerControls.tsx` and `packages/view-studio/src/app/panels/PanelRail.tsx`. against this requirement.

_Evidence:_ initial selection and individual toggle actions in `packages/view-present/src/presentation.ts`; controls in `packages/view-present/src/PresentationControls.tsx`, `packages/view-studio/src/app/panels/ProducerControls.tsx` and `packages/view-studio/src/app/panels/PanelRail.tsx`.

### PRESENT-004 — No Scene means full-strength rendering

When no Standalone Scene or Sequence Scene is active, every visible artefact and Flow MUST render without Scene dimming. Selecting one focus source MUST clear the other focus source.

_Conformance:_ conforming

_Verify:_ inspect focus precedence, `lightNothing` and Scene selection in `packages/view-studio/src/app/hooks/use-presentation.ts`; highlight classes in `packages/view-canvas/src/InfoschematicDiagram.tsx`. against this requirement.

_Evidence:_ focus precedence, `lightNothing` and Scene selection in `packages/view-studio/src/app/hooks/use-presentation.ts`; highlight classes in `packages/view-canvas/src/InfoschematicDiagram.tsx`.

### PRESENT-005 — Focus does not change geometry

Selecting, stepping or clearing a Scene MUST change emphasis without changing authored Card or Fabric placement, Flow routes, ports or label placement.

_Conformance:_ conforming

_Verify:_ inspect Present state is reduced to visibility and highlight sets in `packages/view-studio/src/app/hooks/use-presentation.ts`; geometry remains derived by `packages/view-model/src/runtime.ts` and consumed through `packages/view-canvas/src/runtime-context.tsx`. against this requirement.

_Evidence:_ Present state is reduced to visibility and highlight sets in `packages/view-studio/src/app/hooks/use-presentation.ts`; geometry remains derived by `packages/view-model/src/runtime.ts` and consumed through `packages/view-canvas/src/runtime-context.tsx`.

### PRESENT-006 — Visibility is resolved before focus

Present MUST apply Scope and Flow-family filters before deriving Scene emphasis. An active Scene MUST NOT make a filtered artefact or Flow visible, and filtered content MUST NOT contribute to the resulting focus set.

Design and Direct MUST NOT use that filtered Audience projection as their editable content source.

_Conformance:_ conforming

_Verify:_ inspect presentation derivation in `packages/view-present/src/presentation.ts` and compatible integrated derivation in `packages/view-studio/src/app/hooks/use-presentation.ts`. against this requirement.

_Evidence:_ presentation derivation in `packages/view-present/src/presentation.ts` and compatible integrated derivation in `packages/view-studio/src/app/hooks/use-presentation.ts`.

### PRESENT-007 — Info is derived from the model

Info MUST derive its Card, Fabric and Flow register from the current Infoschematic runtime rather than duplicate those entries in view-owned content. A Flow row MUST identify its endpoints and represented interface relationship where one exists.

_Conformance:_ conforming

_Verify:_ inspect `packages/view-studio/src/app/panels/ModelRegister.tsx` reads the runtime register, scopes, families, interfaces and endpoint labels. against this requirement.

_Evidence:_ `packages/view-studio/src/app/panels/ModelRegister.tsx` reads the runtime register, scopes, families, interfaces and endpoint labels.

### PRESENT-008 — Keyboard help reflects presentation controls

Present View MUST expose in-view keyboard help for Sequence stepping and exit, plus automatic-advance control for timed Sequences. The corresponding Callout actions MUST also be available as labelled buttons.

_Conformance:_ conforming

_Verify:_ inspect `packages/view-studio/src/app/panels/ShortcutOverlay.tsx`, `packages/view-studio/src/app/panels/SceneCallout.tsx` and global presentation-key handling in `packages/view-studio/src/app/App.tsx`. against this requirement.

_Evidence:_ `packages/view-studio/src/app/panels/ShortcutOverlay.tsx`, `packages/view-studio/src/app/panels/SceneCallout.tsx` and global presentation-key handling in `packages/view-studio/src/app/App.tsx`.

### PRESENT-009 — The Infoschematic can take the available canvas

Present View MUST offer a collapsed layout in which the Infoschematic panel takes the space otherwise occupied by expanded Producer controls and Details. The collapsed layout MUST retain reachable Architectural Scope, Flow Family and Sequence controls, and the stable title bar MUST retain controls for restoring panels and leaving full screen.

_Conformance:_ conforming

_Verify:_ inspect collapsed state and full-screen handling in `packages/view-studio/src/app/App.tsx`; compact controls in `packages/view-studio/src/app/panels/PanelRail.tsx`; persistent mode controls in `packages/view-studio/src/app/panels/TitleBar.tsx`. against this requirement.

_Evidence:_ collapsed state and full-screen handling in `packages/view-studio/src/app/App.tsx`; compact controls in `packages/view-studio/src/app/panels/PanelRail.tsx`; persistent mode controls in `packages/view-studio/src/app/panels/TitleBar.tsx`.

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
