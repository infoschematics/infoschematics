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

Authored Fabrics, Graphics, and Callouts need domain-specific visual treatments, while Infoschematic definitions must remain serialisable and reusable across React, static SVG, and future outputs. Mapping an authored renderer key directly to a component does not establish which property shape that component accepts, how that shape evolves, or what happens when a host cannot render it. A mutable process-global registry would also leak registrations between hosts, requests, and tests.

## Decision

An authored renderer reference contains only a stable key and serialisable properties. React components, property validators, diagnostic callbacks, and supporting SVG definitions remain host runtime configuration and never enter `InfoschematicConfig`.

Each mounted application receives an immutable renderer registry through its public View prop. Canvas owns the registry contract for Fabric and Graphic definitions; Present extends it for Callout definitions. React context may distribute the supplied registry within a View, but it is not a public registration API and no process-global mutation is allowed.

A renderer definition binds one stable key and positive schema version to a runtime property validator and a React implementation. The owning View validates properties before invoking the implementation. An unknown key, unsupported definition version, invalid property value, or duplicate key emits a structured diagnostic through the optional host callback and selects the product fallback instead of throwing or silently removing the authored content. Registry inputs are snapshotted so later host mutation cannot change a mounted registry; the first definition for a duplicate key wins deterministically.

Fallbacks are deterministic and accessible. A Fabric keeps its labelled bounds, a Graphic receives a labelled placeholder, and a Callout keeps the standard Audience title, body, takeaways, position, and controls. Renderer lookup or validation failure cannot remove View-owned geometry, selection, navigation, or accessibility semantics.

The current authored reference has no separate schema-version field, so the public definition contract supports schema version `1`. Backwards-compatible validator changes may retain the key and version. An incompatible property change requires a new stable renderer key while hosts migrate authored definitions deliberately. Adding an authored version selector is a future Domain Model change rather than an implicit interpretation of existing data.

## Consequences

The same serialisable Infoschematic can be mounted by different React hosts or consumed by non-React renderers without importing executable host code. Server rendering and concurrent mounts are isolated because registry ownership follows the application instance.

Hosts must maintain renderer keys as compatibility contracts, validate untrusted properties, observe diagnostics, and supply intentional migrations. Missing or malformed extensions remain legible to the Audience, but use a generic treatment until the host supplies a compatible definition.
