---
id: INFOSCHEMATICS-TOOL-036
area: TOOL
title: Presentation control semantics
theme: tool
horizon: next
status: ready
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

## Current state

Present and Studio expose the right Scope icons and Flow Family colours, but label both banks generically as “Scopes” and “Families”. Their expanded and compact surfaces also append global show/hide actions that read as unexplained extra members of those vocabularies. Individual selection already applies the intended runtime rule: Cards belong directly to Architectural Scopes and a Flow remains visible only when both endpoints remain visible.

## Steps

- [ ] Label the reusable Present and Studio control banks as Architectural Scopes and Flow Families.
- [ ] Make control descriptions and tooltips state whether a choice is an Architectural Scope or a Flow Family.
- [ ] Remove trailing global show/hide actions from expanded and compact control banks while retaining individual toggles and initial all-visible state.
- [ ] Remove Studio-only bulk-control plumbing that no longer has a consumer without narrowing the reusable presentation reducer contract.
- [ ] Add focused rendered-control and runtime tests for the vocabulary, absence of unexplained bulk actions, and two-ended Scope Flow visibility rule.
- [ ] Rewrite the Present View specification to state the deliberate selection and reset behaviour.
- [ ] Run the focused package tests and complete repository verification gate.

## Files touched

- `packages/view-present/src/PresentationControls.tsx`
- `packages/view-present/src/presentation.test.ts`
- `packages/view-studio/src/app/hooks/use-presentation.ts`
- `packages/view-studio/src/app/panels/PanelRail.tsx`
- `packages/view-studio/src/app/panels/ProducerControls.tsx`
- `packages/view-studio/src/app/panels/ProductionControls.test.tsx`
- `docs/specs/view-present.md`
- This work record

## Verify

- `bunx vitest run packages/view-present packages/view-studio/src/app/panels/ProductionControls.test.tsx`
- `bun run self:check`
- `ki repo audit --skill ki-work-roadmap --repo .`

## Dependencies / blocks

The model inversion and Architectural Scope migration have landed. This item is independent of Sequence playback, Specification highlighting, and canonical View internals.

## Documentation impact

### Decision Records

No decision record is needed; the work applies the already-agreed product vocabulary and control placement without changing architectural ownership.

### Specifications

`docs/specs/view-present.md` will define individual selection, initial visibility, and the absence of vocabulary-level bulk controls.

### Guides

No guide change is needed because the controls remain self-describing and the visual guide already distinguishes Architectural Scopes from Flow Families.

### Roadmap

This record will capture the final control semantics. Sequence playback and canonical View internals remain separate work.

## Discussion

### Scope selection

A Scope directly names the Cards it includes. Presentation derives the connecting Flows only when both endpoints are in that Scope, preventing unrelated routes from lighting merely because they cross the same area. Scope identity and icon belong to the top-level presentation concept rather than a Card Collection.

### Family selection

A Flow Family states what its Flows carry and supplies their shared semantic visual identity. Family controls therefore operate on Flows and should not be presented as a second architectural grouping of Cards.

### Global visibility

Remove the trailing show/hide-all buttons from both compact and expanded banks. They read as vocabulary members rather than presentation reset actions. Individual controls remain independently toggleable, and a fresh presentation still begins with every Scope and Flow Family visible.

### Earlier options

The existing trailing show or hide-all buttons need an explicit product decision: retain them as accessible bulk actions, move them into a clearer control group, or remove them if resetting presentation state already covers the need. The compact rail and expanded panel should follow the same decision without relying on an unexplained `All` chip.
