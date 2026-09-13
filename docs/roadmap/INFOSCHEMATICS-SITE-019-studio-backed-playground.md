---
id: INFOSCHEMATICS-SITE-019
area: SITE
title: Studio-backed playground
theme: site-experience
horizon: next
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-SITE-018, INFOSCHEMATICS-TOOL-043]
baseline_ref: null
---

# Studio-backed playground

## Goal

Turn the Playground into a focused host for the real Studio experience so visitors can explore presets, edit visually or in source, and copy their work without learning a separate editor.

## Context

The current Playground owns a bespoke two-pane preview and YAML textarea. That is useful as an early editor, but it duplicates responsibilities that belong in Studio and makes the public experience diverge from the reusable authoring product.

## Boundary

This item does not add server persistence, accounts, collaboration, filesystem access, a separate Playground editor model, or reusable behaviour inside Site code.

## Current state

Playground parses YAML locally, renders static SVG into an image, and owns preset replacement and validation feedback. Studio is demonstrated elsewhere, while its future source panel and the curated preset set have not yet landed.

## Steps

- [ ] Replace the bespoke Playground editor with a Site host around the supported Studio and source-panel APIs.
- [ ] Load the three curated presets from `INFOSCHEMATICS-SITE-018` as complete authored documents.
- [ ] Preserve copy, source replacement, validation feedback, and reset-to-preset behaviour through Studio-owned contracts.
- [ ] Keep routing, page metadata, responsive layout, and any browser persistence Site-owned.
- [ ] Remove superseded Playground-only parsing and editor state.
- [ ] Add integration and visual coverage for preset switching, structured editing, source editing, and narrow layouts.

## Files touched

- `apps/site/src/Playground.tsx`
- Site-owned Playground host components and focused tests
- `apps/site/src/styles.css`
- `apps/site/package.json`
- Playground-facing user-guide content

## Verify

Run focused Playground and Studio integration tests, `bun run --cwd apps/site build`, and `bun run self:check`. Inspect the built Playground at desktop and 390-pixel widths; confirm every preset loads, structured and YAML edits stay synchronized, invalid YAML is recoverable, copy output reflects the current document, and no bespoke Site editor state remains.

## Dependencies / blocks

`INFOSCHEMATICS-SITE-018` must establish the curated preset contract and compatibility routes. `INFOSCHEMATICS-TOOL-043` must provide the reusable Studio source panel. The Site should consume those capabilities rather than reimplement them.

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

The Playground should demonstrate the authoring product that consumers can integrate, not a second implementation with similar controls.

### Preset ownership

Presets remain authored serialisable documents. The Site chooses which ones to present and owns URL selection; Studio owns the editing experience.
