---
id: INFOSCHEMATICS-TOOL-039
area: TOOL
title: Responsive diagram density
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: e47f2ae54bd64431190ab9154576374c88b531a8
created_at: 2026-09-13T15:39:09Z
updated_at: 2026-09-14T06:49:55Z
---

# Responsive diagram density

## Goal

Keep dense Infoschematics readable at narrow rendered widths by reducing optional visual detail deterministically while preserving authored geometry, essential labels, and accessible information.

## Context

The renderer scales an authored view box into available space. At narrow widths, Card identity, stereotype, and description can become too small before the diagram structure itself stops fitting. Hosts can already override individual Card details, but there is no shared policy that relates rendered pixels to authored geometry or keeps interactive and explicit-size static output aligned.

## Boundary

This item does not rewrite authored boxes, reflow the Diagram, change Region or Flow geometry, remove essential labels, hide information from assistive output, or make renderer behaviour depend on an unobservable device class. Existing output remains unchanged unless a host opts into responsive detail.

## Current state

View Model resolves Card layout from authored box size and requested detail. Canvas knows its rendered container size, while static SVG knows only its authored view box unless the caller provides an output size. The Site uses responsive containers but has no shared output-detail policy.

## Steps

- [x] Add representative dense-diagram fixtures and record the rendered scale at which optional Card detail ceases to be legible on desktop and narrow layouts.
- [x] Add a framework-neutral View Model resolver that takes authored view-box dimensions, target rendered dimensions, and requested Card detail and returns a deterministic visible-detail profile.
- [x] Define an explicit opt-in responsive-detail option for Canvas and static rendering; omission must preserve current authored and cardDetails behaviour.
- [x] Make Canvas observe its container without changing server-rendered markup before measurement, then recompute Card layout when the resolved profile changes.
- [x] Let static callers provide a target output size for the same resolver while keeping output deterministic for identical inputs.
- [x] Preserve Card label, semantic SVG title or accessible name, hidden authored metadata, focus, and selection even when optional visual rows are withheld.
- [x] Add parity tests at full, threshold, and narrow sizes and inspect dense examples in Canvas, Present, Studio, and static SVG.
- [x] Update the output-detail decision, specifications, and host guidance with the opt-in and fallback behaviour.

## Files touched

- packages/domain-model/src/ only if shared render options are typed there
- packages/view-model/src/ responsive detail and Card layout tests
- packages/view-canvas/src/ measurement, rendering, and tests
- packages/render-svg/src/ explicit target-size option and tests
- packages/view-present/src/ and packages/view-studio/src/ pass-through tests
- examples/ and apps/site/src/ proving fixtures
- docs/decisions/, docs/specs/, and affected guides

## Verify

Run focused bunx vitest run suites for View Model Card layout, Canvas responsive output, static SVG, Present and Studio pass-through, and visual-treatment parity, then bun run self:packages:build and bun run self:check. Inspect a dense example above, at, and below each threshold and confirm optional visual rows reduce in the documented order while labels and accessible metadata remain.

## Dependencies / blocks

Card layout, cardDetails overrides, accessible Card metadata, and shared renderer parity have landed. This work is independent of additional Region treatments and authored geometry changes.

## Documentation impact

### Decision Records

Update ADR-INFOSCHEMATICS-011 with opt-in rendered-size detail resolution and the rule that authored geometry and accessible content remain unchanged.

### Specifications

Add View Model, Canvas, and static renderer requirements for deterministic thresholds, compatibility defaults, explicit target size, and accessible retention.

### Guides

Document when hosts should enable responsive detail and how explicit cardDetails requests interact with the resolved profile.

### Roadmap

Keep true layout reflow or alternate mobile diagram composition outside this item as a separately selected capability.

## Review

### Delivered

Delivered the approved opt-in responsive Card-detail boundary from immutable baseline `e47f2ae54bd64431190ab9154576374c88b531a8`; implementation commit `9cdc7ca9e6c6251104318c3f4b5a9823c7742201` provides the resulting code, tests, decision, specification, and guide evidence. Authored geometry, essential labels, accessible metadata, default rendering, true layout reflow, and device-class inference remain outside or unchanged as required.

### Summary of changes

Added `resolveResponsiveCardTreatment` as the shared dimension-driven policy; added opt-in measured Canvas support, Present and Studio pass-throughs, and explicit-size static SVG support. Added full, threshold, narrow, compatibility, and accessibility fixtures. Updated ADR-INFOSCHEMATICS-011, APPEAR-016/017, STATIC-016, and static-rendering host guidance. The selected thresholds preserve all optional rows at scale `0.8`, remove description below `0.8`, identity below `0.6`, and stereotype below `0.4`.

### Verification

`bunx vitest run packages/view-model/src/appearance.test.ts packages/render-svg/src/index.test.ts packages/view-present/src/Present.test.tsx packages/view-studio/src/app/App.test.tsx` passed with 50 tests. The dedicated Chromium run for `InfoschematicDiagram.responsive.browser.test.tsx` passed with two tests. `bun run self:check` passed with 79 unit suites and 593 tests, four browser suites and 21 tests, all package builds, schema and visual-token checks, TypeScript checks, dependency boundaries, and Site production build. The Specifications and Guides audits passed.

### Outstanding concerns

The Decision Records audit still reports the pre-existing non-canonical filename for ADR-INFOSCHEMATICS-018. The roadmap audit currently reports six pre-existing Future records whose `candidate` field is rejected by the concurrently changing KI tool. Neither finding was introduced by or blocks this delivery.

### Post-change review

The implementation meets the approved goal without mutating the canonical model or changing default output. Both renderers consume the same pure resolver, static output is deterministic for identical dimensions, and real-browser coverage proves Canvas responds only after measurement. Public surface growth is limited to the explicitly planned opt-in properties, with source-level pass-through coverage for Present and Studio. The item is ready for acceptance review.

### Mini recap

Responsive detail is now a host choice grounded in explicit dimensions rather than an ambient device heuristic. Optional rows disappear predictably while the diagram structure and accessible meaning remain intact. No follow-up work is required within this item; genuine mobile reflow remains a separate future capability.

## Done

Accepted 2026-09-14 by Kris Brown on review packet above.

## Discussion

### Deterministic input

Rendered pixel dimensions are explicit resolver inputs. The policy must not inspect user agent, device name, or ambient viewport state in View Model.

### Detail order

Description, identity, and stereotype are optional visual rows and may be withheld in a documented order. The Card label and semantic accessible content remain available.

### Compatibility

Omitting the responsive option preserves existing output. Explicit host detail settings form the upper bound, so responsive resolution may withhold requested optional rows at small scale but never reveal rows the host disabled.
