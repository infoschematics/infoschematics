---
id: ADR-INFOSCHEMATICS-042
title: Share the measurement, never the rule
date: 2026-09-25
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-036]
---

# ADR-INFOSCHEMATICS-042: Share the measurement, never the rule

## Context

[ADR-INFOSCHEMATICS-036](ADR-INFOSCHEMATICS-036-a-checker-measures-a-drawing-and-never-repairs-it.md) gave the repository a checker that measures a drawing and never repairs it: it reports that two artefacts are drawn over each other, and it neither moves either of them nor decides which should move. One of its rules, `artefacts-overlap`, computes how far two boxes intersect and reports the finding in diagram units.

`INFOSCHEMATICS-TOOL-125` needed the same arithmetic somewhere else. A new [Card](../reference/vocabulary.md#standard-card) made in [Design](../reference/vocabulary.md#design) was placed at the centre of the view box, consulting nothing already drawn, so making one in the Playground put it squarely over the Message bus [Fabric](../reference/vocabulary.md#fabric) and the [Producer's](../reference/vocabulary.md#producer) first gesture was to drag it off something rather than to place it. Giving the placement a search over candidate positions means asking, for each candidate, whether it is clear — which is the question `artefacts-overlap` already answers.

That put a boundary question in the way, and it is close enough to ADR-INFOSCHEMATICS-036 to state rather than assume: may an editing surface consume the checker at all? An editor that reads a checker's findings and acts on them looks like the checker acquiring authority over the document by proxy, which is the thing that record forbids.

## Decision

The overlap **measurement** is exported from View Model and shared. The overlap **rule** is not.

The measurement is `measuredOverlap` in `packages/view-model/src/diagnostics.ts` — two boxes in, the shared width, height and area out, or nothing when they miss or only touch. It was module-private; promoting it to a documented export was the whole change.

The distinction that makes this safe is what ADR-INFOSCHEMATICS-036 was actually protecting. A checker's restraint is about **authority over the document**: it must not move an artefact, and it must not choose which repair an author takes. It is not custody of geometry. An editor asking "do these two boxes overlap?" is asking a question about arithmetic, not asking the checker to move anything; nothing is repaired, and the answer is a number rather than an instruction. So consuming the measurement takes nothing from the checker's restraint.

The rule is a different object and stays where it is. `artefacts-overlap` carries a **judgement** about when a drawing has become unreadable, and that judgement has deliberate exemptions: an [Adapter](../reference/vocabulary.md#adapter-card) over the Card it clasps is excused because [ADR-INFOSCHEMATICS-032](ADR-INFOSCHEMATICS-032-an-adapter-card-is-positioned-by-what-it-holds.md) draws it there, and anything over a Fabric is excused because a Fabric is a place things sit on. A creation surface wants the opposite conclusion from the very same number. A new Card landing on the Message bus is precisely the case the rule excuses and the placement search must not, because that is the landing the item was raised about. Two callers, one measurement, two conclusions — and the conclusion is the caller's, not the measurement's.

The alternative was a second copy of the intersection arithmetic inside the editor. It is four lines, which is exactly why it is tempting and exactly why it drifts: a fix to one copy leaves the other reporting a different answer for the same two boxes, and nothing fails. `AGENTS.md` names that silent drift as the cost worth avoiding. The other alternative — having the editor call `reviewInfoschematicDrawing` and read `artefacts-overlap` findings — is the one genuinely ruled out, because it would take the rule's exemptions along with the measurement and place the Card on the Fabric again.

## Consequences

View Model gains one more published export from `diagnostics`, and it is documented at the export with why the rule and the search take the same measurement to different conclusions — the reasoning has to live where the next caller will read it, because the mistake this record prevents is a caller reaching for `artefacts-overlap` instead.

An editing surface may now ask View Model geometric questions without a further decision each time. The line it may not cross is stated: it takes measurements and reaches its own conclusion; it does not take a rule's verdict, and it does not act on a checker's repairs. A checker still never moves anything, because an editor moving something on its own judgement is the editor's act.

This is narrower than "editors may consume diagnostics". A finding is a judgement with a severity and a repair list attached, and consuming one is how a surface starts quietly enacting repairs it did not choose. A measurement has nothing attached, which is the property being relied on here.

Studio's placement search now shares its definition of overlap with the checker's, so a Card the placement believes is clear is one the checker agrees is clear — apart from the cases the rule excuses on purpose, which is the intended difference rather than an inconsistency. The search measures boxes only: a [Flow](../reference/vocabulary.md#flow) route is a path rather than a place, and a candidate position is not tested against one.
