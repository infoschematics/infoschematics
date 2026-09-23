---
id: ADR-INFOSCHEMATICS-007
title: Site as public outlet
date: 2026-09-02
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [GDR-INFOSCHEMATICS-001, ADR-INFOSCHEMATICS-004]
---

# ADR-INFOSCHEMATICS-007: Site as public outlet

## Context

The public website must present package APIs, examples, and guidance without becoming the owner of reusable product behaviour or duplicating canonical repository knowledge.

## Decision

`apps/site` is the public outlet for this repository. It composes published package APIs, independently authored examples, Site-owned consumer-guide content, and selected canonical repository documents. It owns navigation, page metadata, layout, and deployment, but reusable Infoschematic behaviour belongs in the appropriate package first.

## Consequences

The website can evolve as a publication without forking product capability or maintainer documentation. Examples continue to prove the same public seams available to external hosts.
