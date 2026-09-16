---
id: INFOSCHEMATICS-TOOL-071
area: TOOL
title: Rasterised Flow arrowheads
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T12:40:00Z
updated_at: 2026-09-16T23:20:00Z
---

# Rasterised Flow arrowheads

## Goal

Make a Flow arrowhead point along its Flow in rasterised output, so a PNG from the command line says the same thing about direction as the SVG and the Canvas do.

## Context

Found while delivering the repository command surface (`INFOSCHEMATICS-TOOL-065`), which needed one rasteriser rather than two and rendered the same document through both to compare. The finding is not that item's change and was not caused by it: the defect is in shipped output today.

Every PNG the published command line emits draws its Flow arrowheads unrotated. The triangle is painted, but never turned to face along the route, so each one hangs off its target as a flat pennant. Confirmed twice independently: once by rendering `examples/is-infoschematics/infoschematic.yaml` through `rsvg-convert` and through resvg and comparing, and once by rendering `bun packages/cli/src/bin.ts render examples/is-infoschematics/infoschematic.yaml --format png --scale 1` and looking at the result on 2026-09-16.

This is exactly the failure [the repository guidance](../../AGENTS.md) describes: a fully green suite, and output that is wrong to look at. It has an additional sting — `scripts/release/pack-smoke.ts` rasterises through the packed consumer and through the workspace and compares the two, so it proves the outputs agree with each other and structurally cannot notice that both are broken.

## Boundary

This item corrects marker orientation in the static renderer and guards it. It does not change the Canvas DOM path, which renders correctly because browsers implement the attribute; it does not change arrowhead geometry, size, or colour; it does not revisit the rasteriser choice made in [ADR-INFOSCHEMATICS-024](../decisions/ADR-INFOSCHEMATICS-024-rasterise-with-a-native-resvg-binding.md); and it does not address the text-metric differences between engines, which are separate and captured as `INFOSCHEMATICS-TOOL-072`.

## Current state

- `packages/render-svg/src/index.ts:349` emits `['orient', 'auto-start-reverse']` on the one marker per Flow family. `auto-start-reverse` is SVG 2. `@resvg/resvg-js` — the engine `packages/cli/src/raster.ts:1` imports — does not implement it and falls back to no rotation rather than failing, which is why nothing reports an error.
- Rewriting only that attribute to `auto` in a copy of the same SVG and rasterising again produces correct arrowheads, which pins the attribute as the whole cause of the rotation failure.
- **`auto` is not a safe substitution on its own.** `packages/render-svg/src/index.ts:606-607` gives a bidirectional Flow `marker-start` and no `marker-end`. Under `auto-start-reverse` that arrowhead points back out of its source, which is the intent; under `auto` it would point forward along the path instead. No document in `examples/` authors `bidirectional: true`, so today's corpus would not reveal the regression and the fix must not be applied as a single token.
- The comment at `packages/render-svg/src/index.ts:336` states that `marker-end` "resolves nothing else", which is stale against `:606-607` and is part of why the change reads as smaller than it is.
- `scripts/visual-treatment-parity.test.ts:413-430` asserts the marker exists and that `marker-end` references it. It asserts nothing about `orient`, so the parity guard is blind to this.
- `packages/view-canvas/src/InfoschematicDiagram.tsx:2085` uses the same attribute in the DOM path. That is correct there and is not in scope, but the two renderers now differ deliberately rather than accidentally, which needs saying in a comment or the difference will be "corrected" later.

## Steps

1. [x] Emit an orientation both engines implement, without reversing any bidirectional Flow. Either define a second marker per family whose path geometry is pre-reversed and reference it from `marker-start`, or give the start case its own explicit marker; keep the extra definition out of documents that author no bidirectional Flow, so `defs` does not grow for every document to serve a case most do not have. Verifiable by `bun run --cwd packages/render-svg test` and by the emitted markup containing no `auto-start-reverse`.
2. [x] Correct the stale comment at `packages/render-svg/src/index.ts:336`, and state at `packages/view-canvas/src/InfoschematicDiagram.tsx:2085` why the DOM path keeps the SVG 2 value while the static path does not. Verifiable by reading them.
3. [ ] Guard the class of defect, not the token. Add a case asserting that every marker orientation the static renderer emits is one the selected raster engine implements, citing `ADR-INFOSCHEMATICS-024` for why that set is what it is. Verifiable by restoring `auto-start-reverse` and watching the case go red — a guard never seen failing is the same unearned green this defect already survived.
4. [x] Author the bidirectional case that does not exist. Add a document — a fixture or an example — with a bidirectional Flow, render it to PNG, and confirm by eye that its arrowhead points back at its source and has not swung forward. Verifiable by the rendered file and by a recorded observation of both ends.
5. [ ] Extend `scripts/visual-treatment-parity.test.ts:413-430` so the parity assertion covers arrowhead orientation in whatever form each renderer expresses it, since it is currently satisfied by a marker that never rotates.
6. [x] Note in `scripts/release/pack-smoke.ts`, or in the releasing guide beside it, that the raster comparison proves agreement rather than correctness, so the next reader does not mistake a green pack smoke for a good-looking PNG.

