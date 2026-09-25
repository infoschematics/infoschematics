---
id: INFOSCHEMATICS-TOOL-137
area: TOOL
title: A stale decision record
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-09-25T00:00:00Z
---

# A stale decision record

## Goal

[ADR-INFOSCHEMATICS-027](../decisions/ADR-INFOSCHEMATICS-027-author-what-an-emphasis-means-not-how-it-is-played.md) stops asserting something the product no longer does, so a reader deciding what an emphasis reaches is not told the opposite of what the code now delivers.

## Context

ADR-INFOSCHEMATICS-027 explains which geometries a travelling mark is offered for, and reasons about what each element's shape can carry. In doing so it states that "the interactive Canvas draws no Point at all, so no emphasis reaches one there", and uses that as part of why declining a treatment is recorded rather than degraded silently.

`INFOSCHEMATICS-TOOL-126` made that false. The Canvas now draws a Point and an emphasis reaches it: a held ring at the shared `emphasisPointRadius`, with no travelling mark, because a mark travels along a perimeter and a Point has none. The record's _conclusion_ about the Point survives intact — it was always that a Point gets a ring and not a mark — but the premise it rests on is now wrong, and a reader checking why their Point shows no travelling mark is told the Canvas draws no Point at all.

## Boundary

A correction to one record's stated premise, not a re-opening of its decision. What an emphasis means and who chooses its treatment are settled and stay settled.

It is captured rather than applied because ADR-INFOSCHEMATICS-027 is an accepted Decision Record: amending one needs its own authority, which delivering `INFOSCHEMATICS-TOOL-126` did not carry. Whether the fix is an amendment in place, a superseding record, or a dated note depends on how far the premise change reaches, and that is the question this record exists to answer.

## Discussion

Found on 2026-09-24 while delivering `INFOSCHEMATICS-TOOL-126`, which raised it in its own record rather than editing an accepted decision unilaterally. That was the right call and this is where the raised concern lands.

Worth checking when this is shaped: whether the same record makes any other claim about what the interactive Canvas draws. It says an Overlay Graphic is accepted by validation and drawn in the still output while the interactive Canvas draws none, which is a claim of the same kind and from the same era, and may have aged the same way.
