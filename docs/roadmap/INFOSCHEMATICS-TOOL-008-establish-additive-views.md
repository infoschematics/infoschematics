---
id: INFOSCHEMATICS-TOOL-008
area: TOOL
title: Establish additive views
theme: tool
horizon: next
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-011]
baseline_ref: null
---

## Goal

Deliver the agreed package direction so consumers can select an interactive Canvas, Audience-facing Present view, Producer-facing Studio view, or deterministic static SVG renderer without importing capabilities they do not need.

## Context

The Domain Model, Domain Core, and View Model boundaries exist, but `@infoschematics/view-studio` still contains Canvas, Present, and Studio behaviour together. `@infoschematics/view-canvas`, `@infoschematics/view-present`, and `@infoschematics/render-svg` are documented architectural destinations but do not yet exist as packages.

[ADR-INFOSCHEMATICS-006](../decisions/ADR-INFOSCHEMATICS-006-additive-views-and-renderers.md) governs the additive dependency direction. TOOL-004 owns publication after the package surfaces are consumable; TOOL-007 owns the extensible renderer-key registry rather than the initial static SVG output.

## Boundary

This item does not publish packages, add domain-specific renderers, redesign the Domain Model, or complete every Design and Direct editing capability. It preserves the current public Studio behaviour while moving ownership downward.

## Current state

`@infoschematics/view-studio` owns the root React component, Infoschematic canvas, presentation state, Producer controls, editing state, and built-in renderer implementations. Site and the blank example exercise that combined package. View Model already owns the framework-neutral geometry needed by both interactive and static outputs.

## Steps

- [ ] Establish `@infoschematics/view-canvas` around the reusable interactive Infoschematic component and renderer bindings.
- [ ] Establish `@infoschematics/view-present` as an additive wrapper over Canvas with Audience navigation, Scene focus, Story playback, and presentation controls.
- [ ] Reduce `@infoschematics/view-studio` to an additive wrapper over Present with Producer-facing Design and Direct capabilities.
- [ ] Establish `@infoschematics/render-svg` over Domain Model and View Model with deterministic defaults for Scene, focus, overlays, and motion-free output.
- [ ] Move shared derivation out of React where static and interactive outputs need the same calculation.
- [ ] Update Site and authored examples to consume only the narrowest appropriate public packages.
- [ ] Tighten dependency rules and tests around every new package boundary.

## Files touched

- package workspace manifests and root workspace scripts;
- interactive source currently under the Studio workspace;
- new Canvas, Present, and SVG renderer package roots;
- View Model only where shared derivation is currently trapped in React;
- Site examples and architecture documentation;
- dependency-cruiser configuration and package-level tests.

## Verify

`bun run check` must pass with package-level TypeScript checks, tests, dependency rules, and production Site build. Static SVG tests must prove deterministic markup for a blank Infoschematic and a representative configured Infoschematic. Existing Studio interaction tests must remain green after each extraction.

## Dependencies / blocks

The public vocabulary and package ownership decisions are settled. Physical monorepo roots—such as `packages/`, `apps/`, and an authored-example area—should be agreed before the first move so this item does not rename the same package twice.

## Documentation impact

### Decision Records

ADR-INFOSCHEMATICS-006 already owns the package direction. Add a separate decision only if physical monorepo roots introduce a material ownership rule not covered by ADR-INFOSCHEMATICS-004.

### Specifications

Split Present and Studio requirements by their final package owner, and add deterministic SVG output requirements without duplicating Domain or View Model contracts.

### Guides

Update consumer imports and explain how to choose Canvas, Present, Studio, or SVG output.

### Roadmap

Keep TOOL-004 focused on publication and TOOL-007 focused on the renderer registry. Record newly discovered capability gaps separately rather than expanding this extraction.

## Discussion

### Extraction order

Canvas should move first because both Present and Studio depend on it. Present follows because Studio is its additive Producer wrapper. Static SVG can proceed beside that chain once shared derivation has a framework-neutral home.

### Compatibility

Studio remains the compatibility surface during extraction. Its existing application export can compose the new packages internally before consumers are asked to change imports.
