---
id: ADR-INFOSCHEMATICS-013
title: Validation mirrors the contract
date: 2026-09-08
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-005, ADR-INFOSCHEMATICS-008]
---

# ADR-INFOSCHEMATICS-013: Validation mirrors the contract

## Context

The canonical Infoschematic model is serialisable data. TypeScript can check programmatic construction, but YAML and JSON need runtime validation with useful paths. Making a schema library own the public type would move contract ownership out of dependency-free Domain Model.

## Decision

Domain Model remains the dependency-free owner of canonical types. Domain Core owns a strict Zod schema that mirrors those types, with bidirectional compile-time parity assertions so either side drifting fails type-checking. JSON Schema is generated from the same runtime schema.

YAML is the preferred authored document format and JSON is accepted as the same restricted plain-data model. Both parse through the same validation and normalisation boundary before Views or renderers receive them. Programmatic TypeScript construction targets the same canonical types; authored documents do not execute JavaScript.

## Consequences

Documents receive path-specific diagnostics without adding dependencies to the contract package. Schema and type changes must land together. YAML, JSON, generated schema, and programmatic construction converge on one normalised model, while comments and editor-specific concrete syntax remain authoring concerns rather than domain semantics.
