---
id: ADR-INFOSCHEMATICS-004
title: Source sorted by ownership
date: 2026-09-02
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [PDR-INFOSCHEMATICS-001, KDR-INFOSCHEMATICS-001]
---

# ADR-INFOSCHEMATICS-004: Source sorted by ownership

## Context

File kind alone does not reveal who owns behaviour. Reusable calculations, host composition, and authored example data can all be TypeScript or YAML while having different dependency and change boundaries.

## Decision

Sort source by ownership before file kind. Domain Model owns serialisable types; Domain Core owns framework-neutral domain behaviour; View Model owns framework-neutral visual and editing derivations; each View or renderer owns output-specific behaviour; examples own authored Infoschematics; applications own hosting and publication composition. Dependencies point from consumers toward reusable owners, never back toward a particular host or example.

Physical workspace roots make those boundaries visible.

## Consequences

Generic-looking folders no longer justify misplaced product-specific literals, and reusable capability cannot hide inside an application. Reviews can reason about dependency direction from ownership before considering implementation form.

The shape this rule produces is written down in [the architecture design](references/design-architecture.md): the current packages, what each owns, and the direction between them. That document changes when a package moves; this record changes only when the sorting rule does.
