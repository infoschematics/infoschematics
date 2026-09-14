---
id: INFOSCHEMATICS-TOOL-050
area: TOOL
title: TypeScript CLI input
theme: tool
horizon: future
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-14T07:02:11Z
---

# TypeScript CLI input

## Goal

Decide whether trusted command-line workflows should be able to render an Infoschematic exported by an executable TypeScript module without weakening the canonical serialisable-data boundary.

## Context

The renderer command intentionally accepts YAML and JSON and rejects executable TypeScript. Programmatic TypeScript callers can already construct the canonical model through the library, but there is no CLI bridge for those trusted projects.

## Boundary

This item does not permit callbacks or runtime state in authored Infoschematic data, execute remote modules, silently trust arbitrary source, or replace YAML as the preferred authoring format.

## Discussion

### Trust boundary

Loading a TypeScript module executes code with the user's authority and is fundamentally different from parsing data. Any future support needs an explicit trusted-input mode with clear security guidance rather than format auto-detection.

### Alternatives

A small programmatic wrapper around the renderer library may remain safer and clearer than adding module execution to the general command. Shaping should retain rejection if no compelling CLI-specific workflow exists.
