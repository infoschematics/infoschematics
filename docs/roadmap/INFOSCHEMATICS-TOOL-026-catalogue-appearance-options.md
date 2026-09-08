---
id: INFOSCHEMATICS-TOOL-026
area: TOOL
title: Catalogue appearance options
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: 0bb213dd11b686f75bcb302d2a6c08160eacc5a0
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

- [ ] Add `regionFrameStyles` and `regionLabelMounts` tuples to `packages/domain-model/src/region.ts` using the `Record<Union, true>` exhaustiveness trick, with matching assertions in its test.
- [ ] Add `packages/domain-model/src/option-catalogue.ts`: the `AppearanceOptionKey` union, an `AppearanceOptionDescriptor` type carrying `control`, `values`, `term`, and an optional `default`, and the `appearanceOptions` record over every key.
- [ ] Add stable term ids to [the vocabulary reference](../reference/vocabulary.md) for each term the catalogue cites.
- [ ] Add `packages/domain-model/src/option-catalogue.test.ts`: every choice descriptor's values equal its union tuple, every key of the authored appearance config is described, and no descriptor is orphaned.
- [ ] Add a test asserting every cited term id resolves to a heading id present in the vocabulary reference, so a renamed term breaks the build rather than the guide.
- [ ] Repoint `packages/view-studio/src/app/editor/region-treatments.ts` at the domain tuples, removing the hand-written placement, frame-style, and label-mount lists.
- [ ] Export the catalogue from `packages/domain-model/src/index.ts` and its `exports` map, and confirm the dependency cruise stays clean.
- [ ] Record the requirement in [the domain model specification](../specs/domain-model.md): every authored appearance option is described in the catalogue and cites a vocabulary term.

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

## Discussion

### Why not derive the catalogue from the types

TypeScript unions do not survive to runtime, which is why the tuples exist at all. A build-time generator could emit the catalogue from the type declarations, but it would add a code-generation step to the dependency root to save writing a literal that the compiler already forces to be complete. The exhaustiveness trick gets the same guarantee — an uncatalogued option does not compile — with nothing to run.
