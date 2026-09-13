---
id: GDR-INFOSCHEMATICS-001
title: Adopt Decision Records
date: 2026-08-22
status: current
decision_type: governance
decision_type_url: https://knowledgeislands.info/specifications/decision-records/gdr
---

# GDR-INFOSCHEMATICS-001: Adopt Decision Records

## Context

Durable reasoning was otherwise repeated across plans, code comments, and documentation. Those instruments answer different questions and should not compete as sources of truth.

## Decision

Use Decision Records in `docs/decisions/` for **why**. Use Specifications in `docs/specs/` for the accepted **what**, including current conformance, verification, and evidence. Use guides in `docs/guides/` for **how**, reference material in `docs/reference/` for canonical facts and language, design documents in `docs/design/` for coherent technical shape, and roadmap records in `docs/roadmap/` for **when** work is planned and delivered.

Decision Records are concise living statements of the current decision. Edit them in place when the decision is refined; Git retains history.

## Consequences

Readers can follow reasoning without mistaking plans for contracts or procedures for architecture. Substantive work updates the instrument whose question it changes and links across instruments when needed.
