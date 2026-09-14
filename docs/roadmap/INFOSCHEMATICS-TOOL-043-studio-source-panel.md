---
id: INFOSCHEMATICS-TOOL-043
area: TOOL
title: Studio source panel
theme: tool
horizon: next
status: awaiting-review
blocks: [INFOSCHEMATICS-SITE-019]
blocked_by: []
baseline_ref: a67000c108999b38b294d3e0c05141277851e619
created_at: 2026-09-13T15:55:21Z
updated_at: 2026-09-14T14:34:52Z
---

## Goal

Let a Studio host expose an authored YAML source panel that Producers can inspect, copy, replace, validate, undo and redo while structured editing stays synchronized with the same document history.

## Context

Playground currently owns a bespoke YAML textarea beside its rendered preview. YAML is part of the authoring experience rather than a separate product surface. `INFOSCHEMATICS-TOOL-033` now supplies the lossless, stable-ID document-edit boundary needed to place that source experience inside Studio.

## Boundary

This item does not grant Studio filesystem authority, embed callbacks in authored data, add a code-editor dependency, implement collaboration or conflict resolution, or redesign unrelated Studio panels. The host retains source loading, persistence and conflict authority.

## Current state

Studio accepts a retained authored document and emits validated structured edits, but it has no source panel. A host cannot yet offer one coherent Studio history across direct YAML replacement and structured changes.

## Steps

- [x] Define a Studio source-panel host contract around the lossless document protocol delivered by `INFOSCHEMATICS-TOOL-033`.
- [x] Add a Source tab that displays and copies current YAML, accepts replacement text, and reports accessible parse or validation failures without discarding the last valid document.
- [x] Keep valid source replacements and structured document edits in one undoable and redoable document history.
- [x] Emit validated source replacements to a host persistence callback without granting Studio filesystem access.
- [x] Cover comments and scalar-style retention, source ordering, invalid replacement, undo and redo, structured-edit synchronization, focus, keyboard use, copy and panel lifecycle.
- [x] Update the authoring and Design-editing specifications, Studio design documentation and authored-YAML guide.

## Files touched

- `packages/view-studio/src/app/`
- focused Studio source-panel and browser tests
- `docs/design/view-studio.md`
- `docs/specs/authoring.md`
- `docs/specs/design-editing.md`
- `docs/guides/editing-authored-yaml.md`

## Verify

Run focused Studio source-panel and YAML document-edit suites, package builds and `bun run self:check`. In an integration fixture, confirm copy returns current source, valid replacement updates the rendered model after host acknowledgement, invalid replacement preserves the last valid model with accessible errors, undo and redo traverse source and structured edits, and structured edits preserve unaffected YAML syntax.

## Dependencies / blocks

The lossless document protocol and canonical Sequence projection are delivered. This work supplies the reusable Studio panel required by `INFOSCHEMATICS-SITE-019`.

## Documentation impact

### Decision Records

Extend the existing lossless-editing decision. Add a separate decision only if implementation introduces a new ownership boundary.

### Specifications

Specify source replacement, validation failure, synchronization, history and host-persistence behaviour as user-observable contracts.

### Guides

Add source-panel host integration and Producer usage guidance to the authored-YAML guide.

### Roadmap

Unblock the Studio-backed Playground. Keep code-editor enhancements and collaboration as separately selected work.

## Review

### Delivered

- A Source tab for retained authored documents in Present, Design and Direct modes.
- Validated whole-document replacement through a host-owned `onDocumentReplace` callback.
- One session-local retained-document timeline spanning structured edits, source replacement, undo and redo.
- Accessible validation feedback, clipboard copy, exact-source reset and responsive panel treatment.

### Summary of changes

Studio now exposes exact retained YAML without exposing YAML nodes to views. Invalid drafts remain in the editor with addressed diagnostics while the last valid diagram stays active. Valid replacements and structured edits append to one document history, and history navigation emits a validated document for host acceptance.

### Verification

- `bun run self:check` passes with 87 test files and 649 unit/integration tests, 4 browser files and 15 browser tests, all package and example typechecks, dependency-cruiser, schema and visual-token checks, and the production Site build.
- Focused Studio document-history, document-operation and browser suites pass.
- A 1440 × 900 Chromium render was inspected after opening the panels and Source tab; the editor fills the panel, history and actions remain distinct, and the visually hidden labels no longer disturb layout.
- `ki-specs`, `ki-guides` and `ki-authoring` audits pass.

### Outstanding concerns

The Decision Record audit still reports the pre-existing noncanonical filename `ADR-INFOSCHEMATICS-018-keep-renderer-command-thin.md`; this item did not rename an unrelated record. The source panel deliberately uses a plain textarea until a separately reviewed code-editor dependency is justified.

### Post-change review

Review host acknowledgement timing, history branching after undo, invalid-source diagnostics, Source-tab availability in all three modes, clipboard failure feedback and the boundary between Studio replacement requests and host persistence.

### Mini recap

Studio now owns the reusable YAML editing surface while the host still owns which validated document becomes current and whether it is saved.

## Discussion

### One document, two editing surfaces

The source panel is another view of the authored Infoschematic, not a second model. Valid source replacements and structured changes advance the same retained document timeline.

### Host authority

Studio may validate, preview and emit replacement documents. Only the host knows which document is current, whether it should be persisted and how external conflicts are resolved.
