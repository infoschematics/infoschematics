---
id: INFOSCHEMATICS-TOOL-130
area: TOOL
title: Where Card detail belongs
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: cfead134fa5faef9fe960b9d8ef6a202d1c1621a
created_at: 2026-09-22T19:15:00Z
updated_at: 2026-09-25T08:50:27Z
---

# Where Card detail belongs

## Goal

Settle whether the four Card switches under `diagram.appearance` are appearance at all, or a disclosure policy that belongs somewhere else in the configuration.

## Context

`diagram.appearance.card` carries `compact`, `identity`, `stereotype` and `description`, each a boolean, each document-wide. Every published example sets the block and they disagree about it: `is-blank` turns all four off, `is-showcase` turns three on, `is-infoschematics` and `is-system` sit between. So it is load-bearing, not vestigial.

None of the four says how a Card looks. They say what a Card discloses — whether a reader is shown an identity, a stereotype, a description, or a condensed form of all three. That is a different kind of decision from `grid` or `style`, which are genuinely about treatment, and it sits uneasily beside `ADR-INFOSCHEMATICS-011`, which already separates authored appearance from output-detail policy. `diagram.appearance.identity` also exists alongside `card.identity`, and the relationship between the two is not obvious from the schema.

The other pull is `INFOSCHEMATICS-TOOL-114`, which wants what a Card shows to follow magnification rather than being fixed for the document. If that lands, a static document-wide boolean becomes either the answer at one magnification or a ceiling on what any magnification may reveal — and which of those it means is exactly the question this record has to answer first.

## Boundary

The question is where the decision belongs and what it means, not a rename. Moving four booleans to a different parent without deciding whether they are a fixed answer, a default, or a ceiling would leave `INFOSCHEMATICS-TOOL-114` facing the same ambiguity under a new field name.

`diagram.appearance.identity` is in scope, because the duplication is part of the confusion. Colour, theme and style are not: `INFOSCHEMATICS-TOOL-129` takes those.

## Current state

The four switches are not a flat authored setting. `packages/view-model/src/appearance.ts` resolves each one down a cascade: an `output` policy first, then `appearance.card`, then — for identity alone — the coarser `appearance.identity`, then a built-in default. So an output-detail policy that overrides authored intent already exists, which is what `ADR-INFOSCHEMATICS-011` separates, and the authored block sits in the middle of it.

`appearance.identity` is not a duplicate of `card.identity` and not merely a fallback beneath it. It is the Diagram-wide default for every element kind, and the only default a Fabric, a Point, a Region or a Flow has: `resolveVisualTreatment` surfaces it as `ResolvedVisualTreatment.identity`, which both renderers read through `drawsOwnCode`. `card.identity` is the older and narrower statement about Cards alone. One broad answer beside one narrow one, not two spellings of the same one.

The record said nothing states that relationship outside the one expression that implements it. That was already false: `APPEAR-018` in `docs/specs/appearance.md` states the cascade in prose — the element's own statement first, then `appearance.card.identity` for a plain Card, then the Diagram-wide default — and `apps/site/content/authoring.md` already explains `cardDetails` as an output-only override that cannot take a pinned code away. What is genuinely unwritten is what an authored value means against a rendering that shows less, and the word for it.

The record also said only static output varies the answer by size. Also false. `packages/render-svg/src/index.ts` and `packages/view-canvas/src/InfoschematicDiagram.tsx` both call `resolveResponsiveCardTreatment`, the first from an explicit target size and the second from the measured frame, and the option is threaded through Present, Studio and the site Playground with `packages/view-canvas/src/InfoschematicDiagram.responsive.browser.test.tsx` covering it in a real browser. What the interactive Diagram lacks is detail that follows magnification rather than the size of its host element, and that is `INFOSCHEMATICS-TOOL-114` rather than this record.

`compact` is not one of four of a kind. It reaches `resolveCardLayout` in `packages/view-model/src/card-layout.ts` and decides how a Card stacks its text and which font size it uses; it withholds nothing. The code had already separated it: `CardDetailOverrides` is a `Pick` of `description | identity | stereotype`, and `resolveResponsiveCardTreatment` copies `compact` through untouched. It is treatment, settled by the code rather than by a decision.

Every published document authors the block and they disagree: `is-blank` turns all four off, `is-showcase` turns three on, `is-infoschematics` and `is-system` sit between. `examples/is-showcase/infoschematic.yaml` is the only one that authors `appearance.identity` beside `card.identity`, and it authors them opposite ways.

