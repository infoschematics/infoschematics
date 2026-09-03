# Present View specification

Present View adds audience-facing filtering, Scene focus, Story playback and explanatory controls around Canvas. `packages/view-present` owns the reusable Audience component and pure presentation state; Studio composes it as the `present` member of the shared transient production mode.

_Package verification: `packages/view-present/src/presentation.test.ts` and `packages/view-present/src/Present.test.tsx` cover state transitions and server-rendered composition._

## Production mode

### PRESENT-011 — Production mode is explicit and transient

The interactive application MUST represent its current production mode as exactly one of `present`, `design` or `direct`. A new mount and every reload MUST start in `present`; the mode MUST NOT be persisted as an Audience preference or authored Infoschematic data.

_Implementation surface: `ProductionMode` and `createProductionState` in `packages/view-present/src/production.ts`, composed by `packages/view-studio`._

### PRESENT-012 — Mode changes preserve preferences, not presentation activity

Audience preferences and filters, active presentation focus and Story playback, and Producer editing state MUST remain independently owned. Entering `design` or `direct` MUST stop Story playback and clear the active Standalone Scene, Thematic Scene or Story while retaining Scope and Flow-family filters and other Audience preferences. Returning to `present` MUST retain those preferences and MUST NOT resume playback or restore cleared focus automatically.

Reasserting the current mode MUST leave all three state areas unchanged.

_Verification: `packages/view-present/src/production.test.ts` covers every mode-to-mode transition; rendered Studio tests cover the reload boundary._

## Visibility and focus

### PRESENT-001 — Filter banks can be cleared

Each scope and flow-family filter bank MUST allow all of its members to be hidden and subsequently restored. The expanded Producer controls and collapsed rail MUST operate on the same visibility state.

_Implementation surface: `showAllScopes` and `showAllFamilies` in `packages/view-studio/src/app/hooks/use-presentation.ts`; controls in `packages/view-studio/src/app/panels/ProducerControls.tsx` and `packages/view-studio/src/app/panels/PanelRail.tsx`._

### PRESENT-002 — No Scene means full-strength rendering

When no Standalone Scene, Thematic Scene or Story Scene is active, every visible artefact and Flow MUST render without Scene dimming. Selecting one focus source MUST clear the other focus sources.

_Implementation surface: focus precedence, `lightNothing` and Scene selection in `packages/view-studio/src/app/hooks/use-presentation.ts`; highlight classes in `packages/view-studio/src/app/InfoschematicDiagram.tsx`._

### PRESENT-003 — Focus does not change geometry

Selecting, stepping or clearing a Scene MUST change emphasis without changing authored Card or Fabric placement, Flow routes, ports or label placement.

_Implementation surface: Present state is reduced to visibility and highlight sets in `packages/view-studio/src/app/hooks/use-presentation.ts`; geometry remains derived by `packages/view-studio/src/app/infoschematic-context.tsx`._

### PRESENT-013 — Visibility is resolved before focus

Present MUST apply Scope and Flow-family filters before deriving Scene emphasis. An active Scene MUST NOT make a filtered artefact or Flow visible, and filtered content MUST NOT contribute to the resulting focus set.

Design and Direct MUST NOT use that filtered Audience projection as their editable content source.

_Implementation surface: presentation derivation in `packages/view-present/src/presentation.ts` and compatible integrated derivation in `packages/view-studio/src/app/hooks/use-presentation.ts`._

## Stories

### PRESENT-004 — A running Story can be steered

While a Story runs, the Audience MUST be able to step forward, step backward, hold or resume automatic advance and stop the Story. Stepping beyond either end MUST wrap within the Story.

_Implementation surface: `stepStory`, `toggleAutoAdvance` and `stopStory` in `packages/view-studio/src/app/hooks/use-presentation.ts`; controls in `packages/view-studio/src/app/panels/SceneCallout.tsx`; keyboard handling in `packages/view-studio/src/app/App.tsx`._

### PRESENT-014 — Only activatable presentation material can own focus

Present MUST allow at most one Standalone Scene, Thematic Scene or Story to be active. Story focus MUST take precedence over Thematic Scene focus, which MUST take precedence over Standalone Scene focus if stale external state contains more than one candidate.

An empty Theme or Story MUST NOT be activatable in Present. Clear and step actions against an empty collection, a stale identifier or an invalid step MUST be total operations: they MUST return a valid state without throwing or activating unavailable content.

_Verification: presentation-state tests cover focus conflicts, empty Themes and Stories, stale identifiers and invalid steps._

## Flow signals

### PRESENT-015 — Scene entry can signal focused Flows once

Present MUST expose a `signalPolicy` prop accepting `focused-flows` or `none`. Under `focused-flows`, entering a Standalone Scene, Thematic Scene, or Story Scene MUST derive one framework-neutral signal occurrence for each resolved focused Flow. The occurrence key MUST distinguish that Scene entry from earlier entries while remaining stable across ordinary renders of the same entry.

Re-rendering, filtering, hover, selection, and focus inspection MUST NOT create a new occurrence. Stepping to another Story Scene or entering another Scene MAY create new occurrences for its resolved focused Flows, including a Flow signalled by an earlier entry.

