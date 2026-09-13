---
id: ADR-INFOSCHEMATICS-016
title: Keep Region bounds explicit
date: 2026-09-13
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-003, ADR-INFOSCHEMATICS-006]
---

# ADR-INFOSCHEMATICS-016: Keep Region bounds explicit

## Context

Matrix-like diagrams repeat coordinates. The IBC diagram has ten [Regions](../reference/vocabulary.md#region): six share its upper-row `y` and `height`, four share its lower-row values, and two span the same width. The self-describing Infoschematic has eleven Regions with three repeated panel-row extents and four repeated outer-row widths.

An authored Region reference could remove that repetition, but it would make one Region's geometry depend on another. That introduces partial-axis syntax, stale references, cycles, update propagation, and renderer ordering into a model where Regions otherwise state independent geography.

## Decision

Every Region owns complete explicit `bounds`. The canonical model does not derive a Region axis from another Region, infer containment, or make renderers resolve Region dependencies.

Programmatic authors may share immutable coordinate constants or use definition-time helpers that emit ordinary complete Regions. Authoring tools may align or distribute selected Regions, but the resulting document contains complete bounds for every Region. YAML and JSON deliberately retain the repeated values.

## Consequences

Any Region can be moved, resized, removed, validated, and rendered without changing another Region. Canvas and static SVG keep identical inputs and require no cycle or dependency handling. Matrix-row changes remain coordinated authoring edits; future ergonomics should improve multi-selection or alignment operations rather than add hidden canonical geometry.
