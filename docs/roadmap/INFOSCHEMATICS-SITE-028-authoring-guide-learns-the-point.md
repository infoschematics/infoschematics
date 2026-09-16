---
id: INFOSCHEMATICS-SITE-028
area: SITE
title: Authoring guide learns the Point
theme: site
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T15:30:00Z
updated_at: 2026-09-16T18:20:00Z
---

# Authoring guide learns the Point

## Goal

Teach the consumer authoring guide that a Point is an artefact a document declares and a Producer edits, and correct the two sentences that `INFOSCHEMATICS-TOOL-063` made wrong.

## Context

[ADR-INFOSCHEMATICS-031](../decisions/ADR-INFOSCHEMATICS-031-a-point-is-its-own-artefact-kind.md) made a Point the sixth artefact kind with its own coordinate geometry role, rather than a part of the Flow that names it. The guide still describes it the old way, and two of its statements are now false:

- `apps/site/content/authoring.md:23` introduces Points only as something `flows` connect through, beside ports. The list it sits in gives `regions` a bullet at `:21`, `fabrics` and `cards` a shared one at `:22`, and `graphics` its own at `:24`; `points` never gets one, so a document author reading the guide top to bottom does not learn that a Point is a thing they declare. `:210` already lists `points` under placeables, so the guide contradicts itself.
- `apps/site/content/authoring.md:169` reads "Removing a Card or Fabric also removes Flows that would lose an endpoint; removing a Region removes only itself." `TOOL-063` fixed `planArtefactRemoval` so a Point takes its Flows with it too — that sentence now understates the cascade a Producer will see.

What the guide should not claim: that a Producer can create a Point on the Diagram. `packages/view-studio/src/app/editor/library.ts:116` offers templates for `card`, `fabric` and `flow` only, so a Point is still authored in source and then moved or removed on the surface. That gap is `INFOSCHEMATICS-TOOL-082`, not this record's to close, and the guide must describe what is true today.

Two more Site surfaces say nothing about a Point, both named by `TOOL-063` as part of the same follow-up:

- `apps/site/content/studio.md` describes what a Producer can do and never mentions a Point. `:20` advertises the Library's "Card, Fabric, Flow starting points" and `:29` gives the removal cascade as "removing a Card names the dependent Flows" — the same two omissions as the authoring guide, in the document a Producer actually reads.
- The Points component page is already routed (`apps/site/src/routes.ts:199`) and already carries prose at `apps/site/src/VisualGuide.tsx:129-134`, which says a Point "can currently be labelled, positioned, and connected through ports". Two thirds of that is now wrong or misleading: no renderer draws a Point's label at all (`INFOSCHEMATICS-TOOL-083`), and the page says nothing about the Design interaction the Point gained.

## Boundary

Site-owned consumer content across the authoring guide, the Studio guide, and the Points component page. Repository documentation under `docs/` is already correct and is not copied here.

## Steps

1. [ ] Give `points` its own bullet in the declaration list, naming it a coordinate artefact a Flow may end on rather than a part of a Flow, and link the vocabulary term.
2. [ ] Correct the removal-cascade sentence at `:169` to include a Point.
3. [ ] Say what a Producer can do with a Point on the Diagram — select, move by pointer and by key, type a coordinate, remove with its Flows — and say plainly that creating one means authoring it, so nobody hunts the Library for it.
4. [ ] Check the surrounding `ports` prose still reads correctly once a Point is no longer introduced as a kind of port.
5. [ ] Give `apps/site/content/studio.md` its Point section, and correct its Library sentence and its removal-cascade sentence to match the authoring guide's.
6. [ ] Correct the Points component page prose so it does not promise a drawn label, and say what a Producer can do with a Point on the surface.
7. [ ] Read every rendered page, not the Markdown.

## Files touched

- `apps/site/content/authoring.md`
- `apps/site/content/studio.md`
- `apps/site/src/VisualGuide.tsx`

## Verify

- Every touched page renders and reads correctly at `bun run self:dev`.
- `bun run self:check`.

## Dependencies / blocks

Follows `INFOSCHEMATICS-TOOL-063`, merged. Independent of `INFOSCHEMATICS-SITE-027`, which edits the Dynamics section of the same file.

## Documentation impact

### Specifications

None. DESIGN-014 (`docs/specs/design-session.md:141`) already states the Point's capability contract — selectable, movable, property-editable, removable, reorderable, and never box-resizable — and EDIT-008 (`docs/specs/design-editing.md:79`) already says a Point moves as a coordinate. The guide is catching up with both.

### Decision Records

None. `ADR-INFOSCHEMATICS-031` settled the Point's editing surface and its non-creatability.

### Guides

This item _is_ the guide change, and it spans three Site-owned surfaces rather than one: `apps/site/content/authoring.md`, `apps/site/content/studio.md`, and the Points page in `apps/site/src/VisualGuide.tsx`. Nothing under `docs/guides/` moves.

## Discussion

Raised by the lead because `TOOL-063`'s own record asked for a Guides follow-up and creating a roadmap record was outside that run's authority. That record named three deliverables, not one — the authoring example, a `studio.md` Point section, and an interactive specimen on the Points component page. This record was first written against the authoring guide alone and then widened to all three, because a follow-up that covers a third of what was deferred leaves the rest recorded nowhere once the asking record is pruned.
