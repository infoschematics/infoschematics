---
id: INFOSCHEMATICS-TOOL-009
area: TOOL
title: Centralise visual tokens
theme: tool
horizon: soon
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-008]
baseline_ref: null
---

## Goal

Give reusable visual decisions one framework-neutral, semantic token contract so renderers and views do not encode unrelated colour, spacing, line and typography choices independently.

## Context

The extraction removed the first realisation's authored content, but inherited visual decisions remain distributed across View Model values, Studio CSS and renderer-specific literals. That does not compromise repository separation, but it makes consistent Canvas, Present, Studio and static SVG output harder to maintain.

## Boundary

This item centralises existing visual decisions; it does not design multiple themes, add host-authored arbitrary styling, or make unrestricted colour and typography part of `InfoschematicConfig`.

## Shaping

Audit reusable values after `INFOSCHEMATICS-TOOL-008` has assigned Canvas, Present, Studio and static SVG ownership. Define framework-neutral semantic tokens below React, adapt them into renderer-appropriate forms, and leave interaction chrome with its owning View. Before promotion, inventory literals and existing tokens, settle naming and override boundaries, identify migration slices, and specify cross-renderer consistency tests without turning authored configuration into a styling API.

## Discussion

### Ownership

Shaping should distinguish structural tokens shared by all renderers from view-only interaction and chrome tokens. Framework-neutral values belong below React, while Producer controls and transient interaction states remain with their owning view package.

### Relationship to package extraction

[INFOSCHEMATICS-TOOL-008](INFOSCHEMATICS-TOOL-008-establish-additive-views.md) may move already-shared values when required to prevent duplication, but this item owns the comprehensive audit, naming and consolidation pass.
