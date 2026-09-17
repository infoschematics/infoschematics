---
id: INFOSCHEMATICS-TOOL-072
area: TOOL
title: Rasterised label legibility
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T12:40:00Z
updated_at: 2026-09-17T10:00:00Z
---

# Rasterised label legibility

## Goal

Keep a Region label readable in rasterised output, rather than letting Flow routes run through the letters.

## Context

Found beside the arrowhead defect (`INFOSCHEMATICS-TOOL-071`) while rendering `examples/is-infoschematics/infoschematic.yaml` to PNG on 2026-09-16 and looking at it. The right-aligned Region label "VIEW AND RENDERER PACKAGES" reads as "IEW ND RENDERER PACKAGES": two Flow routes cross the glyphs and erase parts of them. The document authors it as `label: View and renderer packages` (`examples/is-infoschematics/infoschematic.yaml:146`); the capitals are applied at render time by both renderers (`packages/render-svg/src/index.ts:518`, `packages/view-canvas/src/InfoschematicDiagram.tsx:2184`), so the quoted string is what is painted, not what is authored.

This record was opened believing the cause was measurement variance between resvg and a browser moving a right-aligned label into a route, as an unanticipated consequence of [ADR-INFOSCHEMATICS-024](../decisions/ADR-INFOSCHEMATICS-024-rasterise-with-a-native-resvg-binding.md). **Step 1 measured that and it is not what is happening.** The corrected diagnosis is under Findings: both engines place the label in the same band to within a pixel, Chromium loses the same glyphs, and the defect is paint order against a route that legitimately crosses the band. The engine choice is not implicated, and "rasterised" in this record's title and slug understates the scope — the same output is wrong in the browser.

This is a separate concern from arrowhead orientation and must not be folded into it: one is a wrong attribute with a correct fix, this is a question about whether a route may occupy a label's band at all.

## Boundary

Diagnosis and a recommendation first. This item does not presume a fix, does not revisit the engine choice, and does not change arrowhead orientation.

## Findings

**Measurement (step 1).** The same label, same document, 1440px wide, ink bounding box of the glyphs:

| Engine | Label ink box | Ink width |
| --- | --- | --- |
| Chromium, `getBBox()` and `getComputedTextLength()` | 1113.6 → 1358.0 | 244.4 |
| resvg, as emitted (with `textLength`) | 1114 → 1357 | 243 |
| resvg, with `textLength` stripped | 1159 → 1358 | 199 |

So resvg honours `textLength` and `lengthAdjust`, which `packages/render-svg/src/index.ts` emits from the pinned `length` that `packages/view-model/src/region-geometry.ts` resolves. Pinned, the two engines agree within about a pixel. The 45px displacement this record assumed was occurring is what the third row shows — resvg's own idea of the string's width — and pinning already suppresses it. That is ROUTE-018 working as written.

**The actual cause.** Two Flow routes pass through the label's band, and nothing keeps the label readable across them. `packages/view-model/src/routing.ts` has no notion of a label band or of any obstacle; the static renderer emits every Region before every Flow, so the routes paint over the label's glyphs; Canvas paints them in the same order. The browser render loses the same "V" and "A" as the PNG does, which is the finding that overturns the original diagnosis: this is not an engine difference, because there is no difference to see.

**Requirement (step 2).** Nothing governed this. ROUTE-014 makes an automatically placed _route_ label avoid occupied space, and ROUTE-018 fixes _Region_ label geometry to shared metrics, but neither says what happens when a route and a Region label want the same band. `ROUTE-019` (`docs/specs/routing-and-placement.md`) now states it, recorded `divergent`: a route MAY cross the band, so the label has to survive the crossing rather than the crossing being forbidden, and every renderer draws the label above those routes over an opaque backing in the Region's resolved surface, derived from the label geometry both renderers already share. It also forecloses fixing this by moving the label, which would break the parity ROUTE-018 exists to hold.

**Recommendation (step 3).** Paint an opaque backing behind the Region label and draw it above the routes, in both renderers, from the resolved label geometry.

- **Opaque backing plus paint order** (recommended) — two renderer changes and one new band in the resolved geometry; no layout change, and it cannot fail to apply. It changes rendered bytes for every diagram carrying a Region label, so the `bun run self:examples:verify` fixtures are rewritten in the same change. The backing fill has to follow the Region's resolved surface, including `blueprint` and the `data-ink` inverse cases the label fill already handles, or the backing becomes the new visible defect. A route then reads as passing behind the label, which is the conventional reading.
- **Reserve the band in the view model** — rejected. It has to move routes or refuse authored waypoints, so authored data loses to layout, and on a crowded frame there may be no free band to move to. It changes routing for existing diagrams well beyond the one defect.
- **Pin the font** (`--font`, `packages/cli/src/options.ts:91`, CLI-007) — rejected on evidence. Step 1 shows measurement is already pinned by `textLength` and that the two engines already agree, so there is nothing for a pinned font to correct.