## Steps

- [x] Establish what each of the four actually changes at render time, in both outlets, rather than from the property names. `compact` reaches `resolveCardLayout` through both renderers: it stacks a Card's text differently and picks a smaller type size, and removes nothing a reader could otherwise read. It is treatment rather than disclosure, so it does not travel with the other three — and the code had already excluded it from both the output override and the responsive reduction, so this is settled by the code rather than by a decision. The specification now says so.
- [x] Decide what an authored value means against the policy above it: a fixed answer, an initial default, or a ceiling no magnification may exceed. It is a ceiling. The document states the most a reader may ever be shown; a rendering may show less and may never show more; an element that pins its own code is a floor beneath both. An initial default is rejected explicitly, because it would let a rendering add a row the author deliberately withheld, which is what `ADR-INFOSCHEMATICS-011` exists to prevent. `INFOSCHEMATICS-TOOL-114` can be planned on that: magnification may withhold detail and may never reveal it.
- [x] Name the existing cascade in the contract, so the `output` layer, the authored block and the coarse `appearance.identity` fallback are a stated model rather than one expression in `appearance.ts`. `APPEAR-016` now states the three layers and the word; `APPEAR-018` names itself the floor beneath the ceiling; `CardDetailDefaults` in `packages/domain-model/src/appearance.ts` says the same where the fields are declared.
- [x] Move the block to whatever that makes it, carrying the old location through `packages/view-model/src/compatibility.ts` so existing documents keep working. Not executed, and that is the decision rather than an omission: the block stays under `diagram.appearance`. The record's own Boundary says the question is where the decision belongs and what it means, not a rename, and the meaning is now stated — a move would add nothing to it. Nothing in `INFOSCHEMATICS-TOOL-114` turns on the parent either, because "magnification may only withhold" is the same answer at any address. Against that, a move costs a compatibility path, a regenerated JSON schema, a migration of four published documents, and every guide and example that shows the old spelling. And the premise is weaker than it looked: `compact` is unambiguously treatment and sits in the same block, so splitting three fields out of four would put two kinds of Card statement in two places and make the contract harder to read rather than easier.
- [x] Resolve `appearance.identity` — keep it as the documented coarse form or retire it into the block — and stop it being two spellings of one answer. Kept, with the premise corrected: it is not a second spelling. It is the Diagram-wide default for every element kind and the only default a Fabric, a Point, a Region or a Flow has, surfaced as `ResolvedVisualTreatment.identity` and read through `drawsOwnCode` in both renderers. Retiring it into `card` would silently remove the only way to say that every kind draws its code, and would break `APPEAR-018`. One broad answer beside one narrow one is the right shape, and it is now documented as that rather than left to be read as duplication.
- [x] Migrate the four documents that author the block. Not executed, because nothing moved: no document needs migrating. The four are unchanged and resolve to exactly the treatment they always did.
- [x] Take `resolveResponsiveCardTreatment` into the decision rather than leaving it as an outlet-only behaviour, since it is already an answer to the question and only static output has it. Taken into the decision — `APPEAR-016` now names it as the layer that may only withhold — but the premise was false. Both outlets already consume it, threaded through Present, Studio and the site Playground, with a Canvas browser suite covering it. What the interactive Diagram lacks is detail that follows magnification rather than host element size, which is `INFOSCHEMATICS-TOOL-114`.

## Files touched

`packages/view-model/src/appearance.ts` and its tests; `packages/view-model/src/compatibility.ts`; `packages/domain-model/src/appearance.ts`; `packages/domain-core/src/schema.ts` and the regenerated schema; `packages/render-svg/src/index.ts`; `packages/view-canvas/src`; the four `examples/*/infoschematic.yaml` that author the block; `docs/specs/appearance.md`; `ADR-INFOSCHEMATICS-011` if the layering changes rather than is merely stated.

## Verify

`bun run self:check`, with the compatibility path proving a document authored the old way still resolves to the same treatment.

Per `AGENTS.md`, look at it: render a document with the block on and off in both outlets and capture the pair to `reports/`. Four booleans that each remove something from a Card are precisely the change a green suite says nothing about, because every assertion can pass while the Card that results is unreadable.

## Dependencies / blocks

