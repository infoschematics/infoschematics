---
id: INFOSCHEMATICS-TOOL-034
area: TOOL
title: Unified presentation sequences
theme: tool
horizon: next
status: ready
blocks: [INFOSCHEMATICS-TOOL-035]
blocked_by: []
baseline_ref: null
---

## Goal

Replace separate Themes and Stories with one Sequence concept whose display, timing, and callout behaviour can be selected independently.

## Context

Themes and Stories both own ordered Scenes, but the current view layer fixes them into two combinations: a Theme expands every Scene into an independently selectable control without timing, while a Story collapses its Scenes behind one entry and advances them automatically.

That leaves expanded timed playback and collapsed manual playback inexpressible. Sequence should carry `{ id, label, description?, presentation, scenes }`, with an explicit presentation block selecting display, progression, and callout behaviour. `description` should carry explanatory or interrogative text currently split between `description` and Story `question`.

## Boundary

This item does not reintroduce `sourceScene`, Scene inheritance, implicit sharing, or a top-level Scene vocabulary. Scene reuse remains a Studio copy operation. It does not define YAML patch operations, arbitrary animation timelines, or Diagram Dynamics. Established Theme and Story inputs remain supported at the compatibility boundary.

## Current state

The canonical domain model, schema, serialiser, compatibility projection, runtime, Present, and Studio all encode Themes and Stories separately. Runtime state and controls expose distinct thematic-scene and running-story paths, while callout and auto-advance behaviour is inferred from the container type. Existing examples and the IBC consumer exercise both paths.

The ownership decision is settled: every Sequence owns its Scenes directly. No unresolved domain-reference choice remains.

## Steps

- [ ] Replace canonical `Theme` and `Story` types with `Sequence`, `SequencePresentation`, and one owned Scene shape; require `display: expanded | collapsed`, `timed: boolean`, and `callouts: boolean`, and remove `question`.
- [ ] Mirror the Sequence contract in Domain Core validation, reference checks, generated schema, definition defaults, and compact stable serialisation.
- [ ] Translate established Themes to explicit expanded, untimed, callout-enabled Sequences and established Stories to explicit collapsed, timed, callout-enabled Sequences without changing the established input contract.
- [ ] Replace the split runtime representation and presentation state with Sequence selection and playback that supports all four display/timing combinations; timed Scenes use authored duration with the current hold fallback.
- [ ] Rebuild Present and Studio controls so expanded Sequences expose Scene entries, timed expanded Sequences also expose playback, collapsed Sequences expose one entry, and collapsed untimed Sequences advance manually.
- [ ] Gate Scene callouts solely through `presentation.callouts`, use Sequence or Scene descriptions wherever Story questions were displayed, and preserve partner-callout rendering.
- [ ] Migrate repository examples and fixtures, add parity coverage for all four presentation combinations, and visually inspect the controls and callouts at desktop and narrow widths.
- [ ] Record the unified presentation decision and update the canonical model, core, vocabulary, and consumer guidance.

## Files touched

- `packages/domain-model/src/`
- `packages/domain-core/src/` and `packages/domain-core/schema/`
- `packages/view-model/src/`
- `packages/view-present/src/`
- `packages/view-studio/src/`
- `packages/render-svg/src/`
- `examples/`
- `docs/decisions/`, `docs/specs/`, `docs/reference/`, and affected guides

## Verify

Run `bun run self:packages:build`, focused `bunx vitest run` suites for Domain Core, compatibility, runtime, Present, Studio, and static SVG, then `bun run self:check`. Confirm schema generation and format-parity fixtures are clean. On a throwaway site port, inspect expanded/manual, expanded/timed, collapsed/manual, and collapsed/timed controls; confirm callouts obey their independent switch and existing Theme/Story inputs retain their prior behaviour.

## Dependencies / blocks

The canonical YAML loader and authoring model are already delivered. This item has no build prerequisite. It blocks `INFOSCHEMATICS-TOOL-035` because canonical View internals should migrate after the presentation vocabulary is settled and implemented. The external IBC repository is a proving consumer, but changes there require a separately authorised repository write during implementation.

## Documentation impact

### Decision Records

Add a decision record for the unified Sequence concept, explicit presentation switches, owned Scenes, and compatibility boundary.

### Specifications

Update Domain Model and Domain Core requirements to replace Themes, Stories, and `question` with Sequences and explicit presentation behaviour.

### Guides

Update the overview, visual guide, and presentation guidance so the four supported display/timing combinations are understandable without legacy terminology.

### Roadmap

Once the implementation lands, clear the build-order dependency from `INFOSCHEMATICS-TOOL-035`; do not close that follow-on automatically.

## Discussion

### Scene ownership

Scenes are owned by each Sequence. Reuse is an editorial operation that copies Scene data; it is not a domain relationship. This keeps authored documents explicit and avoids hidden inheritance or `sourceScene` indirection.

### Explicit presentation

The presentation block is required rather than relying on defaults because each switch materially affects audience behaviour. Compatibility projection supplies explicit values for legacy inputs. `timed` controls automatic progression only; `display` controls whether the Sequence or each Scene is the primary selector; `callouts` controls whether authored callouts render.

### Compatibility

Established inputs remain accepted at the public boundary and are normalised once. New canonical values and downstream internals must not carry both vocabularies indefinitely; `INFOSCHEMATICS-TOOL-035` removes the remaining compatibility-shaped internals after this contract lands.
