---
id: PDR-INFOSCHEMATICS-001
title: A framework-neutral Infoschematic library
date: 2026-08-22
status: current
decision_type: product
decision_type_url: https://knowledgeislands.info/specifications/decision-records/pdr
decision_depends_on: [GDR-INFOSCHEMATICS-001]
transferred_from: PDR-IBC2026-001
---

# PDR-INFOSCHEMATICS-001: A framework-neutral Infoschematic library

## Context

The first realisation produced reusable geometry, routing, placement, editing, presentation, and rendering concepts alongside one 5G-EMERGE Infoschematic. Keeping those concepts tied to the realisation would make every new Infoschematic repeat the same work or vendor the source.

## Decision

Infoschematics is a reusable library. Its Domain Model is serialisable and framework-neutral. Domain Core supplies domain behaviour without visualisation or framework dependencies. View Model derives geometry and editing primitives without React. Renderers and interactive views sit above those layers, while each authored Infoschematic and host application remains independently owned.

Dependencies point from a realisation toward the reusable library, never from the library toward a realisation.

## Consequences

The first realisation becomes a consumer rather than the owner of the tool. Generic packages use generic vocabulary even when only one realisation initially exercises a capability. The extra abstraction is intentional: it creates an importable product boundary and lets SVG, React, and future outputs share one model.
