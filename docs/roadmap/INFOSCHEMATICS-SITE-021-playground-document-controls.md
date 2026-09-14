---
id: INFOSCHEMATICS-SITE-021
area: SITE
title: Playground document controls
theme: site-experience
horizon: now
status: in-progress
blocks: []
blocked_by: []
baseline_ref: 8d13f6c1baa642dba6461b9274e5bf11eee76615
created_at: 2026-09-14T01:15:29Z
updated_at: 2026-09-14T01:16:34Z
---

# Playground document controls

## Goal

Make the hosted no-install Playground a practical place to choose, edit, reset, and copy an Infoschematic definition while the reusable Studio source panel remains blocked.

## Context

The current page loads curated presets into a live YAML textarea, but the preset selector never shows the loaded preset and there are no reset or copy actions. Readers can edit the source, yet the page gives little state or handoff feedback.

## Boundary

This item owns only Site host controls around the existing inert document string. It does not introduce lossless structured edits, write files, replace the editor with Studio, persist drafts, or duplicate the reusable source-panel work in `INFOSCHEMATICS-TOOL-043`.

## Current state

The query-selected preset provides the initial YAML, while a selector with no selected value can replace it. The page offers no dirty state, reset action, clipboard action, or action feedback.

## Steps

- [ ] Show the selected preset and identify when its document has been edited.
- [ ] Reset the document to the selected preset with an explicit action.
- [ ] Copy the current YAML through the browser clipboard with accessible success and failure feedback.
- [ ] Keep preset query selection, validation, stale-preview behaviour, and responsive layout intact.

## Files touched

- `apps/site/src/Playground.tsx`
- `apps/site/src/Playground.test.tsx`
- `apps/site/src/styles.css`

## Verify

Run focused Site tests and `bun run self:check`. In a browser, load a query-selected preset, edit the document, reset it, copy it, and inspect desktop and mobile layouts without console errors or overflow.

## Dependencies / blocks

None for this bounded host improvement. `INFOSCHEMATICS-TOOL-033` and `INFOSCHEMATICS-TOOL-043` still block replacing the editor itself under `INFOSCHEMATICS-SITE-019`.

## Documentation impact

### Decision Records

No decision change is required.

### Specifications

No reusable product behaviour changes.

### Guides

The existing Installation and Overview guides already describe the hosted editor; no new public page is required.

### Roadmap

Keep the Studio-backed replacement in `INFOSCHEMATICS-SITE-019`; this record owns only the current Site host controls.

## Discussion

### Preserve the Studio destination

These controls surround the existing document string and should remain valid host actions when the textarea is replaced. They must not grow into a second structured-editing implementation.
