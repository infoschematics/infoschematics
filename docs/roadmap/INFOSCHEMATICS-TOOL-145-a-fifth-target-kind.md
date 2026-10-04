---
id: INFOSCHEMATICS-TOOL-145
area: TOOL
title: A fifth target kind
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: af3437867b1a88f9332474faf02802457e35043a
created_at: 2026-09-26T00:00:00Z
updated_at: 2026-10-04T16:32:49Z
---

# A fifth target kind

## Goal

A requirement that enumerates the kinds of a discriminated value enumerates all of them, so a reader can tell conformance from omission.

## Context

`DIRECT-001` in [the directing specification](../specs/directing.md) requires Direct to represent its active authoring target "as a discriminated value for exactly one Standalone Scene, Sequence, Callout or Storyboard" — four kinds. `DirectTarget` at `packages/view-present/src/production.ts:3` has five: `standalone-scene`, `sequence`, `story`, `callout` and `storyboard`.

`story` is the missing one, and it is not a near-duplicate of `storyboard`: the type carries both, and a Callout target separately records an `owner` of `'story' | 'sequence'`, so a Story is something a target can be as well as something a Callout can belong to. The requirement's `_Conformance:_ conforming` therefore rests on an enumeration that does not match the type its own `_Verify:_` line points at.

## Boundary

Which kinds the requirement names. It does not change `DirectTarget`, `reduceProduction`, or what Direct does with a Story target, and it does not decide whether five kinds is the right number — only that the specification must say the number the product has.

The decision inside it is whether `story` was omitted because the requirement predates it, in which case the fix is to add it and leave conformance as it stands, or because a Story target was never meant to be directable, in which case the type is the thing that is wrong and this becomes a product record instead. Reading `reduceProduction` and the Studio chooser at `packages/view-studio/src/app/panels/DetailsPanel.tsx` should settle which.

## Current state

The omission is not a Story target that should not exist, and the type is not wrong: it is a requirement naming canonical concepts at a coarser grain than the type discriminates. `ADR-INFOSCHEMATICS-018` makes Sequence the one canonical presentation concept and the vocabulary lists "story" as another name for it. In the code, the `sequence` target names an expanded Sequence (the composition editor reads `expandedSequencesForEditing`), the `story` target names a collapsed Sequence (`packages/view-model/src/runtime.ts` derives each runtime story from a Sequence with `display: collapsed`), and `storyboard` is the Callout storyboard of a collapsed Sequence. Studio offers all five in `packages/view-studio/src/app/direct-targets.ts`. So the product has five target kinds over four canonical concepts, and `DIRECT-001` names the concepts while claiming to enumerate the kinds.

The requirement's Callout sentence is already right in canonical terms: a Callout target's `owner` of `'story' | 'sequence'` is a collapsed or an expanded Sequence, and the target names its owning Sequence and Scene. `DIRECT-003` lists the artefacts a target can name, not the kinds, and stays as it is.

## Steps

- [x] Rewrite `DIRECT-001`'s enumeration as five kinds in canonical terms: a Standalone Scene, an expanded Sequence, a collapsed Sequence, a Callout, or a Storyboard, with a Sequence target discriminated by its display.
- [x] Update the requirement's Evidence line to say which `DirectTarget` member carries which kind, so the `story` member is accounted for by name.

## Files touched

`docs/specs/directing.md` only. `DirectTarget`, `reduceProduction`, the Studio chooser and the vocabulary are unchanged.

## Verify

Read `DIRECT-001` against `DirectTarget` in `packages/view-present/src/production.ts` and `directOptionsFor` in `packages/view-studio/src/app/direct-targets.ts`: each of the five members maps to exactly one kind the requirement names, and the requirement uses only canonical vocabulary. `bunx vitest run scripts/specification-evidence.test.ts` passes, `ki repo audit --skill ki-specs` passes, and `bun run self:check` passes.

## Dependencies / blocks

None.

## Documentation impact

### Decision Records

None.

### Specifications

`DIRECT-001` in `docs/specs/directing.md` only.

### Guides