## Files touched

Existing:

- `packages/render-svg/src/index.ts`
- `packages/render-svg/src/index.test.ts`
- `packages/view-canvas/src/InfoschematicDiagram.tsx` — comment only
- `scripts/visual-treatment-parity.test.ts`
- `scripts/release/pack-smoke.ts` or `docs/guides/releasing-packages.md`
- `docs/specs/command-line-rendering.md` — CLI-007 gained the fidelity clause
- `docs/specs/static-rendering.md` — STATIC-013 gained the rasteriser-safe-output clause
- `packages/view-model/src/tokens.ts` and `packages/view-model/src/tokens.generated.css` — the shared arrowhead geometry
- `docs/decisions/ADR-INFOSCHEMATICS-024-rasterise-with-a-native-resvg-binding.md` — the engine's SVG subset as a consequence

New:

- A bidirectional fixture, if the case is not authored into an existing example

## Verify

- `bun run --cwd packages/render-svg test`, `bun run self:scripts:test`, then `bun run self:check`.
- `bun run self:examples:verify` unchanged: no example's SVG bytes may change unless the document authors a bidirectional Flow.
- Render and look, because this is visual treatment and a green suite already failed to notice it: `bun packages/cli/src/bin.ts render examples/is-infoschematics/infoschematic.yaml --format png --scale 1 --output /tmp/arrows.png`, then open it. Every Flow must terminate in a triangle pointing into its target Card. Compare against the same document through `rsvg-convert`; the arrowheads must now agree.
- Render the bidirectional case and confirm its arrowhead points back at its source.
- Confirm the blueprint backdrop and Region framing are unchanged, both having previously survived a green run in a broken state.

## Dependencies / blocks

None outstanding. Scoped renderer definition identity (`INFOSCHEMATICS-TOOL-058`) was the blocker and has landed: marker ids now run through `svgResourcePrefix` (`packages/render-svg/src/index.ts:261` and `:345`, `packages/view-canvas/src/InfoschematicDiagram.tsx:540` and `:2077`). This item therefore rebases onto the prefixed marker set rather than waiting for it, and any second marker definition step 1 adds must take its identity from the same prefix.

## Documentation impact

### Specifications

Likely: `docs/specs/command-line-rendering.md` gains or amends a requirement that rasterised output preserves Flow direction, with the rendered evidence path. It is the owner, not `docs/specs/static-rendering.md` — STATIC-001 through STATIC-016 are all about SVG output and the word "raster" does not appear in that file, while CLI-006 (`:47-53`) and CLI-007 (`:57-65`) own raster output and its determinism boundary. Every new requirement lands with a conformance state and resolvable evidence or `bun run self:scripts:test` fails.

### Guides

Expected, small: the releasing guide records what the raster pack smoke does and does not prove.

## Review

### Delivered

The static renderer no longer emits `orient="auto-start-reverse"` at all. Each marker it defines carries `orient="auto"`, which both engines implement, and a head that has to face back out of its source is mirrored geometry rather than a reversed axis: `arrowhead.reversed` is `M24 0 L24 24 L0 12 z` with `reversedRefX: 0`, against `arrowhead.forward`'s `M0 0 L0 24 L24 12 z` with `forwardRefX: 24`. Both paths are `view-model` tokens, so the two renderers cannot drift on the shape — which is what stopped this being a one-token substitution, since `auto` alone would have swung every bidirectional Flow's head forward and no document in `examples/` authors one to notice.

Definitions are minted per document from the Flows it actually has. `arrowheadFor` resolves a head only for a Flow that resolves a family, picks `reversed` for a bidirectional Flow and `forward` otherwise, and the set is deduplicated by id before any `marker` is written, so a document with no bidirectional Flow grows no reversed definition and `defs` stays as small as the document's content warrants. Every id runs through the same `resourceIdPrefix` the rest of the renderer's resources use.

`arrowReference(head, end)` is the single place that decides which end of a route carries the head — `reversed` answers for `marker-start`, `forward` for `marker-end` — and both the route and the emphasis overlay ask it. In Canvas the same question lives in `flowArrowhead`, which also absorbed the old inline rationale for why a bidirectional Flow keeps one head rather than two.

