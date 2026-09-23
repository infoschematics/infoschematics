---
id: PDR-INFOSCHEMATICS-002
title: Product messaging
date: 2026-09-21
status: current
decision_type: product
decision_type_url: https://knowledgeislands.info/specifications/decision-records/pdr
decision_depends_on: [PDR-INFOSCHEMATICS-001, KDR-INFOSCHEMATICS-001]
---

# PDR-INFOSCHEMATICS-002: Product messaging

## Context

The website, README, package descriptions, and social metadata need a consistent account of what Infoschematics is. Product messaging should describe the product rather than a surface's delivery state, and should preserve the distinction between explaining a system in operation and documenting how to assemble it.

## Decision

Canonical messaging is:

- **Essence** — _A visual instrument for complex systems._
- **Invitation** — _See how it works together._
- **Definition** — _An Infoschematic turns a system's architecture and the flows that move through it into one live, explorable view — precise enough for the engineer, clear enough to present to anyone._
- **Mission** — _Make complex systems comprehensible to the people who build them, run them, and depend on them._
- **Vision** — _Serious systems explained by a live instrument, not a stale diagram._

Public copy follows five rules:

1. Be precise and calm; avoid marketing hyperbole and exclamation.
2. Prefer operation language such as "works", "moves", and "explains" over assembly language.
3. Describe the product, not whether a surface is complete or forthcoming.
4. Use canonical product terms from [KDR-INFOSCHEMATICS-001](KDR-INFOSCHEMATICS-001-product-vocabulary.md).
5. Describe the definition and its outlets rather than a finished picture, per [PDR-INFOSCHEMATICS-001](PDR-INFOSCHEMATICS-001-an-infoschematic-is-an-authored-definition-not-a-drawing.md); a diagram redrawn for each outlet is not what is being offered, and copy does not present the product as a generator of finished pictures.

## Consequences

The homepage, metadata, README, and future package descriptions share one review point. A better canonical phrase changes here before it propagates to public surfaces, and it changes without reopening what the product is — that question belongs to `PDR-INFOSCHEMATICS-001`. Mission and vision provide orientation; delivery planning remains in the roadmap.
