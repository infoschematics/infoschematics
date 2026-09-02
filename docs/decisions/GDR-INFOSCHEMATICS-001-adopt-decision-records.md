---
id: GDR-INFOSCHEMATICS-001
title: Adopt decision records and documentation instruments
date: 2026-08-22
status: current
decision_type: governance
decision_type_url: https://knowledgeislands.info/specifications/decision-records/gdr
decision_depends_on: []
---

# GDR-INFOSCHEMATICS-001: Adopt decision records and documentation instruments

## Context

Infoschematics needs durable architectural and product reasoning that can be cited independently of delivery work. Without distinct homes, current behaviour, future intent, delivery state, and the reason for a choice become difficult to distinguish.

## Decision

This repository adopts local decision records and separates documentation instruments by the question each answers:

- decision records in `docs/decisions/` say **why**;
- specifications in `docs/specs/` say **what is true now**, using numbered requirements with verification hooks;
- design documents in `docs/design/` say **where a surface is going**;
- guides in `docs/guides/` say **how to use or operate it**;
- reference material in `docs/reference/` provides canonical facts and language;
- roadmap records in `docs/roadmap/` say **when work is planned or delivered**.

Substantive work updates each instrument it affects rather than asking one document to serve every purpose.

## Consequences

Reasoning becomes citable without being repeated in specifications. Design can stay ahead of implementation without being mistaken for a contract. Roadmap records can retain delivery evidence without becoming the permanent home of architecture. The cost is maintaining links between instruments and being explicit about which kind of claim is being written.
