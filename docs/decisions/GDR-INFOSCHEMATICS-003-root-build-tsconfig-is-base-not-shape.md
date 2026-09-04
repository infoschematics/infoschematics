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

The KI engineering standard detects a package's compiled-build shape from a per-workspace `tsconfig.build.json`. ADR-INFOSCHEMATICS-010's coordinated release contract already used a root-level `tsconfig.build.json` to hold the compiler options every published package's own build config extended. That single filename served two different roles at once: the standard's per-workspace shape marker, and this repository's shared base. Detected at the root, it triggered flat-shape build expectations that do not apply to a multi-package monorepo.

## Decision

The shared base file used to be `tsconfig.base.json` and `tsconfig.build.json` at the root; it is now `tsconfig.json` (the workspace-root config the standard itself expects) and `tsconfig.build-base.json` (the shared compiled-build options). Every package's own `tsconfig.build.json` extends `tsconfig.build-base.json` and remains the standard's per-workspace shape marker. No package's compiled output, public API, or release contract changes; only the shared file's name and its extension chain move.

## Consequences

A new package added under `packages/` or `examples/` extends `../../tsconfig.build-base.json` rather than a root `tsconfig.build.json`, and the root itself carries only `tsconfig.json`. The rename is repository-specific scaffolding, not a product decision, but it is durable: reintroducing a root `tsconfig.build.json` would silently re-trigger the standard's flat-shape detection.
