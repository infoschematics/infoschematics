---
id: INFOSCHEMATICS-TOOL-036
area: TOOL
title: Presentation control semantics
theme: tool
horizon: future
status: draft
candidate: true
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Make presentation controls expose architectural Scopes and Flow Families according to their domain meaning, with deliberate global visibility behaviour.

## Context

Card Collections and Flow Families provide semantic visual identity in the Diagram. Architectural Scopes instead describe a presentation selection: Cards named by a Scope are highlighted, together with Flows whose source and target Cards are both within that selection. The expanded and collapsed control surfaces now show Scope icons and Flow Family colours, but still retain global show or hide controls whose purpose and placement were not resolved during the model migration.

The distinction should remain visible in labels, tooltips, control grouping, selection state, and derived focus behaviour. A Collection must not appear as though it is an architectural Scope merely because both may contain similarly named Cards.

## Boundary

This item does not change Collection or Family appearance definitions, Specification-hover highlighting, Sequence playback, diagram zoom controls, or Studio editing of model membership. It does not assume the current global controls should be removed before their use cases and accessibility behaviour are reviewed.

## Discussion

### Scope selection

A Scope directly names the Cards it includes. Presentation derives the connecting Flows only when both endpoints are in that Scope, preventing unrelated routes from lighting merely because they cross the same area. Scope identity and icon belong to the top-level presentation concept rather than a Card Collection.

### Family selection

A Flow Family states what its Flows carry and supplies their shared semantic visual identity. Family controls therefore operate on Flows and should not be presented as a second architectural grouping of Cards.

### Global visibility

The existing trailing show or hide-all buttons need an explicit product decision: retain them as accessible bulk actions, move them into a clearer control group, or remove them if resetting presentation state already covers the need. The compact rail and expanded panel should follow the same decision without relying on an unexplained `All` chip.
