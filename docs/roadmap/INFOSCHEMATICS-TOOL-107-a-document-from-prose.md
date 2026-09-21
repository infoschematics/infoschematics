---
id: INFOSCHEMATICS-TOOL-107
area: TOOL
title: A document from prose
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-21T09:30:00Z
updated_at: 2026-09-21T09:30:00Z
---

# A document from prose

## Goal

Settle whether the product offers a way to get a first [Infoschematic](../reference/vocabulary.md#infoschematic) from prose or from a repository, and if so where that seam lives — an agent skill outside these packages, a command in the command-line surface, or nowhere.

## Context

Everything downstream of an authored document exists: the interactive Diagram draws it, `infoschematics render` emits deterministic SVG from it, Present shows it to an audience, Studio edits it, and the guide explains how to write one. The step that does not exist is the first one. A newcomer's only on-ramp today is writing a serialisable definition by hand, which is a blank page and a vocabulary at the same time.

The comparison that raised it is [Archify](https://tt-a1i.github.io/archify/), an MIT agent skill that turns a chat description of a system — optionally after inspecting the repository — into a self-contained interactive HTML diagram. Its artefact is terminal: the HTML file is the deliverable, exported to PNG or SVG and otherwise refined by more conversation. Ours is an input with several outlets, which is the durable difference and not in question here. What Archify shows is that the conversational on-ramp is the part people reach for first, and that it can be built entirely on top of a published contract without the product owning any of it.

There is a real obstacle, and it is geometry rather than language. A Card carries authored `bounds`, a Region carries its own, and a Flow's route is derived from the ports those boxes give it: the product deliberately has no automatic layout. `packages/view-model/src/placement.ts` places labels, not elements. So anything that turns prose into a document has to decide where things go, which is a capability nobody has written and which the visual language has opinions about — composition, reading order, and the architectural grammar the representation patterns guide teaches.

## Boundary

A decision item. It does not add a model concept, change what a definition may carry, or put a language runtime inside any package: authored definitions stay serialisable data, and hosts keep mounting. It does not commit to shipping a generator, and it does not adopt automatic layout as product capability — naming layout as the blocking question is the point of the item, not a decision that it will be built here.

## Discussion

Captured on 2026-09-21 from a comparison the owner raised; no existing roadmap record, specification, or decision record covers prose or repository input, so this is new ground rather than a restatement.

Three shapes are worth putting side by side when this is shaped, and they differ in who carries the layout problem:

- **An agent skill outside the repository**, consuming the published packages and the vocabulary reference. The generating model chooses coordinates, which is exactly what agents are tolerable at and what a deterministic algorithm is expensive at. Costs the product nothing and proves the contract is genuinely public.
- **A command in `packages/cli`**, which would need a real placement algorithm and therefore a decision record about whether the product owns layout at all. The largest option, and the one most likely to contradict the current design.
- **Neither**, with the guide's authoring walkthrough improved instead, on the argument that a hand-written first document teaches the model and a generated one hides it.

The question to answer first is whether a generated document has to be good enough to keep, or only good enough to edit in Studio. If Studio is the second step, the layout bar drops sharply and the first option becomes small.
