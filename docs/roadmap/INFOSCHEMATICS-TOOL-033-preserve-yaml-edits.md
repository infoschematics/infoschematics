---
id: INFOSCHEMATICS-TOOL-033
area: TOOL
title: Preserve YAML edits
theme: tool
horizon: future
status: draft
candidate: true
blocks: []
blocked_by: []
baseline_ref: null
---

# Preserve YAML edits

## Goal

Let Studio edit an authored YAML document without discarding its comments, deliberate formatting, or stable review history.

## Context

`INFOSCHEMATICS-TOOL-032` established YAML as the primary inert document representation but intentionally parses it to plain canonical data. A later editorial layer should retain the YAML document tree and express changes as serialisable operations addressed by stable domain IDs.

## Boundary

This item will define the lossless document boundary and editing operation protocol. It does not reopen the canonical domain model, introduce executable document values, or make array positions durable identities.

## Discussion

### Patch vocabulary

A YAML-compatible patch format can use stable element IDs and domain-aware selectors rather than brittle array indices. The operation set should remain inert data and support readable previews, undo and redo, collaboration, and agent-authored edits.

### Source preservation

Edits must apply to the YAML concrete syntax or document tree rather than round-tripping through plain JavaScript objects. That is the point at which comments, scalar styles, ordering, and surrounding formatting can be retained deliberately.

### Promotion condition

Shape this work after the canonical YAML loader is delivered and the Studio editing boundary is ready to move away from established configuration state.
