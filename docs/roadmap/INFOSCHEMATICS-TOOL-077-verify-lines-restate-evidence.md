---
id: INFOSCHEMATICS-TOOL-077
area: TOOL
title: Verify lines restate evidence
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-16T14:40:00Z
updated_at: 2026-09-16T14:40:00Z
---

# Verify lines restate evidence

## Goal

Make every requirement's `_Verify:_` line say how a reader checks the requirement, distinct from the `_Evidence:_` line that says where the proof already is.

## Context

Found on 2026-09-16 while confirming that a merged item's specification edits had landed. The corpus has 188 `_Verify:_` / `_Evidence:_` pairs. In 75 of them the `_Verify:_` line ends with the phrase "against this requirement." bolted on after a sentence that already closed with a full stop, so it reads as a broken sentence:

    _Verify:_ inspect `infoschematicSchema` and `SchemaMirrorsContract` in `packages/domain-core/src/schema.ts`. Decision: [ADR-INFOSCHEMATICS-013](…). against this requirement.

In 46 of those 75 the damage is not only grammatical: strip the tail and the `_Verify:_` line is the `_Evidence:_` line word for word. The requirement therefore has no verification instruction at all — it names its artefacts twice and calls one of them a method. The phrase entered the corpus in `769a5397 docs(specs): organise feature contracts` and no script emits it, so it is a hand-authored template tail applied over prose that was already written, not a generator defect.

This is a public specification corpus, and `_Verify:_` is the line a reader follows to hold the product to its own contract. A line that restates the evidence cannot be followed.

## Boundary

The `_Verify:_` lines and the guard that keeps them honest. Not the requirements themselves, not their `_Conformance:_` values, not the `_Evidence:_` lines except where a `_Verify:_` rewrite makes one redundant.

## Steps

1. [ ] Write the guard first, in `scripts/specification-evidence.test.ts` beside the cases that already check cited paths and conformance values: a `_Verify:_` line MUST NOT end with the bolted-on tail, and MUST NOT be its requirement's `_Evidence:_` line restated. Verifiable by both cases failing on today's tree with counts near 75 and 46.
2. [ ] Decide and record what a `_Verify:_` line is for, in one place a future author will read — `docs/specs/index.md` or the specification-realisations document, whichever already owns corpus conventions. The distinction to state: `_Verify:_` is an action someone can take, `_Evidence:_` is where the proof already sits. Verifiable by the convention being citable from the guard's failure message.
3. [ ] Repair the 46 that carry no method, one requirement at a time, by naming the command, suite, or observation that actually checks it. Where the honest answer is a suite that does not exist, say so and mark the requirement's conformance accordingly rather than inventing a method. Verifiable by the guard going green without exemptions.
4. [ ] Repair the remaining tail-only cases, where the method is real and only the sentence is broken. Verifiable by the same guard.
5. [ ] Confirm no requirement lost information: every artefact named in an old `_Verify:_` line is still named somewhere in its requirement. Verifiable by a diff read, not by the suite.

## Files touched

- `scripts/specification-evidence.test.ts`
- `docs/specs/*.md` — thirteen files carry affected lines
- `docs/specs/index.md` or `docs/specs/specification-realisations.md`, for the convention

## Verify

- `bun run self:scripts:test` — the two new cases fail before the repair and pass after, and the existing cited-path and conformance cases stay green.
- `bun run self:check`.

## Dependencies / blocks

None, but it wants to run after the batch settles rather than during it: step 3 rewrites lines in thirteen specification files, and several are being edited concurrently by feature work.

## Documentation impact

### Specifications

Thirteen of them, in the `_Verify:_` line only.

### Guides

None.

## Discussion

Step 1 before step 3 is the whole point. The tail is easy to strip with one substitution, and doing that first would leave 46 requirements with a `_Verify:_` line that is grammatical, plausible, and still says nothing — a worse state than the broken sentence, because the break is what makes the emptiness visible. The guard is what stops the cheap fix from passing for the real one.

Worth noting what did catch part of this: `INFOSCHEMATICS-TOOL-064`'s new case, which requires every file a backticked name cites to contain it, forced a real correction in `docs/specs/authoring.md` (`infoschematicConfigSchema` for an export actually named `infoschematicSchema`). A guard that reads the cited artefact found a false citation the whole corpus had carried. The same shape applied to the method half of the line is this item.
