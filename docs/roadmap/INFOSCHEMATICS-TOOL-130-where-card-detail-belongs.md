---
id: INFOSCHEMATICS-TOOL-130
area: TOOL
title: Where Card detail belongs
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T19:15:00Z
updated_at: 2026-09-22T19:15:00Z
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

## Discussion

Raised on 2026-09-22 while reshaping `INFOSCHEMATICS-TOOL-129` around theme and style, from the owner's observation that this block may belong in some other part of the configuration. It is deliberately kept out of that record: the colour model is a coherent change with a decided shape, and folding an unsettled question into it would hold the settled part open.

Worth deciding before `INFOSCHEMATICS-TOOL-114` is planned in detail, and worth doing after `INFOSCHEMATICS-TOOL-129`, which will have moved `diagram.appearance` already.
