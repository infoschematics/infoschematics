---
id: INFOSCHEMATICS-TOOL-012
area: TOOL
title: Configure visual treatments
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Let authored configuration and explicit render options control the reusable visual treatments needed to express an Infoschematic consistently across interactive and static outputs.

## Context

The homepage reference composition uses a blueprint background, framed regions, compact Cards, identity labels and deliberate title placement. The visual-language guidance describes these ideas, but the Domain and renderer contracts do not yet say which choices are authored meaning, output policy or fixed visual language.

`INFOSCHEMATICS-SITE-001` places the bespoke homepage treatment beside generated SVG from `is-infoschematics`. That comparison provides a review surface for the smallest reusable contract rather than making the homepage itself the implementation specification.

## Boundary

This item does not add arbitrary per-element CSS, website-specific renderer branches or executable values to `InfoschematicConfig`. It does not make every token a public option, redesign Studio's general editing model, or implement Flow animation and signalling; `INFOSCHEMATICS-TOOL-013` owns signalling.

## Current state

`LaneConfig` requires a label, fixed legend edge, panel bounds and numeric radius. `ZoneConfig` requires a label and fill. `CardConfig` carries stable identity, detail, Scope and placement but has no stereotype or independent Domain classification. Canvas exposes an editing-grid boolean, while static SVG fixes its backdrop, geography labels and Card content.

The shared visual-token manifest now keeps invariant geometry and colours aligned across Canvas and static SVG. It deliberately provides no authored appearance contract or renderer options for blueprint grids, region frames, label placement or Card metadata visibility.

## Steps

- [ ] Add narrowly typed, serialisable appearance modules to Domain Model for Canvas grid treatment, Lane and Zone frames, and region-label placement; use closed string unions and booleans rather than CSS property bags.
- [ ] Extend the Infoschematic definition with optional appearance defaults that distinguish no grid, major lines and major-plus-minor lines, with neutral and blueprint treatments resolved through shared semantic tokens.
- [ ] Extend Lane and Zone configuration with optional frame treatment covering visible, solid, dashed, dotted or absent borders; standard rounded geometry; optional label; nine-position compass placement; and plain or notched label treatment.
- [ ] Make an absent region label suppress its notch automatically, keep notch padding symmetric, and derive rounded/notched outline geometry in View Model so Canvas and static SVG cannot disagree.
- [ ] Add serialisable Card stereotype and Domain classification, introduce a Domain catalogue with semantic colour and fill, and keep Scope applicability independent from Domain appearance.
- [ ] Define framework-neutral render-detail options for Card identity tag, stereotype and description visibility. Let authored appearance provide defaults while an explicit Canvas or SVG render option may override visibility without removing authored data.
- [ ] Add View Model resolvers that normalise omitted appearance fields to backward-compatible defaults and expose one resolved treatment shape to every renderer.
- [ ] Update Canvas to render configurable blueprint grids, region frames and labels, compact Standard Cards, top-right bordered identity tags, optional stereotype and description, and Domain treatment without reintroducing decorative status dots.
- [ ] Update `renderInfoschematicSvg` to consume the same resolved treatment contract and emit deterministic accessible SVG for every supported combination without React, DOM state or page-specific CSS.
- [ ] Add representative fixtures and table-driven tests for defaults, configuration combinations, invalid references, symmetric notches, label placement, Card detail overrides, Scope/Domain independence and byte-stable Canvas-versus-SVG semantics.
- [ ] Update the architecture decision, Domain and renderer specifications, visual-language guidance and authoring guide with the boundary between authored meaning, output visibility and invariant tokens.

## Files touched

- `packages/domain-model/src/appearance.ts`, a Domain classification module, and focused changes to `infoschematic.ts`, `lane.ts`, `zone.ts`, `card.ts` and public module exports.
- `packages/view-model/src/appearance.ts`, region geometry, shared treatment types and focused resolver tests.
- `packages/view-canvas/src/Canvas.tsx`, `InfoschematicDiagram.tsx`, `styles.css` and focused rendering tests.
- `packages/render-svg/src/index.ts` and deterministic output tests.
- `packages/view-model/src/tokens.ts`, its generated stylesheet and generator checks only where new shared semantic values are required.
- `docs/decisions/`, `docs/specs/domain-model.md`, `docs/specs/view-canvas.md`, `docs/specs/render-svg.md`, `docs/design/visual-language.md` and `docs/guides/authoring.md`.

## Verify

Domain tests must prove every new field is serialisable, closed to arbitrary CSS and backward compatible when omitted. View Model tests must prove deterministic defaults, all compass placements, symmetric notches and independent Scope and Domain resolution.

Canvas and static SVG tests must use the same fixtures to prove matching grid, frame, label, Card metadata and semantic-colour decisions. Static output must remain byte-stable and browser-independent. Accessibility tests must prove hidden visual metadata remains available through useful SVG or DOM labelling where necessary. Dependency Cruiser must preserve Domain Model → View Model → renderer direction, and `bun run check` is the final pass/fail gate. Browser comparison against the SITE-001 reference must cover representative desktop and narrow layouts.

## Dependencies / blocks

TOOL-007, TOOL-008 and the delivered implementation of TOOL-009 provide the renderer seam, additive outputs and shared tokens this work needs. SITE-001 is not a hard blocker: its side-by-side page is the preferred visual review surface, while the existing homepage composition and its fixtures are sufficient to begin implementation.

TOOL-013 is independently specified but overlaps Canvas, SVG and token files. Deliver TOOL-012 first and verify its resolved treatment contract before beginning signalling; do not batch their implementation into one review boundary.

## Documentation impact

### Decision Records

Add a decision record fixing the public boundary between authored appearance, output-specific visibility overrides and invariant renderer tokens, including the decision to model Domain separately from Scope.

### Specifications

Extend Domain Model, Canvas and static SVG specifications with serialisability, defaulting, region geometry, Card metadata, semantic colour and cross-renderer parity requirements.

### Guides

Update authoring guidance with concise examples for blueprint grids, Lane and Zone treatment, label placement, Domain-classified Cards and renderer detail overrides.

### Roadmap

Record any visual gap discovered by the SITE-001 comparison against this item only when it fits the approved configuration boundary. Keep Flow motion and signal authority in TOOL-013.

## Discussion

### Configuration boundary

Configuration expresses stable visual meaning and intentional presentation defaults, not renderer implementation detail. Output options may hide identity tags, stereotypes or descriptions without deleting authored data. Tokens retain invariant measurements and colours that should not become per-diagram knobs.

### Scope and Domain

Scope determines applicability and filtering. Domain classifies a Card for semantic visual grouping. Treating them as separate references prevents a Card's visibility rule from being accidentally coupled to its colour family.

### Region geometry

Rounded geometry is the standard treatment rather than an arbitrary radius control. A titled region may use a notched frame with equal padding around the label; an untitled region uses an uninterrupted frame. Nine-position placement covers the requested compass combinations without exposing free coordinates.

### Backward-compatible defaults

Existing configurations must retain their current readable output when appearance fields are absent. New homepage-like treatments are opt-in until the generated comparison has been approved as the preferred default.
