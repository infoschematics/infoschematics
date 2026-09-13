---
id: PDR-INFOSCHEMATICS-001
title: Framework-neutral library
date: 2026-08-22
status: current
decision_type: product
decision_type_url: https://knowledgeislands.info/specifications/decision-records/pdr
decision_depends_on: [GDR-INFOSCHEMATICS-001]
---

# PDR-INFOSCHEMATICS-001: Framework-neutral library

## Context

Infoschematics provides a reusable model for structure, geometry, presentation, editing, and rendering. Binding that model to one UI framework or authored example would make every consumer repeat the same work and would prevent parallel renderers from sharing a contract.

## Decision

Infoschematics is a framework-neutral library. Domain Model owns dependency-free serialisable types; Domain Core owns domain behaviour; View Model owns derived visual and editing calculations. Interactive views and static renderers depend on those layers. Authored Infoschematics and host applications remain independent consumers, and reusable packages never depend on a particular example or host.

## Consequences

React, SVG, and future outputs can share one model without importing one another. New reusable behaviour belongs in the lowest layer that can own it; application-specific composition remains outside the library.
