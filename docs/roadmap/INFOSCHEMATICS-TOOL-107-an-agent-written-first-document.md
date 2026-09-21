---
id: INFOSCHEMATICS-TOOL-107
area: TOOL
title: An agent-written first document
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-113]
baseline_ref: null
created_at: 2026-09-21T09:30:00Z
updated_at: 2026-09-21T19:30:00Z
---

# An agent-written first document

## Goal

Settle whether the product offers an authoring skill that turns prose, or a repository, into a first [Infoschematic](../reference/vocabulary.md#infoschematic) good enough to open in Studio — and where that skill lives.

## Context

Everything downstream of an authored document exists: the interactive Diagram draws it, `infoschematics render` emits deterministic SVG from it, Present shows it to an audience, Studio edits it, and the guide explains how to write one. The step that does not exist is the first one. A newcomer's only on-ramp today is writing a serialisable definition by hand, which is a blank page and a vocabulary at the same time.

The obstacle this record was opened with was geometry rather than language. A Card carries authored `bounds`, a Region carries its own, and a Flow's route is derived from the ports those boxes give it; the product deliberately has no automatic layout, and `packages/view-model/src/placement.ts` places labels, not elements. So anything that turns prose into a document has to decide where things go.

That obstacle now has an answer, and it is not a layout solver. [Archify](https://tt-a1i.github.io/archify/), recorded in [the related-tools reference](../reference/related-tools.md), has no automatic layout engine either and still produces acceptable drawings, because a generating model is competent at placement when three things hold: it commits to a representation pattern before it places anything, it writes a candidate rather than reasoning about coordinates in prose, and it can ask a checker exactly what is wrong and repair one diagnosed thing at a time. The first is already this repository's own material — the representation patterns guide teaches composition, reading order, and architectural grammar. The third is [INFOSCHEMATICS-TOOL-113](INFOSCHEMATICS-TOOL-113-where-a-drawing-fails.md), which is why this now depends on it.

The bar also turns out to be lower than it looked. Studio edits a validated document, so a generated first draft has to be good enough to open and correct, not good enough to keep.

## Boundary

A decision item. It does not add a model concept, change what a definition may carry, or put a language runtime inside any package: authored definitions stay serialisable data, hosts keep mounting, and `ADR-INFOSCHEMATICS-021` keeps command-line input inert. It does not adopt automatic layout as a product capability — the skill chooses placement the way an author does, and the checker judges the result.

It does not cover the diagnostics surface itself, which is TOOL-113, or the semantic promises a document might declare, which is [INFOSCHEMATICS-TOOL-116](INFOSCHEMATICS-TOOL-116-promises-a-document-holds.md).

## Discussion

Captured on 2026-09-21 from a comparison the owner raised; reshaped the same day once the layout obstacle had an answer. No existing roadmap record, specification, or decision record covers prose or repository input.

The shape now worth putting side by side is narrower than the three options this record opened with, because a command in `packages/cli` that owns placement is no longer the alternative it appeared to be:

- **A skill outside these packages**, consuming the published contract, the vocabulary reference, the representation patterns guide, and TOOL-113's diagnostics. Costs the product nothing beyond the diagnostics it wants anyway, and proves the contract is genuinely public.
- **A skill inside this repository**, versioned with the contract it depends on, so a change to the model updates the instructions that teach it in the same commit. The cost is that the repository then owns an agent surface, which nothing in the current design anticipates.

The remaining questions are which of those two, whether repository inspection is in the first version or a later one, and what the skill is told to do when the diagnostics do not clear — reporting an unresolved document for a person to finish in Studio is a legitimate outcome, and a skill that hides it is worse than one that admits it.
