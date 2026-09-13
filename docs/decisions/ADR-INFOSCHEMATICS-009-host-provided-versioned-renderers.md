---
id: ADR-INFOSCHEMATICS-009
title: Host-provided versioned renderers
date: 2026-09-03
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-005, ADR-INFOSCHEMATICS-006]
---

# ADR-INFOSCHEMATICS-009: Host-provided versioned renderers

## Context

Fabrics, Overlays, and Callouts may need domain-specific visual treatments, while authored Infoschematics must remain serialisable and reusable across React, static SVG, and future outputs. Embedding components or using a process-global registry would break that boundary.

## Decision

Authored data names a stable renderer key and plain serialisable properties. Each host supplies an immutable renderer registry to the View instance. A registry definition binds its key to a supported property schema, version, and implementation; the owning View validates properties before rendering.

Unknown keys, unsupported versions, invalid properties, and duplicate definitions produce structured diagnostics and deterministic accessible fallbacks. Failures never remove View-owned geometry, selection, navigation, or labels. Incompatible property changes require a new renderer key unless the Domain Model later adds explicit version selection.

## Consequences

Hosts can provide specialised rendering without executable authored data or cross-host state. The same Infoschematic remains usable by other hosts and renderers, and unsupported extensions stay legible.
