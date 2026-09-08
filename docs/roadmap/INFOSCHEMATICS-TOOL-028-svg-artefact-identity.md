---
id: INFOSCHEMATICS-TOOL-028
area: TOOL
title: SVG artefact identity
theme: tool
horizon: soon
status: draft
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Make every rendered diagram artefact addressable by its authored ID through one documented, collision-safe SVG metadata contract shared by static SVG and Canvas output.

## Context

Authored IDs are already present in both SVG paths, but not through one public contract. `@infoschematics/render-svg` emits `data-id` on the outer Region, Fabric, Flow, Card, Point, and Graphic groups. Canvas emits `data-artefact-id` and `data-artefact-kind` on its corresponding interactive groups. Tests exercise those attributes incidentally for focus, signalling, editing, and preview ordering, while the renderer specifications do not promise them.

Using an authored ID directly as the native SVG `id` attribute would introduce unnecessary constraints. Authored IDs are unrestricted strings, native IDs share a document-wide namespace, and several Infoschematics may be mounted in one page. Renderer-owned definitions such as patterns and markers also already use native IDs internally.

## Boundary

This item does not implement diagram dynamics, expose renderer component structure, make internal SVG child nodes addressable, or assign output identity to model records that have no rendered artefact group. It does not add DOM callbacks or browser state to authored definitions. Port identity and whole-diagram identity remain explicit shaping decisions rather than being included implicitly.

## Shaping

Standardise the outer owning SVG group on `data-artefact-id` and `data-artefact-kind`, then document which authored artefact kinds participate. Audit consumers of static `data-id` before choosing removal, compatibility duplication, or migration. Add cross-renderer contract tests and specification requirements that assert identity without freezing child markup or output ordering.

Before promotion to Next, decide the canonical kind names, the compatibility policy for `data-id`, whether a root diagram identity is required when `InfoschematicConfig.id` is present, and whether visible port markers need a composite identity contract. Confirm that custom Graphics retain the authored Graphic ID on their host-owned outer group regardless of renderer output.

## Discussion

### Recommended attribute contract

`data-artefact-id` and `data-artefact-kind` are the recommended public hooks because they carry authored identity without claiming native document identity. The contract should attach them to the outer group that semantically owns one rendered artefact and should not promise a specific child element, CSS class, or position in the SVG tree.

### Existing coverage

Static SVG already covers Regions, Fabrics, Flows, Cards, Points, and Graphics through `data-id`; Canvas already carries the richer pair on the same broad set. The work is therefore primarily contract alignment, completeness review, compatibility, tests, and documentation rather than inventing identity from scratch.

### Dynamics relationship

Stable rendered identity is useful for diagram dynamics, host integrations, inspection, testing, and accessibility tooling. Dynamics should still target authored IDs through the framework-neutral model rather than manipulating SVG nodes directly; the SVG metadata is an output hook and traceable representation of that identity, not the dynamics API itself.
