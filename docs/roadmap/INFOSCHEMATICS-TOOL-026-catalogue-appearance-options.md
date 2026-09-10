---
id: INFOSCHEMATICS-TOOL-026
area: TOOL
title: Catalogue appearance options
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 421dd6f9896ea4ab7d933f2d8c3eda937ca2a736
---

## Goal

Describe every authored appearance option once, at runtime: its values, its control shape, and the vocabulary term it realises. Controls, specimens, and prose then derive from one catalogue instead of each re-listing the same union by hand.

## Context

The option surface is already stated in at least three places, and they have already drifted. `packages/domain-model/src/appearance.ts` declares the unions and exports `surfaceTreatments`, `gridTreatments`, and `regionLabelPlacements` as tuples built from a `Record<Union, true>` exhaustiveness trick, so a new member fails typecheck until the tuple is updated. `packages/view-studio/src/app/editor/region-treatments.ts` then re-lists all nine label placements as a literal rather than importing that tuple, and lists frame styles and label mounts that have no tuple at all. `apps/site/src/visual-guide/specimens.ts` builds three of its four groups from the domain tuples and hand-curates the fourth.

Nothing connects an option to the concept it expresses. [The vocabulary reference](../reference/vocabulary.md) names Region, Fabric, Card, and the rest, but no code cites those terms and no term names the options that realise it, so the product's language and its option surface move independently.

This was requested as the foundation for a visual guide that teaches the vocabulary rather than displaying screenshots, and it is the same catalogue an editing surface needs: `INFOSCHEMATICS-TOOL-016` hand-wrote Region's controls because there was nothing to derive them from.

## Boundary

This item describes options that already exist. It does not add, rename, or remove an appearance option, change any renderer's output, or change the serialisable config shape. It builds no control component and no page — `INFOSCHEMATICS-SITE-011` consumes the catalogue for those. It adds vocabulary term ids only for the terms the catalogue cites; completing the id set across the wider documentation is `INFOSCHEMATICS-TOOL-027`.

## Current state

`appearance.ts` exports three tuples and no descriptive metadata: nothing states that `grid` is a choice of four values while `card.compact` is a flag, so a consumer that wants to offer either must know it already. `RegionFrameStyle` and `RegionLabelMount` in `packages/domain-model/src/region.ts` have no runtime tuple at all. `region-treatments.ts` carries the only description of a control's shape anywhere in the repository — options with a leading clearing choice, a value reader, and a patch function — and it is Region-specific and lives inside Studio's app, where nothing else can reach it.

## Shaping decisions

- **The catalogue is data in Domain Model.** Static SVG output, React views, and the site all need it, and Domain Model is the dependency root every one of them already consumes. It stays serialisable description with no control component, so framework neutrality is unaffected.
- **Exhaustiveness is enforced rather than asserted.** The catalogue is a `Record<AppearanceOptionKey, AppearanceOptionDescriptor>` over a union of every authored option key, so adding an option without describing it fails typecheck — the same trick the tuples already use, applied one level up.
- **A descriptor states its control shape.** `choice` with an ordered value list, or `flag`. That is what lets a control surface be derived instead of written, and it is the difference between this catalogue and the tuples it replaces.
- **Every descriptor cites a vocabulary term.** The term id is part of the descriptor, and a test asserts the id exists in [the vocabulary reference](../reference/vocabulary.md). An option that expresses no named concept is a signal the concept is missing from the vocabulary, not a reason to omit the field.
- **Missing tuples are added rather than worked around.** `RegionFrameStyle` and `RegionLabelMount` get the same exhaustiveness treatment, and `region-treatments.ts` imports the domain tuples instead of re-listing them. That is the drift this item exists to close, so closing it here rather than leaving it for a consumer is the point.
- **Defaults stay where they are resolved.** A descriptor records the rendered default only where the domain already states one; it does not become a second place that decides what an absent option means.

## Steps

