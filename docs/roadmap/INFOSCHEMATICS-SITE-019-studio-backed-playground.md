---
id: INFOSCHEMATICS-SITE-019
area: SITE
title: Studio-backed playground
theme: site-experience
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 5e3f2751de75f2d346adfed3369208eb2fb10e16
created_at: 2026-09-13T15:55:21Z
updated_at: 2026-09-15T05:17:28Z
---

# Studio-backed playground

## Goal

Turn Playground into a focused host for the real Studio experience so visitors can explore presets, edit visually or in source, and copy their work without learning a separate editor. The hosted, no-install editor is a first-class outcome: creating, editing, and copying must work in the browser without local packages.

## Context

The current Playground owns a bespoke two-pane preview and YAML textarea. It is a useful early editor, but it duplicates responsibilities that belong in Studio and makes the public experience diverge from the reusable authoring experience.

## Boundary

This item does not add server persistence, accounts, collaboration, filesystem access, a separate Playground editor model, or reusable behaviour inside Site code.

## Current state

Playground already provides a hosted, no-install source-editing path: it parses YAML locally, renders a static SVG into an image, and owns preset replacement and validation feedback. Studio now exposes supported document-change and source-replacement contracts, including validation, history, and source copying. The remaining work is to make Playground a focused Site-owned host for that landed capability.

## Steps

- [x] Replace the bespoke Playground editor with a Site host around supported Studio source-panel APIs, preserving a first-class no-install browser path to create, edit, and copy.
- [x] Load the curated presets from `INFOSCHEMATICS-SITE-018` as complete authored documents.
- [x] Preserve copy, source replacement, validation feedback, and reset-to-preset behaviour through Studio-owned contracts.
- [x] Keep routing, page metadata, responsive layout, and any browser persistence Site-owned.
- [x] Remove superseded Playground-only parsing and editor state.
- [x] Add focused integration and browser coverage for the hosted authoring journey.

## Files touched

- `apps/site/src/Playground.tsx`
- Site-owned Playground host components and focused tests
- `apps/site/src/styles.css`
- `apps/site/package.json`
- Playground-facing user-guide content

## Verify

Run focused Playground and Studio integration tests, `bun run --cwd apps/site build`, and `bun run self:check`. Inspect the built Playground at desktop and 390-pixel widths; confirm every preset loads, structured and YAML edits stay synchronized, invalid YAML is recoverable, copy output reflects the current document, and no bespoke Site editor state remains.

## Dependencies / blocks

`INFOSCHEMATICS-SITE-018` established the curated preset contract and compatibility routes. `INFOSCHEMATICS-TOOL-043` has delivered and been accepted, so there is no remaining build-order dependency. Site must consume the reusable Studio capability rather than reimplement it.

## Documentation impact

### Decision Records

No Site-specific decision record is expected unless hosting requires a new ownership boundary.

### Specifications

Reusable Studio behaviour remains specified by `INFOSCHEMATICS-TOOL-043`; Site integration adds no product-level contract.

### Guides

Update Playground guidance to describe Studio-backed visual and source authoring and the limits of browser persistence.

### Roadmap

Retire the bespoke Playground-editor direction after delivery and capture any advanced hosted persistence separately.

## Review

### Delivered

Implemented the approved Site-owned Studio host from immutable baseline `5e3f2751de75f2d346adfed3369208eb2fb10e16`, resulting in implementation commit `667a6ad24476cc5be01efe1ea21e2de9d1078e08`. The delivery excludes server persistence, accounts, collaboration, filesystem access, and any second Site-owned editor model.

### Summary of changes

`apps/site/src/Playground.tsx` now validates curated YAML into retained authored documents and gives them to the public Studio API. Site retains preset URLs, selection, applied-document state, and reset; Studio owns Design, Source, validation, history, and copying. The old debounced parser, static data-URI preview, textarea, issue list, and clipboard implementation were removed. Site styles contain Studio at desktop width and stack its expanded panels and controls at 390 pixels. Playground-facing Overview, Installation, and Authoring guidance now describes the hosted Studio workflow. No approved deviation was required.

### Verification

Focused Playground and documentation tests passed with 44 tests. The focused Chromium integration passed preset selection, invalid-source recovery, valid replacement, copy-action availability, and reset. `bun run --cwd apps/site build` passed. `bun run self:check` passed with 648 unit tests, 19 browser tests, all TypeScript workspaces, dependency boundaries, generated contracts, and the production Site build. Chromium screenshots were inspected at 1440 × 1000 and 390 × 844 pixels, including the expanded mobile Source panel.

### Outstanding concerns

The Studio-backed Playground is lazy-loaded, but its production route includes a 2.75 MB uncompressed dependency chunk and triggers Vite's chunk-size warning. This does not affect correctness or the separately split homepage and guide routes, but route-level bundle optimisation may be worthwhile later.

### Post-change review

The Playground now demonstrates the same reusable authoring experience consumers can integrate, while its host boundary remains limited to Site concerns. Preset switching, editing, validation failure, source replacement, copying, reset, and narrow layouts are covered. The item is ready for human acceptance.

### Mini recap

SITE-019 replaces the temporary Site editor with Studio, keeps all four curated presets and compatibility routes, documents the no-install workflow, and passes the full repository gate. No durable learning requires a separate guide or decision record; bundle optimisation can be routed through `ki-next` if it becomes a priority.

## Done

Accepted 2026-09-15 by Kris Brown on the review packet above.

## Discussion

### Product fidelity

Playground should demonstrate the authoring experience consumers can integrate, not a second implementation with similar controls.

### Preset ownership

Presets remain authored serialisable documents. Site chooses which ones to present and owns URL selection; Studio owns the editing experience.
