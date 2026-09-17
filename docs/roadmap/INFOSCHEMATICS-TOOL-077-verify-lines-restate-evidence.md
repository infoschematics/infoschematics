---
id: INFOSCHEMATICS-TOOL-077
area: TOOL
title: Verify lines restate evidence
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T14:40:00Z
updated_at: 2026-09-17T10:00:00Z
---

# Verify lines restate evidence

## Goal

Make every requirement's `_Verify:_` line say how a reader checks the requirement, distinct from the `_Evidence:_` line that says where the proof already is.

## Context

Found on 2026-09-16 while confirming that a merged item's specification edits had landed. The corpus has 188 `_Verify:_` / `_Evidence:_` pairs. In 73 of them the `_Verify:_` line ends with the phrase "against this requirement." bolted on after a sentence that already closed with a full stop, so it reads as a broken sentence:

    _Verify:_ inspect `infoschematicSchema` and `SchemaMirrorsContract` in `packages/domain-core/src/schema.ts`. Decision: [ADR-INFOSCHEMATICS-013](…). against this requirement.

In 66 of those 73 the damage is not only grammatical: strip the tail and the leading "inspect", and the `_Verify:_` line is the `_Evidence:_` line word for word. The requirement therefore has no verification instruction at all — it names its artefacts twice and calls one of them a method. The phrase entered the corpus in `769a5397 docs(specs): organise feature contracts` and no script emits it, so it is a hand-authored template tail applied over prose that was already written, not a generator defect.

The tail is not the whole of it. A further 45 pairs carry no tail and are byte-identical `_Verify:_` and `_Evidence:_` lines — the same emptiness without the broken sentence that advertises it (`docs/specs/appearance.md:123` and `:125` are a pair). So the repair surface is 111 requirements, not 66, and the 45 are the ones a tail-stripping substitution would leave untouched and unnoticed.

This is a public specification corpus, and `_Verify:_` is the line a reader follows to hold the product to its own contract. A line that restates the evidence cannot be followed.

## Boundary

The `_Verify:_` lines and the guard that keeps them honest. Not the requirements themselves, not their `_Conformance:_` values, not the `_Evidence:_` lines except where a `_Verify:_` rewrite makes one redundant.

## Findings

The guard counted **112** restatements, not the 111 this record recorded. The extra one carries no template tail but does carry the lowercase `inspect` lead-in the tail was written around, and its remainder is byte-identical to its `_Evidence:_` line; the record's count had read the tail as the marker.

`AUTHOR-007` and `AUTHOR-008` cited a repository script, `check:deps`, that does not exist. Neither a path nor a file name, so no existing case could catch it; both now cite `bun run self:boundaries:verify`, which is the command that actually cruises the boundaries. These are the only two artefacts step 5 records as deliberately dropped.

No requirement needed a `pending` conformance state: every one of the 112 had an honest method available, either a command the repository already runs or an observation taken from the requirement's own MUST clauses. The corpus's first non-conforming state came from a different item in the same batch — `ROUTE-019`, recorded `divergent` by `INFOSCHEMATICS-TOOL-072`.

The named-content case's floor moved from 60 to 50, and is documented in place. It counted 73 "`thing` in `path`" claims while each restated pair offered the same claim twice; with the duplicates gone the corpus holds 56 of them, and the evidence half still names everything it named before.

## Steps

