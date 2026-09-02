---
id: GDR-INFOSCHEMATICS-002
title: Delegated mechanical work
date: 2026-08-22
status: current
decision_type: governance
decision_type_url: https://knowledgeislands.info/specifications/decision-records/gdr
decision_depends_on: [GDR-INFOSCHEMATICS-001]
---

# GDR-INFOSCHEMATICS-002: Delegated mechanical work

## Context

Work in this repository divides into judgment and mechanics. Product boundaries, vocabulary, architectural coherence, and the claims made by decisions or specifications require a coordinating view. Exact renames, bounded moves, path repair, and verification loops can be specified precisely and performed independently.

## Decision

The coordinating agent retains judgment work and the final review. Mechanical work may be delegated using a bounded recipe that names owned paths, expected changes, verification, and the instruction to report rather than improvise when reality differs.

Concurrent work must use disjoint file ownership or isolated worktrees. The coordinator reviews the resulting diff and owns integration and commit boundaries.

## Consequences

Delegation improves throughput without distributing architectural authority. Work that cannot yet be described as a bounded recipe is not mechanical and returns to the coordinator for shaping. A delegate's report is useful context but never replaces review of the actual change.
