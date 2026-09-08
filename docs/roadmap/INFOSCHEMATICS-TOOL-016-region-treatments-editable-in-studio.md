---
id: INFOSCHEMATICS-TOOL-016
area: TOOL
title: Edit region treatments
theme: tool
horizon: soon
status: ready
blocks: []
blocked_by: []
baseline_ref: null
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

- [ ] Give the property patch RFC 7386 delete semantics: `mergePatch` removes a member patched with `null`, and `DeepPartial` permits `null` only on optional members.
- [ ] Add `packages/view-studio/src/app/editor/region-treatments.ts`: the control options and a total `regionTreatmentPatch` from a field and its raw control value to a patch.
- [ ] Render the treatments fieldset for a selected Region in `ArtefactControls`, populated from the effective artefact value, and style it with the existing property-fieldset chrome.
- [ ] Pass the effective artefact value through `ArtefactControlsEditor` and `artefactControlsEditorFor`.
- [ ] Cover every field: a patch per treatment field including each clear, and the rendered controls carrying the current Region's values.

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

### Specifications

Add a Studio requirement that a Region's authored treatments are editable through typed controls and that clearing an optional treatment removes it.

### Decision Records

None expected: the patch convention is an implementation detail of one editing module, recorded in code rather than as an architecture boundary.

## Discussion

Confirm the control shapes and round-trip expectations before selecting implementation.
