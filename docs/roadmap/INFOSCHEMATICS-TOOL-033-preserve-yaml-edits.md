---
id: INFOSCHEMATICS-TOOL-033
area: TOOL
title: Preserve YAML edits
theme: tool
horizon: next
status: awaiting-review
blocks: [INFOSCHEMATICS-TOOL-043]
blocked_by: []
baseline_ref: f2bdeee4ccaf57d6414309e4f4c09c34c8fcd148
created_at: 2026-09-09T10:13:09Z
updated_at: 2026-09-14T13:36:49Z
---

## Goal

Let Studio express and apply edits to an authored YAML document without discarding comments, deliberate scalar styles, field ordering, or stable review history.

## Context

`INFOSCHEMATICS-TOOL-032` established YAML as the primary inert document representation but intentionally parses to plain canonical data. Studio currently stores serialisable editor operations and produces source-oriented change descriptions, yet it does not retain or edit the YAML concrete syntax tree. A lossless editorial layer should keep the authored document and express changes as inert operations addressed by stable domain IDs rather than array positions.

## Boundary

This item does not reopen the canonical model, introduce executable document values, make numeric array positions durable identities, write files from React components, or define collaborative transport and merge policy. Hosts retain source loading, persistence, and conflict authority.

## Current state

Domain Core retains source-token YAML behind an opaque validated document and applies versioned transactional edits through stable IDs. Studio accepts that document as an alternative host input and projects artefact operations into validated source changes. TOOL-035 has now supplied canonical Sequence runtime identities, leaving their projection into the document protocol as the only implementation step.

## Steps

- [x] Add a Domain Core document API that retains the YAML concrete syntax tree alongside the validated canonical model, diagnostics, original pathname, and deterministic source emission.
- [x] Define a versioned inert edit envelope with `add`, `remove`, `replace`, and `move` operations; address collection members through structured field and stable-ID segments, and use stable before/after ID anchors for ordering rather than numeric indices.
- [x] Apply edit batches transactionally to a cloned document tree, preserve untouched comments, scalar styles, aliases already accepted by the loader, and mapping order, then validate the complete result before returning source or model.
- [x] Produce inverse operations from the pre-edit document so undo and redo restore both semantic values and affected concrete syntax.
- [x] Project canonical Studio Sequence and Scene presentation edits into the versioned protocol, retaining the current editor-draft compatibility reader only for established input.
- [x] Add a host-owned Studio source boundary that accepts an authored document and emits validated edit batches or updated source; keep filesystem writes and conflict resolution outside Studio.
- [x] Cover comments before, beside, and within edited nodes; quoted and block scalars; stable collection ordering; sorted-set `elements`; add/remove/move anchors; invalid references; rollback; undo/redo; and parse-emit idempotence.
- [x] Record the lossless editing and persistence boundary and document the operation format for hosts, Studio, collaboration adapters, and agent-authored changes.

## Files touched

- `packages/domain-core/src/`
- `packages/view-model/src/` editable operations
- `packages/view-studio/src/` editor draft, source changes, and public host boundary
- focused YAML and Studio fixtures
- `docs/decisions/`, `docs/specs/`, and host/editor guidance

## Verify

Run focused `bunx vitest run` suites for Domain Core parsing and document edits, View Model editable operations, and Studio source changes, then `bun run self:packages:build` and `bun run self:check`. For each fixture, assert the edited document parses to the expected canonical model, untouched source regions remain byte-identical, applying an inverse restores the original source, invalid batches leave the original unchanged, and parse-emit-parse is stable.

## Dependencies / blocks

The canonical YAML loader, stable canonical IDs, serialisable Studio editor operations, unified Sequences, and canonical View internals are delivered. The generic document protocol already edits Sequence and Scene paths, and TOOL-035 now exposes the canonical identities needed to project Studio presentation changes without another temporary editor.

## Documentation impact

### Decision Records

Add a decision record for concrete-syntax preservation, versioned ID-addressed operations, transactional validation, and host-owned persistence.

### Specifications

Add Domain Core and Studio requirements for document retention, edit addressing, validation, rollback, inversion, and source preservation.

### Guides

Document the edit envelope and host integration, with examples showing preserved comments and YAML-oriented review output.

### Roadmap

Keep collaboration transport, merge policy, and agent orchestration as later work unless implementation exposes a concrete prerequisite.

## Review

### Delivered

- Opaque source-token YAML documents and versioned transactional edit envelopes.
- Stable-ID structural, Sequence, and Scene edit projection from Studio.
- Host acknowledgement that clears only accepted structural and presentation drafts.
- Canonical Direct editor population for expanded and collapsed Sequences.

### Summary of changes

The remaining implementation adapts canonical Sequence categories into Studio's focused Direct editor panels and merges their drafts back into canonical Sequences without losing unexposed fields. Document projection recursively emits field edits and stable-ID add, remove, and move operations rather than replacing the top-level presentation tree.

New collapsed Sequence Scenes receive deterministic stable IDs. Established input continues through its existing editor-draft reader, while canonical YAML uses the same visible panels with canonical ownership and output paths.

### Verification

- `bun run self:check` passes: 86 test files and 647 unit/integration tests, 4 browser files and 14 browser tests, all package and example typechecks, dependency-cruiser, schema and token checks, and the production Site build.
- Focused Domain Core, View Model, and Studio suites pass: 43 files and 317 tests.
- Browser coverage opens a canonical YAML Scene in Direct mode and observes the emitted stable-ID document edit.
- `ki-authoring`, `ki-specs`, and `ki-guides` audits pass.

### Outstanding concerns

The Direct panels retain internal compatibility-oriented component and target names while established public input remains supported. Their persisted keys have moved to Sequence-qualified names so obsolete Theme and Story drafts cannot leak into canonical YAML editing.

The Decision Record audit still reports the pre-existing filename finding for `ADR-INFOSCHEMATICS-018-keep-renderer-command-thin.md`; this item did not rename an unrelated record.

### Post-change review

Review comment retention around edited Sequence fields, add and reorder behaviour, the four independent display and timing combinations, and host acknowledgement when a newer local draft exists.

### Mini recap

Studio can now edit canonical YAML presentation content through the same lossless, stable-ID protocol already used for diagram elements, completing the source-preservation contract without giving the browser filesystem authority.

## Discussion

### Edit vocabulary

Version one borrows the four familiar structural operations: add, remove, replace, and move. Paths are structured inert data containing field segments and stable-ID selectors. Collection insertion and movement use optional before or after ID anchors, so no stored operation depends on an array index.

### Source preservation

Edits operate on the YAML concrete syntax tree rather than serialising a plain JavaScript object. Untouched nodes retain comments, scalar style, aliases, ordering, and surrounding formatting. The canonical model remains the validation and runtime boundary; views never receive YAML document nodes.

### Authority boundary

Studio may preview and emit a validated edit batch or updated source, but the host decides which document is current, whether to persist it, and how to handle concurrent changes. That keeps browser state and filesystem authority out of the authored model and reusable View packages.

### Sequence projection

The public Studio source boundary now projects diagram and presentation drafts. Sequence and Scene edits use canonical ownership and stable-ID paths while focused Direct panels continue to provide the editing surface.

The completed foundation began from `cc467afa5ff8dc6dfd72d7b475441d120b82971c`; the final Sequence projection began from `f2bdeee4ccaf57d6414309e4f4c09c34c8fcd148`.
