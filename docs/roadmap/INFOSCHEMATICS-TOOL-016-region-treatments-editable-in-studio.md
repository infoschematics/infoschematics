---
id: INFOSCHEMATICS-TOOL-016
area: TOOL
title: Edit region treatments
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 34adaf9bc7fd4cbb4c66485f61b9a4922b78899d
---

## Goal

Let the Studio's Details panel edit everything a Region can author — frame style and opacity, fill, label placement, label mount and label offset — so a Region's treatments can be designed in the editor rather than only in source.

## Context

The region unification (IBC2026-DBD-020) collapsed lanes and zones into one `RegionConfig` (`packages/domain-model/src/region.ts`): an explicit box with an optional frame (`solid`/`dashed`/`dotted` at opacity), an optional fill, and a label that is internal or boundary-mounted, placed by one of nine compass bearings with an along-edge offset. The Studio already creates, selects, moves, resizes, reorders, renames and removes Regions, but the Details panel exposes none of the treatment fields: `createDefaultRegion` seeds a solid frame and the rest is source-only. Every visual decision the record carries — a fill-only column, a dashed frame, a boundary title pulled along its edge — currently requires editing the authored file.

## Boundary

This item adds editing surface for the existing `RegionConfig` fields only; it does not extend the treatment vocabulary (that is INFOSCHEMATICS-TOOL-018). It does not change the serialisable record or either renderer.

## Current state

Selection already carries the `edit-properties` capability for every Region, and `ArtefactControls` renders one free-text JSON textarea for it. A treatment is therefore reachable only by hand-writing the record's JSON, and a treatment cannot be **removed** at all: `mergePatch` in `packages/view-studio/src/app/editor/artefact-operations.ts` skips `undefined` and its patch value survives a `JSON.stringify` round trip, so no patch can express "this Region has no frame".

## Shaping decisions

- **Typed controls sit beside the JSON textarea, not in place of it.** The textarea stays the general escape hatch that every kind shares; Region gains a dedicated treatments fieldset. The change is additive and no other kind's control surface moves.
- **Clearing an optional field is `null`, following JSON Merge Patch (RFC 7386).** `mergePatch` deletes a member whose patch value is `null`, and `DeepPartial` admits `null` only where the member is already optional, so a required field cannot be cleared by construction.
- **Each control applies on change.** Only free text needs an Apply button; a select or a committed number behaves like the reorder and remove actions already do.
- **Control shapes:** frame style as `None`/`Solid`/`Dashed`/`Dotted` (`None` clears the whole frame); frame opacity as a 0–1 number, offered only while a frame exists, cleared when emptied; fill as text carrying the authored hex convention including alpha, cleared when emptied; label placement as unset plus `none` and the nine bearings; label mount as unset, `boundary` or `internal`; label offset as a number, cleared when emptied.
- **The mapping from a control to a patch is a pure function.** The Studio suite renders through `renderToStaticMarkup` and has no DOM, so per-field coverage must not need one.

## Steps

- [x] Give the property patch RFC 7386 delete semantics: `mergePatch` removes a member patched with `null`, and `DeepPartial` permits `null` only on optional members.
- [x] Add `packages/view-studio/src/app/editor/region-treatments.ts`: the control options and a total `regionTreatmentPatch` from a field and its raw control value to a patch.
- [x] Render the treatments fieldset for a selected Region in `ArtefactControls`, populated from the effective artefact value, and style it with the existing property-fieldset chrome.
- [x] Pass the effective artefact value through `ArtefactControlsEditor` and `artefactControlsEditorFor`.
- [x] Cover every field: a patch per treatment field including each clear, and the rendered controls carrying the current Region's values.

## Files touched

- `packages/view-studio/src/app/editor/artefact-operations.ts` for the patch delete semantics, with its tests
- `packages/view-studio/src/app/editor/region-treatments.ts`, new, with its tests
- `packages/view-studio/src/app/editor/ArtefactControls.tsx` and `packages/view-studio/src/styles.css` for the fieldset
- `packages/view-studio/src/app/panels/DetailsPanel.tsx` and `DetailsPanel.artefacts.test.tsx` for the effective value and the round trip
- `packages/domain-model/` and both renderers are **not** touched: the serialisable record is unchanged

## Verify

Prove that each treatment field round-trips as one replace operation whose value the editing stack accepts, and that clearing an optional field removes the member rather than writing a null into the authored record. Run `bun run self:check`.

## Dependencies / blocks

None. INFOSCHEMATICS-TOOL-018 extends the treatment vocabulary later and consumes this control surface rather than replacing it.

## Documentation impact

### Decision Records

None expected: the patch convention is an implementation detail of one editing module, recorded in code rather than as an architecture boundary.

### Specifications

Add a Studio requirement that a Region's authored treatments are editable through typed controls and that clearing an optional treatment removes it.

### Guides

No guide change is expected.

### Roadmap

Record implementation and verification evidence in this item before acceptance.

## Review

### Delivered

Every treatment a Region authors is now editable in Studio's Details panel: frame style, frame opacity, fill, label placement, label mount and label offset, each as a typed control that produces one ordinary replace operation. Emptying a control clears the treatment — the authored member is removed rather than written as an empty value — and choosing `None` for the frame drops the frame entirely rather than leaving a style behind.

The general JSON properties control is unchanged and still available for every kind. `RegionConfig`, both renderers and the serialisable record are untouched, and no treatment vocabulary was added.

### Summary of changes

