---
id: PDR-INFOSCHEMATICS-002
title: A structured editor, not a drawing tool
date: 2026-08-22
status: current
decision_type: product
decision_type_url: https://knowledgeislands.info/specifications/decision-records/pdr
decision_depends_on: [PDR-INFOSCHEMATICS-001]
---

# PDR-INFOSCHEMATICS-002: A structured editor, not a drawing tool

## Context

Studio could grow either as a general drawing surface or as an editor for the Infoschematic model. Free coordinates, arbitrary colours, unrestricted shapes, and manual stacking appear flexible but allow the drawing to contradict the structure it claims to represent.

## Decision

Studio offers choices the model understands. Placement respects Infoschematic geography, Flow editing operates through ports and waypoints, visual identity follows authored groupings and renderer contracts, and derived values are changed through their source rather than overwritten.

Where the model constrains a value, the editor enforces the constraint during the interaction instead of warning afterwards.

## Consequences

Free rotation, arbitrary shapes, per-item font controls, and unconstrained z-order are deliberately absent rather than missing features. A new visual kind requires a named model or renderer concept before Studio can author it. This is slower than sketching but keeps rendered output trustworthy and portable between renderers.
