---
id: INFOSCHEMATICS-TOOL-116
area: TOOL
title: Promises a document holds
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 1319bd1e18fe2f6600eb4b5484fa8b10255e7fe7
created_at: 2026-09-21T19:30:00Z
updated_at: 2026-09-24T22:49:00Z
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

The identities a promise would be written over are already stable: `ADR-INFOSCHEMATICS-003` authors human-readable codes rather than deriving them from order, and Scopes are named in the document. The graph a promise talks about is not derived anywhere, though: `packages/view-model/src/routing.ts` computes the polyline a Flow is drawn along and answers nothing about what reaches what, and no other module in the repository walks Flows at all. A path promise needs a traversal that does not exist yet, and this item has to write one.

`ADR-INFOSCHEMATICS-015` is the precedent for keeping an optional claim beside the model rather than inside it, and it is the alternative this item has to weigh against declarations that travel with the document.

## Steps

- [x] Take the decision on where a declaration lives — inside the definition or beside it — and record it with the contract cost that choice carries for every outlet.
- [x] Define the declaration vocabulary: where a flow may start, where it must end, which relationships must exist, and which paths must remain traceable.
- [x] Decide and state whether a promise is written over artefact codes, over Scopes, or both, and say why a promise about a boundary survives an edit that a promise about one component does not.
- [x] Validate the declaration's shape in Domain Core, keeping a document that declares nothing exactly as valid as it is today.
- [x] Implement the checks as rules in the delivered checker, so a broken promise is reported with the same code, subject and evidence as a geometric finding. The `infoschematics check` outlet that would print them is owned by `INFOSCHEMATICS-TOOL-114`, live in `packages/cli/` while this landed; surfacing promise findings through the command is handed to whoever holds that package next, carried below.
- [x] State each check as a requirement in a specification, and add an example document that declares a promise and a test that breaks it.

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

## Review

### Delivered

Delivered against the approved boundary: `packages/domain-model/src/model.ts`, everything under `packages/domain-core/`, `packages/view-model/src/diagnostics.ts` and its test, `docs/specs/diagnostics.md`, `docs/specs/authoring.md`, `apps/site/content/authoring.md`, `examples/`, and a new `ADR-INFOSCHEMATICS-040`. Explicitly excluded and untouched: `packages/cli/`, `packages/view-canvas/`, `packages/render-svg/`, `packages/view-model/src/detail.ts`, `docs/decisions/README.md`, and `docs/reference/vocabulary.md`. Baseline `1319bd1e18fe2f6600eb4b5484fa8b10255e7fe7`.

