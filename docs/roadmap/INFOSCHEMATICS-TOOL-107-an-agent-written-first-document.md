---
id: INFOSCHEMATICS-TOOL-107
area: TOOL
title: An agent-written first document
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: f626bee411d7eb1badc1c10e100e1cdbeec5cd0a
created_at: 2026-09-21T09:30:00Z
updated_at: 2026-10-04T12:12:46Z
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

It does not cover the diagnostics surface itself, which is delivered as [the drawing diagnostics](../specs/diagnostics.md), or the semantic promises a document might declare, which `INFOSCHEMATICS-TOOL-116` delivered.

## Current state

Nothing on this path exists yet. What exists is everything the skill would stand on: the vocabulary reference names every concept, the representation patterns guide teaches composition and reading order, the schema refuses an invented property, `infoschematics render` proves a document draws, and Studio opens and corrects one.

The repository has no skill directory and no agent surface of any kind, so this adds the first. The two runtimes the repository supports are declared in `.ki.toml` as `claude-code` and `chatgpt-codex`, which makes a runtime-neutral skill directory the right shape rather than one runtime's binding.

The owner has settled the two questions this record was holding. The skill lives in this repository, versioned with the contract it depends on. Its job is to get a document started, or to amend one that exists, and it does not have to be right: the editor resolves what it leaves, and a conversation refines the rest.

## Steps

- [x] Add `skills/infoschematics-authoring/SKILL.md`, describing when to use it, what it produces, and what it hands over unfinished.
- [x] Have it choose a representation pattern from the guide before placing anything, so composition is a decision rather than an accident of generation order.
- [x] Have it write a candidate document immediately and never reason about coordinates in prose, then validate and repair against `infoschematics check` under a bounded stop rule.
- [x] Support amending an existing document as a first-class mode, not only writing a new one: read the document, change what was asked for, and leave the rest alone.
- [x] Make it report an unresolved document plainly — the remaining findings, named — rather than claiming a clean result, and say that Studio or a conversation is where those are settled.
- [x] Keep the catalogues out of the instructions: artwork kinds, artefact kinds and option values are read from the repository at authoring time, because a list inside a skill drifts from the contract that owns it.
- [x] Document the skill for a reader: what it is for, what it is not, and how to correct what it produces.

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

## Review

### Delivered

The approved boundary, delivered from baseline `f626bee411d7eb1badc1c10e100e1cdbeec5cd0a`: a runtime-neutral Agent Skill at `skills/infoschematics-authoring/` with a NEW mode (plain-language description to a first canonical YAML document) and an AMEND mode (change what was asked, leave every other identity alone), both ending in a check-repair loop under a bounded stop rule, a render-and-look step, and a hand-over that names every remaining finding and points to Studio or a conversation. The Decision Record the item called for is [PDR-INFOSCHEMATICS-004](../decisions/PDR-INFOSCHEMATICS-004-an-authoring-skill-starts-a-document-and-names-what-it-leaves.md).

Excluded as the record states: no model concept, no contract or package change, no automatic layout, no repository inspection as an input. Site-owned consumer prose is captured separately as `INFOSCHEMATICS-SITE-032` (triage), per `AGENTS.md`, because Site output follows a settled feature and `apps/site/content/authoring.md` was under concurrent change by `INFOSCHEMATICS-TOOL-129`.

The parked question is answered by declaring the standard rather than relocating the skill. The owner's settled answer — the skill lives here — stands; `.ki.toml` now declares `[skills.ki-skills]`, so the coverage cascade that would have failed on an undeclared `skills/**/SKILL.md` passes. Probing showed the commitment is smaller than the park feared: for a product skill the rubric's only mechanical demand beyond the open standard was `ki-depends-on: []` and a refresh marker on its source file, and `ki-skills` was available through the installed harness, so the record's own verify step could run.

### Change Summary

- `skills/infoschematics-authoring/SKILL.md` — when to use it, the two modes, the hand-over contract and its boundaries.
- `skills/infoschematics-authoring/references/sources.md` — where each catalogue lives (schema, vocabulary, representation patterns, YAML convention, standard artwork keys, rule codes, worked examples), in a checkout and from the published site, and how to resolve and confirm the checker. It names locations and never copies a catalogue.
- `skills/infoschematics-authoring/references/placement.md` — lanes from the representation pattern, sizes and gutters, ports and Flows, Regions and canvas bounds.
- `skills/infoschematics-authoring/references/repair-loop.md` — validity before drawing, one diagnosed repair per round keyed off `rule`, `concerns` and `measured` (with `repairs` read as prose, per the correction recorded under Parked), the stop rule, and an identity-level comparison for amendments.
- `docs/decisions/PDR-INFOSCHEMATICS-004-…md` and its entry in `docs/decisions/README.md` (renumbering the four Repository operation entries after it).
- `.ki.toml` — `[skills.ki-skills]` declared, with its reason.
- `README.md` — the skill in the repository layout and a short "Start a document with an agent" section.
- `docs/roadmap/INFOSCHEMATICS-SITE-032-first-document-from-prose.md` and `docs/roadmap/_ISSUES.md` — the Site follow-up captured in triage, and its serial reserved.

### Verification

