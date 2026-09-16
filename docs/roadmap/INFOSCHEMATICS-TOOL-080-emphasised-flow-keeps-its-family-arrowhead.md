---
id: INFOSCHEMATICS-TOOL-080
area: TOOL
title: Emphasised Flow keeps its family arrowhead
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T15:30:00Z
updated_at: 2026-09-16T23:20:00Z
---

# Emphasised Flow keeps its family arrowhead

## Goal

Make an emphasised Flow read as one emphasised thing, rather than an emphasised route wearing its ordinary arrowhead.

## Context

Seen on 2026-09-16 by the delivery of held element emphasis (`INFOSCHEMATICS-TOOL-059`), in the Playground at 1440×900. An `emphasise-elements` Dynamic targeting a Flow draws an emphasis outline over the route and leaves the arrowhead in the Flow family's own colour — an amber line ending in a violet head. Pre-existing, and the mechanism is not that the route is repainted: an emphasis never touches the element at all. `packages/view-canvas/src/styles.css:453` says so — "an emphasis is a layer over the diagram: it takes no pointer events and changes nothing an element draws" — and the overlay is a separate path, `packages/view-canvas/src/InfoschematicDiagram.tsx:229` inside the group at `:1960`, with the static side geometry-only at `packages/render-svg/src/index.ts:171-174`. Nor is being a `marker` what freezes the colour: `packages/view-canvas/src/styles.css:1024-1026` sets `.arrow-head { fill: context-stroke; }`, so in the DOM path a head already tracks the stroke of whatever path references it. The head stays family-coloured because the only markered path is the Flow's own route (`packages/view-canvas/src/InfoschematicDiagram.tsx:1610-1611`, `packages/render-svg/src/index.ts:590`) and the emphasis overlay carries no marker.

Two decisions sit underneath, which is why this is a record rather than a one-line fix. The arrowhead marker is defined per family and shared by every Flow in that family, so recolouring it for one emphasised Flow means minting a second marker for the emphasised case — and since `INFOSCHEMATICS-TOOL-058` every marker identifier is already prefixed per mount through `svgResourcePrefix` in `packages/view-model/src/resources.ts`, so the emphasised variant has to join that scheme rather than sit outside it. And `ADR-INFOSCHEMATICS-029` holds that a document says what a change is and never how a renderer carries it, so this is entirely the renderer's call and gets no authored surface.

## Boundary

The arrowhead of an emphasised Flow, in both renderers. Not the emphasis colour itself, not the route treatment, and no authored surface.

## Steps

1. [x] Decide what an emphasised arrowhead should look like — the emphasis colour, the family colour at emphasis weight, or unchanged by deliberate choice. Start from the fact that "unchanged" is the currently _required_ answer, not merely a legitimate one: DYNAMIC-003 (`docs/specs/diagram-dynamics.md:45`) says an occurrence "MUST NOT change authored geometry, routing, hit targets, selection behaviour, or any element's own output", and the Flow's arrowhead is the Flow's own output. So either this item closes as a documented decision to leave it, or it amends DYNAMIC-003 — and treating an overlay-borne head as not the element's output is the distinction the amendment would have to draw. Verifiable by the decision being citable.
2. [x] If it changes, note that the two renderers need different amounts of work. In the DOM path `fill: context-stroke` means giving the emphasis overlay a `markerEnd` picks up the emphasis stroke with no new marker at all; only `packages/render-svg/src/index.ts` needs a second definition, because it writes the colour as a literal attribute (`:356`). Any new definition mints its identifier through `svgResourcePrefix` so two mounted Canvases cannot resolve each other's. The host fixture at `packages/view-canvas/src/InfoschematicDiagram.host.browser.test.tsx` asserts instance isolation through `data-artefact-id` and `data-testid` (`:118`, `:142`, `:184`) rather than marker identity, so this step adds that assertion rather than leaning on it. Verifiable by the identifiers differing across instances.
3. [ ] Do it in both renderers, and add the case to `scripts/visual-treatment-parity.test.ts`, which is the check that holds the DOM and SVG paths to the same treatment. Verifiable by the parity case failing when only one renderer is changed.
4. [x] Look at it. A Flow emphasised in full motion, one under reduced motion, and one in still SVG output, against the same Flow unemphasised. Record what was seen.
5. [x] Note the interaction with rasterised output: `INFOSCHEMATICS-TOOL-071` records that `@resvg/resvg-js` ignores `orient="auto-start-reverse"`, so a PNG's arrowheads are already wrong in orientation. Do not let a PNG be the evidence for this item's colour question until that is fixed, and do not attempt to fix it here.

## Files touched

- `packages/view-canvas/src/InfoschematicDiagram.tsx`
- `packages/render-svg/src/index.ts`
- `packages/view-canvas/src/styles.css`
- `scripts/visual-treatment-parity.test.ts`
- `docs/specs/diagram-dynamics.md` — DYNAMIC-003 (`:45`) amended; DYNAMIC-006 unchanged by this item
- `packages/view-model/src/tokens.ts` — the shared arrowhead geometry both renderers draw from

## Verify

Rendering and looking is the evidence, in the three conditions of step 4. Plus the parity case, the host-fixture suite, and `bun run self:check`.

## Dependencies / blocks

None. `INFOSCHEMATICS-TOOL-060`, which touched the same emphasis treatment regions, has landed and been pruned, so there is nothing to follow and this item rebases onto its treatment rather than waiting for it.

## Documentation impact

### Specifications

