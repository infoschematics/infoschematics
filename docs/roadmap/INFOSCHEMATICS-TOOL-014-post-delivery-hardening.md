---
id: INFOSCHEMATICS-TOOL-014
area: TOOL
title: Renderer schema version
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: e47f2ae54bd64431190ab9154576374c88b531a8
created_at: 2026-09-03T06:02:55Z
updated_at: 2026-09-14T06:49:55Z
---

# Renderer schema version

## Goal

Let authored Fabric, Overlay, and Callout renderer references select a serialisable schema version so a host can support incompatible renderer-property contracts without changing a stable renderer key.

## Context

Host renderer definitions already carry a positive schema version and reject any version other than one. Authored references carry only a renderer key, so the View assumes version one and an incompatible property change must currently mint a new key. The earlier post-delivery hardening record combined this contract gap with unrelated responsive, repository-audit, and publication work; those outcomes now have separate records.

## Boundary

This item does not introduce executable renderers into authored data, add mutable registration, negotiate versions implicitly, publish packages, or remove established scalar renderer-key inputs before a separately reviewed compatibility policy permits it.

## Current state

Fabric appearance, Overlay, and Callout records hold scalar renderer keys plus serialisable properties. The established compatibility contract calls an Overlay a Graphic. Canvas registrations hold key, schemaVersion, validator, and React component. Resolution diagnoses unsupported registered versions but cannot compare a requested authored version with the registered definition.

## Steps

- [x] Add one shared serialisable renderer reference shaped as key plus positive integer version across Fabric, Overlay, and Callout canonical records.
- [x] Accept the current scalar key as compatibility input normalised once to version one, and emit the structured reference from canonical serialisation.
- [x] Mirror the reference in Domain Core validation, generated schema, stable field ordering, and focused invalid-version diagnostics.
- [x] Resolve host definitions by both authored key and requested version, preserving deterministic unknown-key, unsupported-version, invalid-properties, and duplicate-definition diagnostics.
- [x] Carry the versioned reference through Canvas, Present, Studio, compatibility adapters, examples, and static fallbacks without exposing host implementations to authored configuration.
- [x] Add version-one compatibility and version-mismatch tests, then update the durable renderer decision, specifications, vocabulary, and integration guidance.

## Files touched

- packages/domain-model/src/
- packages/domain-core/src/ and packages/domain-core/schema/
- packages/view-model/src/
- packages/view-canvas/src/renderers.tsx and focused renderer tests
- packages/view-present/src/ and packages/view-studio/src/ renderer boundaries
- packages/render-svg/src/ fallback handling
- examples/ and affected fixtures
- docs/decisions/, docs/specs/, docs/reference/, and renderer integration guides

## Verify

Run bun run self:verify:schema, focused bunx vitest run suites for Domain Core parsing and serialisation plus Canvas, Present, Studio, and static renderer resolution, then bun run self:packages:build and bun run self:check. Confirm scalar established inputs behave as requested version one, structured version one selects matching definitions, and unsupported authored or registered versions produce stable diagnostics and accessible fallbacks.

## Dependencies / blocks

The version-one host renderer registry and canonical serialisable model have landed. No release authority or external registry access is required.

## Documentation impact

### Decision Records

Update ADR-INFOSCHEMATICS-009 with explicit authored version selection and the scalar-version-one compatibility boundary.

### Specifications

Update Domain Model, Domain Core, Canvas, Present, Studio, and static renderer requirements for the structured reference, validation, resolution, and fallback behaviour.

### Guides

Update authoring and React integration examples to show versioned references and explain compatibility input.

### Roadmap

The former responsive, repository-conformance, and publication outcomes are now tracked by [Responsive diagram density](INFOSCHEMATICS-TOOL-039-responsive-diagram-density.md), [Repository conformance pass](INFOSCHEMATICS-TOOL-040-repository-conformance-pass.md), and [Initial package publication](INFOSCHEMATICS-TOOL-041-initial-package-publication.md).

## Review

### Delivered

Implementation commit `1b60599fea4771ac6f13f415dd80ab8b40763594` delivers explicit versioned renderer references from immutable baseline `e47f2ae54bd64431190ab9154576374c88b531a8`. Executable renderers remain host-owned, registration remains immutable, resolution performs no implicit negotiation, packages were not published, and scalar compatibility input remains supported as version `1`.

### Summary of changes

Domain Model now exports the shared `RendererReference` contract and scalar-input normaliser. Domain Core validates and serialises canonical key-and-version references, and the generated JSON Schema carries the same shape. Canvas resolves exact registered versions while retaining deterministic diagnostics and fallbacks; compatibility adapters, Present, Studio, and static SVG carry the reference without embedding implementations. The renderer ADR, specifications, vocabulary, and new host-integration guide describe the resulting contract.

### Verification

`bun run self:verify:schema` passed. Focused `bunx vitest run` passed 55 tests across Domain Model, Domain Core, View Model compatibility, Canvas resolution, Present, Studio, and static SVG. `bun run self:packages:build` passed. `bun run self:check` passed 590 unit and integration tests, three browser tests, every workspace typecheck, dependency analysis with 350 modules and 1,075 dependencies, generated-artifact checks, and the production Site build. The `ki-authoring`, `ki-specs`, and `ki-guides` audits passed.

### Outstanding concerns

No concern remains within the approved renderer-version boundary. The decision-record audit continues to report the pre-existing non-canonical filename of `ADR-INFOSCHEMATICS-018-keep-renderer-command-thin.md`. The roadmap audit reports pre-existing `candidate` fields on TOOL-046 through TOOL-050 and TOOL-052, plus catalogue publication drift. This item introduced no finding in either audit and did not alter those records.

### Post-change review

The shared reference is serialisable and dependency-free, canonical parsing removes the scalar/object duality before consumers inspect authored data, and exact-pair registry lookup permits incompatible schemas under one stable key without silent fallback. Unknown keys, unavailable versions, invalid properties, and duplicate key-version pairs retain accessible standard output and structured diagnostics. No executable value or mutable global registry crossed into authored configuration.

### Mini recap

Baseline `e47f2ae54bd64431190ab9154576374c88b531a8`; implementation `1b60599fea4771ac6f13f415dd80ab8b40763594`. TOOL-014 is integrated, fully verified, and ready for human acceptance at `awaiting-review`.

## Done

Accepted 2026-09-14 by Kris Brown on review packet above.

## Discussion

### Reference shape

A shared key-and-version value makes the authored request explicit and keeps properties serialisable. Normalising the scalar form to version one at the input boundary avoids carrying two representations through Views.

### Compatibility

Stable keys may support several intentionally registered schema versions, but resolution must never guess or silently fall forward. A missing authored version exists only in compatibility input and has the deterministic meaning version one.

### Renderer ownership

Authored data selects a contract, not an implementation. Validators, React components, callbacks, diagnostics handlers, and registries remain host-owned.
