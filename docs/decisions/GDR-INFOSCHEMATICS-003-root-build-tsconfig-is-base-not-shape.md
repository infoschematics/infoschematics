---
id: GDR-INFOSCHEMATICS-003
title: Root build tsconfig is base, not shape
date: 2026-09-04
status: current
decision_type: governance
decision_type_url: https://knowledgeislands.info/specifications/decision-records/gdr
decision_depends_on: [ADR-INFOSCHEMATICS-010]
---

# GDR-INFOSCHEMATICS-003: Root build tsconfig is base, not shape

## Context

The engineering standard identifies a compiled workspace through its own `tsconfig.build.json`. A monorepo also needs shared compiler options, but using that filename at the root would falsely identify the root as a compiled package.

## Decision

The root uses `tsconfig.json` for workspace configuration and `tsconfig.build-base.json` for shared compiled-build options. Each compiled package owns a `tsconfig.build.json` that extends the root base. The root does not contain `tsconfig.build.json`.

## Consequences

Build shape remains explicit per workspace while compiler policy stays central. Tooling can distinguish the monorepo root from compiled packages without special cases.