## Steps

1. [x] Measure the actual difference: render the same document through both engines, extract each Region label's resolved x, and record the deltas. Verifiable by the recorded numbers. — recorded in Findings; the engines agree within a pixel.
2. [x] Establish whether any Flow route may legitimately occupy a Region label's band, or whether the label band should be reserved in layout regardless of measurement. No requirement governs this today — the nearest is STATIC-004 (`docs/specs/static-rendering.md:37`), which says nothing about a label's band against routing — so this step writes the requirement rather than citing one. Verifiable by the new requirement carrying a conformance state and resolvable evidence. — `ROUTE-019`, `divergent`, with evidence that resolves.
3. [x] Recommend one of: reserving the band in the view model so no measurement can move a label into a route; pinning the font so both engines measure alike (`--font` already exists: `packages/cli/src/options.ts:91`, under CLI-007 at `docs/specs/command-line-rendering.md:59`); or painting the label over an opaque backing. State the cost of each. Verifiable by the recommendation naming its consequence for existing rendered bytes. — backing plus paint order, rewriting example fixtures.
4. [ ] Whatever is chosen, prove it by rendering and looking, and keep the before and after side by side. — waits on the choice; the boundary above reserves it.

## Files touched

- `docs/specs/routing-and-placement.md` — `ROUTE-019`.
- This record.

Implementing the recommendation would touch `packages/view-model/src/region-geometry.ts` for the backing band, `packages/render-svg/src/index.ts` and `packages/view-canvas/src/InfoschematicDiagram.tsx` for the backing and the paint order, `packages/view-canvas/src/styles.css` for its fill, and the `examples/` rendered fixtures.

## Verify

Rendering and looking is the whole point of this item: every Region label legible in both engines at the widths the repository renders, with the two outputs kept side by side. Plus `bun run self:examples:verify` for any change to rendered bytes, and `bun run self:check`.

## Dependencies / blocks

None hard. Sequence after `INFOSCHEMATICS-TOOL-071` so the two visual findings are not diagnosed through the same broken render.

## Documentation impact

### Decision Records

None. The original expectation was that this would amend what `ADR-INFOSCHEMATICS-024` treats as an acceptable consequence of font variance; step 1 shows font variance is not the cause, so the ADR stands untouched.

## Review packet

### Delivered

A corrected diagnosis, the requirement that was missing, and a costed recommendation. No fix: the boundary reserves that choice, and this item's original cause has been disproved rather than addressed.

### Summary of changes

`ROUTE-019` in `docs/specs/routing-and-placement.md`, recorded `divergent` — the first requirement in the corpus not recorded `conforming`, which is the honest state for a rule the repository does not yet meet. This record gains a Findings section with the measurements, the requirement, and three options with their costs; its Context now says plainly that the cause it was opened with is wrong.

### Verification

`bunx vitest run scripts/specification-evidence.test.ts` — 4 passed; `ROUTE-019`'s conformance state is recognised and its cited paths and named content resolve. No code changed, so no other gate is implicated. The measurements themselves came from Chromium via Playwright (`getBBox()`, `getComputedTextLength()`) and from the rasteriser via PIL ink-box extraction, against `examples/is-infoschematics/infoschematic.yaml`; the before-and-after renders step 4 asks for wait on the fix.

### Outstanding concerns

The title and slug say "rasterised", and the defect is not. Renaming means rewriting cites in `INFOSCHEMATICS-TOOL-071` and the batch ledger, so it is left for the acceptance pass to decide. `ROUTE-019` stays `divergent` until the fix lands — a divergent requirement is accepted, but it is also the only one, so anything that counts conforming requirements as a health measure will read this as a regression.

### Post-change review

The gap ROUTE-019 fills is narrow but its shape is general: the corpus governs how each element resolves its own geometry, and says little about what happens where two elements' resolutions overlap. ROUTE-014 and ROUTE-015 both handle it for one element at a time. Region label against route was simply the first overlap anyone looked at.

### Mini recap

The record's stated cause was wrong, and only measuring it showed that. A defect seen first in a PNG is not thereby a PNG defect — the browser had been drawing it the whole time, at the width nobody had looked at.
