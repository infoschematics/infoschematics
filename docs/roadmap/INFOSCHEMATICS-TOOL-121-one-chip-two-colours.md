---
id: INFOSCHEMATICS-TOOL-121
area: TOOL
title: One chip, two colours
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T12:20:00Z
updated_at: 2026-09-22T12:20:00Z
---

# One chip, two colours

## Goal

A [Standard Card](../reference/vocabulary.md#standard-card)'s identity chip is the same chip whichever renderer drew it, so a rendered file and the interactive Diagram show one document rather than two treatments of it.

## Context

The two renderers disagree about what paints that chip. `packages/render-svg/src/index.ts:1344` writes `fill: paint.annotationFill` with `paint.annotationText` for the code — a contrast chip, dark on light paper and light on dark. `packages/view-canvas/src/styles.css:733` paints `color-mix(in srgb, var(--infoschematic-canvas-paint-backdrop) 88%, transparent)` with `--infoschematic-canvas-paint-text-strong` — a paper chip, the drawing's own ground showing through. Side by side the rendered Card carries a dark tab and the interactive Card carries a pale one.

Every other annotation agrees. The code badge is the same construction and the same `annotationFill`/`annotationText` pair in both (`index.ts:232`, `styles.css:785`), which is what makes the chip an exception rather than a convention. The stroke agrees too: both take the Scope's authored colour, falling back to the unauthored role.

Neither treatment is obviously the right one. The contrast chip is legible at nine pixels and reads as a label attached to the Card; the paper chip is quieter and lets the Scope stroke carry the identity. The question this needs to settle is which the product means, and then to have one place say it — the disagreement exists because the value was written twice, not because two outlets were given different instructions.

## Boundary

A treatment-parity defect across two renderers, resolved by choosing one chip and deleting the other spelling. It touches `packages/render-svg/src/index.ts`, `packages/view-canvas/src/styles.css`, and whatever parity check is extended to hold the result — `scripts/` already carries a visual-treatment parity task, and a chip that can drift again is the actual defect. It does not change the identity chip's geometry, its `card.identity` appearance flag, the Scope colour it strokes with, or the annotation roles the palettes define.

## Discussion

Found on 2026-09-22 while delivering `INFOSCHEMATICS-TOOL-118`, comparing the rendered and interactive drawings in both colour schemes on the guide's own scheme gallery. It predates both palette items: `git show 9f0503bb~1` carries the same two spellings, so `INFOSCHEMATICS-TOOL-117` made it visible rather than causing it, and neither record is widened to absorb it.

Per `AGENTS.md`, whichever chip is chosen has to be looked at rather than asserted: the contrast chip against a blueprint `surface` and the paper chip against a dark backdrop are the two cases where a token that reads well in the light scheme can vanish, and a green parity check would say nothing about either.