1. [x] Write the guard first, in `scripts/specification-evidence.test.ts` beside the cases that already check cited paths and conformance values: a `_Verify:_` line MUST NOT end with the bolted-on tail, and MUST NOT be its requirement's `_Evidence:_` line restated. Verifiable by both cases failing on today's tree with counts of 73 and 111.
2. [x] Decide and record what a `_Verify:_` line is for, in one place a future author will read — `docs/specs/index.md:9-10`, which already states both fields in one sentence each ("`_Verify:_` names the check capable of deciding conformance", "`_Evidence:_` names current proof and is required when conforming") and is therefore the place a future author reads. The distinction to sharpen there: `_Verify:_` is an action someone can take, `_Evidence:_` is where the proof already sits. Verifiable by the convention being citable from the guard's failure message.
3. [x] Repair the 111 that carry no method, one requirement at a time, by naming the command, suite, or observation that actually checks it. Where the honest answer is a suite that does not exist, say so and mark the requirement's conformance accordingly rather than inventing a method — note that all 188 requirements read `_Conformance:_ conforming` today, so the first honest `pending` this produces will be the corpus's first non-conforming state and should be reported as a finding, not buried in the sweep. Verifiable by the guard going green without exemptions.
4. [x] Repair the remaining tail-only cases, where the method is real and only the sentence is broken. Verifiable by the same guard.
5. [x] Confirm no requirement lost information: every artefact named in an old `_Verify:_` line is still named somewhere in its requirement. Verifiable by a diff read, not by the suite.

## Files touched

- `scripts/specification-evidence.test.ts`
- `docs/specs/*.md` — fourteen files carry the tail; the byte-identical pairs are spread wider
- `docs/specs/index.md` or `docs/specs/specification-realisations.md`, for the convention

## Verify

- `bun run self:scripts:test` — the two new cases fail before the repair and pass after, and the existing cited-path and conformance cases stay green.
- `bun run self:check`.

## Dependencies / blocks

None, but it wants to run after the batch settles rather than during it: step 3 rewrites lines in fourteen specification files, and several are being edited concurrently by feature work.

## Documentation impact

### Specifications

Fourteen of them carry the tail, and more carry a byte-identical pair; in the `_Verify:_` line only.

### Guides

None.

## Discussion

Step 1 before step 3 is the whole point. The tail is easy to strip with one substitution, and doing that first would leave 46 requirements with a `_Verify:_` line that is grammatical, plausible, and still says nothing — a worse state than the broken sentence, because the break is what makes the emptiness visible. The guard is what stops the cheap fix from passing for the real one.

Worth noting what did catch part of this: `INFOSCHEMATICS-TOOL-064`'s new case, which requires every file a backticked name cites to contain it, forced a real correction in `docs/specs/authoring.md` (`infoschematicConfigSchema` for an export actually named `infoschematicSchema`). A guard that reads the cited artefact found a false citation the whole corpus had carried. The same shape applied to the method half of the line is this item.

## Review packet

### Delivered

Two new cases in `scripts/specification-evidence.test.ts` refuse a `_Verify:_` line that ends with the template tail or that restates its `_Evidence:_` line; `docs/specs/index.md` states what each of the two lines is for; and all 112 offending requirements across fifteen specification files now carry a method a reader can follow.

### Summary of changes

`scripts/specification-evidence.test.ts` parses both lifecycle lines rather than only the evidence one, and its failure messages cite the convention. Every repaired `_Verify:_` line names a command the repository runs, a rendered observation, or both, followed by a falsifier taken from the requirement's own MUST clauses. Six `diagram-dynamics.md` requirements regained implementation citations that an earlier pass in this batch had dropped.

### Verification

`bun run self:scripts:test` — 15 files, 89 tests, green, with the two new cases failing on the pre-repair tree at counts 112 and 73. `bun run self:check` — 45 of 45 tasks successful. `bunx rumdl check docs/specs scripts` — clean. Step 5 was checked mechanically as the record requires by diff read: every backticked artefact from every old `_Verify:_` line is still named somewhere in its requirement, except `check:deps`, which never existed.

### Outstanding concerns

A `_Verify:_` line that names a real command and a real falsifier is still unexecuted prose; the guard checks that a method is stated, not that following it decides conformance. Several repaired lines ask the reader to render Studio and look, which is the honest method for a visual requirement and the slowest one to act on.

### Post-change review

The guard would not have caught its own subject before this item: the corpus spent 112 requirements advertising a method it did not have, and every gate stayed green. The lesson generalises past this file — a lifecycle field nothing reads decays to decoration, and the cheapest guard is one that reads it the way a reader would.

### Mini recap

Guard first, convention second, repairs third, exactly as the record's Discussion demanded; the 112 count and the dead `check:deps` citation are both findings the guard produced rather than things the sweep buried.