- **Exercised end to end** by a fresh agent following only the skill, in ignored `tmp/tool-107/`. The checker resolved to `bun packages/cli/src/bin.ts` and confirmed on `examples/is-system/infoschematic.yaml` (`the drawing reads.`, exit `0`).
  - NEW, from a five-sentence order-fulfilment description: the agent chose "architecture with boundaries, left to right", wrote the candidate, and every check exited `0` with `findings: []`. Its first PNG validated but read badly — no Region frame, Card detail hidden, a Fabric label truncated — which it repaired from the image, not the checker. The final render was looked at by the agent and again by the implementer: it reads left to right, the cloud boundary encloses the right parts, the courier sits outside, and the families are distinguishable. One description is still truncated on the message bus Fabric.
  - AMEND, on a copy of `examples/is-system/infoschematic.yaml` (rename one Card and replace its description): the check gave `the drawing reads.`; the identity comparison printed exactly `changed diagram.cards.OBS-01`; `diff -u` showed two changed lines with comments, order and quoting intact; the render showed the new text unclipped.
  - The agent's critique was applied: appearance as the lever for what is drawn, Fabric-versus-Card choice, port and `link` notation pointer, required schema fields, id casing, where the before copy goes, and when to stop polishing.
- **`ki repo audit --skill ki-skills`**: PASS (one WARN, LONG-4 refresh marker, fixed before the final run).
- **`bun run self:check`**, in a clean worktree holding the baseline plus only this change, with `--continue`: 51 of 52 tasks pass. The one failure, `scripts/specification-evidence.test.ts` on `docs/specs/routing-and-placement.md` ROUTE-011, fails identically at the baseline with this change removed; it comes from `638e2818`, which this item does not touch.
- **`ki repo audit`**: the coverage cascade passes with the skill present. In the shared checkout the remaining FAILs (TSC-1, BIO-1) come from other agents' uncommitted package changes; the clean worktree shows only RUNTIMES-2, because a worktree carries no runtime discovery links.
- **`bunx rumdl check`** on every Markdown file changed: no issues.

### Outstanding concerns

- `self:check` is red at baseline on ROUTE-011's empty conformance state (`638e2818`); it needs its owner's fix and is not caused or masked by this change.
- Declaring `[skills.ki-skills]` is a governance commitment the owner should confirm: the repository is now held to the Agent Skills rubric for anything under `skills/`, and the skill must be refreshed when the schema, vocabulary, representation guidance or checker output change. PDR-INFOSCHEMATICS-004 records that consequence.
- The exercise produced a document the checker passed on the first round, so the repair loop was proven against the known-good path and the stop rule was not reached. A document that starts with errors was not exercised.
- A checker-clean render can still truncate text and hide detail; the skill now tells an agent to look, but the checker cannot hold it to that.
- The consumer-guide on-ramp is deferred to `INFOSCHEMATICS-SITE-032`.

### Post-change review

The goal holds: from a sentence, an agent following the skill produced a document that validates, reads, and is ready for Studio, and from an amendment request it changed exactly the requested identity. Scope held to the record's boundary — no package, schema, specification or Site content changed — and regression risk is confined to documentation and configuration: no code path reads `skills/`, and the only gate effect is the coverage cascade, which now passes. The skill meets its own rubric. It is ready for review, with the governance declaration and the unexercised error path as the points a reviewer should weigh.

### Mini recap

Delivered the `infoschematics-authoring` skill, its decision record, the README on-ramp and the `ki-skills` declaration, and captured the Site guide follow-up. Verified by a real NEW and AMEND run with renders looked at, a clean `ki-skills` audit, and a clean-worktree `self:check` whose only failure predates this item. Proposed learning routes, not promoted: the `AGENTS.md` point that a checker-clean drawing can still read badly gains a second instance (truncated Fabric text and hidden Card detail); and the ki-skills coverage cascade could say in its finding how small a product skill's declaration actually is, since its cost was overestimated when this record was parked.

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

### Parked on 2026-09-24

Parked by `INFOSCHEMATICS-BATCH-001` before implementation, on a question the record cannot answer itself: **where the skill lives**. The record recorded the answer as "this repository", and that answer has no supported shape here.

This repository tracks no skill content at all. `.agents/skills/` and `.claude/skills/` hold runtime discovery links to the harness and are ignored by `.gitignore`, with one negation — `!.agents/skills/ki-self/` — reserving a slot that does not exist. That slot is the only committed repository-local skill source the `ki-skills` standard recognises, its name is locked to `ki-self` by the rubric's name-matches-directory rule, and it is meant for a repository's own governance rubric rather than a product authoring skill.

The path this record proposes, a top-level `skills/`, is the harness layout. Creating it here makes this repository look like a skills-publishing repository to `ki repo audit`, whose coverage cascade fails a detected-but-undeclared standard. Clearing that failure means declaring `[skills.ki-skills]` in `.ki.toml`, which is a governance commitment — the full SKILL.md rubric, REFRESH ownership, a publication shape — that nothing else in this repository has taken on. The record's own Verify step cannot run either: `ki-skills` is not installed in this checkout.

So the decision owed is not a detail of the skill. It is whether Infoschematics becomes a skill-publishing repository, or whether the authoring skill ships from the harness or a plugin repository and consumes this repository's published contract. Delivering against the record as written would produce a repository that fails its own audit.

Everything the skill would stand on is delivered and needs no re-investigation. `infoschematics check` is real, with `--json` returning `{ document, findings, unreadable }`. A finding is `DrawingFinding` in `packages/view-model/src/diagnostics.ts`, carrying `rule`, `concerns`, `measured`, `reads`, `repairs` and `severity` across seven stable rule codes.

One correction to the record's premise while it is open: `repairs` is `readonly string[]` — English sentences, not structured fixes. The machine-readable triple a repair loop can key off is `rule`, `concerns` and `measured`. The loop the record describes is coded in its rule selection and prose in its repair, which changes what the skill has to do and is worth knowing before it is planned again.
