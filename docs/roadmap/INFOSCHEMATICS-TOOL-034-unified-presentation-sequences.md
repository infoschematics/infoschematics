---
id: INFOSCHEMATICS-TOOL-034
area: TOOL
title: Unified presentation sequences
theme: tool
horizon: future
status: draft
candidate: true
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Replace separate Themes and Stories with one Sequence concept whose display, timing, and callout behaviour can be selected independently.

## Context

Themes and Stories both own ordered Scenes, but the current view layer fixes them into two combinations: a Theme expands every Scene into an independently selectable control without timing, while a Story collapses its Scenes behind one entry and advances them automatically. This leaves expanded timed playback and collapsed manual playback inexpressible.

A Sequence should carry `{ id, label, description?, presentation, scenes }`. Its presentation data should independently choose `display: expanded | collapsed`, timed or manual progression, and whether callouts render. `description` should carry the explanatory or interrogative text currently split between `description` and Story `question`.

## Boundary

This item does not reintroduce `sourceScene`, Scene inheritance, or implicit sharing. It does not decide Studio authoring workflows, YAML patch operations, arbitrary animation timelines, or diagram Dynamics. Existing Theme and Story inputs must remain compatible during migration.

## Discussion

### Scene ownership

The established canonical direction is that Scenes are owned by their presenting group and reuse is a Studio copy operation. A later proposal identified a top-level Scene vocabulary plus Sequence references as a cleaner separation of screen state from ordering and narration. Promotion requires an explicit decision between retaining owned Scenes and introducing referenced Scenes; it must not recreate hidden inheritance by accident.

### Independent presentation switches

Display, timing, and callouts describe different concerns and should not remain welded into type names. A single `presentation` block keeps the combinations explicit while allowing renderers to choose deterministic non-interactive output.

### Compatibility

The migration needs parity tests for expanded controls, manual and timed progression, callout visibility, descriptions, and current IBC presentation states. Compatibility projection may translate Sequences into existing runtime structures temporarily, but downstream Views should consume normalised structured data rather than shorthand authoring forms.
