---
id: ADR-INFOSCHEMATICS-015
title: Specifications own realisation claims
date: 2026-09-10
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-006, ADR-INFOSCHEMATICS-013]
---

# ADR-INFOSCHEMATICS-015: Specifications own realisation claims

## Context

Cards and Flows previously named Interfaces they implemented or conformed to. That made the Diagram depend on an optional Specifications section and forced every claim through an Interface even when an external standard had no callable conformance point. It also split one relationship across Card, Flow, Interface, and Specification records.

Architectural Scopes already use the inverse direction: the additive view names Diagram elements, while the Diagram remains complete without it. UML and ArchiMate call the corresponding implementation relationship realisation.

## Decision

Specifications form a four-level tree: Specification Group, Specification, optional Interface, and optional Operation. Specification, Interface, and Operation MAY each declare `realisedBy`, containing Diagram element ids. Those references MUST resolve, while an element with no realisation claim remains valid.

Identity is the full group/specification/interface/operation path. An id therefore needs to be unique only within its parent. Ownership and document metadata live on the Specification; `documents` is a collection because one logical specification can have multiple published bindings. The Diagram carries no Specification, Interface, or Operation back-reference.

Views derive flat compatibility data, element-to-Specification indexes, and aggregate branch highlights from this tree. The canonical direction remains Specification to Diagram element.

## Consequences

The Diagram is self-contained and Specifications remain an additive overlay. External standards can be represented directly as Specifications; callable APIs can add Interfaces and Operations only where meaningful. One Specification branch can claim Cards, Flows, or other visible elements at the most useful level of detail.

Consumers that need reverse lookup derive it once rather than authoring duplicate links. Removing or renaming a Diagram element requires updating any `realisedBy` references, and Domain Core rejects stale references.
