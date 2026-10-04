---
id: INFOSCHEMATICS-TOOL-140
area: TOOL
title: Naming a promise
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: db3b86593ff001b0c0401b15a2ee306c1f565d5e
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-10-04T20:49:15Z
---

# Naming a promise

## Goal

The thing a document declares about its own meaning has a canonical name with a stable id, so prose about it can cite that id the way prose about a [Card](../reference/vocabulary.md#standard-card) or a [Scope](../reference/vocabulary.md#scope) does.

## Context

`INFOSCHEMATICS-TOOL-116` gave a definition an optional `promises` list: where a reading may begin, where it must end, which relationship must exist, which run of [Flows](../reference/vocabulary.md#flow) must stay traceable. The contract, the schema, the checker rules, two specifications and the authoring guide all now talk about promises.

None of them can link the word. [The vocabulary reference](../reference/vocabulary.md) carries no term for it, so every use is plain English. `AGENTS.md` requires that when a guide, design document or specification first relies on a canonical concept, it links that use to the term's stable vocabulary id — and this concept is canonical by any reasonable test, since it is authored data in the published schema that a gate can fail on.

[KDR-INFOSCHEMATICS-001](../decisions/KDR-INFOSCHEMATICS-001-product-vocabulary.md) is the standing commitment to one vocabulary across model, production, code and documentation, which is what makes the gap worth closing rather than tolerating.

## Boundary

Naming an existing concept and citing it, not changing it. The declaration vocabulary, what a promise may be written over, and the severity of a broken one are settled by [ADR-INFOSCHEMATICS-040](../decisions/ADR-INFOSCHEMATICS-040-a-document-promises-what-it-means-and-a-checker-holds-it-to-it.md) and are not re-opened.

Whether "promise" is the right word is genuinely open. It was chosen in prose before there was a vocabulary entry to constrain it, and the term that survives review may differ from the one in the code — in which case the cost of renaming the authored property has to be weighed here rather than assumed away, because it is a published schema key.

## Current state

[The vocabulary reference](../reference/vocabulary.md) has no row for the concept. Its Product table introduces the product as "its structural Diagram plus optional Scopes, Specifications and Sequences", which already omits the fourth optional authored list. The concept is authored as an optional `promises` list on the definition (`packages/domain-model/src/model.ts`, type `DocumentPromise`, because `Promise` is JavaScript's own), validated in `packages/domain-core`, published in `packages/domain-core/schema/infoschematic.schema.json`, reviewed by the `promise-*` rule series, and exercised by `examples/is-showcase` with ids `PROMISE-ORIGIN`, `PROMISE-TERMINUS`, `PROMISE-RELATIONSHIP` and `PROMISE-PATH`. None of the packages has been published to a registry: [INFOSCHEMATICS-TOOL-041](INFOSCHEMATICS-TOOL-041-initial-package-publication.md) is still waiting, and every package is at `0.1.0`.

The uses that rely on the concept and cannot yet link it are `AUTHOR-018` in `docs/specs/authoring.md`, the "Declared readings" section and `DRAW-014` in `docs/specs/diagnostics.md`, [ADR-INFOSCHEMATICS-040](../decisions/ADR-INFOSCHEMATICS-040-a-document-promises-what-it-means-and-a-checker-holds-it-to-it.md), whose closing paragraph records the gap in so many words, and the promises section of the Site authoring guide, `apps/site/content/authoring.md`. Other uses of "promise" in `docs/specs/composition.md`, `docs/specs/index.md`, the remaining decision records and `.ki.toml` are the ordinary English verb about requirements, Node engines or product messaging, not this concept, and stay as they are.

`scripts/vocabulary-citations.test.ts` resolves every `vocabulary.md#id` citation in repository and Site documentation, and `scripts/vocabulary-drift.test.ts` requires every recorded alternative to carry a classification, so a new row is checked in both directions as soon as it lands.

### Decisions

- **The term is Promise, with id `promise`, and the authored `promises` key is not renamed.** Boundary leaves the word open. Of the candidates - Promise, Declared Reading, Intent, Invariant, Guarantee - Promise is the only one already carried by the schema key, the type names, the four checker rule codes, the showcase ids, an accepted decision record and the Site guide, so any other choice converts a naming item into a schema migration. Its weakness is the ordinary verb, which prose uses freely about requirements; the vocabulary already admits terms with ordinary senses (Design, Present, Flow, Scope), and a capitalised, linked use is what tells them apart. Decided under delegated autonomy (2026-10-04), reversible: nothing is published, so renaming before [INFOSCHEMATICS-TOOL-041](INFOSCHEMATICS-TOOL-041-initial-package-publication.md) remains open to the owner at the cost of the schema key and the rule codes.
- **The three statements about intent are told apart by what each is checked against, in one vocabulary section.** A Promise is a claim about the document's own meaning, checked against the Flows the document already contains, and a broken one is an error. A Specification describes something outside the document - a standard, an interface, an operation. A realisation claim (`realisedBy`) says which Diagram elements satisfy a Specification; the references are validated, but its truth is a fact about the world that no checker here can test, per [ADR-INFOSCHEMATICS-015](../decisions/ADR-INFOSCHEMATICS-015-specifications-own-realisations.md). Decided under delegated autonomy (2026-10-04), reversible.
- **Specification and realisation claim are described, not given ids.** Boundary is naming one existing concept; giving the other two canonical rows is a separate vocabulary change with its own citations to find, and is noted under Discussion rather than absorbed. Decided under delegated autonomy (2026-10-04), reversible.
- **The Site authoring guide's first use is linked in this change.** `AGENTS.md` routes Site output to a follow-up record so consumer prose is written once behaviour has settled; no behaviour moves here, so the reason does not apply, and leaving the one guide that teaches the concept uncited would leave the gap half closed. Decided under delegated autonomy (2026-10-04), reversible.
- **`DocumentPromise` stays the code name** and the vocabulary's Code conventions say why, so a reader meeting the type knows it is this term rather than a JavaScript `Promise`. Decided under delegated autonomy (2026-10-04), reversible.

## Steps

- [ ] Add a `promise` row to the Product table in `docs/reference/vocabulary.md`, with glosses as alternatives, and name Promises in the Product sentence beside Scopes, Specifications and Sequences.
- [ ] Add a `## Promises` section to the vocabulary that defines a Promise, its four kinds, that it may be written over artefact codes or Scope ids, that no renderer reads it and a broken one is an error, and that tells it apart from a Specification and a realisation claim by what each is checked against.
- [ ] Add a Code conventions bullet naming `DocumentPromise` as the code type for a Promise.
- [ ] Classify each new alternative in `scripts/vocabulary-drift.test.ts`.
- [ ] Link the first use of the concept to `vocabulary.md#promise` in `AUTHOR-018`, in the "Declared readings" section of `docs/specs/diagnostics.md`, in ADR-INFOSCHEMATICS-040, and in `apps/site/content/authoring.md`; replace ADR-INFOSCHEMATICS-040's closing paragraph, which records the gap, with one that cites the term.

## Files touched

- `docs/reference/vocabulary.md`
- `scripts/vocabulary-drift.test.ts`
- `docs/specs/authoring.md`
- `docs/specs/diagnostics.md`
- `docs/decisions/ADR-INFOSCHEMATICS-040-a-document-promises-what-it-means-and-a-checker-holds-it-to-it.md`
- `apps/site/content/authoring.md`
- This record

Not touched: the authored `promises` key, the `DocumentPromise` types, the `promise-*` rule codes, the schema, the checker and the showcase, all settled by ADR-INFOSCHEMATICS-040, and plain-English uses of the verb elsewhere.

## Verify

- `bunx vitest run scripts/vocabulary-terms.test.ts scripts/vocabulary-citations.test.ts scripts/vocabulary-drift.test.ts` passes, proving the new id is unique with one stable anchor, every `#promise` citation resolves, and every new alternative is classified.
- Prove the citation check is not vacuous for this term: rename the anchor locally and confirm `vocabulary-citations.test.ts` fails on the new links, then restore it.
- `bun run self:check` passes, including the Site build that renders the vocabulary and the authoring guide.
- `bunx rumdl check` is clean on the touched Markdown, and `ki repo audit --repo .` reports FAIL=0.

## Dependencies / blocks

None. Builds on the delivered `INFOSCHEMATICS-TOOL-116` and ADR-INFOSCHEMATICS-040; [KDR-INFOSCHEMATICS-001](../decisions/KDR-INFOSCHEMATICS-001-product-vocabulary.md) is the standing commitment it serves.

## Documentation impact

### Decision Records

ADR-INFOSCHEMATICS-040's closing paragraph is updated to cite the term it was waiting for; no decision changes, so no new record.

### Specifications

`AUTHOR-018` and the diagnostics "Declared readings" section link the term at first use; no requirement text changes.

### Guides

The Site authoring guide links the term at first use.

### Roadmap

None.

## Discussion

Captured on 2026-09-24 by the agent delivering `INFOSCHEMATICS-TOOL-116`, which raised it rather than adding a vocabulary term outside its boundary.

The awkward case to settle: a document's promise, a Specification and a realisation claim are three different kinds of statement about intent, and the vocabulary should make a reader able to tell them apart rather than needing to already know.

Adopted 2026-10-04 under the owner's delegated estate-push authority, moved from Triage to Now and shaped to Ready in the same change.

Not absorbed: Specification and realisation claim have no vocabulary ids either, although the Product sentence relies on the first. Giving them canonical rows is a candidate for its own record.
