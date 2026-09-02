---
id: ADR-INFOSCHEMATICS-007
title: Site as the public outlet
date: 2026-09-02
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [GDR-INFOSCHEMATICS-001, ADR-INFOSCHEMATICS-004]
---

# ADR-INFOSCHEMATICS-007: Site as the public outlet

## Context

The public site, package examples, and consumer documentation were previously split between repositories. Keeping a second copy of guides on the site would create two sources of truth, while placing reusable behaviour inside the site would reverse package ownership.

## Decision

The Site workspace is the public outlet for this repository. It composes published package APIs, independently authored `is-*` examples, and selected canonical Markdown from `docs/`.

Documentation remains authored once under `docs/`. The site renders consumer guides and reference material at stable public routes. Maintainer-facing decisions, architecture, specifications, and roadmap records remain repository documents unless explicitly selected for publication.

## Consequences

Website presentation can improve without duplicating product knowledge. Examples prove public package seams and remain reusable outside the site. The Site workspace may own navigation, page metadata, layout, and deployment, but any general Infoschematic behaviour must move into the appropriate package before the site consumes it.
