---
id: INFOSCHEMATICS-TOOL-007
area: TOOL
title: Generalise renderer registry
theme: tool
horizon: future
status: draft
candidate: true
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Define a stable, extensible renderer-key contract for authored Fabrics, Graphics and Callouts without placing React values in serialisable configuration.

## Context

The model already carries renderer keys and serialisable properties, while React owns the corresponding visual implementations. The current built-in Fabric renderers demonstrate the seam but do not yet define registration, validation, fallback behaviour or compatibility for external hosts.

## Boundary

This item does not put JSX, component constructors or callbacks into `InfoschematicConfig`. It does not add domain-specific renderers to Core or Model, and it does not require the website to own reusable rendering behaviour.

## Discussion

### Extension seam

Shaping should decide whether renderer registration is an application prop, provider or explicit React-package API. Unknown keys need deterministic fallback and diagnostics, and each public key needs a versioned property schema before examples rely on it.
