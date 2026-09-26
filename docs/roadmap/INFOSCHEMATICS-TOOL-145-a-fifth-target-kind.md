---
id: INFOSCHEMATICS-TOOL-145
area: TOOL
title: A fifth target kind
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-26T00:00:00Z
updated_at: 2026-09-26T00:00:00Z
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

## Discussion

Found on 2026-09-25 by the documentation drift read that [INFOSCHEMATICS-TOOL-135](INFOSCHEMATICS-TOOL-135-where-a-claim-lives.md) performs. Captured separately because TOOL-135's Boundary excludes the specification corpus under `docs/specs/` outright.

Verified on 2026-09-26 against the working tree: the type's five members and the requirement's four names were both read rather than recalled.

Small, and the kind of gap a reader cannot see: an enumeration that is short by one reads exactly like a complete one, and the `_Conformance:_` line actively tells them not to look.
