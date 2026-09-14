---
id: INFOSCHEMATICS-SITE-021
area: SITE
title: Playground document controls
theme: site
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-14T01:15:29Z
updated_at: 2026-09-14T01:15:29Z
---

# Playground document controls

## Goal

Make the hosted no-install Playground a practical place to choose, edit, reset, and copy an Infoschematic definition while the reusable Studio source panel remains blocked.

## Context

The current page loads curated presets into a live YAML textarea, but the preset selector never shows the loaded preset and there are no reset or copy actions. Readers can edit the source, yet the page gives little state or handoff feedback.

## Boundary

This item owns only Site host controls around the existing inert document string. It does not introduce lossless structured edits, write files, replace the editor with Studio, persist drafts, or duplicate the reusable source-panel work in `INFOSCHEMATICS-TOOL-043`.

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

The existing Installation and Overview guides already describe the hosted editor; no new public page is required.
