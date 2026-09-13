---
id: ADR-INFOSCHEMATICS-014
title: Site-owned user guide
date: 2026-09-09
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-007]
---

# ADR-INFOSCHEMATICS-014: Site-owned user guide

## Context

The consumer guide is an ordered public journey whose pages increasingly use live examples and interaction. Repository decisions, specifications, design documents, reference material, and maintainer guides have a different audience and lifecycle.

## Decision

The consumer guide is Site-owned content under `apps/site/content/` and is published under `/docs/`. Its pages may be Markdown or interactive Site modules. Canonical repository documentation remains under `docs/`, and Site may render selected repository documents directly without copying them.

This narrows [ADR-INFOSCHEMATICS-007](ADR-INFOSCHEMATICS-007-site-as-public-outlet.md) without changing its rule that reusable product behaviour belongs in packages before Site consumes it.

## Consequences

The public guide can evolve as an interactive journey while repository documentation remains canonical for maintainers. Site-owned pages use public URLs for other guide pages and repository URLs for canonical repository material.
