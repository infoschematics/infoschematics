---
id: INFOSCHEMATICS-TOOL-080
area: TOOL
title: Emphasised Flow keeps its family arrowhead
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T15:30:00Z
updated_at: 2026-09-16T18:20:00Z
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

1. [ ] Decide what an emphasised arrowhead should look like — the emphasis colour, the family colour at emphasis weight, or unchanged by deliberate choice. Start from the fact that "unchanged" is the currently _required_ answer, not merely a legitimate one: DYNAMIC-003 (`docs/specs/diagram-dynamics.md:45`) says an occurrence "MUST NOT change authored geometry, routing, hit targets, selection behaviour, or any element's own output", and the Flow's arrowhead is the Flow's own output. So either this item closes as a documented decision to leave it, or it amends DYNAMIC-003 — and treating an overlay-borne head as not the element's output is the distinction the amendment would have to draw. Verifiable by the decision being citable.
2. [ ] If it changes, note that the two renderers need different amounts of work. In the DOM path `fill: context-stroke` means giving the emphasis overlay a `markerEnd` picks up the emphasis stroke with no new marker at all; only `packages/render-svg/src/index.ts` needs a second definition, because it writes the colour as a literal attribute (`:356`). Any new definition mints its identifier through `svgResourcePrefix` so two mounted Canvases cannot resolve each other's. The host fixture at `packages/view-canvas/src/InfoschematicDiagram.host.browser.test.tsx` asserts instance isolation through `data-artefact-id` and `data-testid` (`:118`, `:142`, `:184`) rather than marker identity, so this step adds that assertion rather than leaning on it. Verifiable by the identifiers differing across instances.
3. [ ] Do it in both renderers, and add the case to `scripts/visual-treatment-parity.test.ts`, which is the check that holds the DOM and SVG paths to the same treatment. Verifiable by the parity case failing when only one renderer is changed.
4. [ ] Look at it. A Flow emphasised in full motion, one under reduced motion, and one in still SVG output, against the same Flow unemphasised. Record what was seen.
5. [ ] Note the interaction with rasterised output: `INFOSCHEMATICS-TOOL-071` records that `@resvg/resvg-js` ignores `orient="auto-start-reverse"`, so a PNG's arrowheads are already wrong in orientation. Do not let a PNG be the evidence for this item's colour question until that is fixed, and do not attempt to fix it here.

## Files touched

- `packages/view-canvas/src/InfoschematicDiagram.tsx`
- `packages/render-svg/src/index.ts`
- `packages/view-canvas/src/styles.css`
- `scripts/visual-treatment-parity.test.ts`
- `docs/specs/diagram-dynamics.md` — DYNAMIC-003 (`:45`) and DYNAMIC-006 (`:93-111`) own emphasis treatment; `appearance.md` names emphasis only as a token group inside an evidence line (`:79`)

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

## Discussion

The parity check is the interesting part of the verification, and also its limit: it proves the two renderers agree, never that either is right — which is exactly how a raster comparison passed through the whole arrowhead defect in `INFOSCHEMATICS-TOOL-071`. So step 3's parity case is necessary and step 4's looking is what actually settles it.
