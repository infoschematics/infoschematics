---
id: INFOSCHEMATICS-TOOL-034
area: TOOL
title: Unified presentation sequences
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: e47f2ae54bd64431190ab9154576374c88b531a8
created_at: 2026-09-10T00:14:39Z
updated_at: 2026-09-14T03:43:59Z
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

- [x] Replace canonical `Theme` and `Story` types with `Sequence`, `SequencePresentation`, and one owned Scene shape; require `display: expanded | collapsed`, `timed: boolean`, and `callouts: boolean`, and remove `question`.
- [x] Mirror the Sequence contract in Domain Core validation, reference checks, generated schema, definition defaults, and compact stable serialisation.
- [x] Translate established Themes to explicit expanded, untimed, callout-enabled Sequences and established Stories to explicit collapsed, timed, callout-enabled Sequences without changing the established input contract.
- [x] Replace the split runtime representation and presentation state with Sequence selection and playback that supports all four display/timing combinations; timed Scenes use authored duration with the current hold fallback.
- [x] Rebuild Present and Studio controls so expanded Sequences expose Scene entries, timed expanded Sequences also expose playback, collapsed Sequences expose one entry, and collapsed untimed Sequences advance manually.
- [x] Gate Scene callouts solely through `presentation.callouts`, use Sequence or Scene descriptions wherever Story questions were displayed, and preserve partner-callout rendering.
- [x] Migrate repository examples and fixtures, add parity coverage for all four presentation combinations, and visually inspect the controls and callouts at desktop and narrow widths.
- [x] Record the unified presentation decision and update the canonical model, core, vocabulary, and consumer guidance.

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

## Review

### Delivered

From immutable baseline `e47f2ae54bd64431190ab9154576374c88b531a8`, canonical presentation material now uses owned `Sequence` Scenes with explicit `display`, `timed`, and `callouts` switches. Present, Studio, static rendering, examples, fixtures, schema, and documentation consume or explain the new contract while the established Theme and Story input boundary remains compatible.

### Summary of changes

- Replaced canonical Theme and Story types and schema fields with one Sequence model and removed canonical `question`.
- Normalised established standalone Scenes, Themes, and Stories into explicit Sequences at the compatibility boundary.
- Added Sequence runtime state, controls, timing, callout gating, signals, details, and static-renderer selection.
- Migrated repository examples and format-parity fixtures, recorded ADR-INFOSCHEMATICS-019, and updated specifications and consumer guidance.
- Cleared the build-order block on INFOSCHEMATICS-TOOL-035.

### Verification

- `bun run self:packages:build`
- `bunx vitest run packages/domain-core packages/view-model packages/view-present packages/view-studio packages/render-svg examples/is-infoschematics examples/is-blank examples/is-system` — 49 files and 353 tests passed.
- `bun run self:verify:typecheck`
- `bun run self:check`
- `ki repo audit --skill ki-specs --repo .`
- Desktop and narrow playground screenshots on throwaway port 4187 confirmed the migrated format-parity model remains legible and responsive.
- A throwaway Present harness on port 4188 rendered all four Sequence combinations at desktop and narrow widths; browser interaction confirmed a callout-enabled Sequence renders its callout and a callout-disabled Sequence does not.

### Outstanding concerns

Direct's internal Theme and Story editor vocabulary remains temporarily compatibility-shaped and is explicitly owned by INFOSCHEMATICS-TOOL-035. The narrow Present harness also exposes a pre-existing title/header collision addressed by the responsive-density work in INFOSCHEMATICS-TOOL-039; the new Sequence control bank itself wraps cleanly. The decision-record audit is otherwise blocked by the pre-existing non-canonical filename for ADR-INFOSCHEMATICS-018.

### Post-change review

The public canonical contract has one presentation concept and all four display/timing combinations are represented in tests. Compatibility is confined to established inputs and named transitional view/editor paths; no Scene inheritance or shared Scene vocabulary was introduced.

### Mini recap

Sequences now describe what an audience can select, whether progression is automatic, and whether callouts appear. Legacy inputs retain their former behaviour, and canonical view-internal cleanup can proceed independently.

## Discussion

### Scene ownership

Scenes are owned by each Sequence. Reuse is an editorial operation that copies Scene data; it is not a domain relationship. This keeps authored documents explicit and avoids hidden inheritance or `sourceScene` indirection.

### Explicit presentation

The presentation block is required rather than relying on defaults because each switch materially affects audience behaviour. Compatibility projection supplies explicit values for legacy inputs. `timed` controls automatic progression only; `display` controls whether the Sequence or each Scene is the primary selector; `callouts` controls whether authored callouts render.

### Compatibility

Established inputs remain accepted at the public boundary and are normalised once. New canonical values and downstream internals must not carry both vocabularies indefinitely; `INFOSCHEMATICS-TOOL-035` removes the remaining compatibility-shaped internals after this contract lands.
