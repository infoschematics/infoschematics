---
id: ADR-INFOSCHEMATICS-002
title: Undo by snapshot
date: 2026-08-22
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-001]
transferred_from: ADR-IBC2026-002
---

# ADR-INFOSCHEMATICS-002: Undo by snapshot

## Context

Studio edits affect related authored draft state. Moving a Card can carry several Flow routes, so one gesture may update several maps. Inverse operations are compact but require every new edit kind to define a correct inverse, which is where undo defects accumulate.

## Decision

Studio keeps snapshots. Before a gesture begins, it copies the complete authored draft state onto the past stack. Each discrete action is one undo step, while a drag remains one step regardless of pointer-event count.

## Consequences

New edit kinds participate in undo when their state is part of the snapshot, without bespoke inverse logic. The cost is memory proportional to retained edits, acceptable while draft state remains small plain data. Drafts may survive reload, but undo history deliberately does not.
