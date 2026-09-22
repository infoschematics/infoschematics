---
id: INFOSCHEMATICS-TOOL-130
area: TOOL
title: Where Card detail belongs
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T19:15:00Z
updated_at: 2026-09-23T09:05:00Z
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

The four switches are not a flat authored setting. `packages/view-model/src/appearance.ts:55-60` resolves each one down a cascade: an `output` policy first, then `appearance.card`, then — for identity alone — the coarser `appearance.identity`, then a built-in default. So an output-detail policy that overrides authored intent already exists, which is what `ADR-INFOSCHEMATICS-011` separates, and the authored block sits in the middle of it.

`appearance.identity` is therefore not a duplicate of `card.identity` but a fallback beneath it, and nothing states that relationship outside the one expression that implements it.

Static output already varies the answer by size. `packages/render-svg/src/index.ts:579` calls `resolveResponsiveCardTreatment(viewBox, options.responsiveCardDetails, …)`, so a rendered document can disclose differently at different dimensions while the interactive Diagram cannot. That is half of what `INFOSCHEMATICS-TOOL-114` wants, built and unnamed.

Every published document authors the block and they disagree: `is-blank` turns all four off, `is-showcase` turns three on, `is-infoschematics` and `is-system` sit between.

## Steps

- [ ] Establish what each of the four actually changes at render time, in both outlets, rather than from the property names. `compact` in particular reaches `packages/render-svg/src/index.ts:1292` and may be a layout decision rather than a disclosure one, in which case it does not travel with the other three.
- [ ] Decide what an authored value means against the policy above it: a fixed answer, an initial default, or a ceiling no magnification may exceed. This is the decision the record exists for, and `INFOSCHEMATICS-TOOL-114` cannot be planned without it.
- [ ] Name the existing cascade in the contract, so the `output` layer, the authored block and the coarse `appearance.identity` fallback are a stated model rather than one expression in `appearance.ts`.
- [ ] Move the block to whatever that makes it, carrying the old location through `packages/view-model/src/compatibility.ts` so existing documents keep working.
- [ ] Resolve `appearance.identity` — keep it as the documented coarse form or retire it into the block — and stop it being two spellings of one answer.
- [ ] Migrate the four documents that author the block.
- [ ] Take `resolveResponsiveCardTreatment` into the decision rather than leaving it as an outlet-only behaviour, since it is already an answer to the question and only static output has it.

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

## Discussion

Raised on 2026-09-22 while reshaping `INFOSCHEMATICS-TOOL-129` around theme and style, from the owner's observation that this block may belong in some other part of the configuration. It is deliberately kept out of that record: the colour model is a coherent change with a decided shape, and folding an unsettled question into it would hold the settled part open.

Worth deciding before `INFOSCHEMATICS-TOOL-114` is planned in detail, and worth doing after `INFOSCHEMATICS-TOOL-129`, which will have moved `diagram.appearance` already.

### Adoption

Adopted into Next on 2026-09-23 at the owner's explicit direction, moved from Triage. Shaping it surfaced that the question is narrower than it looked: the layering already exists in `appearance.ts` and in the responsive resolver, and what is missing is a decision about what an authored value means within it.
