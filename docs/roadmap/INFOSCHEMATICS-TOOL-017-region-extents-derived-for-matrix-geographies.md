---
id: INFOSCHEMATICS-TOOL-017
area: TOOL
title: Region extent decision
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

# Region extent decision

## Goal

Decide whether Region extents should derive from another Region, expand through an authoring helper, or remain explicit, using real matrix-geography evidence and a recorded product boundary.

## Context

The Region model deliberately has no row, column, containment, or nesting concept. The 5G-EMERGE IBC migration exposed repeated geometry: each column Region duplicates the y and height of its row. Resizing a row therefore requires coordinated edits across every column. A derivation mechanism could reduce that cost, but it could also introduce hidden containment semantics into an otherwise explicit geometry model.

## Boundary

This item makes and records the contract decision. It does not implement a new Region field or renderer behaviour, reintroduce lane or zone kinds, create mandatory nesting, or make renderers walk a containment hierarchy. If implementation is selected, it receives a separately scoped work item.

## Current state

Every Region owns a complete explicit box. TypeScript definitions can share constants, but YAML and JSON documents repeat coordinates. The IBC definition and the Infoschematics self-description are the only known matrix-style consumers.

## Steps

- [ ] Measure duplicated Region coordinates and representative resize changes in the two known matrix-style definitions.
- [ ] Compare an authored reference, a definition-time expansion helper, render-time clipping, and documented explicit geometry against serialisability, cycle detection, editor behaviour, renderer parity, and YAML usability.
- [ ] Prototype only enough data and geometry resolution to expose ambiguity, error handling, and cross-axis semantics; do not land a public field in this decision item.
- [ ] Record one decision that either retains explicit boxes or selects a precise derivation owner, syntax, validation rules, and editor response.
- [ ] Update affected specification gaps and capture one bounded implementation record only if the selected decision requires production change.

## Files touched

- docs/decisions/
- docs/decisions/README.md
- docs/specs/domain-model.md
- docs/specs/domain-core.md
- docs/specs/view-model.md
- docs/roadmap/

## Verify

Review the decision against both known definitions and confirm it answers ownership, serialisation, invalid references, cycles, editor movement, and renderer parity. Run ki repo audit --skill ki-work-roadmap --repo . and bun run self:check after documentation changes.

## Dependencies / blocks

The explicit Region box contract and both proving definitions have landed. No implementation dependency is required for this decision.

## Documentation impact

### Decision Records

Add an architecture decision recording the selected Region extent model and rejected alternatives.

### Specifications

Update only the affected gaps or requirements needed to reflect the decision; do not specify an unselected implementation.

### Guides

If explicit geometry remains the contract, add the shared-constant TypeScript authoring idiom. Otherwise defer user guidance to the implementation item.

### Roadmap

Create a separate implementation record only when the decision selects new product behaviour.

## Discussion

### Decision criteria

The preferred outcome minimises duplicated authoring without making geometric containment implicit. A feature used only by TypeScript definitions may not justify a document-level contract.

### Candidate mechanisms

An authored reference is portable but adds reference validation and editor coupling. A definition helper keeps the canonical model explicit but does not help plain YAML. Render-time clipping is the most powerful option and carries the greatest semantic cost.

### Completion outcome

A supported decision to retain explicit boxes is a valid completion. This record exists to settle the product boundary, not to presume a feature.
