# Present View specification

Present View adds audience-facing filtering, Scene focus, Story playback and explanatory controls around an Infoschematic. These requirements describe reusable behaviour currently represented by `packages/view-studio`; the future package boundary does not change their ownership.

## Visibility and focus

### PRESENT-001 — Filter banks can be cleared

Each scope and flow-family filter bank MUST allow all of its members to be hidden and subsequently restored. The expanded Producer controls and collapsed rail MUST operate on the same visibility state.

_Provenance: generalised from IBC DASH-002._

_Implementation surface: `showAllScopes` and `showAllFamilies` in `packages/view-studio/src/app/hooks/use-presentation.ts`; controls in `packages/view-studio/src/app/panels/ProducerControls.tsx` and `packages/view-studio/src/app/panels/PanelRail.tsx`._

### PRESENT-002 — No Scene means full-strength rendering

When no Standalone Scene, Thematic Scene or Story Scene is active, every visible artefact and Flow MUST render without Scene dimming. Selecting one focus source MUST clear the other focus sources.

_Provenance: generalised from IBC DASH-003 and DASH-004._

_Implementation surface: focus precedence, `lightNothing` and Scene selection in `packages/view-studio/src/app/hooks/use-presentation.ts`; highlight classes in `packages/view-studio/src/app/InfoschematicDiagram.tsx`._

### PRESENT-003 — Focus does not change geometry

Selecting, stepping or clearing a Scene MUST change emphasis without changing authored Card or Fabric placement, Flow routes, ports or label placement.

_Provenance: retained from the fixed-geometry constraint in IBC dashboard design and the intent behind DASH-004._

_Implementation surface: Present state is reduced to visibility and highlight sets in `packages/view-studio/src/app/hooks/use-presentation.ts`; geometry remains derived by `packages/view-studio/src/app/infoschematic-context.tsx`._

## Stories

### PRESENT-004 — A running Story can be steered

While a Story runs, the Audience MUST be able to step forward, step backward, hold or resume automatic advance and stop the Story. Stepping beyond either end MUST wrap within the Story.

_Provenance: generalised from IBC DASH-010._

_Implementation surface: `stepStory`, `toggleAutoAdvance` and `stopStory` in `packages/view-studio/src/app/hooks/use-presentation.ts`; controls in `packages/view-studio/src/app/panels/SceneCallout.tsx`; keyboard handling in `packages/view-studio/src/app/App.tsx`._

## Callouts

### PRESENT-005 — Automatic Callout placement is deterministic

When a Scene does not author an explicit Callout position, Present View MUST choose from the Infoschematic's candidate positions in their declared order, prefer a position clear of focused content and otherwise choose the lowest-cost candidate. The chosen Callout MUST remain inside the Infoschematic view box. An explicitly authored position MUST take precedence.

_Provenance: generalised from IBC DASH-024._

_Verification: `packages/view-model/src/placement.test.ts` covers candidate order, weighted obstruction, least-cost fallback and view-box clamping._

_Implementation surface: `chooseSpot` in `packages/view-model/src/placement.ts`; focused-content obstacles and authored override in `packages/view-studio/src/app/panels/SceneCallout.tsx`._

## Details

### PRESENT-006 — Info is derived from the model

Info MUST derive its Card, Fabric and Flow register from the current Infoschematic runtime rather than duplicate those entries in view-owned content. A Flow row MUST identify its endpoints and represented interface relationship where one exists.

_Provenance: generalised from IBC DASH-030._

_Implementation surface: `packages/view-studio/src/app/panels/ModelRegister.tsx` reads the runtime register, scopes, families, interfaces and endpoint labels._

## Visual language

### PRESENT-007 — Component-scale shapes share the radius token

Rectangular component-scale shapes rendered by the supplied view library MUST use the shared `cornerRadius` token rather than define unrelated local radii.

_Provenance: generalised from IBC DASH-023._

_Implementation surface: `cornerRadius` in `packages/view-model/src/tokens.ts`, consumed by `packages/view-studio/src/app/InfoschematicDiagram.tsx` and supplied Fabric renderers._

## Presentation controls

### PRESENT-008 — Keyboard help reflects presentation controls

Present View MUST expose in-view keyboard help for Story stepping, automatic-advance control and exit, and for Thematic Scene stepping and clearing. The corresponding Callout actions MUST also be available as labelled buttons.

_Provenance: generalised from IBC DASH-010 and DASH-017._

_Implementation surface: `packages/view-studio/src/app/panels/ShortcutOverlay.tsx`, `packages/view-studio/src/app/panels/SceneCallout.tsx` and global presentation-key handling in `packages/view-studio/src/app/App.tsx`._

### PRESENT-009 — The Infoschematic can take the available canvas

Present View MUST offer a collapsed layout in which the Infoschematic panel takes the space otherwise occupied by expanded Producer controls and Details. The collapsed layout MUST retain reachable scope, flow-family, Story and Thematic Scene controls, and the stable title bar MUST retain controls for restoring panels and leaving full screen.

_Provenance: generalised from IBC DASH-015 and DASH-016._

_Implementation surface: collapsed state and full-screen handling in `packages/view-studio/src/app/App.tsx`; compact controls in `packages/view-studio/src/app/panels/PanelRail.tsx`; persistent mode controls in `packages/view-studio/src/app/panels/TitleBar.tsx`._

## Gaps

- **Descriptor integrity:** Present View does not yet validate every Scene and Story reference against the current artefact and Flow registries. Runtime derivation ignores unknown Flow identifiers but does not provide a single fail-fast integrity gate for all references. This is the reusable remainder of IBC DASH-005 and DASH-008.
- **Focused Flow endpoints:** focusing a Flow does not yet add its source and target to the focus set automatically; authors must currently name the artefacts as well. Endpoint expansion remains the reusable requirement identified by IBC DASH-006.
- **Accessible interaction verification:** labelled controls, a keyboard-help dialog, contextual shortcuts and polite Callout announcements are implemented, but end-to-end keyboard operation and focus management do not yet have dedicated interaction tests.
