---
id: INFOSCHEMATICS-TOOL-006
area: TOOL
title: Complete artefact editing
theme: tool
horizon: soon
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-005]
baseline_ref: null
---

## Goal

Give Design consistent creation, selection, placement, resizing and ordering capabilities across all six Infoschematic artefact kinds.

## Context

Current editing capability is strongest for Cards and Flows. The settled product contract also requires type-appropriate editing for Lanes, Zones, Fabrics and Graphics, explicit per-kind stack order, and a Library that can create reusable Card, Fabric and Flow templates without retaining links to those templates.

## Boundary

This item changes Design capabilities and persistent authored data only where required. It does not own Scene composition, production-mode navigation, package publication, or the visual design of the public site.

## Shaping

Extend the existing draft-and-change-set editing model rather than creating a second editor state path. `INFOSCHEMATICS-TOOL-005` must first establish Design ownership and transitions. Before promotion, inventory creation, selection, geometry, deletion and ordering support for every artefact kind; define per-kind mutation operations and copy-from-Library semantics; divide the work into inspectable steps; and specify interaction plus serialisation tests that preserve fixed depth and kind order.

## Discussion

### Geometry and order

Each kind needs geometry appropriate to its role: region bounds for Lanes and Zones, box bounds for Fabrics, Cards and Graphics, and routes with endpoints, ports and waypoints for Flows. Reordering remains within a kind while the fixed depth and kind order remains authoritative.
