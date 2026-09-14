---
id: INFOSCHEMATICS-SITE-019
area: SITE
title: Studio-backed playground
theme: site-experience
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T15:55:21Z
updated_at: 2026-09-14T22:03:54Z
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

- [ ] Replace the bespoke Playground editor with a Site host around supported Studio source-panel APIs, preserving a first-class no-install browser path to create, edit, and copy.
- [ ] Load the curated presets from `INFOSCHEMATICS-SITE-018` as complete authored documents.
- [ ] Preserve copy, source replacement, validation feedback, and reset-to-preset behaviour through Studio-owned contracts.
- [ ] Keep routing, page metadata, responsive layout, and any browser persistence Site-owned.
- [ ] Remove superseded Playground-only parsing and editor state.
- [ ] Add focused integration and browser coverage for the hosted authoring journey.

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

## Discussion

### Product fidelity

Playground should demonstrate the authoring experience consumers can integrate, not a second implementation with similar controls.

### Preset ownership

Presets remain authored serialisable documents. Site chooses which ones to present and owns URL selection; Studio owns the editing experience.