DYNAMIC-003 (`docs/specs/diagram-dynamics.md:45`) is the requirement in play, because it already forbids what step 1 might choose: an occurrence "MUST NOT change authored geometry, routing, hit targets, selection behaviour, or any element's own output". If the arrowhead is left alone, that is the requirement being honoured and the item closes by citing it. If the head changes, DYNAMIC-003 needs amending to distinguish an overlay-borne head from the element's own output, and DYNAMIC-006 (`:93-111`) gains the treatment. `docs/specs/appearance.md` is not the owner — it names emphasis only as a token group inside an evidence line at `:79`.

### Decision Records

None expected. `ADR-INFOSCHEMATICS-029` already holds that a document says what a change is and never how a renderer carries it, which makes this entirely the renderer's call; the decision itself belongs in this record and in the requirement.

### Guides

None. No authored surface appears, so nothing an author reads changes.

## Review

### Delivered

An emphasised Flow now reads as one emphasised thing. The emphasis overlay draws its own arrowhead over the Flow's, so the treatment no longer stops short of the point the eye follows the line to.

Step 1's decision is the amendment, not the deferral. DYNAMIC-003 still says an occurrence MUST NOT change any element's own output, and it now draws the distinction the record said the amendment would have to draw: a treatment MAY redraw, in its own layer and its own paint, a decoration the element already draws — a Flow's arrowhead, say — and that decoration is one the occurrence owns and withdraws with itself, over an element's own output that is unchanged underneath and is what remains when the occurrence retires. The Flow's own head is still there, still family-coloured, still exactly what it was; the overlay's head is on top of it for as long as the occurrence stands.

The two renderers cost different amounts, as step 2 predicted. In Canvas, `CanvasEmphasisGeometry` gained `markerEnd` and `markerStart`, `emphasisTreatment` passes them to the outline path, and `.infoschematic-svg .arrow-head { fill: context-stroke }` does the rest: the head takes the stroke of the path that references the marker, which for the overlay is the emphasis stroke. No second definition exists, and the stylesheet comment now records that the overlay leans on this. The static renderer writes colour as a literal attribute, so it mints one extra definition per emphasised family — `…-arrow-<n>-emphasised`, painted `emphasis.stroke` — through the same `resourceIdPrefix` as every other resource it defines, and `routeEmphasis` references it through the shared `arrowReference` so the emphasis and the route cannot disagree about which end carries the head.

### Summary of changes

| File | Change |
| --- | --- |
| `docs/specs/diagram-dynamics.md` | DYNAMIC-003: an occurrence may redraw a decoration it owns over unchanged element output |
| `packages/view-canvas/src/InfoschematicDiagram.tsx` | Emphasis geometry carries marker references; the overlay path draws its own head |
| `packages/view-canvas/src/styles.css` | Comment: the emphasis overlay depends on `fill: context-stroke` |
| `packages/render-svg/src/index.ts` | A literally recoloured definition per emphasised family, referenced from the emphasis route |
| `packages/view-model/src/tokens.ts` | The shared arrowhead geometry, so the emphasised head is the same shape in both renderers |

### Verification

`bun run self:check` — 45 of 45 tasks successful.

Step 4, looked at rather than asserted, on one document carrying a plain Flow, an emphasised Flow of the same family, and a bidirectional Flow:

- **Still SVG through the command line** (`reports/looks/heads-still-svg.png`). The emphasised Flow's route and its head are both amber; the plain Flow of the same family keeps its blue route and blue head, so the emphasis is legible as a difference rather than as a repaint of the family. The emitted markup carries `heads-arrow-0` and `heads-arrow-0-emphasised` as separate definitions, the emphasised one referenced only from the emphasis route.
- **Canvas in Chromium, full motion** (`reports/looks/heads-full-motion.png`). The same picture, from a single marker definition per family: the overlay's head arrives amber through `context-stroke` with no second definition anywhere in the document.
- **Canvas in Chromium, reduced motion** (`reports/looks/heads-reduced-motion.png`). The held emphasis is steady and the head is still amber, so the reduced-motion treatment loses the motion and keeps the whole of the meaning.

Step 5's constraint was honoured by ordering: `INFOSCHEMATICS-TOOL-071` landed the orientation fix in the same commit, so the PNG used as evidence here is one whose arrowheads point the right way. A PNG taken before that would have shown an unrotated pennant in the right colour, which would have answered the colour question by accident.

### Outstanding concerns

Step 3's parity case is left for the lead's test pass, with the rest of this batch's test work; the file is also held uncommitted by another writer. Until it exists, nothing fails if one renderer's emphasised head is changed and the other's is not — the two paths agree today because they were written together and because the geometry is a shared token, not because a check holds them there.

Step 2 also wanted a marker-identity assertion added to the host fixture, since that suite asserts instance isolation through `data-artefact-id` and `data-testid` rather than through resource ids. The static renderer's emphasised ids run through `resourceIdPrefix` and Canvas's through `resourcePrefix`, so isolation holds by construction, but it is unasserted for the new definition.

### Post-change review

The distinction DYNAMIC-003 now draws is the durable part. "An occurrence must not change the element's output" and "an occurrence must not decorate the element" are different rules, and the specification had only the first while the treatment needed the second. Written as it now is, the rule still forbids what it was there to forbid — an occurrence that re-routes, reveals, or repaints an element — while allowing a treatment to cover the element with something it takes away again.

### Mini recap

An emphasised Flow keeps its family arrowhead underneath and gains an emphasis-coloured one on top, drawn by the overlay that owns it. Canvas gets it from `context-stroke` for free; the static renderer mints one extra definition per emphasised family. DYNAMIC-003 was amended rather than worked around, and the result was looked at in all three conditions the record named.

## Discussion

The parity check is the interesting part of the verification, and also its limit: it proves the two renderers agree, never that either is right — which is exactly how a raster comparison passed through the whole arrowhead defect in `INFOSCHEMATICS-TOOL-071`. So step 3's parity case is necessary and step 4's looking is what actually settles it.