Nothing blocks it. It should land before `INFOSCHEMATICS-TOOL-114` is planned in detail, since that record needs to know whether an authored value is a fixed answer or a ceiling.

It follows `INFOSCHEMATICS-TOOL-129`, which moves `diagram.appearance` for colour. Not a blocker — they touch different properties — but taking them in that order avoids two migrations of the same documents.

## Documentation impact

### Decision Records

`ADR-INFOSCHEMATICS-011` already separates authored appearance from output-detail policy. If the work only names the cascade that record implies, no amendment is needed; if it changes the layering, amend it in place.

### Specifications

`docs/specs/appearance.md` states the cascade, what an authored value means against the policy above it, and what `appearance.identity` is.

### Guides

`apps/site/content/authoring.md` explains what an author is choosing and what a renderer may still override, which nothing currently says.

### Roadmap

`INFOSCHEMATICS-TOOL-114` proceeds on the answer.

## Review

### Delivered

The record's central question was what an authored Card disclosure value means against the policy above it: a fixed answer, an initial default, or a ceiling. It is a ceiling. The document states the most a reader may ever be shown; a rendering — its size today, its magnification once `INFOSCHEMATICS-TOOL-114` lands — may show less and may never show more; and an element that pins its own code is a floor beneath both, which `APPEAR-018` had already carved out.

The repository had decided this twice and never said the word. `resolveResponsiveCardTreatment` only ever ANDs an authored value with the scale test, so a rendering can withdraw a row and never add one, and `packages/view-model/src/appearance.test.ts` already calls that an upper bound. `ADR-INFOSCHEMATICS-011` decided it in those same words: "explicit detail settings remain an upper bound". What was delivered is the word, written where a reader meets the fields — the specification, the type, and the authoring guide — and the explicit rejection of the reading that would have let a rendering restore a row the author withheld.

Nothing moved. Re-grounding against the code found four of the six steps resting on claims that were false when written; each is marked done with what was decided instead, rather than deleted. `ADR-INFOSCHEMATICS-011` was read in full and needs no amendment: its Decision already carries the upper bound, and this work states the same layering rather than changing it.

Baseline `cfead134`.

### Change Summary

Four files.

- `docs/specs/appearance.md` — `APPEAR-016` gains two paragraphs: the word "ceiling" with the three layers named and the cross-reference to `APPEAR-018`'s floor, and the statement that Card compactness is treatment which takes no part in the override or the reduction. Its `_Verify:_` line gains the checks those paragraphs imply and its `_Evidence:_` line the compactness coverage. `APPEAR-018` gains one sentence naming itself the floor beneath that ceiling.
- `apps/site/content/authoring.md` — one sentence extending the output-detail paragraph: what the definition asks for is the most a reader is ever shown, a rendering too small to hold a row may leave it out, and nothing restores a row the definition left off.
- `packages/domain-model/src/appearance.ts` — a doc comment on `CardDetailDefaults` carrying the ceiling, the element floor, and compactness as treatment. No type changed.
- this record.

Deliberate non-changes, several of them named under Files touched and none edited: the block did not move, so `packages/view-model/src/compatibility.ts` gained no path and `packages/domain-core/src/schema.ts` and the generated schema were not regenerated; the four `examples/*/infoschematic.yaml` that author the block are untouched; `appearance.identity` is kept; `packages/render-svg/src/index.ts` and `packages/view-canvas/src` needed nothing, because the behaviour the decision names is the behaviour they already have; `ADR-INFOSCHEMATICS-011` is unamended.

### Verification

`bun run test --filter=@infoschematics/view-model` — PASS. 18 test files, 228 tests, including `src/appearance.test.ts` and `src/code-badge.test.ts`.

`bun run test --filter=@infoschematics/domain-model` — PASS. 3 test files, 9 tests.

`bun run self:scripts:test` — 21 of 22 files pass, 123 of 124 tests. One failure, and it is not this work: `scripts/example-capability-coverage.test.ts > shows every property the contract declares` expects `['sequences.scenes.cues.stage']` to equal `[]`. `cues.stage` is an uncommitted contract property another writer is adding in the same checkout for `INFOSCHEMATICS-TOOL-119`, and no example authors it yet. Everything this change had to satisfy is in the 21 that pass: `scripts/vocabulary-citations.test.ts`, which walks `apps/site/content/**`, and `scripts/specification-evidence.test.ts`, which reads every amended `_Verify:_` and `_Evidence:_` line and opens what they cite.

