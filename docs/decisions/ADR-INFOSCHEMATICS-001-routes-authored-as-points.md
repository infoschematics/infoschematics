---
id: ADR-INFOSCHEMATICS-001
title: Routes authored as points
date: 2026-08-22
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [PDR-INFOSCHEMATICS-001]
transferred_from: ADR-IBC2026-001
---

# ADR-INFOSCHEMATICS-001: Routes authored as points

## Context

Routes were originally hand-authored SVG path strings. That made the string the only source of geometry while ports and endpoints were separate assertions. Waypoint editing, segment dragging, component movement, and grid alignment would require string surgery rather than geometric operations.

## Decision

A Flow route is authored as the ordered points it runs through, including its first and last point. The SVG `d` path is derived output. Renderers reject diagonal runs where the supported route model is orthogonal.

## Consequences

Geometry becomes data: waypoint operations are list operations and placement changes are arithmetic over points. The original migration preserved the rendered SVG byte-for-byte and established the round-trip law `routePath(routePoints(d)) === d`, now guarded in the View Model tests.

Endpoint identity and endpoint geometry remain distinct claims. A later derivation can make route endpoints follow declared ports structurally without reversing this decision.