- [x] Add `regionFrameStyles` and `regionLabelMounts` tuples to `packages/domain-model/src/region.ts` using the `Record<Union, true>` exhaustiveness trick, with matching assertions in its test.
- [x] Add `packages/domain-model/src/option-catalogue.ts`: the `AppearanceOptionKey` union, an `AppearanceOptionDescriptor` type carrying `control`, `values`, `term`, and an optional `default`, and the `appearanceOptions` record over every key.
- [x] Add stable term ids to [the vocabulary reference](../reference/vocabulary.md) for each term the catalogue cites.
- [x] Add `packages/domain-model/src/option-catalogue.test.ts`: every choice descriptor's values equal its union tuple, every key of the authored appearance config is described, and no descriptor is orphaned.
- [x] Add a test asserting every cited term id resolves to a heading id present in the vocabulary reference, so a renamed term breaks the build rather than the guide.
- [x] Repoint `packages/view-studio/src/app/editor/region-treatments.ts` at the domain tuples, removing the hand-written placement, frame-style, and label-mount lists.
- [x] Export the catalogue from `packages/domain-model/src/index.ts` and its `exports` map, and confirm the dependency cruise stays clean.
- [x] Record the requirement in [the domain model specification](../specs/domain-model.md): every authored appearance option is described in the catalogue and cites a vocabulary term.

## Files touched

- `packages/domain-model/src/option-catalogue.ts` and its test, new
- `packages/domain-model/src/appearance.ts`, `packages/domain-model/src/region.ts`, and their tests
- `packages/domain-model/src/index.ts` and `packages/domain-model/package.json` for the export
- `packages/view-studio/src/app/editor/region-treatments.ts`
- `docs/reference/vocabulary.md`, `docs/specs/domain-model.md`

## Verify

`bun run self:check`. The catalogue test proves each choice descriptor matches its union tuple and that every authored option key is described; the vocabulary test proves each cited term id exists. Removing a member from a union, or adding one without cataloguing it, must fail typecheck rather than a test — confirm that by hand before finishing.

## Dependencies / blocks

No lifecycle blockers are declared. `INFOSCHEMATICS-SITE-011` and `INFOSCHEMATICS-TOOL-027` both consume this catalogue and are sequenced after it in practice; that sequencing is a build-order fact, and following the decision recorded on `INFOSCHEMATICS-SITE-008` it is stated here rather than declared as a `blocks` relationship that would gate their planning on this record's approval.

## Documentation impact

### Decision Records

None expected. The catalogue applies the ownership direction ADR-INFOSCHEMATICS-004 and ADR-INFOSCHEMATICS-008 already set, and decides nothing about what the options are.

### Specifications

Add a requirement to [the domain model specification](../specs/domain-model.md) that every authored appearance option is catalogued with its control shape and its vocabulary term.

### Guides

None directly. [The architecture guide](../design/architecture.md) needs no change, since no ownership root moves.

### Roadmap

Record implementation and verification evidence in this item before acceptance.

## Review

### Delivered

Every authored appearance option is now described once, at runtime, with its control shape, its values, its rendered default where one exists, and the vocabulary term it gives visual form to. The option surface can no longer be re-listed by hand without the compiler noticing, and Studio's Region controls consume the domain's tuples instead of their own copy.

### Summary of changes

- `packages/domain-model/src/option-catalogue.ts`, new: `AppearanceOptionKey` derived from the config types rather than written out, `AppearanceOptionDescriptor`, `VocabularyTermId`, and the `appearanceOptions` record keyed by the union so an undescribed option fails to compile.
- `packages/domain-model/src/region.ts`: `regionFrameStyles` and `regionLabelMounts` tuples via the `Record<Union, true>` exhaustiveness trick, matching the three tuples `appearance.ts` already exported.
- `docs/reference/vocabulary.md`: an `Id` column across all three glossary tables — 31 terms — and a paragraph stating that code and documents cite the id rather than repeat the name.
- `packages/view-studio/src/app/editor/region-treatments.ts`: the hand-written nine-placement list, frame styles, and label mounts replaced by imports of the domain tuples.
- `packages/domain-model/package.json` and `modules.test.ts`: the `./option-catalogue` subpath and its four contracts, taking the public contract count from 38 to 42.
- `packages/domain-model/src/option-catalogue.test.ts`, new: choice values match their unions in order, every key is described, values appear only on choices, number controls are bounded, and a stated default is one the choice offers.
- `scripts/vocabulary-terms.test.ts`, new: every glossary id is unique and every term the catalogue cites resolves in the reference.
- `docs/specs/domain-model.md`: DOMAIN-019 requires the catalogue, its compile-time keying, and that cited terms resolve.

