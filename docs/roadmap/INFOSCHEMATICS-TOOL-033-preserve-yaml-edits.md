---
id: INFOSCHEMATICS-TOOL-033
area: TOOL
title: Preserve YAML edits
theme: tool
horizon: next
status: in-progress
blocks: [INFOSCHEMATICS-TOOL-043]
blocked_by: []
baseline_ref: f2bdeee4ccaf57d6414309e4f4c09c34c8fcd148
created_at: 2026-09-09T10:13:09Z
updated_at: 2026-09-14T08:35:12Z
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
- [ ] Project canonical Studio Sequence and Scene presentation edits into the versioned protocol, retaining the current editor-draft compatibility reader only for established input.
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

## Discussion

### Edit vocabulary

Version one borrows the four familiar structural operations: add, remove, replace, and move. Paths are structured inert data containing field segments and stable-ID selectors. Collection insertion and movement use optional before or after ID anchors, so no stored operation depends on an array index.

### Source preservation

Edits operate on the YAML concrete syntax tree rather than serialising a plain JavaScript object. Untouched nodes retain comments, scalar style, aliases, ordering, and surrounding formatting. The canonical model remains the validation and runtime boundary; views never receive YAML document nodes.

### Authority boundary

Studio may preview and emit a validated edit batch or updated source, but the host decides which document is current, whether to persist it, and how to handle concurrent changes. That keeps browser state and filesystem authority out of the authored model and reusable View packages.

### Remaining Sequence projection

The document protocol and public Studio source boundary are complete. The unchecked projection step is limited to existing Scene and presentation editor actions and can now use canonical Sequence ownership directly.

The completed foundation began from `cc467afa5ff8dc6dfd72d7b475441d120b82971c`. This implementation cycle will record a new immutable baseline before changing the remaining presentation projection.
