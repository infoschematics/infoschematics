---
id: INFOSCHEMATICS-TOOL-013
area: TOOL
title: Design Flow signalling
theme: tool
horizon: next
status: in-progress
blocks: []
blocked_by: []
baseline_ref: 2c112fbcc5a38e9321f5a6311bf29cc3c7c32253
---

## Goal

Deliver an accessible, deterministic model for meaningful signals travelling along Flows without turning motion into ambient decoration or executable authored configuration.

## Context

Earlier visual treatments used small pulses moving along Flows to communicate activity. The visual-language guidance distinguishes a finite signalled state from idle, highlighted and filtered states, but the product has no public authority for triggering, replaying or representing that state.

Animation needs a separate contract from static appearance because it introduces transient runtime state, reduced-motion behaviour, Scene semantics and coordination across multiple Flows. Static SVG must remain useful without motion.

## Boundary

This item does not put timers, callbacks, animation durations or executable state into `InfoschematicConfig`. It does not treat every visible Flow as active, signal on hover or filtering, or make motion necessary to understand the diagram. It does not redesign Flow routing or general Scene authoring.

## Current state

Canvas renders static Flow rails and routes and already separates highlighting, focusing, editing and removal transitions. Present resolves Scene and Story focus but emits no finite signal when a new Scene becomes active. There is no public signal occurrence type, replay rule, reduced-motion treatment or accessible announcement.

`renderInfoschematicSvg` deliberately introduces no motion and exposes only Scene and visibility options. The shared visual-token manifest has Flow line treatments but no signal-specific radius, duration or still-state emphasis.

## Steps

- [ ] Add a framework-neutral `FlowSignal` occurrence contract in View Model containing a stable Flow identifier and host-owned occurrence key; repeated renders of the same occurrence MUST NOT restart a signal, while a new key MAY replay it.
- [ ] Add a pure resolver that derives one signal occurrence for each resolved focused Flow when a Standalone, Thematic or Story Scene is entered, including inherited Story Scene focus, without firing on filtering, hover or unrelated rerenders.
- [ ] Expose transient signal occurrences through Canvas props separately from `InfoschematicConfig`, allowing future hosts to supply explicit event-driven signals without a mutable process-global registry.
- [ ] Make Present signal focused Flows once on Scene entry by default and provide an explicit `none` policy for hosts that do not want automatic signalling. Clearing or changing Scene cancels obsolete occurrences and never resumes a completed pulse automatically.
- [ ] Render a small finite pulse along each signalled Canvas Flow, keyed by occurrence, while leaving the underlying Flow route static before and after the animation and preserving pointer, selection and routing geometry.
- [ ] Mark travelling pulse graphics as presentational, announce the semantic Flow signal through a concise live region, and replace travel with a brief in-place route emphasis under `prefers-reduced-motion`.
- [ ] Add signal-specific shared tokens only for values Canvas and deterministic still output must interpret together; keep transient timing and interaction details Canvas-owned unless another renderer requires the same value.
- [ ] Extend static SVG render options with an explicit list of signalled Flow identifiers that emits a deterministic non-animated still treatment and never serialises animation elements, timers or browser state.
- [ ] Add reducer and rendered tests proving one-shot Scene entry, occurrence replay, simultaneous independent signals, cancellation, no signal on filtering or hover, reduced-motion markup, accessible announcements and unchanged Flow selection geometry.
- [ ] Add static SVG tests for deterministic signalled treatment, unknown Flow handling and unchanged default output. Update dependency tests to keep the state model framework-neutral and React-free.
- [ ] Record the signal-authority decision and update Canvas, Present, static SVG and visual-language documentation with runtime, Scene, accessibility and still-output semantics.

## Files touched

- `packages/view-model/src/signals.ts`, public exports and focused resolver tests.
- `packages/view-canvas/src/Canvas.tsx`, `InfoschematicDiagram.tsx`, `styles.css` and signal rendering tests.
- `packages/view-present/src/Present.tsx`, its presentation state or reducer, and Scene/Story interaction tests.
- `packages/render-svg/src/index.ts` and deterministic signalled-output tests.
- `packages/view-model/src/tokens.ts` and generated CSS only for genuinely shared signal semantics.
- `docs/decisions/`, `docs/specs/view-canvas.md`, `docs/specs/view-present.md`, `docs/specs/render-svg.md` and `docs/design/visual-language.md`.

## Verify

Pure View Model tests must prove Scene resolution produces stable occurrences only on entry and handles inherited Story focus. Canvas and Present tests must prove each occurrence animates once, a new occurrence replays, unrelated state does not replay, multiple Flows remain independent, and cancellation leaves the normal route intact.

Accessibility verification must prove motion is decorative rather than the only carrier of meaning, a concise live announcement identifies the signalled Flow, and reduced-motion preference replaces travel with non-spatial emphasis. Static SVG snapshots must prove explicit signalled state is deterministic and default output remains motion-free. Type checks and Dependency Cruiser must prove Domain Model has no runtime signal values or React dependencies. `bun run check` is the final pass/fail gate.

## Dependencies / blocks

The delivered TOOL-008 packages and TOOL-009 token implementation provide the required boundaries. TOOL-012 is not a semantic prerequisite, but both items touch Canvas, static SVG and token surfaces. Deliver them sequentially, with TOOL-012 first, so each retains an isolated diff and review packet.

SITE-001 may later demonstrate signals, but its initial editable example and static comparison do not block this work and do not acquire animation as an implicit acceptance condition.

## Documentation impact

### Decision Records

Add a decision record fixing transient host and Scene signal authority, occurrence-based replay, the absence of runtime animation state from authored configuration, and deterministic static fallback.

### Specifications

Extend View Model, Canvas, Present and static SVG specifications with signal occurrence, one-shot Scene entry, cancellation, reduced-motion, announcement and still-output requirements.

### Guides

Update React integration guidance with automatic Scene signalling, host-supplied occurrences, opt-out behaviour and accessibility expectations. Keep authoring guidance clear that ordinary Flow configuration does not carry animation callbacks or timers.

### Roadmap

Keep event-stream correlation, externally sourced operational telemetry and authoring UI for signal policy outside this first finite signalling contract unless separately captured after the public seam is proven.

## Discussion

### Signal authority

Signals are transient presentation occurrences. Scene entry automatically derives signals from the Scene's resolved focused Flows, while a host may supply an explicit occurrence for a known Flow. Neither path mutates the authored Infoschematic or turns filtering and focus inspection into activity claims.

### Replay identity

A Flow identifier answers what is signalling; an occurrence key answers whether it is a new signal. Keeping both values explicit avoids accidental replay whenever React rerenders or presentation controls change.

### Accessibility

The pulse itself is decorative. The stable Flow route, its accessible description and a concise live announcement carry the meaning. Reduced-motion users receive a finite in-place emphasis with the same announcement and no spatial travel.

### Static fallback

Static renderers accept an explicit set of signalled Flows and show a deterministic emphasis without motion. Default static output remains unchanged, so a Scene or host signal never makes an exported diagram unstable.