- `packages/view-studio/src/app/editor/artefact-operations.ts` — the property patch now follows JSON Merge Patch: `null` removes a member. `DeepPartial` is exported as `PropertyPatch<T>` and admits `null` only where the member is optional (`undefined extends T[P] ? null : never`), so a required member cannot be cleared away. Without this, no patch could express "this Region has no frame": `mergePatch` skipped `undefined` and a `JSON.stringify` round trip dropped it anyway.
- `packages/view-studio/src/app/editor/region-treatments.ts` — new. `regionTreatmentValue` reads a control's value from the Region, `regionTreatmentPatch` maps a control value back to a patch, and `regionTreatmentOptions` supplies each choice list in domain order behind the choice that clears it. Both functions are pure and total: a value the field cannot carry — an opacity on a frameless Region, a bearing that is not one — yields no patch rather than a fault.
- `packages/view-studio/src/app/editor/RegionTreatments.tsx` — new. The controls themselves. Choices apply as they are made; the typed fields apply on blur and are uncontrolled behind a value-derived `key`, so typing keeps the caret while an edit made elsewhere (an undo, or the JSON field) re-seeds them.
- `packages/view-studio/src/app/editor/ArtefactControls.tsx` — renders the fieldset for a selected Region, from a new `artefactValue` on `ArtefactControlsEditor`. `Serialisable` gained `undefined`, which is what a patch shape means and lets it pass without a cast; parsed JSON still never produces one.
- `packages/view-studio/src/app/panels/DetailsPanel.tsx` — passes the effective artefact value through to the controls.
- `packages/view-studio/src/styles.css` — the existing property-fieldset chrome now covers `input` and `select` beside `textarea`.
- Documentation — EDIT-085 in the [Studio View specification](../specs/view-studio.md).

### Verification

- `bun run self:check` exit 0: 57 test files, 380 tests, every TypeScript workspace clean, dependency-cruiser clean at 208 modules and 487 dependencies, production site build in 8.58s.
- `packages/view-studio/src/app/editor/region-treatments.test.ts` — new, 6 tests covering every field in both directions: what each control shows for a treated and an untreated Region, each field's patch, each field's clear, the opacity range, and the six cases that must produce no patch.
- `packages/view-studio/src/app/editor/artefact-operations.test.ts` — a null-patched optional member is removed from the materialised Region and the operation is still accepted; a `@ts-expect-error` proves a required member has no `null` to clear it with, so the constraint is checked by the compiler rather than asserted in prose.
- `packages/view-studio/src/app/editor/ArtefactControls.test.tsx` — the rendered controls carry the Region's current values and selected options, the frame opacity is absent for a Region that draws no frame, and another kind is left with the general control alone.
- `packages/view-studio/src/app/panels/DetailsPanel.artefacts.test.tsx` — the panel renders the treatments and a treatment patch round-trips through `artefactControlsEditorFor` as `{ kind: 'region', value }`.
- `bunx biome check` — clean on the three new files; the warnings in the touched test files are the repository's pre-existing non-null-assertion style.

### Outstanding concerns

- **The blur commit is not exercised in a driven DOM.** The Studio suite renders through `renderToStaticMarkup` and has no DOM, which is why the control-to-patch mapping is a pure function tested exhaustively and the markup is tested separately. The event wiring between them — that blurring the fill field really calls `commit` — is not covered by a test, which is the rendered-interaction gap the specification already records.
- **Fill remains free text.** There is no colour picker and no validation of the authored hex-with-alpha convention; a nonsense string is accepted and rendered as the browser sees fit. The item's boundary asked for editing surface over the existing fields, not new validation.
- **The `Default` option is honest but thin.** Clearing `labelPlacement` or `labelMount` restores the renderer's default (`north-west`, `internal`) rather than showing what that default is. A producer must know the default to predict the result.

### Post-change review

The plan's shape survived, but its central assumption did not: it treated the round trip as already solved because "the panel edits produce the same replace operations the editing stack already orders". That is true for setting a value and false for removing one, and removal is half of what the item asks for — a Region that draws no frame, a boundary title with no offset. The patch convention had to change before any control could clear anything, and that is the only change outside the panel.

The typing is what makes the convention safe rather than a new way to corrupt a record. Allowing `null` everywhere would let `{ label: null }` produce a Region with no label that the materialiser would still accept; restricting it to optional members means the compiler refuses that patch, which the `@ts-expect-error` records.

Keeping the JSON textarea alongside the typed controls was a deliberate choice, not an omission. It stays the escape hatch for the four kinds that have no typed controls, and now shares the delete semantics: an author can write `{"fill": null}` into it and have the member removed.

### Mini recap

INFOSCHEMATICS-TOOL-016 makes a Region's treatments designable in Studio. Six typed controls sit beside the general JSON properties control, each producing one ordinary replace operation, and each able to clear its treatment through a new JSON Merge Patch convention where `null` removes a member — typed so that only an optional member admits it.

Verification is `bun run self:check` at exit 0 with 380 tests, of which 15 are new across the pure mapping, the patch semantics and the rendered controls. EDIT-085 records the requirement in the Studio View specification.

Three concerns are open for review: the blur commit is not exercised in a driven DOM, fill remains unvalidated free text, and a cleared choice shows `Default` without naming the default it restores. `RegionConfig`, both renderers and the treatment vocabulary are unchanged, so INFOSCHEMATICS-TOOL-018 remains free to extend them.

## Discussion

Confirm the control shapes and round-trip expectations before selecting implementation.
