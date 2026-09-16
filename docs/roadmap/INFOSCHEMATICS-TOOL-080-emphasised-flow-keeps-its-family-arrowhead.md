---
id: INFOSCHEMATICS-TOOL-080
area: TOOL
title: Emphasised Flow keeps its family arrowhead
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: 00c067a1
created_at: 2026-09-16T15:30:00Z
updated_at: 2026-09-16T15:30:00Z
---

# Emphasised Flow keeps its family arrowhead

## Goal

Make an emphasised Flow read as one emphasised thing, rather than an emphasised route wearing its ordinary arrowhead.

## Context

Seen on 2026-09-16 by the delivery of held element emphasis (`INFOSCHEMATICS-TOOL-059`), in the Playground at 1440×900. An `emphasise-elements` Dynamic targeting a Flow repaints the route in the emphasis colour and leaves the arrowhead in the Flow family's own colour — an amber line ending in a violet head. Pre-existing: emphasis has always treated the route, and the arrowhead is a `marker` resolved by reference, so it was never in the treated set.

Two decisions sit underneath, which is why this is a record rather than a one-line fix. The arrowhead marker is defined per family and shared by every Flow in that family, so recolouring it for one emphasised Flow means minting a second marker for the emphasised case — and since `INFOSCHEMATICS-TOOL-058` every marker identifier is already prefixed per mount through `svgResourcePrefix` in `packages/view-model/src/resources.ts`, so the emphasised variant has to join that scheme rather than sit outside it. And `ADR-INFOSCHEMATICS-029` holds that a document says what a change is and never how a renderer carries it, so this is entirely the renderer's call and gets no authored surface.

## Boundary

The arrowhead of an emphasised Flow, in both renderers. Not the emphasis colour itself, not the route treatment, and no authored surface.

## Steps

1. [ ] Decide what an emphasised arrowhead should look like — the emphasis colour, the family colour at emphasis weight, or unchanged by deliberate choice. Record the reasoning; "unchanged" is a legitimate answer and this item then closes as a documented decision rather than a code change. Verifiable by the decision being citable.
2. [ ] If it changes, mint the emphasised marker through `svgResourcePrefix` so two mounted Canvases cannot resolve each other's, and confirm that with the existing host-fixture case in `packages/view-canvas/src/InfoschematicDiagram.host.browser.test.tsx`. Verifiable by that suite staying green and by the identifiers differing across instances.
3. [ ] Do it in both renderers, and add the case to `scripts/visual-treatment-parity.test.ts`, which is the check that holds the DOM and SVG paths to the same treatment. Verifiable by the parity case failing when only one renderer is changed.
4. [ ] Look at it. A Flow emphasised in full motion, one under reduced motion, and one in still SVG output, against the same Flow unemphasised. Record what was seen.
5. [ ] Note the interaction with rasterised output: `INFOSCHEMATICS-TOOL-071` records that `@resvg/resvg-js` ignores `orient="auto-start-reverse"`, so a PNG's arrowheads are already wrong in orientation. Do not let a PNG be the evidence for this item's colour question until that is fixed, and do not attempt to fix it here.

## Files touched

- `packages/view-canvas/src/InfoschematicDiagram.tsx`
- `packages/render-svg/src/index.ts`
- `packages/view-canvas/src/styles.css`
- `scripts/visual-treatment-parity.test.ts`
- `docs/specs/diagram-dynamics.md` or `docs/specs/appearance.md`, whichever owns emphasis treatment

## Verify

Rendering and looking is the evidence, in the three conditions of step 4. Plus the parity case, the host-fixture suite, and `bun run self:check`.

## Dependencies / blocks

Touches the same emphasis treatment regions as `INFOSCHEMATICS-TOOL-060`, so it should follow that item rather than run beside it.

## Discussion

The parity check is the interesting part of the verification, and also its limit: it proves the two renderers agree, never that either is right — which is exactly how a raster comparison passed through the whole arrowhead defect in `INFOSCHEMATICS-TOOL-071`. So step 3's parity case is necessary and step 4's looking is what actually settles it.
