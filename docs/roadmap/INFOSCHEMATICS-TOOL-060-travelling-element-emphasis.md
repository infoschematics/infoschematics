---
id: INFOSCHEMATICS-TOOL-060
area: TOOL
title: Travelling element emphasis
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-055]
baseline_ref: null
created_at: 2026-09-15T08:50:00Z
updated_at: 2026-09-15T08:50:00Z
---

# Travelling element emphasis

## Goal

Let an emphasis travel around the element it names — a mark running the perimeter of a Card or Region — so a presenter can point at one thing on a live slide and have the eye follow it, rather than the whole outline brightening at once.

## Context

Raised while reviewing [Diagram dynamics](INFOSCHEMATICS-TOOL-055-diagram-dynamics.md) against the IBC 2026 5G-EMERGE walkthrough. The ask there was described as "a big circular arrow runs around it": movement along the element's own geometry, not a change of state in place.

`emphasise-elements` as delivered outlines the whole element and animates the outline as one object. That reads as "this element matters now", which is the right statement for most uses and the wrong one when the point is direction — a loop, a cycle, a path being walked.

This is a treatment question rather than a vocabulary question. The authored declaration already names an element and a meaning; what a renderer may do with that element's geometry is what is unsettled.

## Boundary

This item does not introduce authored durations, easing, keyframes, offsets, speeds, or path data. It does not let a document choose a motion technique, and it does not add a Dynamic kind whose meaning is "animate" rather than something a reader would say out loud. It does not make travelling the default treatment for `emphasise-elements`, and it does not require every element type to support it if the geometry cannot carry it honestly.

## Current state

`packages/view-canvas/src/element-emphasis.ts` and `styles.css` draw one outline per emphasised element, sized from `visualTokens.canvas.emphasis`, and animate it as a single shape. The emphasis layer in `InfoschematicDiagram.tsx` already knows each target's resolved geometry, which is what a travelling mark would need.

`packages/render-svg/src/index.ts` draws the still outline. A travelling treatment needs a deterministic still interpretation that is not simply the same outline, or a stated reason why the still case cannot distinguish the two.

## Steps

- [ ] Decide whether travelling is a second interpretation of `emphasise-elements` chosen by the renderer, or a distinct authored meaning that happens to travel; prefer the one a presenter could explain, and record why.
- [ ] Define the treatment for each element geometry it supports, including what happens to a Region that contains other elements and to a Flow that already has a signal treatment.
- [ ] Give it a `prefers-reduced-motion` interpretation that is not a slower orbit, and a still interpretation that says the same thing without movement.
- [ ] Keep the announcement one utterance per occurrence stating the Dynamic's label, unchanged from the finite case.
- [ ] Prove in a browser that the mark follows the element's real geometry at more than one size and aspect ratio, and that it does not change hit targets or obscure the element's own text.

## Files touched

- `packages/view-model/src/tokens.ts` if the treatment needs its own measurements
- `packages/view-canvas/src/element-emphasis.ts`, `InfoschematicDiagram.tsx`, and `styles.css`
- `packages/render-svg/src/` for the still interpretation
- `docs/specs/diagram-dynamics.md` and `docs/decisions/`

## Verify

Run `bun run self:check`, then watch the treatment in a browser on a Card, a Region, and a Fabric in both motion preferences, and compare the still render against the finite emphasis. Read the live region once per occurrence.

## Dependencies / blocks

Needs the Dynamics contract from `INFOSCHEMATICS-TOOL-055`. Independent of [Held element emphasis](INFOSCHEMATICS-TOOL-059-held-element-emphasis.md), though a held travelling mark is the combination the IBC walkthrough actually wants and whichever lands second should prove they compose.

## Documentation impact

### Decision Records

`ADR-INFOSCHEMATICS-026` keeps motion technique out of the document. A travelling treatment tests that line and needs either an extension or a companion record saying why a renderer-chosen path treatment is not authored animation.

### Specifications

Add the travelling treatment's obligations to the `DYNAMIC` area, including its reduced-motion and still interpretations and its geometry coverage.

### Guides

Host-binding guidance gains the distinction between marking a thing and tracing a path, so a presenter picks the one that matches what they are saying.

### Roadmap

None.
