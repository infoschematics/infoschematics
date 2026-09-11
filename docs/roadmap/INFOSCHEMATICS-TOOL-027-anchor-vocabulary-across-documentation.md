---
id: INFOSCHEMATICS-TOOL-027
area: TOOL
title: Refresh public documentation
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 3102a8c5398647ca675d6176cd38186a17bb15ef
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

- [x] Reconcile `docs/reference/vocabulary.md` with the current domain model, including Point and the six primary artefact kinds.
- [x] Add a documentation citation test proving explicit vocabulary ids are unique and repository-local vocabulary links resolve.
- [x] Sweep public guides, design documents, and specifications so their first material use of canonical concepts links to the reference.
- [x] Reconcile documentation indexes and Site route summaries with the current feature set and reader journeys.
- [x] Review every ADR, GDR, KDR, and PDR for current status, present/future focus, retired terms, duplication, and volatile operational detail.
- [x] Tighten records where needed while retaining rationale; record any decision that needs genuine amendment as follow-up work.
- [x] State the vocabulary-citation convention in repository guidance.

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

## Review

### Delivered

Public documentation now shares one navigable vocabulary and a clearer reader journey. The vocabulary reconciles all six domain artefact kinds, including Point, and every term has an explicit stable HTML anchor. Getting Started, public guides, design documents, and specifications link their canonical concepts to those anchors. Site navigation now names the landing page “Getting started” and describes current visual-language and document-format coverage.

Every current decision record was reviewed. ADR-010, ADR-011, GDR-003, and PDR-004 were tightened because they contained volatile counts or runtime versions, retired Lane and Zone behaviour, or migration narration. The other records remain current and already concise enough to preserve their governing rationale.

The immutable delivery baseline is `3102a8c5398647ca675d6176cd38186a17bb15ef`.

### Summary of changes

- `docs/reference/vocabulary.md` now contains Point and an explicit anchor for every Product, Production, and Grouping term.
- Public guides, design documents, and specifications include compact vocabulary links before relying on canonical concepts.
- `scripts/vocabulary-citations.test.ts` proves glossary ids and anchors are unique, equal, and resolve every repository documentation citation.
- `AGENTS.md` records the first-material-use citation convention.
- `docs/README.md` and `apps/site/src/routes.ts` now describe Getting Started, the interactive visual guide, current visual-language concerns, and YAML-first document orientation.
- ADR-010 routes volatile release membership and runtime detail to the release guide; ADR-011 uses the current Region model and defaults; GDR-003 states the enduring tsconfig rule; PDR-004 removes delivery history while retaining canonical messaging.
- `DocumentPage.test.tsx` proves representative vocabulary anchors survive Markdown rendering.

### Verification

`bun run self:check` exits 0: 68 test files and 488 tests pass, every TypeScript workspace compiles, dependency cruise reports no violations across 367 modules and 1,134 dependencies, generated artefacts are current, and the production Site builds.

Focused documentation and Site tests pass: three files and 47 tests. `rumdl` reports no issues across the 24 touched Markdown and guidance files. `ki repo audit --skill ki-authoring --repo .` passes.

### Outstanding concerns

ADR-009 and ADR-013 remain denser than the surrounding records. Their detail defines renderer-version fallback and bidirectional schema-parity behaviour rather than delivery history, so shortening them further would lose governing constraints. They are current and contain no retired concepts.

The citation check validates every explicit link but cannot mechanically decide whether prose should cite an additional concept. The public documentation sweep supplies citations at each document's orientation point and the repository guidance makes that an ongoing authoring judgment.

### Post-change review

The goal and boundary are met without changing product behaviour or public TypeScript contracts. Consumer guidance, specifications, Site navigation, vocabulary, and decisions now agree on the current feature set. Decision edits preserve rationale and move operational facts to the guide that owns them.

The documentation is ready for qualitative review as one reader journey from Getting Started through the visual guide and into deeper design or specifications.

### Mini recap

Delivered explicit stable vocabulary anchors, corpus-wide public citations, a citation gate, current Site summaries, YAML-first documentation wording, and a complete decision-record review with four focused rewrites. Verification is clean. Remaining reviewer work is editorial judgment, not missing implementation.

## Done

Accepted 2026-09-11 by Kris Brown on the review packet above.

## Discussion

### Why decisions are included

Documentation quality depends on the reasoning behind its boundaries. A concise current decision record prevents guides from carrying architectural history and lets future changes evaluate the reason, not merely the implementation that happened to exist when the record was written.
