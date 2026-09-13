---
id: ADR-INFOSCHEMATICS-017
title: Use deterministic Region label metrics
date: 2026-09-13
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-006, ADR-INFOSCHEMATICS-011]
---

# ADR-INFOSCHEMATICS-017: Use deterministic Region label metrics

## Context

Boundary-mounted [Region](../reference/vocabulary.md#region) labels cut a notch in the frame. View Model currently estimates horizontal text at 9.4 diagram units per character and uses a 14-unit vertical extent, 16-unit default inset, and 10-unit notch padding. Canvas and static SVG share the derived geometry, but these unexplained local constants can drift from the visual token manifest.

Browser text measurement follows the mounted font more closely but makes server rendering, tests, and static SVG depend on the environment and font-loading time. A glyph-width table remains an approximation, expands the Unicode contract, and binds geometry to one font revision.

## Decision

Region label and notch geometry remains deterministic and framework-neutral. The existing four measurements become named shared visual tokens consumed by the View Model resolver; their current values and the character-count calculation remain unchanged.

Both renderers continue to consume the same resolved label length, notch, and outline. Browser measurement and a glyph-width table are rejected. Authored `labelOffset` retains its present placement meaning and does not become a typography override.

## Consequences

The implementation is a zero-pixel refactor. Fixtures for short, long, narrow, mixed-case, numeric, and non-ASCII labels must retain current geometry across compass placements and both internal and boundary mounts.

A future font or metric change becomes an explicit visual-token migration with side-by-side evidence rather than an incidental renderer cleanup.
