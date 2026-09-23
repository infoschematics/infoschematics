---
id: INFOSCHEMATICS-TOOL-116
area: TOOL
title: Promises a document holds
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-21T19:30:00Z
updated_at: 2026-09-22T19:40:00Z
---

# Promises a document holds

## Goal

An [Infoschematic](../reference/vocabulary.md#infoschematic) may state the readings it intends to support — where a flow starts, where it must end, which relationships must exist, which paths must remain traceable — and a checker holds that promise.

## Context

An Infoschematic explains a system, and the explanation is the point: that a request reaches the database through the gateway, that nothing bypasses the queue, that every ingress terminates somewhere. Today those readings live only in the author's head. The schema holds the shape of the document and nothing holds its meaning, so an edit made months later can silently break the very reading the diagram was drawn to support, and every check will still pass.

`ADR-INFOSCHEMATICS-030` already establishes that a cross-feature composition is stated as its own requirement rather than as a clause inside a newer feature, which is the same instinct applied to the repository's own specifications: a promise that is not stated somewhere durable is not held.

The comparison that raised it is Archify's author-declared semantic checks, recorded in [the related-tools reference](../decisions/references/related-tools.md): a document may declare allowed roots, allowed terminals, required edges, and required paths, and the compiler enforces them.

## Boundary

Builds on [the drawing diagnostics](../specs/diagnostics.md), because a declared check is worth nothing without a surface that reports its failure with a subject and evidence. It is captured separately because it is a change to what a definition may carry, where the diagnostics surface is only a report about one.

It does not make any declaration mandatory: a document that declares nothing stays valid, and this never becomes a second modelling language the author has to satisfy before drawing.

## Current state

Nothing holds a document's meaning. `packages/domain-core/schema/infoschematic.schema.json` holds its shape, and `docs/specs/composition.md` holds the repository's own cross-feature requirements, but a definition cannot say what a reader must be able to trace through it, so no check can notice when an edit breaks that.

The identities a promise would be written over are already stable: `ADR-INFOSCHEMATICS-003` authors human-readable codes rather than deriving them from order, and Scopes are named in the document. `packages/view-model/src/routing.ts` resolves the Flows that a required path would be traced through, so the graph a promise talks about is already derived.

`ADR-INFOSCHEMATICS-015` is the precedent for keeping an optional claim beside the model rather than inside it, and it is the alternative this item has to weigh against declarations that travel with the document.

## Steps

- [ ] Take the decision on where a declaration lives — inside the definition or beside it — and record it with the contract cost that choice carries for every outlet.
- [ ] Define the declaration vocabulary: where a flow may start, where it must end, which relationships must exist, and which paths must remain traceable.
- [ ] Decide and state whether a promise is written over artefact codes, over Scopes, or both, and say why a promise about a boundary survives an edit that a promise about one component does not.
- [ ] Validate the declaration's shape in Domain Core, keeping a document that declares nothing exactly as valid as it is today.
- [ ] Implement the checks as rules in the delivered checker, so a broken promise is reported with the same code, subject and evidence as a geometric finding.
- [ ] State each check as a requirement in a specification, and add an example document that declares a promise and a test that breaks it.

## Files touched

`packages/domain-model` and `packages/domain-core` for the declaration and its validation; `packages/view-model/src/diagnostics.ts` for the rules; `docs/specs/` for the requirements; an example under `examples/`; a new Decision Record.

## Verify

`bun run self:check`. A document declaring a promise that holds passes; the same document with one Flow removed fails with the promise's own rule code and names the declaration that broke. A document that declares nothing is unaffected, asserted rather than assumed.

## Dependencies / blocks

Nothing blocks it any longer. The reporting surface a declared check needs is delivered under [the drawing diagnostics](../specs/diagnostics.md) and [ADR-INFOSCHEMATICS-036](../decisions/ADR-INFOSCHEMATICS-036-a-checker-measures-a-drawing-and-never-repairs-it.md). It blocks nothing.

## Documentation impact

### Decision Records

A new record deciding whether a declaration is authored data or a document beside the definition, what it may say, what identities it may say it over, and whether a broken promise is an error or an observation.

### Specifications

`docs/specs/diagnostics.md` gains the declared-check requirements; `docs/specs/authoring.md` states that declarations are optional and that a silent document stays valid.

### Guides

The authoring guide gains a short section on declaring what a diagram must keep true, aimed at the author who will not be the one maintaining it.

### Roadmap

Consumes the delivered drawing diagnostics. Nothing further follows unless declarations turn out to want their own editing surface in Studio, which would be its own record.

## Discussion

Captured on 2026-09-21 from the Archify comparison.

The question that decides the size of this is whether declarations are authored data or authored documentation. As data inside the definition they travel with the document into every outlet and can be checked in a pipeline, but they enlarge the contract every package and both renderers consume, and `PDR-INFOSCHEMATICS-001` makes that a deliberate cost. As a separate artefact beside the document — closer to how `ADR-INFOSCHEMATICS-015` keeps realisation claims in an optional overlay — they stay out of the model that every outlet must understand, at the cost of being easier to leave behind.

Also worth settling: whether a declaration is expressed over artefact identities or over Scopes, since a promise about a named component is brittle in a way a promise about a boundary is not; and whether a broken promise is an error or an observation, which is the same distinction the drawing diagnostics had to draw.

### Adoption

Adopted for immediate work on 2026-09-21, behind the diagnostics surface, which has since been delivered. The data-or-overlay question is taken as part of delivery and recorded as a decision, because it is the one choice here that enlarges what every outlet consumes.
