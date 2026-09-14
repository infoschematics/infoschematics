---
id: INFOSCHEMATICS-TOOL-047
area: TOOL
title: Raster renderer output
theme: tool
horizon: future
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-14T07:02:11Z
---

# Raster renderer output

## Goal

Let command-line users render a canonical Infoschematic directly to a deterministic raster image when an SVG is not suitable for the consuming workflow.

## Context

The renderer command deliberately emits SVG only. Raster conversion remains possible through external tools, but the supported command does not own viewport scale, output density, background, font, or conversion reproducibility.

## Boundary

This item does not replace SVG as the canonical static output, bundle an arbitrary browser, or promise pixel identity across unpinned platform font stacks.

## Discussion

### Determinism

Shaping must choose an explicit conversion engine and define viewport, scale, background, font, metadata, and platform guarantees before raster output can become a supported contract.

### Formats

PNG is the likely first format. Additional bitmap or document formats should be selected separately rather than inferred from whichever converter is adopted.
