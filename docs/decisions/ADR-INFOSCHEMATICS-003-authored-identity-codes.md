---
id: ADR-INFOSCHEMATICS-003
title: Authored identity codes
date: 2026-08-22
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [PDR-INFOSCHEMATICS-001]
transferred_from: ADR-IBC2026-003
---

# ADR-INFOSCHEMATICS-003: Authored identity codes

## Context

Cards, Fabrics, Flows, and presentation material carry codes used in discussion, labels, Scenes, and change output. Deriving a code from list order makes identity move whenever an earlier item is removed or inserted.

## Decision

Codes are authored, not generated from array position. Issuing logic proposes the next available code for new material, while validation checks uniqueness and any configured naming convention. A retired code is not silently reassigned.

## Consequences

Identity survives movement, reclassification, and neighbouring removal. Authors must choose or accept a proposed code, and serial gaps are an honest record of removed material rather than an error to tidy. Human-readable codes remain distinct from stable machine identifiers.