Under `none`, Present MUST derive no automatic occurrences. The policy MUST NOT prevent a host from supplying explicit occurrences directly through the Canvas boundary. Signal policy and active occurrences MUST remain transient host or Present state rather than authored Infoschematic or process-global state.

_Implementation surface: signal derivation in `packages/view-model/src/signals.ts` and Scene-entry coordination in `packages/view-present`._

### PRESENT-016 — Scene changes cancel obsolete signals

Clearing a Scene MUST cancel its active occurrences. Replacing the active Standalone Scene, Thematic Scene, or Story Scene MUST cancel occurrences not owned by the new entry before deriving new ones. A completed occurrence MUST NOT resume merely because Present re-renders or the same Scene remains active.

Unknown Flow identifiers MUST be ignored by focused-Flow resolution. Scene signal derivation MUST remain pure, framework-neutral, and independent of timers; Canvas owns finite rendering and accessible announcement.

_Verification: presentation reducer and rendered Present tests cover one-shot entry, opt-out, replay after a new entry, Story stepping, cancellation, and filtering without signalling._

## Callouts

### PRESENT-005 — Automatic Callout placement is deterministic

When a Scene does not author an explicit Callout position, Present View MUST choose from the Infoschematic's candidate positions in their declared order, prefer a position clear of focused content and otherwise choose the lowest-cost candidate. The chosen Callout MUST remain inside the Infoschematic view box. An explicitly authored position MUST take precedence.

_Verification: `packages/view-model/src/placement.test.ts` covers candidate order, weighted obstruction, least-cost fallback and view-box clamping._

_Implementation surface: `chooseSpot` in `packages/view-model/src/placement.ts`; focused-content obstacles and authored override in `packages/view-studio/src/app/panels/SceneCallout.tsx`._

### PRESENT-010 — Custom Callouts retain the Audience contract

Present MUST resolve a Callout renderer through the immutable host registry and MUST validate its serialisable properties before invoking it. An unknown key or invalid property value MUST emit the corresponding structured host diagnostic and use the standard Callout presentation. An unsupported renderer-definition version MUST be diagnosed and rejected before use.

A custom implementation MAY replace the Callout's visual content, but Present MUST retain deterministic placement, the accessible live-status frame, Story navigation, automatic-advance controls, and exit action. The fallback MUST retain the authored title, body, and takeaways rather than hide explanatory content.

_Implementation surface: renderer resolution in `packages/view-canvas/src/renderers.tsx` and Callout composition in `packages/view-present/src/SceneCallout.tsx`._

_Verification: `packages/view-present/src/SceneCallout.test.tsx` covers standard, custom, unknown and invalid Callouts through server rendering._

## Details

### PRESENT-006 — Info is derived from the model

Info MUST derive its Card, Fabric and Flow register from the current Infoschematic runtime rather than duplicate those entries in view-owned content. A Flow row MUST identify its endpoints and represented interface relationship where one exists.

_Implementation surface: `packages/view-studio/src/app/panels/ModelRegister.tsx` reads the runtime register, scopes, families, interfaces and endpoint labels._

## Visual language

### PRESENT-007 — Component-scale shapes share the radius token

Rectangular component-scale shapes rendered by the supplied view library MUST use the shared `cornerRadius` token rather than define unrelated local radii.

_Implementation surface: `cornerRadius` in `packages/view-model/src/tokens.ts`, consumed by `packages/view-studio/src/app/InfoschematicDiagram.tsx` and supplied Fabric renderers._

## Presentation controls

### PRESENT-008 — Keyboard help reflects presentation controls

Present View MUST expose in-view keyboard help for Story stepping, automatic-advance control and exit, and for Thematic Scene stepping and clearing. The corresponding Callout actions MUST also be available as labelled buttons.

_Implementation surface: `packages/view-studio/src/app/panels/ShortcutOverlay.tsx`, `packages/view-studio/src/app/panels/SceneCallout.tsx` and global presentation-key handling in `packages/view-studio/src/app/App.tsx`._

### PRESENT-009 — The Infoschematic can take the available canvas

Present View MUST offer a collapsed layout in which the Infoschematic panel takes the space otherwise occupied by expanded Producer controls and Details. The collapsed layout MUST retain reachable scope, flow-family, Story and Thematic Scene controls, and the stable title bar MUST retain controls for restoring panels and leaving full screen.

_Implementation surface: collapsed state and full-screen handling in `packages/view-studio/src/app/App.tsx`; compact controls in `packages/view-studio/src/app/panels/PanelRail.tsx`; persistent mode controls in `packages/view-studio/src/app/panels/TitleBar.tsx`._

## Gaps

- **Descriptor integrity:** Present View does not yet validate every Scene and Story reference against the current artefact and Flow registries. Runtime derivation ignores unknown Flow identifiers but does not provide a single fail-fast integrity gate for all references.
- **Focused Flow endpoints:** focusing a Flow does not yet add its source and target to the focus set automatically; authors must currently name the artefacts as well.
- **Accessible interaction verification:** labelled controls, a keyboard-help dialog, contextual shortcuts and polite Callout announcements are implemented, but end-to-end keyboard operation and focus management do not yet have dedicated interaction tests.
