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

[ADR-INFOSCHEMATICS-007](ADR-INFOSCHEMATICS-007-site-as-public-outlet.md) made the Site the public outlet and required documentation to be authored once under `docs/`. The consumer user guide has since outgrown that arrangement: it is a step-by-step progression whose order, page boundaries, and onward links are publication decisions, and its pages will progressively become interactive Site content with live specimens rather than plain Markdown. Repository-facing documents — decisions, design, specifications, reference material, and maintainer guides — have no such trajectory.

## Decision

The consumer user guide is Site-owned content under `apps/site/content/`, published as an ordered progression under `/docs/`. Its pages may be Markdown or interactive Site modules; either way they are publication artefacts of the Site application, not canonical repository documentation.

`docs/` remains the canonical home for repository documentation: decision records, design documents, specifications, roadmap records, reference material, and maintainer guides. The Site continues to render selected repository documents — currently the vocabulary reference and the design documents — directly from `docs/` without maintaining copies.

This is a scoped amendment of ADR-INFOSCHEMATICS-007's "documentation remains authored once under `docs/`" clause. ADR-007 stays current for the outlet and ownership boundaries: the Site still owns no reusable product behaviour, and general Infoschematic capability still moves into the appropriate package before the Site consumes it.

## Consequences

The user guide can adopt Site capabilities — live rendering, interactive specimens, ordered navigation — page by page without fighting a canonical-Markdown constraint. Guide content authored under `apps/site/content/` must use absolute site paths for published pages and absolute repository URLs for repository material, because it no longer lives at a repository path relative links can resolve against. Vocabulary citations in guide content remain verified alongside those in `docs/`.
