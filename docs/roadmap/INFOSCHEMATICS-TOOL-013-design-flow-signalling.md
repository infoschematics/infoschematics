---
id: INFOSCHEMATICS-TOOL-013
area: TOOL
title: Design Flow signalling
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 2c112fbcc5a38e9321f5a6311bf29cc3c7c32253
---

## Goal

Deliver an accessible, deterministic model for meaningful signals travelling along Flows without turning motion into ambient decoration or executable authored configuration.

## Context

Earlier visual treatments used small pulses moving along Flows to communicate activity. The visual-language guidance distinguishes a finite signalled state from idle, highlighted, and filtered states, but the product had no public authority for triggering, replaying, or representing that state.

Animation needs a separate contract from static appearance. It introduces transient runtime state, reduced-motion behaviour, Scene semantics, and coordination across multiple Flows. Static SVG must remain useful without motion.

## Boundary

This item does not put timers, callbacks, animation durations, or executable state into `InfoschematicConfig`. It does not treat every visible Flow as active, signal on hover or filtering, or make motion necessary to understand a diagram. It does not redesign Flow routing or general Scene authoring.

## Current state

Canvas renders finite keyed signal occurrences while preserving each Flow's static route and interaction geometry. Present derives occurrences from resolved focused Flows on Scene entry, and static SVG renders an explicit deterministic still treatment. View Model owns the framework-neutral occurrence and Scene-resolution contract.

## Steps

- [x] Add a framework-neutral `FlowSignal` occurrence contract in View Model containing a stable Flow identifier and host-owned occurrence key; repeated renders of the same occurrence MUST NOT restart the signal, while a new key MAY replay it.
- [x] Add a pure resolver that derives one signal occurrence for each resolved focused Flow when a Standalone, Thematic, or Story Scene is entered, including inherited Story Scene focus, without firing on filtering, hover, or unrelated rerenders.
- [x] Expose transient signal occurrences through Canvas props separately from `InfoschematicConfig`, allowing future hosts to supply explicit event-driven signals without a mutable process-global registry.
- [x] Make Present signal focused Flows once on Scene entry by default and provide an explicit `none` policy for hosts that do not want automatic signalling. Clearing or changing Scene cancels obsolete occurrences and never resumes a completed pulse automatically.
- [x] Render a small finite pulse along each signalled Canvas Flow, keyed by occurrence, while leaving the underlying Flow route static before and after animation and preserving pointer, selection, and routing geometry.
- [x] Mark travelling pulse graphics as presentational, announce the semantic Flow signal through a concise live region, and replace travel with a brief in-place route emphasis under `prefers-reduced-motion`.
- [x] Add signal-specific shared tokens only for values Canvas and deterministic still output must interpret together; keep transient timing and interaction details Canvas-owned unless another renderer requires the same value.
- [x] Extend static SVG render options with an explicit list of signalled Flow identifiers that emits a deterministic non-animated still treatment and never serialises animation elements, timers, or browser state.
- [x] Add reducer and rendered tests proving one-shot Scene entry, occurrence replay, simultaneous independent signals, cancellation, no signal on filtering or hover, reduced-motion markup, accessible announcements, and unchanged Flow selection geometry.
- [x] Add static SVG tests for deterministic signalled treatment, unknown and duplicate Flow handling, and unchanged default output. Keep the state model framework-neutral and React-free.
- [x] Record the signal-authority decision and update Canvas, Present, static SVG, and visual-language documentation with runtime, Scene, accessibility, and still-output semantics.

## Files touched

- `packages/view-model/src/signals.ts`, its public export, and focused resolver tests.
- `packages/view-canvas/src/Canvas.tsx`, `flow-signals.ts`, `InfoschematicDiagram.tsx`, `styles.css`, and signal tests.
- `packages/view-present/src/Present.tsx`, presentation state and derivation, public exports, and Scene/Story tests.
- `packages/render-svg/src/index.ts` and deterministic signalled-output tests.
- `packages/view-model/src/tokens.ts` and generated CSS for the genuinely shared still-emphasis width.
- `docs/decisions/ADR-INFOSCHEMATICS-012-keep-flow-signals-transient.md`, specifications, guides, and visual-language guidance.

## Verify

Pure View Model tests prove stable Scene resolution, inherited Story focus, and unknown Flow handling. Canvas reconciliation tests prove collision-safe occurrence identity, duplicate removal, one-shot acceptance, replay, simultaneous signals, filtering, and cancellation. Server-rendered Canvas tests prove finite visible pulse markup, the reduced-motion treatment, semantic announcement surface, and unchanged route, hit-target, hover, and selection markup.

Presentation reducer tests prove Scene entry, replay, Story stepping, cancellation, filtering without replay, and the `none` policy. A rendered Present wiring test uses the real reducer and derivation path and verifies that the resulting occurrence reaches Canvas. Static SVG tests prove deterministic still output, unknown and duplicate identifier handling, unchanged default output, and absence of animation elements.

`bun run check` and `bun run release:verify` are the final pass/fail gates.

## Dependencies / blocks

TOOL-008 and TOOL-009 supplied the required package and token boundaries. TOOL-012 was delivered first because both items touch Canvas, static SVG, token surfaces, and renderer semantics.

SITE-001 may later demonstrate signals, but its editable comparison does not block this work and does not acquire animation as an implicit acceptance condition.

