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
