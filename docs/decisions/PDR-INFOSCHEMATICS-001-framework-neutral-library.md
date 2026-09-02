---
id: PDR-INFOSCHEMATICS-001
title: A framework-neutral Infoschematic library
date: 2026-08-22
status: current
decision_type: product
decision_type_url: https://knowledgeislands.info/specifications/decision-records/pdr
decision_depends_on: [GDR-INFOSCHEMATICS-001]
---

# PDR-INFOSCHEMATICS-001: A framework-neutral Infoschematic library

## Context

Infoschematics provides geometry, routing, placement, editing, presentation, and rendering concepts that apply across independently authored products. Tying those concepts to one realisation would make every new Infoschematic repeat the same work or vendor source.

## Decision

Infoschematics is a reusable library. Its Domain Model is serialisable and framework-neutral. Domain Core supplies domain behaviour without visualisation or framework dependencies. View Model derives geometry and editing primitives without React. Renderers and interactive views sit above those layers, while each authored Infoschematic and host application remains independently owned.

Dependencies point from a realisation toward the reusable library, never from the library toward a realisation.

## Consequences

Each realisation is a consumer rather than the owner of the tool. Generic packages use generic vocabulary even when only one realisation exercises a capability. The abstraction is intentional: it creates an importable product boundary and lets SVG, React, and future outputs share one model.
