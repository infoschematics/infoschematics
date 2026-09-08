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

An Infoschematic needs stable presentation intent that survives across Canvas and static SVG. An individual output may also need to reduce optional detail for its available size. Treating every visual value as authored configuration would expose renderer internals; treating all presentation as host policy would discard the product's intended character.

Scope and Domain create a related boundary. Scope controls applicability and visibility. Domain classifies a Card for semantic visual treatment. One must not silently change the other.

## Decision

Authored appearance is narrow, typed, and serialisable. It covers Canvas surface and grid, Card compactness and default metadata visibility, and Region fill, frame, label placement, label mount, and label offset. Region labels use one of the closed compass positions and deterministic View Model geometry.

Output policy may override optional Card identity, stereotype, and description visibility without mutating authored data. It does not replace authored compactness, Region treatments, semantic colours, or geometry.

Shared measurements and fallback colours are invariant renderer tokens, not per-Infoschematic theme knobs. Canvas consumes their generated CSS projection and static SVG consumes the same framework-neutral manifest.

Domain and Scope remain independent. A resolved Domain supplies a Card's semantic colour when present; Scope treatment remains the fallback for a Card without Domain classification.

Omitted appearance preserves the documented renderer defaults: neutral surface, no grid, non-compact Cards, hidden optional Card metadata, and an unfilled, unframed Region with a plain boundary-mounted label.

## Consequences

One definition preserves intended visual character across interactive and static renderers while each output can reduce optional Card detail. Authors receive deliberate choices without arbitrary CSS, callbacks, or free-form renderer overrides.

Adding a treatment requires a Domain Model contract, framework-neutral resolution, catalogue entry, visual guidance, and renderer parity evidence. Scope filtering and Domain colour can evolve independently.