An [Infoschematic](../reference/vocabulary.md#infoschematic) may now declare, inside its own definition, the readings it is for: where a reading may begin, where it must end, which relationship must exist directly, and which run of Flows must stay traceable. A checker holds it to each one and names the promise that broke. The resulting evidence is a showcase document carrying one promise of every kind and reporting nothing, the same pipeline with one Flow removed reporting all four rules, and a document that declares nothing proved unchanged rather than assumed to be.

### Change Summary

`packages/domain-model/src/model.ts` gains `DocumentPromise` — a discriminated union of `origin`, `terminus`, `relationship` and `path` over a shared identity — and an optional `promises` on `Infoschematic`, made total on `DefinedInfoschematic`. `packages/domain-core/src/schema.ts` mirrors it as a strict discriminated union whose ends are non-empty, sorted, de-duplicated identifier lists; `packages/domain-core/src/model.ts` defaults `promises` to an empty list and refuses a duplicate id or an end naming neither an artefact nor a Scope; `packages/domain-core/src/serialise.ts` places `promises` and its fields in canonical order; `packages/domain-core/schema/infoschematic.schema.json` is regenerated rather than hand-edited. `packages/view-model/src/diagnostics.ts` gains `PromiseRuleCode`, `PromiseFinding`, `reviewInfoschematicPromises`, `promisesAreBroken`, and the breadth-first Flow traversal the repository did not have. `examples/is-showcase/infoschematic.yaml` authors one promise of every kind, with `examples/is-showcase/src/infoschematic.ts` regenerated from it. `docs/specs/diagnostics.md` gains DRAW-014 to DRAW-018 under a new `## Declared readings` section; `docs/specs/authoring.md` gains AUTHOR-018; `apps/site/content/authoring.md` gains "Declare what the diagram must keep true".

Three material decisions are recorded in [ADR-INFOSCHEMATICS-040](../decisions/ADR-INFOSCHEMATICS-040-a-document-promises-what-it-means-and-a-checker-holds-it-to-it.md). A promise is authored data inside the definition and optional, because [ADR-INFOSCHEMATICS-015](../decisions/ADR-INFOSCHEMATICS-015-specifications-own-realisations.md)'s overlay precedent covers claims about the world outside the document while a promise is a claim about the document's own meaning, and the artefact that travels separately is the one that gets left behind. A promise may be written over artefact codes and over Scopes alike, neither forced, because a Scope-written promise survives an edit a code-written one does not and both are sometimes what the author means. A broken promise is always an error, never an observation, because the `DrawingSeverity` split exists to leave room to disagree with the checker's own judgement and there is nobody left to disagree with an author's assertion about their own document.

One deviation from the stated plan, recorded in the ADR rather than taken silently: the new rule codes are a sibling `PromiseRuleCode` union with their own review function and gate rather than members of `DrawingRuleCode`, because that union's own documentation makes it public contract about a drawing and a promise is not a fact about geometry. The two share the finding shape exactly, so a broken promise reads like a geometric finding to anything that formats or ranks findings.

### Verification

`bunx turbo run typecheck test --filter=@infoschematics/domain-model --filter=@infoschematics/domain-core --filter=@infoschematics/view-model --force` — 6 tasks successful; domain-model 9 tests, domain-core 66 tests, view-model 245 tests, all passing.

`bunx turbo run //#self:scripts:test --force` — 1 task successful; 22 test files, 125 tests passing, including `scripts/example-capability-coverage.test.ts`, which derives its list from the live schema and would have turned red had the showcase not authored every new property path.

`bun run ki:lint:md` — "Success: No issues found in 119 files".

The item's own acceptance was run directly: a document declaring a promise of each kind reports nothing; removing one Flow from the middle of it reports `promise-origin-not-allowed`, `promise-path-broken`, `promise-relationship-missing` and `promise-terminus-not-allowed`, each naming the promise id that broke; and a document that declares nothing is asserted — not assumed — to produce an empty promise list, an unchanged drawing review, and an open gate.

`bun run self:check` was deliberately not run. It is repo-wide and `INFOSCHEMATICS-TOOL-114` was live in the same working tree throughout, so a repo-wide gate would have measured another item's half-finished state rather than this one's.

### Outstanding concerns

The `infoschematics check` command does not print promise findings. `packages/cli/src/index.ts` calls `reviewInfoschematicDrawing` only, and the CLI package was owned by `INFOSCHEMATICS-TOOL-114` for the duration of this work. Adding a second call to `reviewInfoschematicPromises`, gating on `promisesAreBroken`, and extending `DRAW-011`'s prose-and-JSON parity to promise findings is handed to whoever next holds `packages/cli/`, and wants its own record if it is not picked up alongside TOOL-114.

There is no canonical vocabulary term for a promise. `docs/reference/vocabulary.md` was outside this item's boundary, so the word is used as plain English throughout and no prose about promises can cite a stable id the way prose about a Card or a Scope does. The ADR says so in its own consequences. Adding the term is a small, separate change to the vocabulary reference and its drift check.

The promise requirements are numbered in the `DRAW` series in `docs/specs/diagnostics.md`, which is titled for drawings. A dedicated prefix would be truer to what they measure, but the prefix registry lives in `docs/specs/index.md`, outside this boundary, and a requirement id is a stable citation that should not be renamed casually.

Nothing checks that a declared promise is the _right_ promise. A document may promise a path that was never the point and pass forever. That is a limitation of every specification and not one a checker can close.

### Post-change review

Against the goal, the change does what the Goal states: a document may state the readings it intends to support and a checker holds it to them. Every element of the Goal's list — where a flow starts, where it must end, which relationships must exist, which paths must remain traceable — has a kind, a rule, a requirement and a test.

Against the Boundary, the item's own constraint held: no declaration is mandatory, a document that declares nothing stays valid, and this did not become a second modelling language. The Boundary's other half — that it is a change to what a definition may carry rather than to the reporting surface — is why the contract widened in Domain Model, Domain Core and the checker and nowhere else. No renderer consumes a promise.

Regression risk is low and concentrated in one place. The contract change is purely additive and optional at every level: an absent `promises` key normalises to an empty list, the drawing review is untouched, and no renderer reads the new field. The one place a regression could hide is serialisation order, and the generated example module and the format-parity check both round-trip the showcase through it. The `Current state` claim that `routing.ts` already derived the graph was wrong and is corrected in place, so the record no longer misleads the next reader about what exists.

Acceptance readiness: the six Steps are complete, with Step 5 reworded to name the hand-over it could not perform. Every gate that could legitimately be run in a shared tree was run and passed. A reviewer should look hardest at the sibling-union decision, since it is the one place this deviates from the obvious reading of the Steps, and at whether the four kinds are the right four rather than merely the four Archify has.

### Mini recap

`INFOSCHEMATICS-TOOL-116` is delivered. A document may now declare what it promises about its own meaning — origins, terminals, required relationships, required paths — as optional authored data inside the definition, validated in Domain Core and checked by a new promise review in View Model that shares the drawing finding's shape while keeping its own rule codes and its own always-error gate. Three decisions are recorded in `ADR-INFOSCHEMATICS-040`, five new requirements in the specifications, and the showcase authors one promise of every kind.

Verification: scoped typecheck and tests across Domain Model, Domain Core and View Model all passing; the root script suite passing including capability coverage; markdown lint clean. The repo-wide `self:check` was not run because another item was live in the same tree.

Concerns carried: the `check` command still prints only drawing findings; there is no vocabulary term for a promise; the requirements borrow the `DRAW` prefix; and nothing verifies that a promise is the right one to have made.

Two routes are worth considering, neither promoted here. Surfacing promise findings through `infoschematics check` is the natural next item and is small once `packages/cli/` is free. A vocabulary entry for the concept, with the drift check that keeps it honest, would let every future document about promises cite a stable id — and would be the moment to decide whether the requirements should move out of the `DRAW` series.

## Discussion

Captured on 2026-09-21 from the Archify comparison.

The question that decides the size of this is whether declarations are authored data or authored documentation. As data inside the definition they travel with the document into every outlet and can be checked in a pipeline, but they enlarge the contract every package and both renderers consume, and `PDR-INFOSCHEMATICS-001` makes that a deliberate cost. As a separate artefact beside the document — closer to how `ADR-INFOSCHEMATICS-015` keeps realisation claims in an optional overlay — they stay out of the model that every outlet must understand, at the cost of being easier to leave behind.

Also worth settling: whether a declaration is expressed over artefact identities or over Scopes, since a promise about a named component is brittle in a way a promise about a boundary is not; and whether a broken promise is an error or an observation, which is the same distinction the drawing diagnostics had to draw.

### Adoption

Adopted for immediate work on 2026-09-21, behind the diagnostics surface, which has since been delivered. The data-or-overlay question is taken as part of delivery and recorded as a decision, because it is the one choice here that enlarges what every outlet consumes.
