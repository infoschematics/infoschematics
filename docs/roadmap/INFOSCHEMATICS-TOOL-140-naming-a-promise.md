---
id: INFOSCHEMATICS-TOOL-140
area: TOOL
title: Naming a promise
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-09-25T00:00:00Z
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

## Discussion

Captured on 2026-09-24 by the agent delivering `INFOSCHEMATICS-TOOL-116`, which raised it rather than adding a vocabulary term outside its boundary.

The awkward case to settle: a document's promise, a Specification and a realisation claim are three different kinds of statement about intent, and the vocabulary should make a reader able to tell them apart rather than needing to already know.