`bun run ki:lint:md` — PASS. No issues found in 117 files.

`ki repo audit --skill ki-work-roadmap --repo .` — PASS.

`bun run self:check` was deliberately not run: the coordinator owns the aggregate gate for this batch.

The record's plan-time Verify also asked for a rendered pair with the block on and off, per `AGENTS.md`. Not run, and not applicable: no rendering changed. The decision names behaviour the renderers already had, and the three edited files are a specification, a guide sentence, and a doc comment.

### Outstanding concerns

Two.

- `examples/is-showcase/infoschematic.yaml` authors `appearance.identity: false` beside `card.identity: true` — the only published document that exercises the coarse and the narrow statement together. Under `APPEAR-018` that resolves to "Cards draw their codes and nothing else does", which is a reasonable thing for a showcase to demonstrate and is probably deliberate, but nobody has confirmed the showcase means to demonstrate it. The file is unchanged here and nothing waits on the answer; it is named because `APPEAR-018`'s precedence rule has exactly one document standing behind it, and if that pairing is accidental then the rule has none.
- `INFOSCHEMATICS-TOOL-129` is still `status: draft` and would move `diagram.appearance` for colour. This record's Dependencies section warned that taking the two out of order risked migrating the same four documents twice. That concern is now moot: nothing moved here and no document changed, so `INFOSCHEMATICS-TOOL-129` inherits no migration debt and the ordering between them no longer matters.

### Post-change review

The goal is met. The record asked whether the four switches are appearance at all or a disclosure policy belonging elsewhere, and the answer is that three of them are a disclosure policy which stays where it is with its meaning stated, while the fourth is treatment and was never the same question.

The judgement a reviewer should test is the refusal to move the block. The case for it is that a ceiling stated in the contract answers everything the move was meant to answer, and a rename answers nothing further — the meaning does not live in the parent property. The case against is that `diagram.appearance` now holds two kinds of statement, one about treatment and three about disclosure, which is precisely the untidiness that raised the record. That untidiness is real and is now documented rather than removed, which is the trade taken: a compatibility path, a regenerated schema and four migrated documents is a high price for a tidier name, and it would have to be paid again if `INFOSCHEMATICS-TOOL-129` moves the same parent for colour.

Scope held. Nothing outside the four files changed, and the four steps that rested on false claims were corrected in the record rather than executed. Regression risk is as low as it goes: one doc comment, two specification paragraphs, one sentence of guidance, and no behaviour touched — which is the point, because the behaviour was already right and only unnamed.

### Mini recap

Delivered: an authored Card disclosure value is a ceiling, named in `APPEAR-016`, in `CardDetailDefaults` and on the site, with `APPEAR-018`'s pinned code as the floor beneath it and Card compactness excluded as treatment. Nothing moved, nothing was retired, no document migrated, and `ADR-INFOSCHEMATICS-011` needed no amendment.

Verified by both package suites, the repository script suite bar one failure belonging to another writer's in-flight work, the markdown lint, and the roadmap audit.

Concerns: whether `examples/is-showcase` means its coarse-beside-narrow pairing, and `INFOSCHEMATICS-TOOL-129`'s double-migration worry, now moot.

Learning route, proposed rather than promoted: a decision the code has already made twice still needs its word written down before a dependent record can be planned on it, and re-grounding a shaped record against the code before implementing is what catches the steps whose premise has dissolved. Both are general delivery lessons rather than Infoschematics facts, so they belong in the harness rather than in any document here.

## Done

Accepted 2026-09-25 by Kris Brown on the review packet above.

## Discussion

Raised on 2026-09-22 while reshaping `INFOSCHEMATICS-TOOL-129` around theme and style, from the owner's observation that this block may belong in some other part of the configuration. It is deliberately kept out of that record: the colour model is a coherent change with a decided shape, and folding an unsettled question into it would hold the settled part open.

Worth deciding before `INFOSCHEMATICS-TOOL-114` is planned in detail, and worth doing after `INFOSCHEMATICS-TOOL-129`, which will have moved `diagram.appearance` already.

### Adoption

Adopted into Next on 2026-09-23 at the owner's explicit direction, moved from Triage. Shaping it surfaced that the question is narrower than it looked: the layering already exists in `appearance.ts` and in the responsive resolver, and what is missing is a decision about what an authored value means within it.
