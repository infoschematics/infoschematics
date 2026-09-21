---
id: INFOSCHEMATICS-TOOL-116
area: TOOL
title: Promises a document holds
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-21T19:30:00Z
updated_at: 2026-09-21T19:30:00Z
---

# Promises a document holds

## Goal

Settle whether an [Infoschematic](../reference/vocabulary.md#infoschematic) may state the readings it intends to support — where a flow starts, where it must end, which relationships must exist, which paths must remain traceable — and have a checker hold that promise.

## Context

An Infoschematic explains a system, and the explanation is the point: that a request reaches the database through the gateway, that nothing bypasses the queue, that every ingress terminates somewhere. Today those readings live only in the author's head. The schema holds the shape of the document and nothing holds its meaning, so an edit made months later can silently break the very reading the diagram was drawn to support, and every check will still pass.

`ADR-INFOSCHEMATICS-034` already establishes that a cross-feature composition is stated as its own requirement rather than as a clause inside a newer feature, which is the same instinct applied to the repository's own specifications: a promise that is not stated somewhere durable is not held.

The comparison that raised it is Archify's author-declared semantic checks, recorded in [the related-tools reference](../reference/related-tools.md): a document may declare allowed roots, allowed terminals, required edges, and required paths, and the compiler enforces them.

## Boundary

Depends on whatever [INFOSCHEMATICS-TOOL-113](INFOSCHEMATICS-TOOL-113-where-a-drawing-fails.md) settles, because a declared check is worth nothing without a surface that reports its failure with a subject and evidence. It is captured separately because it is a change to what a definition may carry, where TOOL-113 is only a report about one.

It does not make any declaration mandatory: a document that declares nothing stays valid, and this never becomes a second modelling language the author has to satisfy before drawing.

## Discussion

Captured on 2026-09-21 from the Archify comparison.

The question that decides the size of this is whether declarations are authored data or authored documentation. As data inside the definition they travel with the document into every outlet and can be checked in a pipeline, but they enlarge the contract every package and both renderers consume, and `PDR-INFOSCHEMATICS-001` makes that a deliberate cost. As a separate artefact beside the document — closer to how `ADR-INFOSCHEMATICS-015` keeps realisation claims in an optional overlay — they stay out of the model that every outlet must understand, at the cost of being easier to leave behind.

Also worth settling: whether a declaration is expressed over artefact identities or over Scopes, since a promise about a named component is brittle in a way a promise about a boundary is not; and whether a broken promise is an error or an observation, which is the same distinction TOOL-113 has to draw.
