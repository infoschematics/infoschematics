---
id: INFOSCHEMATICS-TOOL-007
area: TOOL
title: Generalise renderer registry
theme: tool
horizon: soon
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-008]
baseline_ref: null
---

## Goal

Define a stable, extensible renderer-key contract for authored Fabrics, Graphics and Callouts without placing React values in serialisable configuration.

## Context

The model already carries renderer keys and serialisable properties, while React owns the corresponding visual implementations. The current built-in Fabric renderers demonstrate the seam but do not yet define registration, validation, fallback behaviour or compatibility for external hosts.

## Boundary

This item does not put JSX, component constructors or callbacks into `InfoschematicConfig`. It does not add domain-specific renderers to Core or Model, and it does not require the website to own reusable rendering behaviour.

## Shaping

Place renderer lookup and fallback at the Canvas host boundary established by `INFOSCHEMATICS-TOOL-008`, while authored data retains only stable keys and serialisable properties. Before promotion, choose the public registry API, define versioned property validation and diagnostics, specify deterministic unknown-key fallbacks for Fabrics, Graphics and Callouts, and prove that external hosts can register implementations without introducing React into Domain Model or authored definitions.

## Discussion

### Extension seam

Shaping should decide whether renderer registration is an application prop, provider or explicit React-package API. Unknown keys need deterministic fallback and diagnostics, and each public key needs a versioned property schema before examples rely on it.
