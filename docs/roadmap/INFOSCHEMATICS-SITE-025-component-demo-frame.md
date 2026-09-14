---
id: INFOSCHEMATICS-SITE-025
area: SITE
title: Component demo frame
theme: site-experience
horizon: now
status: ready
blocks: [INFOSCHEMATICS-SITE-026]
blocked_by: []
baseline_ref: null
created_at: 2026-09-14T07:05:25Z
updated_at: 2026-09-14T07:05:25Z
---

# Component demo frame

## Goal

Give component documentation a compact, consistent demonstration frame that connects rendered output, genuine Design treatment, focused controls, and copyable source without overwhelming the page.

## Context

Current specimens render large static SVG images, put controls inside a separate card, expose broad Infoschematic configuration in every snippet, and use large text actions. The approved MUI-inspired structure uses a bounded preview, a compact toolbar, short component-only source, and detailed reference material below while retaining Infoschematics visual language.

## Boundary

This item does not add MUI as a dependency, implement a second editor, claim persistent visual editing, introduce unsupported component variants, or change Domain Model and renderer contracts. Design mode must use the public Canvas behavior that exists today.

## Current state

`InteractiveSpecimen` renders a deterministic SVG as an image. `SpecimenSnippet` provides YAML and TypeScript tabs with a text Copy button, but code is always fully open and specimens repeat surrounding configuration. Reset is a large text button and preview sizing makes simple components visually dominant.

## Steps

- [ ] Build a reusable demo frame with compact preview, optional side-by-side variants, property controls, and a coherent preview-toolbar-source stack.
- [ ] Add Rendered and Design display modes using genuine Canvas behavior while avoiding unsupported editing claims.
- [ ] Replace text reset and copy actions with accessible icon controls, add expand or collapse source, and retain visible feedback and keyboard access.
- [ ] Produce focused YAML and TypeScript snippets for the demonstrated component, limited to roughly five or six visible lines until expanded.
- [ ] Keep property changes, source, mode changes, and reset synchronized within the demo frame.
- [ ] Add focused interaction tests and inspect representative Canvas, Region, and Card demonstrations at desktop and narrow widths.

## Files touched

- `apps/site/src/visual-guide/InteractiveSpecimen.tsx`
- `apps/site/src/visual-guide/SpecimenSnippet.tsx`
- New Site-owned demo-frame or source-pane modules
- `apps/site/src/visual-guide/specimens.ts`
- Site tests, package metadata when required, and `apps/site/src/styles.css`

## Verify

Run focused demo-frame, specimen, and Components tests plus Site type checking and build; then run `bun run self:check`. In a browser, exercise mode, property, reset, source format, expand, and copy controls and inspect representative demos at desktop and 390-pixel widths without overflow.

## Dependencies / blocks

No build dependency. The demo frame must remain compatible with the information architecture from `INFOSCHEMATICS-SITE-024`; both outputs are required by `INFOSCHEMATICS-SITE-026`.

## Delegation

A bounded lower-cost worker may implement the demo-frame modules and focused tests inside the Site visual-guide area. The primary agent owns dependency review, accessibility and visual inspection, integration, full verification, lifecycle evidence, and commits.

## Documentation impact

### Decision Records

No decision record is needed because the frame consumes existing public rendering behavior and remains Site-owned.

### Specifications

No product contract changes. Tests cover the Site demonstration interaction and honest use of existing Canvas modes.

### Guides

Component pages will present concise editable examples and focused source more clearly.

### Roadmap

Unblock the dedicated component-page work in `INFOSCHEMATICS-SITE-026`; retain new grid, Point, and visual-theme semantics as separate package work.

## Discussion

### MUI as a structural reference

Follow the useful order of heading, explanation, preview, compact toolbar, source, and detailed API material. Do not import MUI or copy its branding.

### Honest Design mode

Canvas already exposes a `design` mode and port treatment. Showing that mode is honest; calling the demo a persistent visual editor would require operation-state plumbing and is outside this item.

### Focused source

The snippet should show the component record under the smallest useful surrounding key rather than repeat Scopes, Domains, Flow Families, and an entire view box when they are not the subject.
