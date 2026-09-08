---
id: INFOSCHEMATICS-TOOL-027
area: TOOL
title: Refresh public documentation
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: 0bb213dd11b686f75bcb302d2a6c08160eacc5a0
---

## Goal

Make the public documentation describe the current Infoschematics feature set in one canonical vocabulary, and leave the decision record concise, current, and useful for future choices.

## Context

The documentation grew with the implementation. Individual guides and specifications are useful, but terminology is repeated without stable citations, the vocabulary omits Point while claiming six primary artefact kinds, and some decision records retain migration narration or volatile operational details.

`INFOSCHEMATICS-SITE-011` establishes the reader-facing visual curriculum. This item follows it with a corpus-level reconciliation so Getting Started, the visual guide, design guidance, specifications, and decisions agree.

## Boundary

This item updates canonical documentation under `docs/`, the Site's document summaries, and documentation consistency checks. It may add a missing canonical term where the domain model already proves that concept exists.

It does not change product behaviour or public TypeScript contracts, document Studio/editorial interfaces in the visual guide, rewrite roadmap history, or publish decision records as consumer guidance. Substantive new product decisions become separate records rather than being smuggled into an editorial pass.

## Current state

The vocabulary has stable ids but omits Point from its Product table and Infoschematic anatomy. Specifications and guides use canonical terms without linking their first material use. Decision records are all marked current, but ADR-011 still speaks in retired Lane and Zone language; ADR-010 and GDR-003 contain details that will date; several indexes summarise implementation counts rather than durable policy.

## Shaping decisions

- **Orient readers before specifying internals.** Getting Started explains the product, visible anatomy, authoring-to-output path, and where to continue. Detailed requirements stay in specifications.
- **Cite canonical terms where a document first relies on them.** Stable ids make links survive heading edits and allow a repository test to catch broken citations.
- **Fix proved vocabulary gaps.** Point is already a domain artefact and renderer output, so documenting it reconciles the reference rather than inventing a feature.
- **Edit decisions for enduring value.** Keep present-tense context, the durable decision, consequences, and links to current operational guides. Remove delivery narration, exact package counts, and superseded terminology.
- **Preserve honest status.** A record remains current when its decision still governs. A later decision should amend or supersede it explicitly; this pass does not manufacture supersession.

## Steps

- [ ] Reconcile `docs/reference/vocabulary.md` with the current domain model, including Point and the six primary artefact kinds.
- [ ] Add a documentation citation test proving explicit vocabulary ids are unique and repository-local vocabulary links resolve.
- [ ] Sweep public guides, design documents, and specifications so their first material use of canonical concepts links to the reference.
- [ ] Reconcile documentation indexes and Site route summaries with the current feature set and reader journeys.
- [ ] Review every ADR, GDR, KDR, and PDR for current status, present/future focus, retired terms, duplication, and volatile operational detail.
- [ ] Tighten records where needed while retaining rationale; record any decision that needs genuine amendment as follow-up work.
- [ ] State the vocabulary-citation convention in repository guidance.

## Files touched

- `docs/reference/vocabulary.md`
- `docs/overview.md`
- `docs/guides/*.md`
- `docs/design/*.md`
- `docs/specs/*.md`
- `docs/decisions/*.md`
- `apps/site/src/routes.ts`
- `scripts/vocabulary-citations.test.ts`, new
- `AGENTS.md`

## Verify

Run `bun run self:check`. The citation test proves explicit ids are unique and local vocabulary links resolve. Run the repository authoring audit. Review the public documentation navigation and read the complete decision index against the edited records.

## Dependencies / blocks

`INFOSCHEMATICS-SITE-011` precedes this item because its final language is part of the corpus being reconciled. There are no external dependencies.

## Delegation

No delegation. Terminology, reader journey, and decision-record editing require one consistent editorial pass and the current authority does not grant delegated execution.

## Documentation impact

### Decision Records

All records are reviewed. Edits clarify existing decisions; any change to a governing choice is stopped and captured separately.

### Specifications

No product requirement changes are intended. Links and wording reconcile specifications with canonical vocabulary without weakening normative language.

### Guides

Getting Started, visual language, authoring, and integration guidance form a coherent reader journey and link to deeper reference material.

### Roadmap

Record the documents reviewed, decisions tightened, gaps found, and verification evidence here before review.

## Discussion

### Why decisions are included

Documentation quality depends on the reasoning behind its boundaries. A concise current decision record prevents guides from carrying architectural history and lets future changes evaluate the reason, not merely the implementation that happened to exist when the record was written.
