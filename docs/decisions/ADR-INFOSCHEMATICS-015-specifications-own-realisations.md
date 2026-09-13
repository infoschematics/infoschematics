---
id: ADR-INFOSCHEMATICS-015
title: Specifications own realisations
date: 2026-09-10
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-006, ADR-INFOSCHEMATICS-013]
---

# ADR-INFOSCHEMATICS-015: Specifications own realisations

## Context

Diagram elements previously pointed to the interfaces they implemented or conformed to. That made the Diagram depend on an optional Specifications overlay and forced every claim through an interface even when an external standard had no callable conformance point.

## Decision

Specifications point to Diagram elements through sorted `realisedBy` identifiers. The optional hierarchy is group, specification, interface, and operation; each level may claim elements directly, and identities are paths whose segments are unique within their parent. A specification may carry multiple documents. Diagram elements carry no reverse specification reference.

Domain Core validates every `realisedBy` identifier. Views derive reverse indexes and aggregate descendant claims for presentation.

## Consequences

The Diagram is self-contained and Specifications remain additive. External standards can be represented directly, while callable APIs add interfaces and operations only where meaningful. Renaming or removing a realised element requires updating the overlay, and stale claims fail validation.
