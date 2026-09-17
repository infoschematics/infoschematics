# Directing — DIRECT

Producer control of Scenes and their containing presentation material. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### DIRECT-001 — Direct has a discriminated active target

Direct MUST represent its active authoring target as a discriminated value for exactly one Standalone Scene, Sequence, Callout or Storyboard. Every target MUST carry the stable identity required by its kind. A Callout target MUST identify its owning Sequence Scene. Mode selection, Direct target selection and Present focus MUST remain distinct operations.

A Callout storyboard MUST be associated with its selected presentation owner rather than introduced as another presentation-focus source.

_Conformance:_ conforming

_Verify:_ inspect `DirectTarget` and `reduceProduction` in `packages/view-present/src/production.ts`, and confirm mode, target and focus move independently.

_Evidence:_ `packages/view-present/src/production.ts` defines `DirectTarget` as a discriminated union whose Callout variant carries its owning Sequence and Scene, and `directTargetIsValid` requires the identity each kind needs. `packages/view-present/src/production.test.ts` starts every session in Present without a target, routes presentation actions only while Present is active, ignores Direct target actions outside Direct, and clears targets when another mode takes ownership.

### DIRECT-002 — Empty Sequences remain authorable

Direct MUST permit creation and editing of a Sequence whose ordered Scene collection is empty. Those drafts MUST participate in the same undo, discard and reviewable change-set conventions as other Direct edits.

An empty Sequence MUST be identifiable as non-activatable, and Present MUST keep its activation action disabled until it contains a valid Scene. Editing or previewing the empty collection MUST NOT change presentation focus.

_Conformance:_ conforming

_Verify:_ draft a Sequence, clear its Scenes, and confirm it stays editable and discardable while Present refuses to start it.

_Evidence:_ `packages/view-studio/src/app/editor/SceneListPanel.tsx` clears every Scene from a Story while leaving it editable, names the empty Story in place, and discards its edits through the same draft that `packages/view-studio/src/app/editor/use-scene-list.ts` holds and `packages/view-studio/src/app/editor/document-history.ts` reviews. `packages/view-present/src/presentation.ts` returns the presentation state unchanged for `start-sequence` and `toggle-sequence-scene` when the Scene collection is empty, and `packages/view-present/src/presentation.test.ts` asserts that by identity, so focus cannot move.

### DIRECT-003 — A Direct target that leaves the document is released

When the artefact a Direct target names is no longer among the targets the document offers, Direct MUST release the target and fall back to no target. Holding it is not permitted: a Producer cannot see, edit or present a Standalone Scene, Sequence, Callout or Storyboard that the document no longer contains, and the chooser shows a held-but-absent target as no selection, so the state is unreadable as well as unusable.

The release MUST be one mechanism. The host that mounts Direct MUST derive the available targets once, offer that list to the Producer and hand the same list to the production reducer whenever it changes; the panel that chooses a target MUST NOT release one of its own. A second release path is how a target survives a change made anywhere the panel is not looking — the Design tools, a replaced source document, or an editor whose panel is on another tab.

_Conformance:_ conforming

_Verify:_ hold a Direct target on a Standalone Scene, remove that Scene, and confirm the Diagram leaves its Scene-focusing treatment while Direct stays the active mode. Prove the case is not vacuous by removing the host's `reconcileDirectTargets` call: the case MUST fail, which it does not if a panel clears the target as well.

_Evidence:_ `packages/view-present/src/production.ts` clears a held target on `reconcile-direct-target` when no available target equals it and returns the same state when one does, and `packages/view-present/src/production.test.ts` asserts both halves by identity. `packages/view-studio/src/app/direct-targets.ts` derives the list once for both readers; `packages/view-studio/src/app/App.tsx` dispatches it on every change and `packages/view-studio/src/app/panels/DetailsPanel.tsx` reads it for its options and syncs only the kind tab. `packages/view-studio/src/app/App.browser.test.tsx` directs a Standalone Scene, removes another Scene and confirms the target holds, then removes the directed Scene and confirms the treatment goes.
