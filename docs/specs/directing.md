# Directing — DIRECT

Producer control of Scenes and their containing presentation material. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### DIRECT-001 — Direct has a discriminated active target

Direct MUST represent its active authoring target as a discriminated value for exactly one Standalone Scene, Sequence, Callout or Storyboard. Every target MUST carry the stable identity required by its kind. A Callout target MUST identify its owning Sequence Scene. Mode selection, Direct target selection and Present focus MUST remain distinct operations.

A Callout storyboard MUST be associated with its selected presentation owner rather than introduced as another presentation-focus source.

_Conformance:_ pending

_Verify:_ inspect `DirectTarget` and `reduceProduction` in `packages/view-present/src/production.ts`, composed by the Direct surface under `packages/view-studio/src/app`. against this requirement.

### DIRECT-002 — Empty Sequences remain authorable

Direct MUST permit creation and editing of a Sequence whose ordered Scene collection is empty. Those drafts MUST participate in the same undo, discard and reviewable change-set conventions as other Direct edits.

An empty Sequence MUST be identifiable as non-activatable, and Present MUST keep its activation action disabled until it contains a valid Scene. Editing or previewing the empty collection MUST NOT change presentation focus.

_Conformance:_ pending

_Verify:_ Direct state and rendered-control tests cover empty Sequence creation, editing, undo, activation guards and the first valid Scene.
