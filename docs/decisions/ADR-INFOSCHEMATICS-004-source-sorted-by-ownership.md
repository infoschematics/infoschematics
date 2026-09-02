---
id: ADR-INFOSCHEMATICS-004
title: Source sorted by ownership before kind
date: 2026-09-02
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [PDR-INFOSCHEMATICS-001, KDR-INFOSCHEMATICS-001]
---

# ADR-INFOSCHEMATICS-004: Source sorted by ownership before kind

## Context

A tree sorted only by file kind says what a file is but not who owns it. A generic-looking directory can still contain hard-coded realisation material, while reusable behaviour can be scattered between model, application, and component folders. Import cleanliness alone cannot detect literals owned by a particular Infoschematic.

## Decision

Ownership boundaries state purpose first; file kind sorts within an owner:

- Domain Model owns dependency-free serialisable product types.
- Domain Core owns framework-neutral domain behaviour.
- View Model owns framework-neutral derived visual and editing calculations.
- renderer and View packages own output-specific behaviour.
- `is-*` example packages own authored Infoschematic configurations.
- Site owns publication and composition, not reusable product behaviour.

Physical roots make those boundaries visible: independently consumable libraries live under `packages/`, deployable composition roots under `apps/`, and independently authored Infoschematic examples under `examples/`.

Dependency Cruiser enforces import direction. Review remains responsible for ownership violations hidden in literals.

## Consequences

Reusable capability moves or publishes by ownership unit rather than file-by-file triage. A feature used by one example still belongs in a reusable package when its concept is general. Application composition may depend on lower layers, while lower layers never import a host, site, or authored Infoschematic.
