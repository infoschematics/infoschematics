---
id: ADR-INFOSCHEMATICS-042
title: A creation reaches the document by one route
date: 2026-09-22
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-032, ADR-INFOSCHEMATICS-036]
---

# ADR-INFOSCHEMATICS-042: A creation reaches the document by one route

## Context

[Studio](../reference/vocabulary.md#design) made an element two ways, and only one of them was making anything.

The Library and the artefact factories build a domain-shaped value and one `CreateArtefactOperation`. That operation joins `artefactOperations`, `projectStudioDocumentOperations` turns it into a document edit, and the host is told. The [Card](../reference/vocabulary.md#standard-card) and [Adapter](../reference/vocabulary.md#adapter-card) buttons did something else: `editor.createCard` wrote into a `cards` draft map, which the overlay drew and the change pane accounted for and the projection never read, because the projection is handed `artefactOperations` alone. A [Producer](../reference/vocabulary.md#producer) pressing the button saw a Card appear, saw the change pane count it, and the document never heard about it.

Two paths is not by itself a defect — a draft the host has not been told about is a coherent thing for an editor to hold, and the second path may have been reaching for that. What made it one is that nothing said which it was, so the two diverged on everything else as well. `INFOSCHEMATICS-TOOL-104` (a made Card answering to two names) and `-105` (a creation the document could take) were defects in the operation path; `-106` was a defect in the draft path. Neither pair could have been found from the other, and each was fixed without anyone looking at the other path, because there was no statement saying the two were supposed to agree.

[`ADR-INFOSCHEMATICS-032`](ADR-INFOSCHEMATICS-032-a-point-is-created-from-the-library.md) settled the same question once, for one kind: a [Point](../reference/vocabulary.md#point) is created from the Library, and the reason given was about identity — a Point is coded and Scoped, so it belongs on the path that allocates a code and applies the current [Scope](../reference/vocabulary.md#scope). That reasoning generalises and was never generalised. A Card is coded and Scoped too.

## Decision

**Every creation in Studio reaches the document as a create operation.** There is one route: a domain-shaped value and a `CreateArtefactOperation` at a stated index, projected by `projectStudioDocumentOperations`. The Library, the artefact factories and the element controls are three surfaces onto that one route, and none of them holds a creation of its own.

The `cards` draft map is therefore retired rather than re-pointed. It was not a considered second kind of state; it was the create path that predated the operations and never joined them, and keeping it would mean stating a purpose for it that nothing in the product wants.

Two things the draft path had to itself become shared, because a route only converges if the decisions on it do:

- **Where a creation lands.** `nextArtefactIndex` in `packages/view-studio/src/app/editor/artefact-operations.ts` is the single expression of "after everything authored and everything already created". Two Cards made in a row cannot land on each other, and no surface can disagree with another about the end of the document, because there is only one place that computes it.
- **What an [Adapter](../reference/vocabulary.md#adapter-card) starts as.** [`ADR-INFOSCHEMATICS-036`](ADR-INFOSCHEMATICS-036-an-adapter-is-positioned-by-what-it-holds.md) says an Adapter is drawn at the Card it clasps rather than at its own authored box, so the box a creation writes is a legal starting value and nothing more. The control seeds it from the held Card's current box for exactly that reason, and the drawing does not depend on it.

The surfaces keep what is genuinely theirs. The element controls still decide the Scope, the prefix, the next free code and the room a new Card is given, because those are questions about what a Producer just did; they express the answer as a `CardConfig`, and hand it to the one route.

## Consequences

A Studio with no `onDocumentChange` no longer draws a Card made from the control. That is a real loss and it is accepted: it was already true of every other kind, including the Library's own Cards, so the alternative was not "keep it working" but "keep one kind working by a mechanism nothing else uses". A host that wants to see edits subscribes to them.

A defect in creation is now one defect. `INFOSCHEMATICS-TOOL-104`, `-105` and `-106` would each have been found from either surface, and the browser case added with this record asserts the property directly: a Card made from the control appears in the document the host holds, carries a code issued from the document's own register, and leaves again on undo.

The change pane gets simpler and more honest. It previously had a `map: 'cards'` origin listing creations that were not going anywhere; every creation it now lists is one the document will receive.

Persisted drafts are affected. A stored draft holding a `cards` map is ignored by `normaliseEditorDraft` rather than migrated — those entries described creations that never reached a document, so there is nothing to carry forward, and the Producer sees the document they actually have.

`EDIT-023` and `EDIT-024` in [the Design editing specification](../specs/design-editing.md) carry the rule, so a reader arriving at either the offering of a creation or the identity it is given meets it without reading this record.
