---
id: INFOSCHEMATICS-TOOL-007
area: TOOL
title: Generalise renderer registry
theme: tool
horizon: next
status: ready
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

## Current state

Studio already accepts an `InfoschematicRenderers` prop and supplies it through an internal context. Host renderers cover Fabrics, Graphics, SVG definitions and Scope icons; unknown Fabrics receive a generic visible fallback, while missing Graphics are omitted. The Domain Model stores only renderer keys and serialisable properties. The seam lacks Callout registration, definition-level property schemas, schema versions, structured diagnostics and one documented compatibility contract.

## Steps

- [ ] Define the public registry as an immutable application prop, with context remaining an internal delivery mechanism and no process-global mutable registration.
- [ ] Add a typed `RendererDefinition` carrying a stable key, positive schema version, runtime property validator and React implementation, plus a `defineInfoschematicRenderers` helper that preserves inference.
- [ ] Cover Fabric, Graphic and Callout definitions in the same registry contract while retaining SVG definitions and Scope icons as host-level supporting renderers.
- [ ] Validate serialisable properties before invoking a renderer and expose structured diagnostics for unknown keys, unsupported schema versions and invalid properties through an optional host callback.
- [ ] Define deterministic fallbacks: generic labelled bounds for Fabrics, accessible labelled placeholders for Graphics and standard Callout presentation for unknown or invalid custom definitions.
- [ ] Guarantee that fallback geometry, selection and accessibility remain available independently of renderer success.
- [ ] Export the registry types, helper and diagnostics from the public View surface and retain compatibility re-exports when the implementation moves from Studio to Canvas.
- [ ] Add host-integration tests for successful registration, each diagnostic, every fallback, duplicate keys, immutable input and server rendering.
- [ ] Document the key and schema-version compatibility policy, including how hosts evolve properties without changing authored configuration into executable state.

## Files touched

- the public renderer registry module, currently `packages/view-studio/src/app/renderers.tsx`, and `packages/view-studio/src/index.ts`;
- Canvas rendering, Callout rendering, supporting host-renderer lookup and focused tests;
- Domain Model renderer-property types only if a schema-version field is required in serialisable configuration;
- final Canvas public exports if `INFOSCHEMATICS-TOOL-008` lands first;
- `docs/design/architecture.md`, View design and specifications, and React integration guidance.

## Verify

Type tests must prove registry definitions preserve component-property inference without React types entering Domain Model. Rendered tests must exercise registered Fabric, Graphic and Callout implementations; unknown keys; unsupported versions; invalid properties; diagnostics; generic accessible fallbacks; selection geometry; and server rendering. A source-boundary test must prove authored examples contain no component, callback or runtime store. `bun run check` is the final gate.

## Dependencies / blocks

No hard dependency remains. The contract can be completed on the existing Studio host seam and re-exported from Canvas after additive extraction, or implemented directly in Canvas if that package already exists. The immutable prop contract and serialisable authored keys stay the same in either order.

## Documentation impact

### Decision Records

Record the immutable host-provided registry and versioned schema policy as an architecture decision because it becomes a durable public extension seam.

### Specifications

Add registry, validation, diagnostic, fallback, accessibility and compatibility requirements to the relevant Domain and View specifications.

### Guides

Add a host renderer guide with one Fabric, Graphic and Callout example and a versioned-property migration example.

### Roadmap

Keep renderer package extraction in `INFOSCHEMATICS-TOOL-008` and visual-token ownership in `INFOSCHEMATICS-TOOL-009`; custom domain renderers remain host work.

## Discussion

### Extension seam

The application prop is the public authority boundary: it is explicit per mounted Infoschematic, supports server rendering and tests, and cannot leak registrations between hosts. React context may distribute that value internally but is not itself the public registration API.

Unknown or invalid custom renderers must degrade to labelled product content rather than disappear. Diagnostics inform the host without making console output or exceptions the Audience experience.
