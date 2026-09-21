---
id: INFOSCHEMATICS-TOOL-115
area: TOOL
title: Linking to one part
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-21T19:30:00Z
updated_at: 2026-09-22T00:15:00Z
---

# Linking to one part

## Goal

Surrounding prose can point at one part of an embedded [Infoschematic](../reference/vocabulary.md#infoschematic) — an artefact or a Scope — so a sentence about a component takes the reader to it.

## Context

[PDR-INFOSCHEMATICS-004](../decisions/PDR-INFOSCHEMATICS-004-product-messaging.md) positions an Infoschematic as an input embedded where it is read, and [the Getting started guide](../../apps/site/content/getting-started.md) now says so. Nothing delivers the capability that positioning implies: an embedded Diagram is reached as a whole, and a document that wants to discuss one part of it has to describe where to look.

The identities needed already exist and are stable by design. `ADR-INFOSCHEMATICS-003` authors human-readable identity codes rather than deriving them from order, so an artefact can be named durably from outside; Scopes and Scenes are named in the document too. The Canvas can already centre on a coordinate (`packages/view-canvas/src/viewport.ts`), and Present already selects a Scene, so the mechanics of arriving somewhere exist.

What is undecided is the seam. `ADR-INFOSCHEMATICS-005` gives the host routing, page metadata, and URL ownership, so a deep link cannot be a package concern without contradicting it, and a Diagram that reads `window.location` itself would be the same contradiction in a different place.

## Boundary

A decision item about addressing, not about navigation chrome. It does not add a model concept, and it does not move routing into any package: whatever lands has to be a host-driven selection the Diagram accepts, consistent with `ADR-INFOSCHEMATICS-005`.

It does not cover editing, linking into Studio state, or linking to a Dynamic occurrence, which `ADR-INFOSCHEMATICS-012` keeps transient.

## Current state

An embedded Diagram is reached as a whole. `packages/view-canvas/src/viewport.ts` can centre on a diagram coordinate, `ADR-INFOSCHEMATICS-027` already models one ordered selection with an anchor, and Present already focuses a Scene — so arriving somewhere is mechanically solved in three places and addressable from none of them.

The identities are stable by design: `ADR-INFOSCHEMATICS-003` authors human-readable codes rather than deriving them from order, and Scopes and Scenes are named in the document.

The constraint is ownership. `ADR-INFOSCHEMATICS-005` gives the host routing, page metadata and URL, so a Diagram that read `window.location` itself would contradict it. Whatever lands is therefore a resolved input the host supplies, exactly as `INFOSCHEMATICS-TOOL-117` resolves a colour scheme.

## Steps

- [ ] Take the decision and record it: what is addressable, what arriving means, and that the host owns the address while the Diagram takes a resolved destination.
- [ ] Define the destination in the View Model over authored identity — an artefact code or a Scope id — and resolve it to a viewport and a selection without reading any browser state.
- [ ] Accept the destination as a Diagram input, centring the viewport and selecting the named part, and leave authored Dynamics untouched: arrival is not an emphasis.
- [ ] Make an unresolvable destination a quiet no-op with a reported reason rather than a thrown error, because an address in someone else's prose outlives the document it points into.
- [ ] Announce arrival to an assistive reader, per `ADR-INFOSCHEMATICS-033`.
- [ ] State plainly what a static outlet does: an SVG cannot navigate, so the deterministic renderer either frames the named part or says it does not honour a destination.
- [ ] Show the mechanism working from a host in the website, since the claim is that surrounding prose can point into a drawing.

## Files touched

`packages/view-model` for destination resolution and its test; `packages/view-canvas` for the input and the arrival behaviour; `apps/site` for the host that demonstrates it; `docs/specs/` for the requirements; a new Decision Record.

## Verify

`bun run self:check`. Destination resolution is unit-tested over an artefact code, a Scope id, and an identity that does not resolve.

Arrival is proved in a browser: the viewport centres on the named part, the selection is what was addressed, and no Dynamic starts. The unresolvable case asserts that the Diagram still mounts and still draws.

## Dependencies / blocks

Nothing blocks it. It is independent of [INFOSCHEMATICS-TOOL-114](INFOSCHEMATICS-TOOL-114-detail-follows-magnification.md), which deliberately leaves named views here.

## Documentation impact

### Decision Records

A new record deciding that a destination is authored identity resolved by the host and accepted by the Diagram, that arriving is centring and selecting rather than emphasising, and that an unresolvable destination is not an error.

### Specifications

`docs/specs/runtime-model.md` or `docs/specs/diagram-elements.md` states the destination input and its resolution; `docs/specs/static-rendering.md` states what a still outlet does with one.

### Guides

The React integration guide shows a host turning a URL into a destination; the consumer guide shows prose pointing at one part of an embedded diagram.

### Roadmap

Nothing follows necessarily. Linking into Studio state and into a Dynamic occurrence stay out, the latter because `ADR-INFOSCHEMATICS-012` keeps an occurrence transient.

## Discussion

Captured on 2026-09-21 as the capability the positioning work implies but nothing provides.

Questions worth putting side by side when this is shaped:

- **What is addressable.** An artefact, a Scope, and a Scene are three different kinds of destination; the smallest useful version may be Scopes only.
- **What arriving means.** Centring the viewport, selecting the artefact, and emphasising it are separable, and an emphasis on arrival risks colliding with authored Dynamics.
- **Who owns the address.** A host-supplied selection keeps the ownership rule intact and makes the same mechanism serve a documentation anchor, a query parameter, and a presenter's cue.
- **What a static outlet does with it.** An SVG in a document cannot navigate, so the deterministic renderer would either honour the same selection as a framed output or say plainly that it does not.

### Adoption

Adopted for immediate work on 2026-09-21. Scenes are dropped from the addressable set for a first delivery: Present already selects a Scene by its own route, so an artefact code and a Scope id are what surrounding prose actually lacks.
