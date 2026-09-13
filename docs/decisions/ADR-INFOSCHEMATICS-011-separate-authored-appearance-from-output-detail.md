---
id: ADR-INFOSCHEMATICS-011
title: Separate authored appearance from output detail
date: 2026-09-03
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-001, ADR-INFOSCHEMATICS-006]
---

# ADR-INFOSCHEMATICS-011: Separate authored appearance from output detail

## Context

An author choosing semantic visual identity is different from a host choosing how much optional detail an output can show. Conflating them would let viewport or presentation policy silently change the meaning of a Diagram.

## Decision

Authored appearance is narrow, typed, and serialisable. Card Collections provide the default semantic identity for their Cards, Flow Families provide it for their Flows, and Fabrics and Regions may carry their identity directly. Architectural Scopes are presentation overlays and do not provide element identity. Individual elements may carry only the deliberate overrides admitted by the canonical model.

Output-detail policy may reduce optional labels, descriptions, codes, or other metadata without mutating authored data, geometry, or semantic identity. Shared measurements and fallback colours are renderer tokens, not arbitrary per-Infoschematic CSS.

## Consequences

One authored model retains its intended visual meaning across interactive and static outputs while each output can fit its available space. Adding an appearance treatment requires a canonical contract, framework-neutral resolution, documented examples, and renderer-parity evidence.