This item and `INFOSCHEMATICS-TOOL-080` were delivered as one commit, because they are one mechanism along two axes: direction (forward or reversed) and paint (family colour or emphasis stroke). Fixing either alone leaves the other looking like an oversight in the code that fixed it.

### Summary of changes

| File | Change |
| --- | --- |
| `packages/view-model/src/tokens.ts` | New `arrowhead` token group: shared geometry, both reference points, size |
| `packages/render-svg/src/index.ts` | `orient="auto"` with mirrored geometry; per-document head resolution; `arrowReference` owns which end |
| `packages/view-canvas/src/InfoschematicDiagram.tsx` | `flowArrowhead` helper; tokens for geometry and size; a comment recording the deliberate divergence |
| `docs/specs/static-rendering.md` | STATIC-013: still output may not depend on an SVG 2 feature the rasteriser drops |
| `docs/specs/command-line-rendering.md` | CLI-007: determinism is not fidelity |
| `docs/decisions/ADR-INFOSCHEMATICS-024-…` | The engine's SVG subset, and what it costs, as a consequence |
| `scripts/release/pack-smoke.ts` | Comment: the raster comparison proves agreement, not correctness |

### Verification

`bun run self:check` — 45 of 45 tasks successful. `bun run self:examples:verify` reports the four generated exports current; no example authors a bidirectional Flow, so no example's bytes moved.

Rendered and looked at, which is the evidence this item exists for. `bun packages/cli/src/bin.ts render examples/is-infoschematics/infoschematic.yaml --format png --scale 1` now shows every Flow terminating in a triangle pointing into its target Card; before the change each one was a flat unrotated pennant. The bidirectional case step 4 asked for was authored as a throwaway document with a plain, an emphasised, and a bidirectional Flow, rendered through the same command path, and read: `reports/looks/heads-still-svg.png`. Its bidirectional head sits at the source end and points back out of it, while the two forward heads point into their targets. The emitted markup was checked directly: three definitions, `heads-arrow-0`, `heads-arrow-0-emphasised` and `heads-arrow-1-reversed`, the reversed one referenced from `marker-start` and the others from `marker-end`, and no `auto-start-reverse` anywhere.

The same document was mounted in Chromium so the two renderers could be compared on the same picture (`reports/looks/heads-full-motion.png`): all three heads point the same way in both renderers. The blueprint backdrop and Region framing are unchanged, both having previously survived a green run in a broken state.

### Outstanding concerns

Three steps are deliberately left for the lead's test pass, at the lead's instruction to land the features across the codebase first: step 3's guard that every emitted orientation is one the selected engine implements, step 5's extension of `scripts/visual-treatment-parity.test.ts` to cover orientation, and step 4's promotion of the throwaway bidirectional document into a committed fixture. Until step 3 exists, nothing stops a future change reaching for another SVG 2 attribute the rasteriser ignores — the class of defect is described in STATIC-013 and ADR-INFOSCHEMATICS-024 but not yet gated. `scripts/visual-treatment-parity.test.ts` is also held uncommitted by another writer, so this run did not touch it.

The comment the record flagged as stale at `packages/render-svg/src/index.ts:336` reads, in context, as a statement about why the definition is a `marker` element rather than a `g` — a marker reference resolves nothing else — which is accurate. It has been rewritten as part of the new marker block and now also records why `orient` diverges from Canvas.

### Post-change review

Worth keeping: the rasteriser's failure mode is silence, and two independent checks agreed with it. `scripts/release/pack-smoke.ts` compared the packed render against the workspace render, which is agreement rather than correctness, and `scripts/visual-treatment-parity.test.ts` asserted that the marker exists and is referenced but nothing about `orient`. A guard that names the implemented set is the part still missing, and the specification now says what that set is for.

### Mini recap

Static output now uses an orientation the rasteriser implements and mirrors the geometry for the one head that faces backwards, with the shape shared through a `view-model` token so neither renderer can drift. Looked at through the command line and in a browser, on plain, emphasised, and bidirectional Flows. The guard for the class of defect is the lead's test pass.

## Discussion

The engine choice is not in question. `ADR-INFOSCHEMATICS-024` chose a resolver over a browser, and the cost of that choice is that SVG 2 conveniences are not all present. What this exposes is that nothing in the repository states which SVG level the static renderer may rely on, so the renderer reached for an attribute the rasteriser cannot honour and every check agreed. A guard that names the implemented set, rather than one that pins today's token, is the part worth keeping.
