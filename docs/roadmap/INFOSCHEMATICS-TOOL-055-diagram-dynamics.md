---
id: INFOSCHEMATICS-TOOL-055
area: TOOL
title: Diagram dynamics
theme: tool
horizon: next
status: awaiting-review
blocks: [INFOSCHEMATICS-TOOL-023]
blocked_by: []
baseline_ref: null
created_at: 2026-09-08T17:36:14Z
updated_at: 2026-09-15T08:45:00Z
---

## Goal

Define a small declarative vocabulary for named Diagram Dynamics so a host can bind runtime occurrences to stable semantic behaviour without embedding runtime machinery in an authored Infoschematic.

## Context

The product currently has one narrow dynamic behaviour: a transient Flow signal. `ADR-INFOSCHEMATICS-012` defines it as a framework-neutral occurrence containing a Flow ID and host-owned occurrence key; Canvas renders finite motion with a reduced-motion emphasis, while static SVG renders a deterministic still emphasis when explicitly requested.

Calling the broader concept “animation” would make a rendering technique the product abstraction. A Dynamic instead names a semantic change an audience should perceive through motion, a still treatment, an accessible announcement, or another renderer-appropriate presentation. External events can bind a stable Dynamic ID rather than knowing renderer details or authored element geometry.

## Boundary

This item does not introduce arbitrary JavaScript, callbacks, CSS selectors, timers, event-source schemas, or mutable runtime state into the authored model. It does not replace Scenes or Sequences, make motion the only carrier of meaning, animate static output by default, or define persistent reveal, conceal, movement, and arbitrary timelines. Scene-authored signal choreography remains `INFOSCHEMATICS-TOOL-023`.

## Current state

`FlowSignal` and Scene signal resolution are framework-neutral, but they address Flow IDs directly and have no authored named behaviour to which a host can bind. Present passes signals to Canvas; Studio support is incomplete; static SVG accepts direct signalled Flow IDs. Canonical Diagram validation already has a complete element-ID set, and static SVG now exposes stable authored artefact identity.

The initial vocabulary is deliberately finite: `signal-flow` targets one or more Flows, and `emphasise-elements` targets one or more visual elements. Both are occurrence-based and end without creating persistent presentation state.

## Steps

- [x] Add canonical `DiagramDynamic` types under `diagram.dynamics`, with identity and description fields plus discriminated `signal-flow` and `emphasise-elements` target shapes using sorted, stable authored IDs.
- [x] Mirror the union in Domain Core schema, validation, generated schema, field ordering, compact YAML serialisation, and definition defaults; reject unknown, duplicate, or wrong-kind targets.
- [x] Add a framework-neutral `DynamicOccurrence` carrying `dynamicId` and a host-owned `occurrenceKey`, and resolve occurrences into renderer-facing Flow signals or element emphasis without exposing authored shorthand.
- [x] Extend Canvas, Present, Studio, and static SVG boundaries to consume resolved occurrences while retaining the existing direct Flow-signal input as a compatibility path.
- [x] Give both kinds deterministic full-motion, reduced-motion, static, and accessible interpretations; absence of an occurrence must leave output unchanged.
- [x] Add an authored example and visual-guide treatment showing external binding by Dynamic ID, replay through a changed occurrence key, cancellation, reduced motion, and static fallback.
- [x] Record the Dynamics contract and update model, core, vocabulary, and host-integration guidance.

## Files touched

- `packages/domain-model/src/`
- `packages/domain-core/src/` and `packages/domain-core/schema/`
- `packages/view-model/src/`
- `packages/view-canvas/src/`
- `packages/view-present/src/`
- `packages/view-studio/src/`
- `packages/render-svg/src/`
- `examples/` and visual-guide content
- `docs/decisions/`, `docs/specs/`, `docs/reference/`, and affected guides

## Verify

