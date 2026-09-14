---
id: INFOSCHEMATICS-TOOL-043
area: TOOL
title: Studio source panel
theme: tool
horizon: next
status: draft
blocks: [INFOSCHEMATICS-SITE-019]
blocked_by: [INFOSCHEMATICS-TOOL-033]
baseline_ref: null
created_at: 2026-09-13T15:55:21Z
updated_at: 2026-09-13T16:31:38Z
---

# Studio source panel

## Goal

Let a Studio host expose the authored YAML source as an editor panel that can be inspected, copied, replaced, validated, and kept in step with structured editing.

## Context

The Playground currently owns a bespoke YAML textarea beside a rendered preview. YAML is part of the authoring experience rather than a separate product surface, but moving it into Studio requires the lossless document-edit boundary planned by `INFOSCHEMATICS-TOOL-033`.

## Boundary

This item does not grant Studio filesystem authority, embed callbacks in authored data, choose a code-editor dependency without review, implement collaboration or conflict resolution, or redesign every Studio panel.

## Current state

Studio edits structured drafts derived from canonical data and has no source panel. Playground parses and serialises YAML itself, so source editing, validation feedback, and replacement behaviour are outlet-specific and cannot preserve document syntax through structured edits.

## Steps

- [ ] Define the Studio source-panel host contract around the lossless document and edit protocol delivered by `INFOSCHEMATICS-TOOL-033`.
- [ ] Add a panel that displays and copies current YAML, accepts replacement text, and reports parse and validation failures without discarding the last valid document.
- [ ] Keep structured edits and source replacements synchronized through one undoable document history.
- [ ] Expose host-controlled persistence hooks without reading or writing files inside Studio.
- [ ] Cover comments, scalar styles, ordering, invalid replacements, undo and redo, focus, keyboard access, and panel lifecycle.
- [ ] Document how hosts integrate the panel and retain persistence authority.

## Files touched

- `packages/view-studio/src/`
- focused Studio source-panel fixtures and tests
- `docs/design/view-studio.md`
- `docs/specs/view-studio.md`
- consumer Studio guidance rendered by Site

## Verify

Run focused Studio source-panel and YAML document-edit suites, package builds, and `bun run self:check`. In an integration fixture, confirm copy returns current source, valid replacement updates the rendered model, invalid replacement preserves the last valid model with accessible errors, and structured edits preserve unaffected YAML syntax.

## Dependencies / blocks

`INFOSCHEMATICS-TOOL-033` must first supply lossless, transactional YAML document edits. This work then supplies the reusable panel required by `INFOSCHEMATICS-SITE-019`.

## Documentation impact

### Decision Records

Extend or link the lossless-editing decision from `INFOSCHEMATICS-TOOL-033`; add a separate decision only if panel ownership introduces a new reusable boundary.

### Specifications

Specify source replacement, validation failure, synchronization, history, and host-persistence behaviour.

### Guides

Add Studio source-panel integration and authoring guidance after the contract lands.

### Roadmap

Unblock the Studio-backed Playground. Keep code-editor enhancements and collaboration as separately selected work.

## Discussion

### Source as a panel

YAML is one representation of the authored Infoschematic, not a second model. A Studio panel lets hosts compose it alongside structured editing while one document history remains authoritative.

### Host authority

The panel can emit validated changes and persistence requests, but only the host knows which document is current and whether or where it should be saved.
