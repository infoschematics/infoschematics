---
id: INFOSCHEMATICS-TOOL-027
area: TOOL
title: Anchor vocabulary across documentation
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: 0bb213dd11b686f75bcb302d2a6c08160eacc5a0
---

## Goal

Make [the vocabulary reference](../reference/vocabulary.md) the cited source for the product's terms across the specifications, design guides, and site, with stable ids that other documents point at and a check that the citations resolve — so the language cannot drift away from the documents that use it.

## Context

`AGENTS.md` already requires that only the canonical concepts in the vocabulary reference are used, but nothing enforces or even records where they are used. The reference is a set of tables of terms and their aliases; specifications, design guides, and site copy repeat those terms as plain prose, so a renamed or retired concept leaves stale usages behind with nothing to find them. The region unification that collapsed lanes and zones into Region is the worked example: residue survived in code and fixtures long enough to need a dedicated sweep.

Once `INFOSCHEMATICS-TOOL-026` gives the terms ids and `INFOSCHEMATICS-SITE-011` teaches them, the reference stops being a glossary read on its own and becomes design documentation the rest of the corpus refers to. That only holds if the references are real links rather than repeated words.

The user's framing was that a good deal of the documentation needs tidying and made coherent around the same concepts, with the visual guide as the main one; this item is the mechanical half of that, deliberately separated from editorial rewriting.

## Boundary

This item adds ids, citations, and a check. It does not rename, retire, or add a product concept, and it does not rewrite documents for tone, structure, or length. Where a citation cannot be made because the concept genuinely is not in the vocabulary, this item records the gap rather than inventing the term. Editorial rework surfaced by that sweep becomes its own record.

## Current state

`docs/reference/vocabulary.md` holds the glossary as tables under `## Glossary` with `### Product`, `### Production`, and `### Groupings`, then sections for Infoschematic, Scenes, Themes and Stories, Roles and modes, and Code conventions. Headings carry no explicit ids, so any link to a term relies on a generated slug that changes with the heading text.

`INFOSCHEMATICS-TOOL-026` introduces ids for the terms its option catalogue cites, and a test that those ids resolve. That covers appearance options only; every other term remains uncited.

## Shaping decisions

- **Ids are explicit, not generated.** A term's id is written down and does not change when its heading is reworded, because the whole point is a reference that survives editing.
- **The check is a test, not a linter pass.** It runs inside `bun run self:check` with everything else, so a broken citation fails the same gate as a broken import.
- **Citation is bidirectional where a visual realisation exists.** Every term the visual guide teaches names a real vocabulary id, and every catalogued option's term resolves — the two directions `INFOSCHEMATICS-TOOL-026` and `INFOSCHEMATICS-SITE-011` each half-establish, completed here across the whole corpus.
- **Gaps are recorded, not filled.** A concept used in a specification but absent from the vocabulary is a finding for the roadmap, not a term this item coins.
- **Scope is the repository's own documents.** `docs/` and site copy. Commit messages, decision records already written, and roadmap history are left alone: they are the record of what was thought at the time.

## Steps

- [ ] Extend the term ids started in `INFOSCHEMATICS-TOOL-026` to every term in [the vocabulary reference](../reference/vocabulary.md).
- [ ] Add `scripts/vocabulary-citations.test.ts`: every vocabulary citation in `docs/` resolves to a declared id, and every declared id is unique.
- [ ] Sweep the specifications under `docs/specs/` for concept usages and cite the vocabulary where a term is first used in each document.
- [ ] Sweep the design guides under `docs/design/` and the consumer guides under `docs/guides/` the same way.
- [ ] Record any concept used in the corpus but missing from the vocabulary as a finding in this item, and raise a separate record where one is warranted.
- [ ] State the convention in `AGENTS.md`: a document that uses a canonical concept cites its vocabulary id on first use.

## Files touched

- `docs/reference/vocabulary.md`
- `scripts/vocabulary-citations.test.ts`, new
- `docs/specs/*.md`, `docs/design/*.md`, `docs/guides/*.md` for citations
- `AGENTS.md` for the convention

## Verify

`bun run self:check`. The citation test proves every reference resolves and every id is unique; breaking a heading id must fail it. Confirm by hand that a term renamed in the reference leaves the corpus failing rather than silently stale.

## Dependencies / blocks

No lifecycle blockers are declared. This item completes the id set `INFOSCHEMATICS-TOOL-026` starts and the citation direction `INFOSCHEMATICS-SITE-011` relies on, and is sequenced after both in practice, stated here rather than declared, following the decision recorded on `INFOSCHEMATICS-SITE-008`.

## Documentation impact

### Decision Records

None expected. Citing an existing vocabulary decides nothing new.

### Specifications

Every specification under `docs/specs/` gains citations on first use of a canonical concept. No requirement changes.

### Guides

Design and consumer guides gain the same citations. `AGENTS.md` states the convention.

### Roadmap

Record implementation and verification evidence in this item, including any vocabulary gaps found, before acceptance.

## Discussion

### Why not fix the prose at the same time

Because the two jobs fail differently. Anchoring is mechanical and verifiable — a citation resolves or it does not — while making the corpus coherent is editorial judgement that wants reading, argument, and probably several passes. Bundling them would put a large subjective rewrite behind a check that could otherwise land in an afternoon, and would make the diff impossible to review. The sweep is also the right way to discover what the editorial pass should actually address, so doing it first is not merely separation but sequence.
