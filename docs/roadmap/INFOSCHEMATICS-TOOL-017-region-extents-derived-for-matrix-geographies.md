---
id: INFOSCHEMATICS-TOOL-017
area: TOOL
title: Region extent decision
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 769a539773045bffa518e57ee4b4f9782e82c09e
---

# Region extent decision

## Goal

Decide whether Region extents should derive from another Region, expand through an authoring helper, or remain explicit, using real matrix-geography evidence and a recorded product boundary.

## Context

The Region model deliberately has no row, column, containment, or nesting concept. The 5G-EMERGE IBC migration exposed repeated geometry: each column Region duplicates the y and height of its row. Resizing a row therefore requires coordinated edits across every column. A derivation mechanism could reduce that cost, but it could also introduce hidden containment semantics into an otherwise explicit geometry model.

## Boundary

This item makes and records the contract decision. It does not implement a new Region field or renderer behaviour, reintroduce lane or zone kinds, create mandatory nesting, or make renderers walk a containment hierarchy. If implementation is selected, it receives a separately scoped work item.

## Current state

Every Region owns a complete explicit box. The IBC definition has ten Regions: six share its upper-row `y` and `height`, four share its lower-row values, and two share the full-row `x` and `width`. The Infoschematics self-description has eleven Regions: three panel pairs share row extents and four outer rows share `x` and `width`.

## Steps

- [x] Measure duplicated Region coordinates and representative resize changes in the two known matrix-style definitions.
- [x] Compare an authored reference, a definition-time expansion helper, render-time clipping, and documented explicit geometry against serialisability, cycle detection, editor behaviour, renderer parity, and YAML usability.
- [x] Prototype only enough data and geometry resolution to expose ambiguity, error handling, and cross-axis semantics; do not land a public field in this decision item.
- [x] Record one decision that either retains explicit boxes or selects a precise derivation owner, syntax, validation rules, and editor response.
- [x] Update affected specification gaps and capture one bounded implementation record only if the selected decision requires production change.

## Files touched

- `docs/decisions/ADR-INFOSCHEMATICS-016-keep-region-bounds-explicit.md`
- `docs/decisions/README.md`
- `docs/specs/diagram-elements.md`
- `docs/guides/README.md`
- `docs/guides/maintaining-programmatic-examples.md`
- `docs/roadmap/INFOSCHEMATICS-TOOL-017-region-extents-derived-for-matrix-geographies.md`

## Verify

Review the decision against both known definitions and confirm it answers ownership, serialisation, invalid references, cycles, editor movement, and renderer parity. Run ki repo audit --skill ki-work-roadmap --repo . and bun run self:check after documentation changes.

## Dependencies / blocks

The explicit Region box contract and both proving definitions have landed. No implementation dependency is required for this decision.

## Documentation impact

### Decision Records

Add ADR-INFOSCHEMATICS-016 to retain complete explicit Region bounds.

### Specifications

Add DIAGRAM-009 to require complete independent Region bounds while allowing authoring tools to materialise alignment operations.

### Guides

Add a repository guide showing how TypeScript examples share immutable coordinates while emitting complete canonical Regions.

### Roadmap

No follow-on item is required because the decision retains current product behaviour; future editor alignment ergonomics remain part of editing work selection.

## Review

### Delivered

Completed the approved decision boundary from baseline `769a539773045bffa518e57ee4b4f9782e82c09e`. The work measured both known matrix-style definitions, compared the candidate mechanisms, retained explicit Region bounds, and did not introduce a canonical field, renderer behaviour, or follow-on implementation item.

### Summary of changes

Added ADR-INFOSCHEMATICS-016, registered it in reveal order, added DIAGRAM-009, and documented the shared-constant idiom for repository-owned TypeScript examples. The decision treats alignment as an authoring operation that materialises complete bounds rather than a persistent dependency between Regions.

### Verification

`ki repo audit --skill ki-decision-records --repo .`, `ki repo audit --skill ki-specs --repo .`, `ki repo audit --skill ki-guides --repo .`, and `ki repo audit --skill ki-work-roadmap --repo .` passed. `bun run self:check` passed all tests, type checks, dependency checks, package builds, and the production Site build.

### Outstanding concerns

None within the approved boundary. YAML and JSON matrix definitions deliberately retain repeated coordinates; future multi-selection or alignment ergonomics may reduce that editing cost without changing the model.

### Post-change review

The result meets the goal with no runtime or migration risk. It answers ownership, serialisation, invalid-reference and cycle handling by excluding Region dependencies, keeps editor moves local, and preserves renderer parity through complete independent inputs.

### Mini recap

Region geometry remains explicit and independent. Programmatic examples may share constants before model construction, while canonical documents and editor outputs always contain complete bounds.

## Discussion

### Decision criteria

The preferred outcome minimises duplicated authoring without making geometric containment implicit. A feature used only by TypeScript definitions may not justify a document-level contract.

### Candidate mechanisms

An authored reference is portable but adds reference validation and editor coupling. A definition helper keeps the canonical model explicit but does not help plain YAML. Render-time clipping is the most powerful option and carries the greatest semantic cost.

The conceptual reference prototype required an axis selector, a referenced Region id, precedence between local and inherited values, cycle rejection, and propagation rules for move, resize, and removal. Those requirements outweigh the repeated coordinates in the two known consumers. A definition-time TypeScript constant provides the useful part without entering the canonical contract.

### Completion outcome

A supported decision to retain explicit boxes is a valid completion. This record exists to settle the product boundary, not to presume a feature.
