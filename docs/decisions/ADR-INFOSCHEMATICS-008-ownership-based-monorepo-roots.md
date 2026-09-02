---
id: ADR-INFOSCHEMATICS-008
title: Ownership-based monorepo roots
date: 2026-09-02
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-004, ADR-INFOSCHEMATICS-007]
---

# ADR-INFOSCHEMATICS-008: Ownership-based monorepo roots

## Context

A single `workspaces/` directory identifies Bun mechanics but hides why each workspace exists. Consumable libraries, deployable applications, and authored Infoschematic examples have different ownership, dependency, publication, and deployment rules even though Bun treats all three as workspaces.

A separate `views/` root would describe implementation form rather than ownership. Canvas, Present, and Studio are consumable packages, while Site is an application and each `is-*` definition is independently authored example data.

## Decision

The monorepo uses ownership-based workspace roots:

- `packages/` contains independently consumable libraries, including Domain, View, and renderer packages;
- `apps/` contains deployable or executable composition roots, with the public website at `apps/site`;
- `examples/` contains independently authored Infoschematic definitions, whose workspace names use the `is-*` prefix.

The root Bun workspace configuration includes each of these roots. A workspace's package name remains role-based and does not repeat its physical root.

## Consequences

A path communicates ownership before source kind. New renderers and views go under `packages/`, new deployable surfaces go under `apps/`, and new authored examples go under `examples/`. Tooling must discover all three workspace families rather than assuming one `workspaces/*` glob.

The Site's repository configuration and deployment tooling point to `apps/site`. Shared website skills should support that conventional default while retaining an explicit site-root override for repositories with a justified different layout.
