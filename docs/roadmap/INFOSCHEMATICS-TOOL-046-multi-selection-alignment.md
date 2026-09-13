---
id: INFOSCHEMATICS-TOOL-046
area: TOOL
title: Multi-selection alignment
theme: tool
horizon: future
status: draft
candidate: true
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-13T20:08:57Z
---

# Multi-selection alignment

## Goal

Let Producers select several diagram elements and align, distribute, or move them together so repeated layout coordinates do not need to be maintained one element at a time.

## Context

Matrix-like geographies currently retain explicit repeated coordinates in YAML and JSON. That keeps the authored model complete and portable, but [Design](../reference/vocabulary.md#design) offers no multi-selection operation for efficiently maintaining those coordinates.

## Boundary

This item does not add persistent alignment constraints, derived Region extents, automatic layout, or implicit relationships between otherwise independent elements.

## Discussion

### Selection semantics

Shaping must decide which visual element kinds can participate together, how a primary element anchors alignment, and whether composed Cards move as one selectable unit.

### Authored result

Every operation should materialise ordinary canonical coordinates in one reviewable, undoable change. Reopening the same model must not require an alignment engine to reproduce its geometry.
