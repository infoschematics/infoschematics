---
id: ADR-INFOSCHEMATICS-001
title: Routes authored as points
date: 2026-08-22
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [PDR-INFOSCHEMATICS-001]
---

# ADR-INFOSCHEMATICS-001: Routes authored as points

## Context

An SVG path string is output syntax rather than an appropriate source of geometry. Treating it as authored state would leave ports and endpoints as separate assertions and make waypoint editing, segment dragging, component movement, and grid alignment depend on string surgery.

## Decision

A Flow route is authored as the ordered points it runs through, including its first and last point. The SVG `d` path is derived output. Renderers reject diagonal runs where the supported route model is orthogonal.

## Consequences

Geometry is data: waypoint operations are list operations and placement changes are arithmetic over points. View Model guards the round-trip law `routePath(routePoints(d)) === d`.

Endpoint identity and endpoint geometry remain distinct claims. A later derivation can make route endpoints follow declared ports structurally without reversing this decision.