Run `bun run self:packages:build`, focused `bunx vitest run` suites for canonical parsing, validation, serialisation, dynamic resolution, Canvas, Present, Studio, and static SVG, then `bun run self:check`. Render the example in normal and reduced-motion modes, replay an occurrence by changing only its key, and compare static SVG with no occurrence and with each explicit Dynamic kind.

## Dependencies / blocks

Stable SVG artefact identity from `INFOSCHEMATICS-TOOL-028` has landed, so no build prerequisite remains. This item blocks `INFOSCHEMATICS-TOOL-023`, whose Scene signal treatments should bind the shared Dynamic vocabulary rather than create a parallel animation contract.

## Documentation impact

### Decision Records

Extend or supersede the narrow Flow-signal decision with a record defining authored Dynamics, host-owned occurrences, and renderer obligations.

### Specifications

Add Domain Model, Domain Core, View Model, Canvas, and static-renderer requirements for Dynamic declarations, reference validation, occurrence resolution, and accessible fallbacks.

### Guides

Add host-binding guidance and a visual-guide example that distinguishes semantic Dynamics from animation techniques.

### Roadmap

Once the implementation lands, clear the build-order dependency from `INFOSCHEMATICS-TOOL-023`; persistent choreography remains outside this item.

## Discussion

### Initial vocabulary

`signal-flow` carries a finite signal over authored Flow targets. `emphasise-elements` briefly emphasises any of the six visual element types. Each declaration uses product-owned fields and stable IDs; renderer components and host event payloads never enter the document.

### Contract layers

The authored Infoschematic declares named Dynamics, a host submits occurrences by Dynamic ID and occurrence key, View Model resolves the declaration, and each renderer chooses an appropriate treatment. Keeping those layers separate makes replay and cancellation testable without making browser state part of the model.

### Static and accessible meaning

Every Dynamic must have a non-motion interpretation. Static output changes only when a caller explicitly supplies an occurrence, and accessibility text describes the semantic event rather than the animation used to depict it.

## Review

### Delivered

A Diagram now names the Dynamics it can express, and a host plays one by saying its id and a key: `<Canvas config={config} dynamics={[{ dynamicId: 'attention', occurrenceKey: crypto.randomUUID() }]} />`. `signal-flow` sends a signal down the Flows the declaration names; `emphasise-elements` outlines the elements it names. The same occurrence reaches Present, Studio's Producer rehearsal bank, and the static renderer, where it becomes a still outline and a described Dynamic label rather than motion. A document that declares no Dynamics validates, serialises, and renders exactly as before.

### Summary changes

`packages/domain-model/src/model.ts` adds the `DiagramDynamic` union — identity, label, optional description, and one of `kind: 'signal-flow'` with `flows` or `kind: 'emphasise-elements'` with `elements` — as a required `dynamics` collection on `DefinedDiagram`. `packages/domain-core` mirrors it in the schema, validation, definition defaults, and compact serialisation, rejecting duplicate ids, empty target lists, unknown targets, and a target field from the other kind; the generated `schema/infoschematic.schema.json` is regenerated. Canonicalisation keeps authored declaration order and sorts each target list, so reordering targets is not a model change.

`packages/view-model/src/dynamics.ts` is new and is the whole contract: `DynamicOccurrence` (`dynamicId` plus host-owned `occurrenceKey`) and `resolveDiagramDynamics`, which turns occurrences into Flow signals and element emphasis. A resolved Flow signal is the same value a host supplies directly through `signals`, so a Dynamic gains no lifecycle a direct signal lacks; an occurrence naming an undeclared Dynamic resolves to nothing without diagnostics.

