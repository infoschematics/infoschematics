---
id: PDR-INFOSCHEMATICS-003
title: Adjacent projects inform rather than supply
date: 2026-09-23
status: current
decision_type: product
decision_type_url: https://knowledgeislands.info/specifications/decision-records/pdr
decision_depends_on: [GDR-INFOSCHEMATICS-001, PDR-INFOSCHEMATICS-001]
---

# PDR-INFOSCHEMATICS-003: Adjacent projects inform rather than supply

## Context

Infoschematics occupies a crowded space. Model-driven architecture tools, diagram-as-code languages, node editors, agent-authored diagram skills and layout kernels all solve overlapping problems, usually in public, and often with their reasoning written down. Ignoring them wastes the most available evidence there is about which trade-offs bite. Reading them carelessly is worse, because a comparison can arrive in the repository as an argument from authority — _this is how the others do it_ — and quietly replace the argument this product owes its own constraints.

Two failure modes follow from that, and both had already appeared. The first is language: a survey that says a choice is or is not "worth copying" describes a relationship of extraction, and invites a reader to treat an adjacent project as a parts bin. The second is placement: a survey is supporting material, and material that supports a decision drifts if it has no settled home, which is how comparisons end up restated inside records, inside guides, and inside roadmap items at once.

## Decision

**Adjacent projects are read for what they make visible, never for material to take.** A survey entry records the question a project answers and the trade-off its answer exposes. Every choice Infoschematics reaches is argued in its own Decision Records against this product's own constraints, and a comparison may motivate a decision or sharpen its alternatives but never stands in for the reasoning. An entry earns its place by making a trade-off legible, including — especially — where the project resolves one the other way.

**Tracked comparisons live in `docs/decisions/references/`.** That directory holds supporting material for the decision collection: surveys of adjacent projects, evidence tables, and anything else a record wants to point at. [The related-tools survey](references/related-tools.md) is its first occupant. The directory sits inside `docs/decisions/` so a record cites it as a sibling path and never reaches outside the collection to something that may move.

**A record remains readable without following the link.** A supporting file may be cited by several records, by one, or by none, and a Decision Record that leans on a comparison states the point in its own body rather than delegating it. Supporting files are not Decision Records: they carry no identifier, no status, and no entry in the ordered index.

**Inclusion implies nothing else.** A tracked project is neither a dependency, nor a feature-parity target, nor an endorsement; licence constraints belong in the entry that names the project.

## Consequences

The survey stays honest about its purpose, and a reader who meets an entry knows they are reading evidence rather than a plan. Comparisons that would otherwise accumulate inside records, guides and roadmap items have one address, so removing a project or correcting an entry is one edit.

The directory gives the repository a place to put durable supporting material of any kind without expanding the Decision Record collection itself, and the index in [the decision-record README](README.md) says the directory exists without listing its contents among the records.

The cost is a small discipline at authoring time: a comparison is not an argument, so a record citing one still has to say, in its own words, what follows for this product.
