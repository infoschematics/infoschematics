---
id: INFOSCHEMATICS-TOOL-014
area: TOOL
title: Renderer schema version
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

# Renderer schema version

## Goal

Let authored Fabric, Graphic, and Callout renderer references select a serialisable schema version so a host can support incompatible renderer-property contracts without changing a stable renderer key.

## Context

Host renderer definitions already carry a positive schema version and reject any version other than one. Authored references carry only a renderer key, so the View assumes version one and an incompatible property change must currently mint a new key. The earlier post-delivery hardening record combined this contract gap with unrelated responsive, repository-audit, and publication work; those outcomes now have separate records.

## Boundary

This item does not introduce executable renderers into authored data, add mutable registration, negotiate versions implicitly, publish packages, or remove established scalar renderer-key inputs before a separately reviewed compatibility policy permits it.

## Current state

Fabric appearance, Graphic, and Callout records hold scalar renderer keys plus serialisable properties. Canvas registrations hold key, schemaVersion, validator, and React component. Resolution diagnoses unsupported registered versions but cannot compare a requested authored version with the registered definition.

## Steps

- [ ] Add one shared serialisable renderer reference shaped as key plus positive integer version across Fabric, Graphic, and Callout canonical records.
- [ ] Accept the current scalar key as compatibility input normalised once to version one, and emit the structured reference from canonical serialisation.
- [ ] Mirror the reference in Domain Core validation, generated schema, stable field ordering, and focused invalid-version diagnostics.
- [ ] Resolve host definitions by both authored key and requested version, preserving deterministic unknown-key, unsupported-version, invalid-properties, and duplicate-definition diagnostics.
- [ ] Carry the versioned reference through Canvas, Present, Studio, compatibility adapters, examples, and static fallbacks without exposing host implementations to authored configuration.
- [ ] Add version-one compatibility and version-mismatch tests, then update the durable renderer decision, specifications, vocabulary, and integration guidance.

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

## Discussion

### Reference shape

A shared key-and-version value makes the authored request explicit and keeps properties serialisable. Normalising the scalar form to version one at the input boundary avoids carrying two representations through Views.

### Compatibility

Stable keys may support several intentionally registered schema versions, but resolution must never guess or silently fall forward. A missing authored version exists only in compatibility input and has the deterministic meaning version one.

### Renderer ownership

Authored data selects a contract, not an implementation. Validators, React components, callbacks, diagnostics handlers, and registries remain host-owned.
