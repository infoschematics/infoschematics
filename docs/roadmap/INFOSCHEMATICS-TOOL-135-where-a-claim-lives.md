---
id: INFOSCHEMATICS-TOOL-135
area: TOOL
title: Where a claim lives
theme: tool
horizon: now
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-23T17:10:00Z
updated_at: 2026-09-23T20:05:00Z
---

# Where a claim lives

## Goal

A reader of `docs/` finds each kind of claim in exactly one instrument, and the design and guide documents state what the product does now rather than what it did when they were written.

## Context

The Decision Record corpus has just been consolidated: five records that said one thing in two places became two, the serials read as the build narrative, and the index groups the records by the phase they belong to. That work only covered `docs/decisions/`. The documents that sit around it were not looked at, and the same failure mode is likely there for the same reason — a document written beside one feature is rarely revisited when a later feature changes what it describes.

Three specific doubts prompted this record. `docs/reference/related-tools.md` framed two of Archify's choices as "deliberately not worth copying", which describes the wrong relationship: this repository is informed by what adjacent projects have learned and argues every choice it reaches in its own Decision Records. `docs/reference/specification-id-migration.md` recorded a one-time rename that has completed. And `docs/reference/vocabulary.md` is a canonical glossary that may not belong under `reference/` at all — it is published to the public site as "Terminology", it is cited by name from specifications, guides and source, and [KDR-INFOSCHEMATICS-001](../decisions/KDR-INFOSCHEMATICS-001-product-vocabulary.md) already governs it.

The first two were fixed in the same change that opened this record, because they were corrections rather than questions, and the survey has since moved to `docs/decisions/references/related-tools.md` under [PDR-INFOSCHEMATICS-003](../decisions/PDR-INFOSCHEMATICS-003-adjacent-projects-inform-rather-than-supply.md), which settles what a survey of adjacent projects is for and where it lives. The third is a real question and is the substantial part of the work remaining, together with a read of the design documents and `docs/guides/` against what the product now does.

## Boundary

A documentation-corpus review across the design documents, `docs/guides/`, and `docs/reference/`, plus the site routes that render those documents. It settles where the vocabulary lives, removes or merges documents that no longer carry their own claim, and repairs statements the product has outgrown.

It does not change the model, any package, the specification corpus under `docs/specs/`, or the roadmap records themselves. It does not reopen what the Decision Records decided — where a document disagrees with a record, the document is wrong unless the disagreement reveals a decision that was never taken, in which case that becomes its own record rather than a paragraph here. It does not restructure the site's information architecture beyond the routes whose source documents move.

## Current state

The four design documents — `design-architecture.md`, `design-visual-language.md`, `design-view-present.md`, `design-view-studio.md`, 604 lines — have moved to `docs/decisions/references/`, where `GDR-INFOSCHEMATICS-001` now places material that supports the records without being one. All four remain published by the site under `/docs/approach/` through `apps/site/src/routes.ts`; only their source paths changed.

The citation check that prompted the move found the relationship running one way. `design-architecture.md` cited seven records and the others cited none, while no record cited any design document at all — so a reader arriving at a decision had no route to the shape it adds up to. Four records now carry that route in their bodies: `ADR-INFOSCHEMATICS-004` to the architecture design, `ADR-INFOSCHEMATICS-011` to the visual language, `ADR-INFOSCHEMATICS-018` to the Present view, and `ADR-INFOSCHEMATICS-025` to Studio.

None has yet been read against the records that have landed since, which is the remaining work. `design-view-studio.md` in particular predates the two-axis split `ADR-INFOSCHEMATICS-026` now records.

`docs/guides/` holds seven guides plus a README, totalling 483 lines, none published by the site: `ADR-INFOSCHEMATICS-014` gives the public consumer journey to `apps/site/content/` and leaves maintainer and operator procedures here. Whether all seven are still maintainer procedures, and whether any duplicates the Site-owned journey, is unexamined.

`docs/reference/vocabulary.md` is a 130-line glossary whose terms are table rows carrying explicit `<span id>` anchors. Three checks hold it — `scripts/vocabulary-citations.test.ts`, `vocabulary-drift.test.ts`, and `vocabulary-terms.test.ts` — and 107 citations across the repository resolve to 27 distinct anchors. It is published at `/docs/reference/vocabulary/` titled "Terminology". `KDR-INFOSCHEMATICS-001` is 191 words and governs the vocabulary without containing it.

That last pairing is the crux. The `ki-decision-records` standard caps a record body at 200 to 500 words and treats a record as a living document whose obsolete wording simply goes — which is exactly the wrong container for 27 anchors that 107 citations depend on. The likely answer is therefore that the glossary stays a document and moves to where a reader expects a glossary, with `KDR-001` continuing to govern it; but the alternative is a real one and the record should state which was chosen and why.

`docs/reference/` now holds `vocabulary.md` alone, the migration table having been removed and the survey moved, which is itself a reason to ask whether the directory is carrying its own meaning.

That question no longer has to be settled here. `docs/decisions/references/` was the established convention in `ki-agentic-harness` and `vallearmonia-website`, and `standards-decision-records.md` now states it as a rule: supporting material lives in a `references/` directory inside the decisions collection, cited from a record's body by a sibling path, never listed among the records. This repository has adopted it — the directory exists, `docs/decisions/README.md` says what belongs in it, and `related-tools.md` is its first occupant. What remains open is only whether the glossary belongs there too, which is a harder case because the directory's name tells a reader "supporting evidence for the decisions" and the glossary is a public page the site renders as "Terminology".

