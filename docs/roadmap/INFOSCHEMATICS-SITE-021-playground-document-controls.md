---
id: INFOSCHEMATICS-SITE-021
area: SITE
title: Playground document controls
theme: site-experience
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 8d13f6c1baa642dba6461b9274e5bf11eee76615
created_at: 2026-09-14T01:15:29Z
updated_at: 2026-09-14T01:21:46Z
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

- [x] Show the selected preset and identify when its document has been edited.
- [x] Reset the document to the selected preset with an explicit action.
- [x] Copy the current YAML through the browser clipboard with accessible success and failure feedback.
- [x] Keep preset query selection, validation, stale-preview behaviour, and responsive layout intact.

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

## Review

### Delivered

Commit `8d2768d1` makes the hosted Playground's current YAML document selectable, stateful, resettable, and copyable without changing the parser, renderer, or Studio boundaries.

### Summary of changes

The preset selector now reflects the active preset and keeps the `preset` query current. Editing changes the visible state from Preset loaded to Edited and enables Reset preset. Reset restores the selected document. Copy YAML writes the current text through the browser clipboard and reports success or a manual-copy fallback through a polite live region.

### Verification

Focused Playground tests cover preset documents, selected state, actions, and the clipboard boundary. `bun run self:check` passed 570 tests, browser tests, all workspace typechecks, dependency boundaries, schema and token checks, and the production Site build. Chromium exercised query-selected loading, edit detection, reset restoration, clipboard output, preset query replacement, desktop and 390-pixel layouts, zero horizontal overflow, and an empty console.

### Outstanding concerns

The editor remains the intentionally temporary Site textarea. Lossless structured editing and its reusable source panel remain owned by `INFOSCHEMATICS-TOOL-033` and `INFOSCHEMATICS-TOOL-043` before `INFOSCHEMATICS-SITE-019` can replace it with Studio.

### Post-change review

The new actions operate only on the inert document string and remain suitable as Site host controls around a future Studio source panel. No persistence, file access, structured-editing logic, or package-owned behaviour entered Site.

### Mini recap

The no-install Playground now supports a complete choose, edit, reset, and copy loop with clear state and accessible feedback.

## Done

Accepted 2026-09-14 under the project owner's explicit outcome authority to finish the website batch, on the review packet above.

## Discussion

### Preserve the Studio destination

These controls surround the existing document string and should remain valid host actions when the textarea is replaced. They must not grow into a second structured-editing implementation.
