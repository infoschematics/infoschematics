---
id: ADR-INFOSCHEMATICS-004
title: Source sorted by ownership before kind
date: 2026-09-02
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [PDR-INFOSCHEMATICS-001, KDR-INFOSCHEMATICS-001]
transferred_from: ADR-IBC2026-005
---

# ADR-INFOSCHEMATICS-004: Source sorted by ownership before kind

## Context

A tree sorted only by file kind says what a file is but not who owns it. During extraction, apparently generic directories still contained hard-coded realisation material, while reusable behaviour was scattered between model, application, and component folders. Import cleanliness alone could not detect literals owned by a particular Infoschematic.

## Decision

Workspace boundaries state ownership first; file kind sorts within an owner:

- Domain Model owns dependency-free serialisable product types.
- Domain Core owns framework-neutral domain behaviour.
- View Model owns framework-neutral derived visual and editing calculations.
- renderer and view workspaces own output-specific behaviour.
- `is-*` workspaces own authored Infoschematic configurations.
- Site owns publication and composition, not reusable product behaviour.

Dependency Cruiser enforces import direction. Review remains responsible for ownership violations hidden in literals.

## Consequences

Reusable capability moves or publishes by workspace rather than file-by-file triage. A feature used by one example still belongs in a reusable package when its concept is general. Application composition may depend on lower layers, while lower layers never import a host, site, or authored Infoschematic.