## Steps

- [ ] Read the four design documents against the current Decision Records and specifications, and list every statement the product has outgrown before changing any of them, so the size of the drift is known rather than discovered one paragraph at a time. Their move and their citations from the records are done; the drift read is not.
- [ ] Repair those statements, or delete the passage where the claim now lives in a record or a specification and the design document was only restating it.
- [ ] Read `docs/guides/`'s seven guides the same way, and confirm each is a maintainer or operator procedure rather than a duplicate of the Site-owned consumer journey `ADR-INFOSCHEMATICS-014` places under `apps/site/content/`.
- [ ] Decide where the vocabulary belongs — a guide, a reference document, `docs/decisions/references/` beside the record that governs it, or folded into `KDR-INFOSCHEMATICS-001` — and record the reasoning in the review rather than only the outcome. The directory is now available to it, so this is a question about the glossary alone.
- [x] Settle whether this repository adopts `docs/decisions/references/` at all, and say so in `docs/decisions/README.md`. It does: the directory holds the survey of adjacent projects, and `PDR-INFOSCHEMATICS-003` states what that survey is for.
- [ ] Apply that decision, keeping every `<span id>` anchor stable if the document moves, and update `apps/site/src/routes.ts` and the three vocabulary checks together with it.
- [ ] Decide whether `docs/reference/` still names a distinct kind of document once the migration table is gone, and merge it away if it does not.
- [ ] Look at every site route whose source document moved, in a real browser per `AGENTS.md`, because a route that resolves is not evidence that the page reads.

## Files touched

`docs/decisions/references/design-*.md`, `docs/guides/*.md`, `docs/reference/*.md`, `apps/site/src/routes.ts`, `apps/site/src/DocumentPage.tsx`, `apps/site/src/App.test.tsx`, `apps/site/src/DocumentPage.test.tsx`, and the vocabulary checks under `scripts/` if the glossary moves. `docs/decisions/README.md`, `GDR-INFOSCHEMATICS-001`, and the records that cite a design document. `docs/decisions/KDR-INFOSCHEMATICS-001-product-vocabulary.md` if the vocabulary's home changes what that record governs.

## Verify

`bun run self:check`, which carries the three vocabulary checks and the site build, and `ki repo audit --skill ki-guides --repo .` over the guide collection, per the rule that an artefact is audited by the skill that governs it rather than by the repository's habitual gates. A browser capture into `reports/` for any site route whose source document moved.

The check that matters most is negative: no citation anywhere in the repository may resolve to a document that no longer exists or an anchor that moved, and `scripts/vocabulary-citations.test.ts` proves exactly that for the glossary.

## Dependencies / blocks

Nothing blocks it and it blocks nothing. It follows the Decision Record consolidation only in the sense that the consolidation established what the records now say, which is the yardstick this item measures the surrounding documents against.

## Documentation impact

### Decision Records

Possibly one. If the vocabulary's home changes, `KDR-INFOSCHEMATICS-001` is amended in place rather than superseded — it governs the vocabulary either way. A new record is needed only if the review finds a decision the corpus never took, which is a finding to surface rather than a planned output.

### Specifications

None expected. The specification corpus is outside this boundary; a specification found to be wrong during the read is captured as its own record.

### Guides

This item is largely a guide review, so `docs/guides/` is its subject rather than its impact. Any guide that turns out to duplicate the Site-owned journey is removed here rather than in a follow-up.

### Roadmap

`docs/roadmap/_ISSUES.md` advances `TOOL` to `135`. Anything the read finds that is a product defect rather than a documentation defect becomes its own record rather than widening this one.

## Discussion

Raised on 2026-09-23 while reviewing the consolidated Decision Records, on the observation that the consolidation only covered one directory and the same neglect probably applies to its neighbours. The two corrections named in Context — the "copying" framing in `related-tools.md` and the completed `specification-id-migration.md` — were applied immediately rather than deferred into this item, because neither needed a decision: the first was wrong about the relationship this repository has with adjacent projects, and the second was a table whose only remaining readers in the repository were two stale citations, now repaired to `APPEAR-010` and `AUTHOR-010`.

The vocabulary question is left open deliberately. Folding a glossary into a Decision Record is attractive because it puts the canonical terms with the record that governs them, and wrong for mechanical reasons the record standard makes explicit; but "wrong for mechanical reasons" is worth writing down once rather than re-deriving, which is what this item's review section is for.

The `docs/decisions/references/` pattern was raised on the same day and is the most promising of the four, because it keeps the glossary beside the record that governs it without putting it inside a body that is meant to be rewritten freely. The complication it has to answer is publication: the material in that directory in both precedent repositories is internal evidence, whereas this glossary is a public page the site renders as "Terminology", and a directory whose name tells a reader "supporting evidence for the decisions" is not obviously where a public terminology page belongs. `related-tools.md` had no such complication and has been moved, with [PDR-INFOSCHEMATICS-003](../decisions/PDR-INFOSCHEMATICS-003-adjacent-projects-inform-rather-than-supply.md) recording the general approach to tracking adjacent projects rather than only the placement. Deciding the easy case first was accepted knowingly: the record states the directory holds supporting material for the decisions, which is a claim the glossary has to satisfy on its own terms rather than one the move has already made for it.

### Adoption

Adopted into Now on 2026-09-23 at the request that this be handled as a Now-horizon item rather than folded into the Decision Record consolidation.
