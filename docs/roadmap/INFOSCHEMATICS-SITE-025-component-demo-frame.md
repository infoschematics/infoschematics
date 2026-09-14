---
id: INFOSCHEMATICS-SITE-025
area: SITE
title: Component demo frame
theme: site-experience
horizon: now
status: done
blocks: [INFOSCHEMATICS-SITE-026]
blocked_by: []
baseline_ref: 4de2cbe3fb9f4f54db5ce82f57052cfdf15493fe
created_at: 2026-09-14T07:05:25Z
updated_at: 2026-09-14T07:47:02Z
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

- [x] Build a reusable demo frame with compact preview, optional side-by-side variants, property controls, and a coherent preview-toolbar-source stack.
- [x] Add Rendered and Design display modes using genuine Canvas behavior while avoiding unsupported editing claims.
- [x] Replace text reset and copy actions with accessible icon controls, add expand or collapse source, and retain visible feedback and keyboard access.
- [x] Produce focused YAML and TypeScript snippets for the demonstrated component, limited to roughly five or six visible lines until expanded.
- [x] Keep property changes, source, mode changes, and reset synchronized within the demo frame.
- [x] Add focused interaction tests and inspect representative Canvas, Region, and Card demonstrations at desktop and narrow widths.

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

## Review

### Delivered

Component examples now use one compact preview, toolbar, properties, and source frame. It supports rendered output, the real Canvas Design treatment, side-by-side variants, synchronized reset, YAML and TypeScript source, and accessible icon actions.

### Summary of changes

Added the reusable `DemoFrame`, bounded previews, Canvas styling and dependency metadata, collapsed or expanded source, icon-only reset and copy controls with labels and feedback, and focused unit and browser interaction coverage.

### Verification

At result `957ccda727d79d62654455638b9034aa6c17687f`, 39 focused Site tests, Site TypeScript checking, the production Site build, and all 13 browser tests passed in clean detached worktrees. Canvas, Region, and Card frames were inspected at desktop and 390-pixel widths in both Rendered and Design treatments with no overflow.

### Outstanding concerns

Design treatment exposes the real Canvas affordances but deliberately does not claim that drag operations persist. Individual component pages and their supported variant selections remain `INFOSCHEMATICS-SITE-026` work.

### Post-change review

Preview height is capped on wide screens and remains proportional on narrow screens, so simple examples no longer dominate the page. Property controls remain usable below the preview and source begins at about six visible lines.

### Mini recap

Baseline `4de2cbe3fb9f4f54db5ce82f57052cfdf15493fe`; result `957ccda727d79d62654455638b9034aa6c17687f`. The frame consumes existing public Canvas behavior and introduces no model or renderer contract.

## Done

Accepted 2026-09-14 by Kris Brown under `INFOSCHEMATICS-BATCH-011` closure authority on the review packet above.

## Discussion

### MUI as a structural reference

Follow the useful order of heading, explanation, preview, compact toolbar, source, and detailed API material. Do not import MUI or copy its branding.

### Honest Design mode

Canvas already exposes a `design` mode and port treatment. Showing that mode is honest; calling the demo a persistent visual editor would require operation-state plumbing and is outside this item.

### Focused source

The snippet should show the component record under the smallest useful surrounding key rather than repeat Scopes, Domains, Flow Families, and an entire view box when they are not the subject.
