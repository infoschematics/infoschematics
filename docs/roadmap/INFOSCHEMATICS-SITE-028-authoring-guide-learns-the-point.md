---
id: INFOSCHEMATICS-SITE-028
area: SITE
title: Authoring guide learns the Point
theme: site
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: 83fa1a84
created_at: 2026-09-16T15:30:00Z
updated_at: 2026-09-16T15:30:00Z
---

# Authoring guide learns the Point

## Goal

Teach the consumer authoring guide that a Point is an artefact a document declares and a Producer edits, and correct the two sentences that `INFOSCHEMATICS-TOOL-063` made wrong.

## Context

[ADR-INFOSCHEMATICS-031](../decisions/ADR-INFOSCHEMATICS-031-a-point-is-its-own-artefact-kind.md) made a Point the sixth artefact kind with its own coordinate geometry role, rather than a part of the Flow that names it. The guide still describes it the old way, and two of its statements are now false:

- `apps/site/content/authoring.md:23` introduces Points only as something `flows` connect through, beside ports. The list above it gives `fabrics`, `cards` and `graphics` their own bullets; `points` never gets one, so a document author reading the guide top to bottom does not learn that a Point is a thing they declare. `:210` already lists `points` under placeables, so the guide contradicts itself.
- `apps/site/content/authoring.md:169` reads "Removing a Card or Fabric also removes Flows that would lose an endpoint; removing a Region removes only itself." `TOOL-063` fixed `planArtefactRemoval` so a Point takes its Flows with it too — that sentence now understates the cascade a Producer will see.

What the guide should not claim: that a Producer can create a Point on the Diagram. `packages/view-studio/src/app/editor/library.ts:116` offers templates for `card`, `fabric` and `flow` only, so a Point is still authored in source and then moved or removed on the surface. That gap is `INFOSCHEMATICS-TOOL-082`, not this record's to close, and the guide must describe what is true today.

## Boundary

Site-owned consumer content. Repository documentation under `docs/` is already correct and is not copied here.

## Steps

1. [ ] Give `points` its own bullet in the declaration list, naming it a coordinate artefact a Flow may end on rather than a part of a Flow, and link the vocabulary term.
2. [ ] Correct the removal-cascade sentence at `:169` to include a Point.
3. [ ] Say what a Producer can do with a Point on the Diagram — select, move by pointer and by key, type a coordinate, remove with its Flows — and say plainly that creating one means authoring it, so nobody hunts the Library for it.
4. [ ] Check the surrounding `ports` prose still reads correctly once a Point is no longer introduced as a kind of port.
5. [ ] Read the rendered page, not the Markdown.

## Files touched

- `apps/site/content/authoring.md`

## Verify

- The page renders and reads correctly at `bun run self:dev`.
- `bun run self:check`.

## Dependencies / blocks

Follows `INFOSCHEMATICS-TOOL-063`, merged. Independent of `INFOSCHEMATICS-SITE-027`, which edits the Dynamics section of the same file.

## Discussion

Raised by the lead because `TOOL-063`'s own record asked for a Guides follow-up and creating a roadmap record was outside that run's authority.
