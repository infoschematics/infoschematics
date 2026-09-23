---
id: ADR-INFOSCHEMATICS-016
title: Region geometry is stated, not derived
date: 2026-09-13
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-003, ADR-INFOSCHEMATICS-006, ADR-INFOSCHEMATICS-011]
---

# ADR-INFOSCHEMATICS-016: Region geometry is stated, not derived

## Context

A [Region](../reference/vocabulary.md#region) has geometry from two sources, and both offered a way to compute it instead of writing it down.

The first is its extent. Matrix-like diagrams repeat coordinates: the IBC diagram has ten Regions, six sharing its upper-row `y` and `height`, four sharing its lower-row values, and two spanning the same width; the self-describing Infoschematic has eleven Regions with three repeated panel-row extents and four repeated outer-row widths. An authored Region reference could remove that repetition, but it would make one Region's geometry depend on another, introducing partial-axis syntax, stale references, cycles, update propagation, and renderer ordering into a model where Regions otherwise state independent geography.

The second is its label. A boundary-mounted label cuts a notch in the frame, and View Model sizes that notch by estimating horizontal text at 9.4 diagram units per character against a 14-unit vertical extent, a 16-unit default inset, and 10-unit notch padding. Browser text measurement would follow the mounted font more closely, but it makes server rendering, tests, and static SVG depend on the environment and on font-loading time. A glyph-width table remains an approximation, expands the Unicode contract, and binds geometry to one font revision.

## Decision

A Region's geometry is stated in the document and resolved deterministically. Neither axis of it is computed from something the document does not contain.

**Every Region owns complete explicit `bounds`.** The canonical model does not derive a Region axis from another Region, infer containment, or make renderers resolve Region dependencies. Programmatic authors may share immutable coordinate constants or use definition-time helpers that emit ordinary complete Regions. Authoring tools may align or distribute selected Regions, but the resulting document contains complete bounds for every Region. YAML and JSON deliberately retain the repeated values.

**Label and notch geometry remains deterministic and framework-neutral.** The four measurements are named shared visual tokens consumed by the View Model resolver, rather than unexplained local constants that can drift from the visual token manifest; their values and the character-count calculation are unchanged by being named. Both renderers consume the same resolved label length, notch, and outline. Browser measurement and a glyph-width table are rejected. Authored `labelOffset` retains its placement meaning and is not a typography override.

## Consequences

Any Region can be moved, resized, removed, validated, and rendered without changing another Region. Canvas and static SVG keep identical inputs and require no cycle or dependency handling, and they resolve one label geometry rather than two approximations of it.

Matrix-row changes remain coordinated authoring edits; future ergonomics should improve multi-selection or alignment operations rather than add hidden canonical geometry.

Naming the label metrics is a zero-pixel change: fixtures for short, long, narrow, mixed-case, numeric, and non-ASCII labels retain their geometry across compass placements and both internal and boundary mounts. A future font or metric change becomes an explicit visual-token migration with side-by-side evidence rather than an incidental renderer cleanup.
