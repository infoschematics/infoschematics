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

An Infoschematic can carry stable presentation intent, such as a blueprint surface, visible grid, framed geography, compact Cards, and semantic Card colour. Canvas and static SVG also need to omit optional Card detail for a particular output size without deleting authored information. Treating every visual value as authored configuration would expose renderer implementation details, while treating all presentation as host policy would make the same definition lose its intended character across outputs.

Scope and Domain introduce a related distinction. Scope controls whether an artefact applies to the current view. Domain classifies a Card for semantic visual grouping. Coupling Domain colour to Scope filtering would make appearance change when applicability changes.

## Decision

Authored appearance is narrow, typed, serialisable presentation intent. It may select the neutral or blueprint surface, no grid or one of the standard grid treatments, Card compactness and default metadata visibility, and Lane or Zone frame, label-placement, and label treatments. A Region frame is absent, solid, dashed, or dotted. Its label independently selects plain or notched treatment and one of nine compass placements rather than free coordinates. Label treatments and positions are resolved into deterministic geometry in View Model; a missing or hidden label suppresses its notch, and notch padding remains symmetric.

An output may override only the visibility of Card identity, stereotype, and description. These overrides do not mutate or remove authored data and do not replace authored compactness, region treatments, semantic colours, or geometry. Canvas and static SVG consume the same View Model treatment and region-geometry resolvers.

Reusable measurements and fallback colours remain invariant renderer tokens. They are not per-Infoschematic theme knobs. The framework-neutral TypeScript token manifest is authoritative; Canvas consumes its generated CSS projection and static SVG consumes the manifest directly.

Domain is an authored Card classification with its own catalogue, label, colour, and fill. Scope remains an independent applicability reference. A resolved Domain supplies Card semantic colour when present; the existing Scope treatment remains the compatibility fallback for a Card without Domain classification. Domain identifiers must be unique and Card references must resolve.

Omitted appearance retains the existing readable result: neutral surface, no authored grid, non-compact Cards, hidden optional Card metadata, solid-framed Lanes with plain labels, and unframed Zones with plain labels. Region labels follow the Lane legend edge when no explicit placement is authored.

## Consequences

One serialisable definition can preserve intended visual character across interactive and static renderers while each output can reduce optional Card detail to suit available space. Renderer parity is testable through shared resolved values, deterministic geometry, semantic attributes, and accessible labelling.

Authors gain deliberate presentation choices but not arbitrary CSS, freeform geometry, or renderer-specific callbacks. Adding a new treatment requires a Domain Model contract, framework-neutral resolution, and parity evidence rather than a local View shortcut. Scope filtering and Domain colour can evolve independently without overloading either concept.
