---
id: INFOSCHEMATICS-TOOL-115
area: TOOL
title: Linking to one part
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-21T19:30:00Z
updated_at: 2026-09-21T19:30:00Z
---

# Linking to one part

## Goal

Settle whether surrounding prose can point at one part of an embedded [Infoschematic](../reference/vocabulary.md#infoschematic) — an artefact, a Scope, or a Scene — so that a sentence about a component can take the reader to it.

## Context

[PDR-INFOSCHEMATICS-004](../decisions/PDR-INFOSCHEMATICS-004-product-messaging.md) positions an Infoschematic as an input embedded where it is read, and [the Getting started guide](../../apps/site/content/getting-started.md) now says so. Nothing delivers the capability that positioning implies: an embedded Diagram is reached as a whole, and a document that wants to discuss one part of it has to describe where to look.

The identities needed already exist and are stable by design. `ADR-INFOSCHEMATICS-003` authors human-readable identity codes rather than deriving them from order, so an artefact can be named durably from outside; Scopes and Scenes are named in the document too. The Canvas can already centre on a coordinate (`packages/view-canvas/src/viewport.ts`), and Present already selects a Scene, so the mechanics of arriving somewhere exist.

What is undecided is the seam. `ADR-INFOSCHEMATICS-005` gives the host routing, page metadata, and URL ownership, so a deep link cannot be a package concern without contradicting it, and a Diagram that reads `window.location` itself would be the same contradiction in a different place.

## Boundary

A decision item about addressing, not about navigation chrome. It does not add a model concept, and it does not move routing into any package: whatever lands has to be a host-driven selection the Diagram accepts, consistent with `ADR-INFOSCHEMATICS-005`.

It does not cover editing, linking into Studio state, or linking to a Dynamic occurrence, which `ADR-INFOSCHEMATICS-012` keeps transient.

## Discussion

Captured on 2026-09-21 as the capability the positioning work implies but nothing provides.

Questions worth putting side by side when this is shaped:

- **What is addressable.** An artefact, a Scope, and a Scene are three different kinds of destination; the smallest useful version may be Scopes only.
- **What arriving means.** Centring the viewport, selecting the artefact, and emphasising it are separable, and an emphasis on arrival risks colliding with authored Dynamics.
- **Who owns the address.** A host-supplied selection keeps the ownership rule intact and makes the same mechanism serve a documentation anchor, a query parameter, and a presenter's cue.
- **What a static outlet does with it.** An SVG in a document cannot navigate, so the deterministic renderer would either honour the same selection as a framed output or say plainly that it does not.
