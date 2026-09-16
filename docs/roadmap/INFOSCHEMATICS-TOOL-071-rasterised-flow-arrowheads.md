---
id: INFOSCHEMATICS-TOOL-071
area: TOOL
title: Rasterised Flow arrowheads
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-058]
baseline_ref: null
created_at: 2026-09-16T12:40:00Z
updated_at: 2026-09-16T12:40:00Z
---

# Rasterised Flow arrowheads

## Goal

Make a Flow arrowhead point along its Flow in rasterised output, so a PNG from the command line says the same thing about direction as the SVG and the Canvas do.

## Context

Found while delivering the repository command surface (`INFOSCHEMATICS-TOOL-065`), which needed one rasteriser rather than two and rendered the same document through both to compare. The finding is not that item's change and was not caused by it: the defect is in shipped output today.

Every PNG the published command line emits draws its Flow arrowheads unrotated. The triangle is painted, but never turned to face along the route, so each one hangs off its target as a flat pennant. Confirmed twice independently: once by rendering `examples/is-infoschematics/infoschematic.yaml` through `rsvg-convert` and through resvg and comparing, and once by rendering `bun packages/cli/src/bin.ts render examples/is-infoschematics/infoschematic.yaml --format png --scale 1` and looking at the result on 2026-09-16.

This is exactly the failure [the repository guidance](../../AGENTS.md) describes: a fully green suite, and output that is wrong to look at. It has an additional sting — `scripts/release/pack-smoke.ts` rasterises through the packed consumer and through the workspace and compares the two, so it proves the outputs agree with each other and structurally cannot notice that both are broken.

## Boundary

This item corrects marker orientation in the static renderer and guards it. It does not change the Canvas DOM path, which renders correctly because browsers implement the attribute; it does not change arrowhead geometry, size, or colour; it does not revisit the rasteriser choice made in [ADR-INFOSCHEMATICS-024](../decisions/ADR-INFOSCHEMATICS-024-rasterise-with-resvg.md); and it does not address the text-metric differences between engines, which are separate and captured as `INFOSCHEMATICS-TOOL-072`.

## Current state

- `packages/render-svg/src/index.ts:346` emits `['orient', 'auto-start-reverse']` on the one marker per Flow family. `auto-start-reverse` is SVG 2. `@resvg/resvg-js` — the engine `packages/cli/src/raster.ts:1` imports — does not implement it and falls back to no rotation rather than failing, which is why nothing reports an error.
- Rewriting only that attribute to `auto` in a copy of the same SVG and rasterising again produces correct arrowheads, which pins the attribute as the whole cause of the rotation failure.
- **`auto` is not a safe substitution on its own.** `packages/render-svg/src/index.ts:604` gives a bidirectional Flow `marker-start` and no `marker-end`. Under `auto-start-reverse` that arrowhead points back out of its source, which is the intent; under `auto` it would point forward along the path instead. No document in `examples/` authors `bidirectional: true`, so today's corpus would not reveal the regression and the fix must not be applied as a single token.
- The comment at `packages/render-svg/src/index.ts:333` states that `marker-end` "resolves nothing else", which is stale against `:604` and is part of why the change reads as smaller than it is.
- `scripts/visual-treatment-parity.test.ts:385-392` asserts the marker exists and that `marker-end` references it. It asserts nothing about `orient`, so the parity guard is blind to this.
- `packages/view-canvas/src/InfoschematicDiagram.tsx:1974` uses the same attribute in the DOM path. That is correct there and is not in scope, but the two renderers now differ deliberately rather than accidentally, which needs saying in a comment or the difference will be "corrected" later.

## Steps

1. [ ] Emit an orientation both engines implement, without reversing any bidirectional Flow. Either define a second marker per family whose path geometry is pre-reversed and reference it from `marker-start`, or give the start case its own explicit marker; keep the extra definition out of documents that author no bidirectional Flow, so `defs` does not grow for every document to serve a case most do not have. Verifiable by `bun run --cwd packages/render-svg test` and by the emitted markup containing no `auto-start-reverse`.
2. [ ] Correct the stale comment at `packages/render-svg/src/index.ts:333`, and state at `packages/view-canvas/src/InfoschematicDiagram.tsx:1974` why the DOM path keeps the SVG 2 value while the static path does not. Verifiable by reading them.
3. [ ] Guard the class of defect, not the token. Add a case asserting that every marker orientation the static renderer emits is one the selected raster engine implements, citing `ADR-INFOSCHEMATICS-024` for why that set is what it is. Verifiable by restoring `auto-start-reverse` and watching the case go red — a guard never seen failing is the same unearned green this defect already survived.
4. [ ] Author the bidirectional case that does not exist. Add a document — a fixture or an example — with a bidirectional Flow, render it to PNG, and confirm by eye that its arrowhead points back at its source and has not swung forward. Verifiable by the rendered file and by a recorded observation of both ends.
5. [ ] Extend `scripts/visual-treatment-parity.test.ts:385-392` so the parity assertion covers arrowhead orientation in whatever form each renderer expresses it, since it is currently satisfied by a marker that never rotates.
6. [ ] Note in `scripts/release/pack-smoke.ts`, or in the releasing guide beside it, that the raster comparison proves agreement rather than correctness, so the next reader does not mistake a green pack smoke for a good-looking PNG.

## Files touched

Existing:

- `packages/render-svg/src/index.ts`
- `packages/render-svg/src/index.test.ts`
- `packages/view-canvas/src/InfoschematicDiagram.tsx` — comment only
- `scripts/visual-treatment-parity.test.ts`
- `scripts/release/pack-smoke.ts` or `docs/guides/releasing-packages.md`
- `docs/specs/static-rendering.md` — if a requirement states rasterised fidelity, it gains the orientation clause

New:

- A bidirectional fixture, if the case is not authored into an existing example

## Verify

- `bun run --cwd packages/render-svg test`, `bun run self:scripts:test`, then `bun run self:check`.
- `bun run self:examples:verify` unchanged: no example's SVG bytes may change unless the document authors a bidirectional Flow.
- Render and look, because this is visual treatment and a green suite already failed to notice it: `bun packages/cli/src/bin.ts render examples/is-infoschematics/infoschematic.yaml --format png --scale 1 --output /tmp/arrows.png`, then open it. Every Flow must terminate in a triangle pointing into its target Card. Compare against the same document through `rsvg-convert`; the arrowheads must now agree.
- Render the bidirectional case and confirm its arrowhead points back at its source.
- Confirm the blueprint backdrop and Region framing are unchanged, both having previously survived a green run in a broken state.

## Dependencies / blocks

Blocked by scoped renderer definition identity (`INFOSCHEMATICS-TOOL-058`), which edits the same `defs` block and the same marker id construction. Delivering them concurrently in one checkout would collide; delivering this one first would force that item to rebase onto a marker set it did not plan for.

## Documentation impact

### Specifications

Likely: `docs/specs/static-rendering.md` gains or amends a requirement that rasterised output preserves Flow direction, with the rendered evidence path. Every new requirement lands with a conformance state and resolvable evidence or `bun run self:scripts:test` fails.

### Guides

Expected, small: the releasing guide records what the raster pack smoke does and does not prove.

## Discussion

The engine choice is not in question. `ADR-INFOSCHEMATICS-024` chose a resolver over a browser, and the cost of that choice is that SVG 2 conveniences are not all present. What this exposes is that nothing in the repository states which SVG level the static renderer may rely on, so the renderer reached for an attribute the rasteriser cannot honour and every check agreed. A guard that names the implemented set, rather than one that pins today's token, is the part worth keeping.
