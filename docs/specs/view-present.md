# Present View specification

Present View adds audience-facing filtering, Scene focus, Story playback and explanatory controls around Canvas. `packages/view-present` owns the reusable Audience component and pure presentation state; Studio retains compatible integrated controls while Producer-mode extraction continues.

_Package verification: `packages/view-present/src/presentation.test.ts` and `packages/view-present/src/Present.test.tsx` cover state transitions and server-rendered composition._

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

## Stories

### PRESENT-004 — A running Story can be steered

While a Story runs, the Audience MUST be able to step forward, step backward, hold or resume automatic advance and stop the Story. Stepping beyond either end MUST wrap within the Story.

_Implementation surface: `stepStory`, `toggleAutoAdvance` and `stopStory` in `packages/view-studio/src/app/hooks/use-presentation.ts`; controls in `packages/view-studio/src/app/panels/SceneCallout.tsx`; keyboard handling in `packages/view-studio/src/app/App.tsx`._

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