### Verification

`bun run self:check` exits 0 — 65 test files, 455 tests, `✔ no dependency violations found (360 modules, 1115 dependencies cruised)`.

The compile-time guarantee was proved by hand rather than asserted. Adding `icon?: boolean` to `CardDetailDefaults` produces:

```text
option-catalogue.ts(86,14): error TS2741: Property '"card.icon"' is missing in type
'Readonly<{ 'card.compact': ...; }>' but required in type
'Readonly<Record<AppearanceOptionKey, ...>>'
```

An option added to authored appearance therefore cannot ship uncatalogued, which is the claim the item rests on. The probe was reverted; `appearance.ts` is unchanged.

### Outstanding concerns

Three shaping decisions were widened during delivery, each recorded here rather than absorbed silently.

The catalogue carries four control kinds, not the two the plan named. Region's authored appearance includes a fill colour and two numbers alongside its choices, so a `choice`-and-`flag` catalogue would have described part of the surface and left the rest to be hand-written again — the exact failure the item exists to remove. `colour` and `number` were added, with `range` bounding the numbers.

Term ids were added to all 31 glossary terms rather than only the ones the catalogue cites. A column populated for three rows and blank for twenty-eight is not a table anyone would ship. This does not take work from `INFOSCHEMATICS-TOOL-027`, which owns citing terms across the corpus and the check that those citations resolve; it only means the ids exist to be cited.

The vocabulary-resolution test lives in `scripts/`, not in the package. A package test that reads `docs/reference/vocabulary.md` would tie a published package to a repository path, and `INFOSCHEMATICS-TOOL-025` set the precedent when the same problem arose with the token generator.

The `region.labelOffset` bounds — plus or minus 200 — are a control's sensible range, not a domain constraint. Nothing rejects a larger authored value, and nothing should on this item's evidence.

### Post-change review

The boundary held: no option was added, renamed, or removed, no renderer output changed, and `InfoschematicConfig` is untouched. `card.icon` exists only in the reverted probe.

The drift the item was written against is closed rather than described. `region-treatments.ts` had its own nine-member placement list, and the deeper problem was that nothing made importing the tuple easier than retyping it — `RegionFrameStyle` and `RegionLabelMount` had no tuple to import at all. Adding those two was what made the repoint possible, so the fix is structural rather than a tidy-up that the next contributor can undo by accident.

Worth flagging for `INFOSCHEMATICS-SITE-011`: `appearanceOptions` describes Region's options with `region.` keys, but a Region option applies per Region while `surface` and `grid` apply to the whole Infoschematic. A control surface has to know which config it is patching, and the catalogue deliberately does not say — the key's prefix does. If that turns out to be too implicit when the controls are built, an explicit `target` field is the small change to make.

### Mini recap

Delivered under INFOSCHEMATICS-TOOL-026: a runtime catalogue of all twelve authored appearance options, two new domain tuples, stable ids for all 31 vocabulary terms, Studio repointed off its hand-written lists, a new spec requirement, and two new test files. Verified by `bun run self:check` (455 tests, clean cruise) plus a hand probe proving an uncatalogued option fails to compile. Outstanding: four control kinds instead of two, ids added corpus-wide rather than only where cited, and the implicit patch target noted above for SITE-011. Proposed learning route: none beyond this record — DOMAIN-019 and the vocabulary reference already carry the durable statements.

## Done

Accepted 2026-09-10 by Kris Brown on the review packet above.

## Discussion

### Why not derive the catalogue from the types

TypeScript unions do not survive to runtime, which is why the tuples exist at all. A build-time generator could emit the catalogue from the type declarations, but it would add a code-generation step to the dependency root to save writing a literal that the compiler already forces to be complete. The exhaustiveness trick gets the same guarantee — an uncatalogued option does not compile — with nothing to run.
