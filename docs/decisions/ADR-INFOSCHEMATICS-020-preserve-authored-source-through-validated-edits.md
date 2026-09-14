---
id: ADR-INFOSCHEMATICS-020
title: Preserve authored source through validated edits
date: 2026-09-14
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-005, ADR-INFOSCHEMATICS-013]
---

# ADR-INFOSCHEMATICS-020: Preserve authored source through validated edits

## Context

Canonical YAML is both executable input and reviewable source. Parsing it to plain data is correct for runtimes, but serialising that data after an edit discards comments, deliberate scalar styles, aliases, and local mapping order. Numeric array positions are also unstable addresses because independent reordering changes their meaning.

Studio may help a Producer edit source, but reusable view code must not acquire filesystem authority or expose YAML parser nodes to renderers and runtimes.

## Decision

Domain Core retains authored YAML behind an opaque `InfoschematicDocument`. Public accessors expose only its exact source, pathname, and validated canonical model.

Document changes use a versioned inert envelope containing `add`, `remove`, `replace`, and `move` operations. Paths contain field segments and stable-ID selectors; collection ordering uses stable before-or-after ID anchors. Domain Core applies a complete envelope to a cloned document, normalises edited `elements` sets, validates the full canonical result, and publishes nothing when any operation or reference is invalid.

Every successful edit returns an inverse. The inverse carries a semantically verified source snapshot when exact concrete syntax is required to restore comments and scalar presentation. Studio may project its typed draft operations into this protocol and emit a validated result. Its Source panel may also parse a whole-document replacement and keep both forms of valid change in one session-local document timeline, but the host alone accepts, persists, and reconciles source.

## Consequences

Untouched authored choices survive structured edits, undo can restore exact source, and change addresses remain stable across collection reordering. Runtimes and renderers continue to receive only canonical data. Studio adapts canonical Sequence categories into focused Direct editors and projects their changes as field or stable-ID member operations; it does not replace the complete presentation tree merely because an editor holds an ordered collection draft.

Inverse envelopes may be larger than forward envelopes because exact restoration can require a source snapshot. Collaboration transport and merge policy remain separate concerns; this protocol defines deterministic local edits, not concurrent authority. Source-panel undo and redo select validated retained documents and request host acceptance rather than bypassing that authority.

## References

- [ADR-INFOSCHEMATICS-005](ADR-INFOSCHEMATICS-005-host-owned-configuration.md) — keeps source and persistence under host authority.
- [ADR-INFOSCHEMATICS-013](ADR-INFOSCHEMATICS-013-validation-mirrors-the-contract.md) — requires edited documents to pass the same canonical validation contract as loaded documents.