`packages/view-canvas` gains `occurrences.ts` (accept-once-per-key bookkeeping) and `element-emphasis.ts` (reconcile, retire after `visualTokens.canvas.emphasis.duration`, and revise the polite announcement), with the emphasis layer drawn by `InfoschematicDiagram.tsx` and the treatments in `styles.css` — a travelling outline under full motion, a still outline under `prefers-reduced-motion`. `Present.tsx` passes occurrences through without touching Scene signalling. `panels/ProducerControls.tsx` shows one control per declared Dynamic while presenting, and `App.tsx` gives each activation a fresh key so a Producer can rehearse and replay. `packages/render-svg/src/index.ts` draws the still outline with `data-artefact-id`/`data-dynamic-id` and appends `Dynamics: <label>` to the accessible description, never the occurrence key.

`packages/view-model/src/tokens.ts` adds the emphasis tokens both the motion and still treatments measure from. `examples/is-system` declares two Dynamics and its test asserts every target is an identity the document itself declares; `apps/site/src/playground/seeds/media-pipeline.yaml` declares two more so the hosted playground renders the bank. [ADR-INFOSCHEMATICS-026](../decisions/ADR-INFOSCHEMATICS-026-name-dynamics-in-the-document.md) records why the document names meaning and the host owns every occurrence, [the Diagram Dynamics specification](../specs/diagram-dynamics.md) states `DYNAMIC-001` to `DYNAMIC-006`, and `diagram-dynamic` is a vocabulary term.

### Verification

`bun run self:check` passed: 90 node test files / 697 tests, 9 browser test files / 28 tests, all thirteen TypeScript workspaces, dependency boundaries, and the production site build.

Rendered the `system` example statically and looked at all three outputs. Quiet output is unchanged. `view-revised` draws an amber ring around SEE-04 outside the Card's own border, leaving the Card's stroke, code badge, and text exactly as they were. `signal-observed` thickens the SELECT Flow to `signalStillWidth` — visible under magnification against the quiet render, and byte-identical to a directly supplied signal apart from the description. The still outputs contain no `<animate>` and do not vary with the occurrence key.

The browser suite proves the live parts a markup assertion cannot: the emphasis is painted from the shared tokens, it retires on its own without the host withdrawing anything, a new key replays it, and the live region says the Dynamic's own label once per occurrence rather than naming the elements it outlined.

### Outstanding concerns

The still signal treatment is only a width change in the Family's own colour, so on a thick Flow it is easy to miss in a thumbnail. That is the pre-existing `flow-signals` treatment and `DYNAMIC-003` requires a resolved signal to be indistinguishable from a direct one, so changing it here would have been the wrong place; if the still signal needs more contrast, it is a `flow-signals` change for both paths.

`emphasise-elements` is finite by construction: it outlines its targets for one token-owned duration and retires. The IBC 2026 walkthrough wants an element to keep pulsating for as long as a step is on screen, which is a different statement, and the only way to get it from this item is to keep minting keys. [Held element emphasis](INFOSCHEMATICS-TOOL-059-held-element-emphasis.md) is the record for that and it is not delivered here.

Test literals in the view packages now build their fixture through `defineInfoschematicModel` rather than annotating a partial object as `InfoschematicInput`. The partial form ran correctly but only typechecked because an excess-property error masked the missing-collection error behind it; `render-svg` cannot use Domain Core even in tests, so its two fixtures are explicit `DefinedInfoschematic` literals.

### Post-change review

Adding `dynamics` as a required collection on `DefinedDiagram` rather than an optional one means every canonical literal in the repository had to name it. That is more churn than an optional field, but it keeps `DefinedDiagram` a complete canonical shape where a renderer never asks whether a collection exists.

Resolution deliberately reaches only what the renderer drew. An occurrence naming a Card that Scope filtering excluded emphasises nothing rather than revealing it, which is the behaviour a presenter wants and also the one that keeps an occurrence from being a way around visibility policy.

Studio's bank reuses the same occurrence boundary a host uses instead of a rehearsal-only path, so what a Producer sees while presenting is what the deployed host will do.

### Mini recap

The document names the Dynamic; the host says it happened. Everything about timing, keys, and event sources stays outside the authored Infoschematic, and every Dynamic has a still meaning so nothing depends on motion to be understood.
