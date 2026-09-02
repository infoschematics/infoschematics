---
id: INFOSCHEMATICS-TOOL-005
area: TOOL
title: Complete production modes
theme: tool
horizon: soon
status: draft
blocks: [INFOSCHEMATICS-TOOL-006]
blocked_by: [INFOSCHEMATICS-TOOL-008]
baseline_ref: null
---

## Goal

Make Present, Design and Direct explicit application modes with complete ownership of their settled production capabilities.

## Context

The vocabulary distinguishes the Audience-facing Present mode from the Producer's Design and Direct modes. Existing controls implement parts of each capability but still reflect the earlier theatre vocabulary and do not yet provide a coherent mode model, Theme authoring or Storyboard surface.

## Boundary

This item owns mode state, mode transitions and the division of production controls. It does not redesign the six artefact contracts, publish packages, or add a domain-specific Infoschematic.

## Shaping

Build the settled Present, Design and Direct vocabulary into an explicit mode model after `INFOSCHEMATICS-TOOL-008` establishes Present and Studio ownership. Present owns Audience session state; Studio owns the Producer's mode selection and the Design and Direct controls. Before promotion, specify transition behaviour, the single-active Scene, Theme or Story invariant, empty-sequence guards, Scope and Flow-family precedence, persistence boundaries, and interaction tests for every transition.

## Discussion

### Session semantics

Shaping must settle what happens to active presentation state across mode changes, ensure that at most one Standalone Scene, Theme or Story is active, define Scope and Flow-family visibility precedence, and prevent an empty Theme or Story from starting while still allowing either to be authored.
