---
id: INFOSCHEMATICS-TOOL-141
area: TOOL
title: An option specified elsewhere
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-09-25T00:00:00Z
---

# An option specified elsewhere

## Goal

Every option the rendering command accepts is stated where a reader looks for command options.

## Context

`INFOSCHEMATICS-TOOL-114` added `--detail`, which hands the still renderer the same band the Canvas resolved from scale. Its requirement landed as `STATIC-021` in [the static-rendering specification](../specs/static-rendering.md), because that is where the band behaviour it describes belongs and it was the file the delivering boundary held.

Every other option is specified in [the command-line rendering specification](../specs/command-line-rendering.md) under the `CLI` prefix, which runs through `CLI-013`. So a reader assembling the command's full surface from its specification finds all of it in one place except this, and a reader who finds all of it in one place concludes wrongly that they have it all.

## Boundary

Where one requirement is stated, not what it requires. The detail band, its resolution from scale, and the split that keeps hysteresis in the view are settled by [ADR-INFOSCHEMATICS-039](../decisions/ADR-INFOSCHEMATICS-039-detail-is-a-band-of-scale-and-the-view-holds-the-hysteresis.md) and are unaffected.

The likely answer is a `CLI` requirement naming the option and deferring to `STATIC-021` for what a band means, rather than moving the text and leaving the still specification with a hole. Which of those it is, is the decision.

`GDR-INFOSCHEMATICS-005` holds the command-surface conventions and a single test over them, so whether that test should have caught this is part of the question.

## Discussion

Found on 2026-09-24 while delivering `INFOSCHEMATICS-TOOL-114`, whose boundary did not include the command-line specification. Captured rather than reached for.

Small, and worth doing for that reason: a specification a reader cannot trust to be complete costs more than the one requirement missing from it.
