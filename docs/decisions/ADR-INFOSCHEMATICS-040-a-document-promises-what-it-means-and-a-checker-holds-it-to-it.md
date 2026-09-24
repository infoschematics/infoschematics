---
id: ADR-INFOSCHEMATICS-040
title: A document promises what it means and a checker holds it to it
date: 2026-09-24
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [PDR-INFOSCHEMATICS-001, ADR-INFOSCHEMATICS-015, ADR-INFOSCHEMATICS-036]
---

# ADR-INFOSCHEMATICS-040: A document promises what it means and a checker holds it to it

## Context

[ADR-INFOSCHEMATICS-036](ADR-INFOSCHEMATICS-036-a-checker-measures-a-drawing-and-never-repairs-it.md) gave the repository a checker that measures a drawing: it says two [Cards](../reference/vocabulary.md#standard-card) overlap, a route crosses the artefact it leaves, a label sits off its route. Every one of those rules is the checker's own judgement about geometry nobody stated, and the checker can reach it because the document contains the coordinates.

There is a second class of wrongness it cannot reach at all. An [Infoschematic](../reference/vocabulary.md#infoschematic) is drawn to make one reading obvious — material enters here, passes through these stages, leaves there — and six months later somebody deletes a [Flow](../reference/vocabulary.md#flow), or reverses an endpoint, or adds an artefact that starts a story of its own. The geometry is still impeccable. The drawing review is still clean. The reading the document existed for is gone, and nothing in the repository noticed, because nothing in the repository was ever told what the reading was.

Telling it is the whole problem. A checker cannot infer that a particular path matters; a path either exists or it does not, and every document has hundreds of them. Only the author knows which ones the document is about. So the question is not how to detect a broken reading — that is a graph walk — but where the author's statement of the reading is allowed to live, what it may be written over, and what a checker is entitled to do when it no longer holds.

Three decisions had to be taken together, because each one is only defensible in the light of the other two.

## Decision

### A promise is authored data inside the definition, and it is optional

What a document promises about its own meaning is authored **inside the document**, as an optional `promises` list beside `diagram`, `scopes`, `sequences` and `specifications`.

The tempting alternative is the overlay precedent of [ADR-INFOSCHEMATICS-015](ADR-INFOSCHEMATICS-015-specifications-own-realisations.md), which keeps realisation claims out of the Diagram and beside it. That precedent does not transfer, and the reason is worth stating precisely rather than treating as a matter of taste. A realisation claim is a fact about the world **outside** the document: which component satisfies which specification, which is knowledge the document neither contains nor can check, and which properly belongs to whoever owns that world. A promise is a claim about the document's **own** meaning — it can be checked against nothing but the Flows already written down, and it is false the moment the document changes. An artefact that travels separately from the thing it describes is exactly the artefact that gets left behind, and being left behind is precisely the failure a promise exists to prevent. A promise kept beside the document would go stale in the one situation it was written for.

It is optional in every document, and a document that declares nothing stays exactly as valid as it was before promises existed. This is asserted rather than assumed: the load-time and review-time cases both hold a silent document to the behaviour it had before.

The cost is stated plainly, as [PDR-INFOSCHEMATICS-001](PDR-INFOSCHEMATICS-001-an-infoschematic-is-an-authored-definition-not-a-drawing.md) requires of anything that widens what an author may write. The contract grows in three places: the Domain Model type, the Domain Core schema and its published JSON Schema, and the checker. It grows in no others, and this is the load-bearing half of the trade — **no renderer consumes a promise**. It changes what a checker may refuse. It never changes what an outlet has to draw, what a host has to bind, or what a reader sees on the page.

### A promise may be written over artefact codes and over Scopes, and neither is forced

Every end of a promise — the `allowed` set of an origin or a terminus, the `from` and `to` of a relationship or a path — is a list of names, and a name may be an artefact code or the id of an [Architectural Scope](../reference/vocabulary.md#scope). A Scope stands for the artefacts it covers.

The difference is real and the author is left to choose it, because the right answer depends on what they mean. A promise written over a Scope survives an edit that a promise written over one named component does not: replace the component inside the boundary and the Scope-written promise still holds, because the boundary is what the author was talking about. A promise written over that component's code breaks, which is correct when the author meant _this component_ and not _whatever sits here_. Forcing either would make the vocabulary say something the author did not: forcing Scopes would silently loosen every promise about a specific thing, and forcing codes would make every promise about a boundary re-break on each refactor inside it.

A name that resolves to neither an artefact nor a Scope is refused at load, and so is a name that resolves to a [Region](../reference/vocabulary.md#region) or an Overlay, which are drawn rather than met: no reading is ever traced through one, so a promise over one could never hold. Refusing it once at load is better than reporting it as a broken promise for the rest of the document's life.

### A broken promise is an error, and never an observation

ADR-INFOSCHEMATICS-036 split severity deliberately, and the split still stands for drawings. An **observation** exists there because a drawing finding is the checker's own judgement about geometry the author never stated: a cramped document is not a wrong one, a `labelAt` in the wrong unit still reads, and a checker that refused those is a checker people learn to skip. The author is entitled to disagree, so the severity leaves them room to.

A promise inverts that entirely. It is the author's own assertion about their own document, made in their own words, in the document itself. There is nobody left to disagree with. A finding that said "you promised this reading, the document no longer keeps it, and this need not block anything" would make declaring something a decorative act — and a declaration nothing enforces is worse than none, because it reads like a guarantee. So every promise finding is an error, and the promise gate fails on any finding at all.

The repair list keeps that honest. Every promise finding offers withdrawing the promise as one of its legal repairs, alongside restoring the reading. The document is allowed to change its mind; what it is not allowed to do is change its mind silently.

### The rule codes are a sibling series, not members of `DrawingRuleCode`

`DrawingRuleCode` is public contract about a _drawing_, and its own documentation says so: an agent's repair loop, a pipeline's allowlist and Studio's messages all key off those strings, and every one of them is a measurement of geometry. Folding `promise-path-broken` into that union would quietly change what the older name means for everything already reading it — a pipeline allowlisting drawing findings would start allowlisting broken promises it never agreed to accept.

So `PromiseRuleCode` is a separate union with a separate review function and a separate gate, sharing the _finding shape_ exactly: rule, concerns, measured, reads, repairs, severity. Sharing the shape is what makes a broken promise read like a geometric finding to every consumer that formats or ranks findings, without pretending it is one. A caller that wants both asks for both.

The graph traversal a path promise needs did not exist here. `routing.ts` computes the polyline a Flow is drawn along and answers nothing about what reaches what, so a breadth-first walk over an explicit queue was written for this — explicit rather than recursive because a document may describe a cycle and a naive descent would never come back out of one. It lives beside the rules that ask the question rather than as its own published module: it has exactly one consumer today, and a published export nothing imports is contract bought without a reader.

## Consequences

An author gains a way to say what their document is for, and a pipeline gains a gate that fails when an edit takes that away. This is the first check in the repository that can fail on a document whose geometry is perfect, which is the point: it is the first check told what the document means.

The Domain Model, the Domain Core schema and the published JSON Schema all widen, and the showcase example now authors one promise of every kind so the capability-coverage gate keeps seeing them. The checker grows a second review surface, a second rule series and a second gate helper, and a caller wanting both answers asks for both — which is deliberate, because a single merged list would hide the severity distinction that the two surfaces exist to keep apart.

A promise is only as good as the reading its author described, and nothing here checks that the promise is the right one. A document may declare a path that was never the point and pass forever. That is the same limitation every specification has and is not one a checker can close; what it can do, and does, is refuse to let a stated intention decay in silence.

The word "promise" is used here as plain English rather than as a canonical product concept, because the [vocabulary reference](../reference/vocabulary.md) does not yet carry a term for it. It should, and until it does, prose about promises cannot cite a stable id the way prose about a Card or a Scope can.
