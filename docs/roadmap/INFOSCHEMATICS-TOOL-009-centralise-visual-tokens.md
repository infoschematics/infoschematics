---
id: INFOSCHEMATICS-TOOL-009
area: TOOL
title: Centralise visual tokens
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 432aecb66aa57513320f7017735327829fd7253b
---

## Goal

Give reusable visual decisions one framework-neutral, semantic token contract so renderers and views do not encode unrelated colour, spacing, line and typography choices independently.

## Context

The extraction removed the first realisation's authored content, but inherited visual decisions remain distributed across View Model values, Studio CSS and renderer-specific literals. That does not compromise repository separation, but it makes consistent Canvas, Present, Studio and static SVG output harder to maintain.

## Boundary

This item centralises existing visual decisions; it does not design multiple themes, add host-authored arbitrary styling, or make unrestricted colour and typography part of `InfoschematicConfig`.

## Current state

View Model exports only `cornerRadius`. Studio's aggregate stylesheet contains a small number of local custom properties but more than one hundred repeated colour, radius, type-size and stroke literals. Grid size and interaction distances also live as local TypeScript constants. Some values describe the product across renderers; others describe Present or Studio chrome. There is no canonical semantic manifest or automated check keeping TypeScript, CSS and future static output aligned.

## Steps

- [x] Inventory every reusable colour, spacing, radius, stroke, typography, grid and interaction value and classify it as cross-renderer product language, interactive Canvas behaviour, Present chrome, Studio chrome or intentional one-off composition.
- [x] Replace the scalar token module with a readonly semantic manifest grouped by canvas geometry, surfaces, text, flows, focus, selection and motion-independent output defaults.
- [x] Keep Producer-only and Audience-control tokens with their owning View packages rather than lifting all CSS literals into View Model.
- [x] Add a deterministic generator that emits owned CSS custom properties from the framework-neutral manifest and a `--check` mode that fails on stale generated output.
- [x] Migrate Canvas-owned TypeScript and CSS values to the manifest in coherent slices, retaining authored Scope and Flow-family colours as data rather than global tokens.
- [x] Make interactive and static renderers consume the same cross-renderer values when both exist, without adding unrestricted style overrides to `InfoschematicConfig`.
- [x] Add focused tests for token names, values, generated CSS, collision detection, deterministic ordering and representative React versus static-render consistency.
- [x] Document the semantic naming rule, ownership split, generation workflow and criteria for adding or refusing a token.

## Files touched

- `packages/view-model/src/tokens.ts`, a token generator and focused tests;
- generated token CSS in the current interactive View owner, moving to Canvas if additive extraction has landed;
- Canvas or current Studio rendering modules and `styles.css` values classified as cross-renderer;
- Present and Studio styles only where local custom properties improve their own ownership clarity;
- root generation/check scripts and ignored generated-output policy;
- `docs/design/visual-language.md`, `docs/design/architecture.md` and relevant View specifications.

## Verify

The inventory must account for every repeated literal selected for migration and explicitly leave one-off or view-local values in place. The generator's `--check` mode must be deterministic and fail after any manual generated-CSS edit. Tests must prove TypeScript and CSS expose identical token names and values, Scope and Flow-family authored colours remain data, and representative render output keeps its visual semantics. `bun run check` must include the token consistency gate.

## Dependencies / blocks

No hard dependency remains. The manifest and generator can target the current Studio-owned Canvas styles, then move mechanically with them, or target Canvas directly when it exists. Static SVG adopts the same manifest when delivered; its absence does not prevent establishing and verifying the contract now.

## Documentation impact

### Decision Records

Add a decision only if token generation introduces a new durable source-of-truth rule not adequately owned by the visual-language design document.

### Specifications

Specify which geometry and semantic visual values must agree across interactive and static renderers without exposing a general theming API.

### Guides

No consumer guide change is required unless a supported package export becomes useful to renderer authors; document contributor workflow in the visual-language guidance.

### Roadmap

Keep multiple themes and host-authored styling outside this item. Record them separately only after a concrete consumer requires either capability.

## Review

### Delivered

Delivered one framework-neutral, readonly visual-token manifest with a deterministic CSS projection, integrated freshness checking, and shared consumption by interactive Canvas and static SVG output.

### Summary of changes

- Classified shared product semantics, Canvas interaction values, Present and Studio chrome, authored colours and intentional one-offs in the visual-language and View documentation.
- Replaced the scalar token module with grouped `visualTokens.canvas` geometry, surface, text, Flow, focus, selection and static-output defaults while retaining the `cornerRadius` compatibility export.
- Added a deterministic generator, collision detection, generated package CSS export and stale-output check to the canonical repository gate.
- Migrated Canvas TypeScript geometry and classified CSS declarations to the manifest and generated custom properties.
- Migrated static SVG geometry, Flow treatment, focus state and light-output defaults to the TypeScript manifest while preserving authored Scope, lane and Flow-family colours.

### Verification

- Baseline: `432aecb66aa57513320f7017735327829fd7253b`.
- Delivery commits: `b93cc603`, `7128f288`, `7d2a1149`, `4da66743`, `f9aedc9e` and `a72fe30d`.
- Focused View Model token/generator, Canvas and static SVG tests passed with their package TypeScript checks.
- Generated CSS freshness, deterministic ordering and collision tests passed.
- `bun run check` passed on 2026-09-03 after the integrated migration.

### Outstanding concerns

Present and Studio retain their own chrome values by design. Studio also retains legacy duplicate Canvas selectors pending the production-mode consolidation owned by TOOL-005; those duplicates were not promoted into Studio-level shared tokens. The manifest is not a host theming API.

### Post-change review

The migration centralises only values with a cross-renderer or calculation-to-output consistency requirement. Authored Scope fills, lane fills and Flow-family colours remain serialisable product data, while local hit targets, transient controls and optical offsets stay with their owning View.

### Mini recap

TOOL-009 is ready for human review. Acceptance, pruning, pushing and releasing remain outside this delivery run.

## Done

Accepted by the user on 2026-09-03 after impartial review and a fresh canonical gate confirmed the stated goal and boundary.

## Discussion

### Ownership

Structural tokens shared by renderers belong in the framework-neutral manifest. Interaction and chrome tokens remain with the View that owns them, and authored Scope and Flow-family colours remain serialisable product data.

### Relationship to package extraction

[INFOSCHEMATICS-TOOL-008](INFOSCHEMATICS-TOOL-008-establish-additive-views.md) may move already-shared values when required to prevent duplication, but this item owns the comprehensive audit, naming and consolidation pass.
