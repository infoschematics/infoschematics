---
id: ADR-INFOSCHEMATICS-009
title: Host-provided versioned renderers
date: 2026-09-14
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-005, ADR-INFOSCHEMATICS-006]
---

# ADR-INFOSCHEMATICS-009: Host-provided versioned renderers

## Context

Fabrics, Overlays, and Callouts may need domain-specific visual treatments, while authored Infoschematics must remain serialisable and reusable across React, static SVG, and future outputs. Embedding components or using a process-global registry would break that boundary.

## Decision

Authored data selects a renderer property contract with a stable key and positive schema version, alongside plain serialisable properties. A scalar key remains compatibility input with the deterministic meaning of version `1`; canonical data and serialisation use the structured key-and-version reference. Each host supplies an immutable renderer registry to the View instance. A registry definition binds one key and version to a property validator and implementation; the owning View resolves the exact requested pair and validates properties before rendering.

Unknown keys, unregistered requested versions, invalid properties, and duplicate key-and-version definitions produce structured diagnostics and deterministic accessible fallbacks. A registry may deliberately provide several versions under one key, but resolution never guesses or silently falls forward. Failures never remove View-owned geometry, selection, navigation, or labels.

## Consequences

Hosts can evolve incompatible property contracts without multiplying otherwise stable renderer keys, while authored data remains executable-code-free and independent of cross-host state. Scalar compatibility input remains predictable, and canonical serialisation makes version selection visible. Hosts must retain every version still requested by supported documents or accept an explicit fallback diagnostic; they cannot rely on implicit negotiation.
