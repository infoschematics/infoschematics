---
id: INFOSCHEMATICS-TOOL-039
area: TOOL
title: Responsive diagram density
theme: tool
horizon: next
status: in-progress
blocks: []
blocked_by: []
baseline_ref: e47f2ae54bd64431190ab9154576374c88b531a8
created_at: 2026-09-13T15:39:09Z
updated_at: 2026-09-14T02:16:32Z
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

- [ ] Add representative dense-diagram fixtures and record the rendered scale at which optional Card detail ceases to be legible on desktop and narrow layouts.
- [ ] Add a framework-neutral View Model resolver that takes authored view-box dimensions, target rendered dimensions, and requested Card detail and returns a deterministic visible-detail profile.
- [ ] Define an explicit opt-in responsive-detail option for Canvas and static rendering; omission must preserve current authored and cardDetails behaviour.
- [ ] Make Canvas observe its container without changing server-rendered markup before measurement, then recompute Card layout when the resolved profile changes.
- [ ] Let static callers provide a target output size for the same resolver while keeping output deterministic for identical inputs.
- [ ] Preserve Card label, semantic SVG title or accessible name, hidden authored metadata, focus, and selection even when optional visual rows are withheld.
- [ ] Add parity tests at full, threshold, and narrow sizes and inspect dense examples in Canvas, Present, Studio, and static SVG.
- [ ] Update the output-detail decision, specifications, and host guidance with the opt-in and fallback behaviour.

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

## Discussion

### Deterministic input

Rendered pixel dimensions are explicit resolver inputs. The policy must not inspect user agent, device name, or ambient viewport state in View Model.

### Detail order

Description, identity, and stereotype are optional visual rows and may be withheld in a documented order. The Card label and semantic accessible content remain available.

### Compatibility

Omitting the responsive option preserves existing output. Explicit host detail settings form the upper bound, so responsive resolution may withhold requested optional rows at small scale but never reveal rows the host disabled.