None.

### Roadmap

None.

## Review

### Delivered

`DIRECT-001` now enumerates the five Direct target kinds the product has - a Standalone Scene, an expanded Sequence, a collapsed Sequence, a Callout, or a Storyboard - in canonical vocabulary, and its Evidence line names which `DirectTarget` member carries which kind, so the `story` member is accounted for. The record's open question is settled as neither of its two anticipated answers: the requirement did not predate a new kind and the type is not wrong. Under `ADR-INFOSCHEMATICS-018` a Story is a Sequence, and the type's `sequence` and `story` members are an expanded and a collapsed Sequence; the requirement named four concepts where the type discriminates five kinds. Excluded and untouched: `DirectTarget`, `reduceProduction`, the Studio chooser, the vocabulary, and `DIRECT-003`, which lists artefacts a target names rather than kinds. Baseline `af3437867b1a88f9332474faf02802457e35043a`; the change is the commit carrying this packet.

### Change Summary

- `docs/specs/directing.md` - `DIRECT-001`'s first sentence enumerates five kinds and adds that a Sequence target is discriminated by the Sequence's display; its Evidence line maps `standalone-scene`, `sequence`, `story`, `callout` and `storyboard` to those kinds and cites `packages/view-studio/src/app/direct-targets.ts`, which offers all five. The Callout sentence ("its owning Sequence Scene") was already right in canonical terms and is unchanged.
- No approved deviation. Using "Story" as a sixth canonical name was rejected because the vocabulary lists "story" as another name for Sequence and `AGENTS.md` requires canonical concepts only.

### Verification

- Read against code: `DirectTarget` in `packages/view-present/src/production.ts` has five members; `directOptionsFor` in `packages/view-studio/src/app/direct-targets.ts` builds `sequence` targets from the expanded-Sequence composition and `story` and `storyboard` targets from the collapsed-Sequence list, which `packages/view-model/src/runtime.ts` derives from Sequences with `display: collapsed`. Each member maps to exactly one named kind.
- `bunx vitest run --root . scripts/specification-evidence.test.ts` - 5 passed, 1 failed; the failure is `ROUTE-011` in `docs/specs/routing-and-placement.md` declaring no conformance state, committed at `638e2818` before this item and outside it. The evidence-path cases covering this requirement pass.
- `ki repo audit --skill ki-specs` - PASS.
- `bunx rumdl check docs/specs/directing.md` - no issues.
- `bun run self:check` - red for the same unrelated causes recorded on `INFOSCHEMATICS-TOOL-136`.

### Outstanding concerns

- The `story` member's name is the compatibility name for a collapsed Sequence. Renaming it is a code change outside this boundary and is not proposed here.
- Repository-wide `bun run self:check` is red for unrelated causes.

### Post-change review

The goal is met: the requirement's enumeration matches the type its Verify line points at, so a reader can tell conformance from omission, and it does so without introducing a non-canonical term. Scope held to one requirement. No behavioural regression risk. Ready for acceptance.

### Mini recap

`DIRECT-001` enumerates five kinds in canonical terms and its evidence names each type member; the specification audit passes. Learning route (not promoted): when a requirement names concepts and the type names kinds, say which maps to which, because a compatibility name in the type reads as a missing concept.

## Done

Accepted 2026-10-04 by the Fable reviewer on the review packet above, under the owner's delegated estate-push authority. No nits.

## Discussion

Found on 2026-09-25 by the documentation drift read that [INFOSCHEMATICS-TOOL-135](INFOSCHEMATICS-TOOL-135-where-a-claim-lives.md) performs. Captured separately because TOOL-135's Boundary excludes the specification corpus under `docs/specs/` outright.

Verified on 2026-09-26 against the working tree: the type's five members and the requirement's four names were both read rather than recalled.

Small, and the kind of gap a reader cannot see: an enumeration that is short by one reads exactly like a complete one, and the `_Conformance:_` line actively tells them not to look.

Adopted 2026-10-04 under the owner's delegated estate-push authority, moved from Triage to Now and shaped to Ready in the same change.
