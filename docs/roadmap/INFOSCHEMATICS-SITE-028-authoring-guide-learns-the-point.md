---
id: INFOSCHEMATICS-SITE-028
area: SITE
title: Authoring guide learns the Point
theme: site
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T15:30:00Z
updated_at: 2026-09-16T22:55:00Z
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

1. [x] Give `points` its own bullet in the declaration list, naming it a coordinate artefact a Flow may end on rather than a part of a Flow, and link the vocabulary term.
2. [x] Correct the removal-cascade sentence at `:169` to include a Point.
3. [x] Say what a Producer can do with a Point on the Diagram — select, move by pointer and by key, type a coordinate, remove with its Flows — and say plainly that creating one means authoring it, so nobody hunts the Library for it.
4. [x] Check the surrounding `ports` prose still reads correctly once a Point is no longer introduced as a kind of port.
5. [x] Give `apps/site/content/studio.md` its Point section, and correct its Library sentence and its removal-cascade sentence to match the authoring guide's.
6. [x] Correct the Points component page prose so it does not promise a drawn label, and say what a Producer can do with a Point on the surface.
7. [x] Read every rendered page, not the Markdown.

## Files touched

- `apps/site/content/authoring.md`
- `apps/site/content/studio.md`
- `apps/site/src/VisualGuide.tsx`
- `apps/site/src/visual-guide/curriculum.ts`

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

## Review

### Delivered

Points are now declared, edited, and described as artefacts across all three Site surfaces the record names, plus a fourth file the sixth step turned out to need.

`apps/site/content/authoring.md` gains a `points` bullet of its own in the declaration list, placed before `flows` so a document author meets the artefact before the thing that connects to it. It names a Point a coordinate artefact in its own right rather than a part of the Flows that meet it, records that each has an `id`, a position, and optional ports of its own, and states that a Point with no Flow attached is valid. The `flows` bullet lost its trailing link to `#point` — a Point is no longer a thing a Flow connects _through_ alongside a port — and now reads "connect Cards, Fabrics, and Points through named ports". The removal-cascade sentence at `:180` includes a Point. A new paragraph at `:182` says what a Producer can do with one (select, drag, nudge, type a coordinate), why there is no resize (its geometry is a coordinate, not a rectangle), and that creating one means authoring it in source, so nobody hunts the Library.

`apps/site/content/studio.md` carries the same two corrections in the document a Producer actually reads: the Library sentence now states there is no Point seed, and the removal cascade names a Point. A new `## Points` section sits between `## The Library` and `## Drafts and the handoff`.

The Points component page (`apps/site/src/VisualGuide.tsx`) no longer claims a Point "can currently be labelled, positioned, and connected through ports". It now says the Point is positioned rather than boxed, carries ports of its own, is editable in Design, is authored in source rather than inserted from the Library, and that its `label` is authored but no renderer draws it yet. The page's lead sentence in `apps/site/src/visual-guide/curriculum.ts:448` changed with it: "A Point is a labelled junction or anchor" became "A Point is a junction or anchor with an identity of its own", because the old wording promised the label the renderer does not draw.

### Summary of changes

| File | Change |
| --- | --- |
| `apps/site/content/authoring.md` | `points` bullet added; `flows` bullet loses its `#point` link; removal cascade includes a Point; new Producer-editing paragraph |
| `apps/site/content/studio.md` | Library sentence states there is no Point seed; removal cascade includes a Point; new `## Points` section |
| `apps/site/src/VisualGuide.tsx` | Points-page prose replaced: positioned not boxed, own ports, editable in Design, authored in source, `label` undrawn, roles future |
| `apps/site/src/visual-guide/curriculum.ts` | Points-page lead sentence no longer calls a Point "labelled" |

### Verification

`bun run self:check` — 45 of 45 tasks successful.

All three pages were rendered at 1280×1100 against `bun run self:dev` on `http://localhost:4173` and read, not diffed: `/docs/authoring/` (`reports/site028-a1.png`, `a2`), `/docs/studio/` (`s1`), `/docs/components/points/` (`p1`, `p2`). Reading them caught two defects a green suite did not: the Points-page prose initially wrote `` `label` `` in JSX, which renders as literal backticks rather than code — corrected to `<code>label</code>`, matching `VisualGuide.tsx:179` — and two new sentences used ASCII hyphens where the surrounding prose uses em dashes.

`apps/site/src/VisualGuide.test.tsx:56` then failed. The guard named "does not use internal Point endpoint language" asserts the page contains the exact string `Start, end, junction, anchor`, and the replacement prose had folded the role list mid-sentence into lowercase. The role list now opens its own sentence — "Start, end, junction, anchor, and hidden are future role semantics." — which satisfies the guard without weakening it, and preserves what the sentence was there to say. The guard was not touched.

### Outstanding concerns

The record's sixth step asked for the Points page to stop promising a drawn label and to say what a Producer can do. `INFOSCHEMATICS-TOOL-063`'s original deferral also wanted an interactive specimen on that page; one already exists (`aria-label="Point properties live example"`, with position and per-edge port controls), so nothing was added there. If that deferral meant a _different_ specimen — one demonstrating Design-mode interaction rather than property editing — it remains unaddressed and belongs in its own record.

`INFOSCHEMATICS-TOOL-082` (a Library Point seed) and `INFOSCHEMATICS-TOOL-083` (a renderer for the Point label) have since landed, and every sentence this record wrote about today's behaviour was corrected with them: the authoring guide's two Library lists and its Point paragraph, `studio.md`'s "there is no Point seed", and the component page's "no renderer draws it yet". The prose describing present behaviour was the right call and the cost was paid where it was predicted.

### Post-change review

The `flows` bullet's old link to `#point` is worth noting as the root of the confusion this item fixes: the guide's own declaration list taught that a Point was a routing detail of a Flow, in the same breath as a port. That reading survived `ADR-INFOSCHEMATICS-031` by nine months because nothing in the suite asserts what the guide teaches — only that certain phrases do or do not appear. The guard at `VisualGuide.test.tsx:56` is the one exception, and it earned its place this run by catching a real regression in prose the suite otherwise cannot see.

### Mini recap

Three Site surfaces described a Point as part of a Flow; now all three describe it as an artefact a document declares and a Producer moves. A fourth file joined the change because the Points page's lead sentence promised a label nothing draws. One prose guard failed and was satisfied by rephrasing rather than relaxing it.

## Discussion

Raised by the lead because `TOOL-063`'s own record asked for a Guides follow-up and creating a roadmap record was outside that run's authority. That record named three deliverables, not one — the authoring example, a `studio.md` Point section, and an interactive specimen on the Points component page. This record was first written against the authoring guide alone and then widened to all three, because a follow-up that covers a third of what was deferred leaves the rest recorded nowhere once the asking record is pruned.
