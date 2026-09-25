---
id: INFOSCHEMATICS-TOOL-142
area: TOOL
title: A showcase without Points
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-09-25T00:00:00Z
---

# A showcase without Points

## Goal

The showcase document names a [Point](../reference/vocabulary.md#point) in a Dynamic, so the emphasis treatment a Point receives is exercised by an authored document rather than only by tests.

## Context

`INFOSCHEMATICS-TOOL-126` made an emphasis reach a Point in both renderers. The behaviour is held by unit tests, a browser test, and a visual-treatment parity case, and it was confirmed by a browser look — but the look had to be taken from a throwaway page, because `examples/is-showcase` names no Point in any Dynamic and the Playground therefore cannot show one.

That matters beyond convenience. `scripts/example-capability-coverage.test.ts` derives its capability list from the live schema and asserts it against the showcase alone, which is the mechanism that keeps authored examples honest about what the product can do. A capability the showcase does not author is a capability nobody looks at unless they go out of their way to build a page for it.

## Boundary

Authoring an existing capability into the existing showcase. It adds no product behaviour and changes no contract.

It does not follow that every capability belongs in the showcase — that document is also a piece of communication and a dumping ground for feature coverage would be a worse one. Whether Point emphasis earns a place in the story the showcase tells, or wants a separate example under `examples/`, is the question worth asking rather than assuming the first answer.

## Discussion

Captured on 2026-09-24 by the agent delivering `INFOSCHEMATICS-TOOL-126`, as a follow-on it deliberately did not fold in.

Relevant context for whoever picks it up: at that moment the Playground could not be used at all, because a concurrently-delivered change had the showcase mid-regeneration and its YAML did not parse. That was transient and is resolved; it is recorded only so the throwaway-page workaround in the `INFOSCHEMATICS-TOOL-126` record is not mistaken for a standing limitation.
