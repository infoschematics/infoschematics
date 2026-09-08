---
id: GDR-INFOSCHEMATICS-003
title: Root build tsconfig is a base, not a shape
date: 2026-09-04
status: current
decision_type: governance
decision_type_url: https://knowledgeislands.info/specifications/decision-records/gdr
decision_depends_on: [ADR-INFOSCHEMATICS-010]
---

# GDR-INFOSCHEMATICS-003: Root build tsconfig is a base, not a shape

## Context

The engineering standard recognises compiled-build shape from a workspace's own `tsconfig.build.json`. This multi-package repository also needs shared compiler options, but a root file with that name would be mistaken for a flat single-package build.

## Decision

The repository root uses `tsconfig.json` for workspace configuration and `tsconfig.build-base.json` for shared compiled-build options. Each compiled package owns its own `tsconfig.build.json` and extends the root build base.

The root must not contain `tsconfig.build.json` while that filename is the standard's per-workspace shape marker.

## Consequences

New compiled workspaces extend `../../tsconfig.build-base.json`. Per-workspace build shape remains explicit, shared options remain central, and repository tooling does not misclassify the monorepo as a flat package.
