---
id: PDR-INFOSCHEMATICS-003
title: Infoschematic
date: 2026-08-31
status: current
decision_type: product
decision_type_url: https://knowledgeislands.info/specifications/decision-records/pdr
decision_depends_on: [PDR-INFOSCHEMATICS-001]
---

# PDR-INFOSCHEMATICS-003: Infoschematic

## Context

The reusable library and the authored product need a shared name. The product explains how a system is structured and how things move through it; it is more specific than a generic diagram and broader than a schema.

## Decision

The tool is **Infoschematics** and one complete authored product is **an Infoschematic**. Use `infoschematic` as the naming stem unless a more specific role name is clearer.

## Consequences

The name provides one subject for the model, documentation, and public API. Charts, mind maps, and unconstrained drawings remain outside the product boundary. Packages keep responsibility-based names under `@infoschematics/*`.
