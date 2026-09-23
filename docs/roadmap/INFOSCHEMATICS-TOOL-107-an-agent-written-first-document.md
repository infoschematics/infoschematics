---
id: INFOSCHEMATICS-TOOL-107
area: TOOL
title: An agent-written first document
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-21T09:30:00Z
updated_at: 2026-09-22T19:40:00Z
---

# An agent-written first document

## Goal

This repository offers an authoring skill that turns a plain-language description into a first [Infoschematic](../reference/vocabulary.md#infoschematic), or amends one that exists, good enough to open in Studio and correct there.

## Context

Everything downstream of an authored document exists: the interactive Diagram draws it, `infoschematics render` emits deterministic SVG from it, Present shows it to an audience, Studio edits it, and the guide explains how to write one. The step that does not exist is the first one. A newcomer's only on-ramp today is writing a serialisable definition by hand, which is a blank page and a vocabulary at the same time.

The obstacle this record was opened with was geometry rather than language. A Card carries authored `bounds`, a Region carries its own, and a Flow's route is derived from the ports those boxes give it; the product deliberately has no automatic layout, and `packages/view-model/src/placement.ts` places labels, not elements. So anything that turns prose into a document has to decide where things go.

That obstacle now has an answer, and it is not a layout solver. [Archify](https://tt-a1i.github.io/archify/), recorded in [the related-tools reference](../decisions/references/related-tools.md), has no automatic layout engine either and still produces acceptable drawings, because a generating model is competent at placement when three things hold: it commits to a representation pattern before it places anything, it writes a candidate rather than reasoning about coordinates in prose, and it can ask a checker exactly what is wrong and repair one diagnosed thing at a time. The first is already this repository's own material — the representation patterns guide teaches composition, reading order, and architectural grammar. The third is [the drawing diagnostics](../specs/diagnostics.md), which is why this now depends on it.

The bar also turns out to be lower than it looked. Studio edits a validated document, so a generated first draft has to be good enough to open and correct, not good enough to keep.

## Boundary

A decision item. It does not add a model concept, change what a definition may carry, or put a language runtime inside any package: authored definitions stay serialisable data, hosts keep mounting, and `ADR-INFOSCHEMATICS-017` keeps command-line input inert. It does not adopt automatic layout as a product capability — the skill chooses placement the way an author does, and the checker judges the result.

It does not cover the diagnostics surface itself, which is delivered as [the drawing diagnostics](../specs/diagnostics.md), or the semantic promises a document might declare, which is [INFOSCHEMATICS-TOOL-116](INFOSCHEMATICS-TOOL-116-promises-a-document-holds.md).

## Current state

Nothing on this path exists yet. What exists is everything the skill would stand on: the vocabulary reference names every concept, the representation patterns guide teaches composition and reading order, the schema refuses an invented property, `infoschematics render` proves a document draws, and Studio opens and corrects one.

The repository has no skill directory and no agent surface of any kind, so this adds the first. The two runtimes the repository supports are declared in `.ki.toml` as `claude-code` and `chatgpt-codex`, which makes a runtime-neutral skill directory the right shape rather than one runtime's binding.

The owner has settled the two questions this record was holding. The skill lives in this repository, versioned with the contract it depends on. Its job is to get a document started, or to amend one that exists, and it does not have to be right: the editor resolves what it leaves, and a conversation refines the rest.

## Steps

- [ ] Add `skills/infoschematics-authoring/SKILL.md`, describing when to use it, what it produces, and what it hands over unfinished.
- [ ] Have it choose a representation pattern from the guide before placing anything, so composition is a decision rather than an accident of generation order.
- [ ] Have it write a candidate document immediately and never reason about coordinates in prose, then validate and repair against `infoschematics check` under a bounded stop rule.
- [ ] Support amending an existing document as a first-class mode, not only writing a new one: read the document, change what was asked for, and leave the rest alone.
- [ ] Make it report an unresolved document plainly — the remaining findings, named — rather than claiming a clean result, and say that Studio or a conversation is where those are settled.
- [ ] Keep the catalogues out of the instructions: artwork kinds, artefact kinds and option values are read from the repository at authoring time, because a list inside a skill drifts from the contract that owns it.
- [ ] Document the skill for a reader: what it is for, what it is not, and how to correct what it produces.

## Files touched

New `skills/infoschematics-authoring/SKILL.md` with its `references/`; `README.md` and the site guide where the on-ramp is described; `docs/decisions/` for the record of where the skill lives and what it promises.

## Verify

The skill is exercised, not only written: from a short prose description it produces a document that `infoschematics check` accepts, and from an existing document plus an amendment request it produces a document that still validates and still contains what it was not asked to change.

`bun run self:check` for the repository gates, and `ki repo audit --skill ki-skills` for the skill's own standard, which is the gate that governs what this item makes.

A produced document is rendered and looked at, per `AGENTS.md`: a document that validates and reads badly is exactly the failure this skill exists to keep out of a person's way.

## Dependencies / blocks

Nothing blocks it any longer. The repair loop is the whole method, and the coded findings it repairs against are delivered: `infoschematics check` and `reviewInfoschematicDrawing`, specified as [the drawing diagnostics](../specs/diagnostics.md) and decided in [ADR-INFOSCHEMATICS-036](../decisions/ADR-INFOSCHEMATICS-036-a-checker-measures-a-drawing-and-never-repairs-it.md). It blocks nothing.

## Documentation impact

### Decision Records

A new record that the product offers an authoring skill from this repository, that its output is a starting point rather than a deliverable, and that an unresolved document is a legitimate result it must report rather than hide.

### Specifications

None. The skill consumes the published contract and adds no behaviour to it; a skill that needed a contract change would be evidence it had taken on something a package should own.

### Guides

The consumer guide gains the on-ramp: how to get a first document from a description, and that correcting it in Studio is the expected next step rather than a sign of failure.

### Roadmap

Consumes the delivered drawing diagnostics. Repository inspection as an input is deliberately left for its own record rather than folded in here.

## Discussion

Captured on 2026-09-21 from a comparison the owner raised; reshaped the same day once the layout obstacle had an answer. No existing roadmap record, specification, or decision record covers prose or repository input.

### Where the skill lives

The owner settled this on 2026-09-21: the skill is part of this repository. The two shapes that were worth weighing, before that answer:

- **A skill outside these packages**, consuming the published contract, the vocabulary reference, the representation patterns guide, and the delivered drawing diagnostics. Costs the product nothing beyond the diagnostics it wants anyway, and proves the contract is genuinely public.
- **A skill inside this repository**, versioned with the contract it depends on, so a change to the model updates the instructions that teach it in the same commit. The cost is that the repository then owns an agent surface, which nothing in the current design anticipates.

The remaining questions are which of those two, whether repository inspection is in the first version or a later one, and what the skill is told to do when the diagnostics do not clear — reporting an unresolved document for a person to finish in Studio is a legitimate outcome, and a skill that hides it is worse than one that admits it.

The reason the inside answer wins is the one stated against it: the repository does now own an agent surface, but a skill that teaches a contract has to move when the contract moves, and only a skill versioned beside it can be held to that in one commit.

### What the skill is allowed to leave unfinished

Also settled by the owner on 2026-09-21, and it changes the acceptance bar rather than the design. The skill is there to get a document started or to have one amended; it does not have to get it right. Whatever it leaves, the editor resolves — and where an issue needs a judgement, a conversation about it is part of the work rather than a failure of the skill.

That makes one thing explicit which the record had left as an open question: a skill that reports an unresolved document, naming what it could not fix, is behaving correctly. The failure mode to design against is not an imperfect drawing; it is a skill that claims a clean result it did not achieve, because that is the one outcome a person cannot act on.
