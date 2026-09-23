---
id: GDR-INFOSCHEMATICS-001
title: Adopt Decision Records
date: 2026-09-23
status: current
decision_type: governance
decision_type_url: https://knowledgeislands.info/specifications/decision-records/gdr
---

# GDR-INFOSCHEMATICS-001: Adopt Decision Records

## Context

Durable reasoning was otherwise repeated across plans, code comments, and documentation. Those instruments answer different questions and should not compete as sources of truth.

## Decision

Use Decision Records in `docs/decisions/` for **why**. Use Specifications in `docs/specs/` for the accepted **what**, including current conformance, verification, and evidence. Use guides in `docs/guides/` for **how**, reference material in `docs/reference/` for canonical facts and language, and roadmap records in `docs/roadmap/` for **when** work is planned and delivered.

Material that supports the records without being one — a design document holding a coherent technical shape, a survey of adjacent projects, an evidence table — lives in `docs/decisions/references/`, inside this collection so a record cites it as a sibling rather than reaching outside for something that may move. Design documents carry a `design-` prefix there. Such a file is not a Decision Record: it has no identifier, no status, and no place in the ordered index, and no record may depend on a reader following a link to one.

Decision Records are concise living statements of the current decision. Edit them in place when the decision is refined; Git retains history.

## Consequences

Readers can follow reasoning without mistaking plans for contracts or procedures for architecture. Substantive work updates the instrument whose question it changes and links across instruments when needed.

A design document is a consumer of the records rather than a rival to them: it states the shape the decisions add up to and cites each decision that fixes part of it, so a reader who disagrees with the shape is pointed at the record to argue with. Keeping it beside the records is what makes that citation a sibling path and keeps the collection movable as one thing.