## Delegation

- View Model occurrence and resolver contract: delegated as an isolated package lane.
- Canvas rendering, reconciliation, accessibility, and audit fixes: delegated as isolated Canvas-owned commits.
- Present Scene coordination and static SVG output: delegated as non-overlapping package lanes.
- Specifications, guides, and ADR: delegated separately from implementation.
- Cross-renderer regression coverage and independent acceptance audit: delegated after integration.
- The orchestrator retained roadmap lifecycle changes, shared-path coordination, final integration review, and repository-wide gates.

## Documentation impact

### Decision Records

ADR-INFOSCHEMATICS-012 fixes transient host and Scene signal authority, occurrence-based replay, the absence of runtime animation state from authored configuration, and deterministic static fallback.

### Specifications

View Model, Canvas, Present, and static SVG specifications now define occurrence identity, one-shot Scene entry, cancellation, reduced-motion, announcement, and still-output requirements.

### Guides

React integration guidance covers automatic Scene signalling, host-supplied occurrences, opt-out behaviour, and accessibility expectations. Authoring guidance makes clear that ordinary Flow configuration does not carry animation callbacks or timers.

### Roadmap

Event-stream correlation, externally sourced operational telemetry, and authoring UI for signal policy remain outside this first finite signalling contract unless separately captured after the public seam is proven.

## Review

### Delivered

Infoschematics now has one transient Flow-signal contract across View Model, Canvas, Present, and static SVG. Scene entry can signal focused Flows once, hosts can supply explicit keyed occurrences, and static exports can request a deterministic motion-free still state.

### Summary of changes

- Added `FlowSignal`, Scene signal selection, and pure focused-Flow resolution to View Model.
- Added Canvas occurrence reconciliation with collision-safe tuple keys, deduplication, cancellation, filtered-Flow retirement, and intentional replay through a new occurrence key.
- Added finite presentational SVG pulse travel, occurrence-aware live announcements, and a reduced-motion in-place emphasis without changing the underlying route or hit target.
- Added Present's default `focused-flows` policy and explicit `none` opt-out, with occurrence keys advancing only on Scene-entry actions.
- Added deterministic static SVG still emphasis for explicit Flow identifiers; unknown and duplicate identifiers are harmless and default output is unchanged.
- Kept the shared still-emphasis width in View Model while returning the pulse radius and timing to Canvas ownership.
- Added ADR-INFOSCHEMATICS-012 and updated specifications, integration and authoring guides, and visual-language guidance.

### Verification

- `bun run check` passed after integration, covering tests, every TypeScript workspace, generated-token drift, dependency boundaries, examples, and the production Site build.
- `bun run release:verify` passed after integration, packing and consuming all public workspaces from isolated tarballs.
- Focused tests cover stable and replayed occurrences, separator-safe identities, duplicates, simultaneous signals, hidden and restored Flows, cancellation, Story inheritance, filter stability, `none` policy, live-announcement revisions, pulse opacity, reduced-motion markup, unchanged interaction geometry, and deterministic static output.
- An independent audit identified occurrence-key collisions, duplicate initial signals, filtered replay, stale announcements, an invisible normal-motion pulse, incomplete duplicate and filter coverage, and a Canvas-only shared radius. Each issue was corrected in a separate bounded commit before the final gates.

### Outstanding concerns

- The repository does not include a mounted DOM test renderer. Lifecycle transitions are therefore proven in pure reconciliation and presentation tests, while server-rendered tests prove Canvas markup and real Present-to-Canvas wiring. Human review should still observe one normal-motion signal and the reduced-motion replacement in a browser.
- The in-app browser rejects local loopback URLs, so that visual observation could not be recorded in this run.

### Post-change review

Authored Infoschematic data remains serialisable and contains no occurrence, timer, callback, or browser state. View Model remains framework-neutral, Present owns Scene-entry authority, Canvas owns transient interaction, and static SVG receives only explicit Flow identifiers. Filtering, hover, selection, and unrelated renders do not claim new activity.

### Mini recap

Implementation commits are `8c2e1845`, `9a0d95bf`, `3eeb76c3`, `481f7bed`, `7dd473bf`, `94da2fb0`, `1f80d809`, `31a925b2`, `3f335947`, `c8dc632b`, and `b1df0c2d`; baseline `2c112fbcc5a38e9321f5a6311bf29cc3c7c32253`. TOOL-013 is ready for human review.

## Done

Pending human acceptance.

## Discussion

### Signal authority

Signals are transient presentation occurrences. Scene entry automatically derives signals from the Scene's resolved focused Flows, while a host may supply an explicit occurrence for a known Flow. Neither path mutates the authored Infoschematic or turns filtering, focus, or inspection into activity claims.

### Replay identity

A Flow identifier answers what is signalling; an occurrence key answers whether it is a new signal. Keeping both values explicit avoids accidental replay whenever React rerenders or presentation controls change.

### Accessibility

The pulse itself is decorative. The stable Flow route, accessible description, and concise live announcement carry meaning. Reduced-motion users receive a finite in-place emphasis with the same announcement and no spatial travel.

### Static fallback

Static renderers accept an explicit set of signalled Flows and show deterministic emphasis without motion. Default static output remains unchanged, so a Scene or host signal never makes an exported diagram unstable.
