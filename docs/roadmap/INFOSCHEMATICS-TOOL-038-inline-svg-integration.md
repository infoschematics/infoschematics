---
id: INFOSCHEMATICS-TOOL-038
area: TOOL
title: Inline SVG integration
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 7646468507d3bc10e80b414a8f1d5661d7a82346
---

# Inline SVG integration

## Goal

Let a host place deterministic SVG output inline, inspect rendered artefacts by stable authored identity, and bind accessible host-owned interactions around them without putting browser callbacks into authored definitions.

## Context

`renderInfoschematicSvg` returns a serialised SVG string whose outer artefact groups expose `data-artefact-id` and `data-artefact-kind` under the contract delivered by `INFOSCHEMATICS-TOOL-028`. An image element is suitable for inert display but makes SVG descendants unavailable to parent-document inspection or event delegation.

## Boundary

This item does not add browser globals to the static renderer, make child markup stable, copy authored IDs into native SVG `id` attributes, put callbacks or runtime state in `InfoschematicConfig`, treat DOM mutation as model editing, or replace Canvas, Present, or Studio as interactive or authoring surfaces.

## Current state

Static output is deterministic, standalone, XML-escaped, and carries stable metadata on all six outer visual-artefact groups. The Site homepage and visual guide embed data-URI image elements. Public guidance shows string rendering but does not define inline insertion, scoped event delegation, trust, accessibility, cleanup, or the editing boundary.

## Steps

- [x] Specify two supported delivery modes: inert image output for display and same-document inline insertion when a host needs SVG descendant access.
- [x] Document a framework-neutral insertion and teardown pattern that accepts only output produced by `renderInfoschematicSvg`, scopes all queries and listeners to one host container, and tolerates multiple Infoschematics on a page.
- [x] Define event delegation against the nearest outer `data-artefact-id` and `data-artefact-kind` group without promising child elements, CSS classes, native IDs, or tree position.
- [x] Add a Site-owned reference component that renders generated markup inline and exposes selected or hovered artefact metadata through host state, with listeners removed on replacement and unmount.
- [x] Provide keyboard-equivalent surrounding controls for click actions and accessible status or detail content; do not automatically turn every SVG group into a generic button.
- [x] Prove that text and authored identifiers remain escaped, generated output carries no script or inline event attributes, event resolution stays inside the mounted SVG, and duplicate authored IDs in separate diagrams do not collide.
- [x] Update static-rendering and React integration guidance to clarify that persistent movement or editing must update the authored model through Canvas or Studio and rerender.

## Files touched

- `packages/render-svg/src/index.ts`
- `packages/render-svg/src/index.test.ts`
- `apps/site/src/InlineSvgReference.tsx`
- `apps/site/src/InlineSvgReference.test.tsx`
- `apps/site/content/static-rendering.md`
- `apps/site/content/react-integration.md`
- `docs/design/architecture.md`
- `docs/specs/static-rendering.md`
- `docs/specs/appearance.md`

## Verify

Run focused `bunx vitest run` suites for static SVG identity and escaping plus the Site reference component, `bun run --cwd apps/site build`, and `bun run self:check`. In a browser, mount two inline Infoschematics with repeated authored IDs, confirm hover and click resolve only inside the correct host, confirm a keyboard-equivalent control exposes the same result, replace one render, and confirm stale listeners and state are removed.

## Dependencies / blocks

`INFOSCHEMATICS-TOOL-028` has landed and supplies stable outer-group metadata. Existing `renderInfoschematicSvg` output is the only accepted markup source, so no renderer API takes a browser dependency.

## Documentation impact

### Decision Records

No new decision record is expected because the static renderer remains DOM-free and Site remains an outlet. Add one only if implementation needs reusable browser-package changes that alter those ownership boundaries.

### Specifications

Clarify the static renderer metadata and safe-output guarantees needed by inline hosts without freezing child markup.

### Guides

Add complete inert-image and inline-integration examples, event delegation, accessibility, lifecycle cleanup, and editing-boundary guidance.

### Roadmap

Keep product-specific click outcomes and homepage storytelling interactions as separate Site work once audience behaviour is defined.

## Review

### Delivered

The approved inline-SVG integration boundary is implemented from baseline `7646468507d3bc10e80b414a8f1d5661d7a82346`. The resulting uncommitted working tree adds a deterministic renderer-resource namespace, a config-based Site reference host, scoped interaction lifecycle helpers, focused tests, and consumer and architecture guidance. Homepage-specific mappings, navigation, authored callbacks, and persistent DOM editing remain excluded.

### Summary of changes

`renderInfoschematicSvg` now accepts an optional validated `resourceIdPrefix` and applies it to native marker and pattern IDs and references, allowing multiple inline diagrams without document-wide resource collisions while preserving standalone output by default. `InlineSvgReference` accepts authored input rather than arbitrary markup, renders the trusted output inline, scopes nearest-outer-group event resolution to its direct SVG, owns hover and selection state, tears listeners down on replacement or unmount, and exposes only host-declared click actions through matching named buttons. The static-rendering, React, architecture, static-rendering specification, and migrated appearance specification now document the trust, identity, accessibility, lifecycle, namespace, and editing boundaries.

### Verification

Focused renderer and Site tests pass: 18 tests across `packages/render-svg/src/index.test.ts` and `apps/site/src/InlineSvgReference.test.tsx`. The renderer package build, Site TypeScript check, and Site production build pass. `bun run self:check` passes with 78 test files and 529 tests, every TypeScript workspace, dependency boundaries, generated-token and schema checks, and the production Site build. The browser-control plugin could not initialise because its runtime rejected `node:process`; the focused fake-host tests cover duplicate authored IDs, host scoping, hover, click, teardown, and the SSR test renders actual inline SVG with a named keyboard-equivalent action.

### Outstanding concerns

An interactive browser-control run was not completed because the available browser plugin could not initialise. Automated host-lifecycle coverage and rendered SSR evidence passed, but a reviewer may still choose to repeat the manual browser interaction scenario before acceptance.

### Post-change review

The implementation meets the goal without moving interaction state into authored data or browser dependencies into the renderer. The additive resource-prefix option closes the native marker and pattern collision discovered during implementation and remains deterministic and host-owned. Regression risk is concentrated in consumers that opt into the new option or Site reference component; default standalone SVG remains byte-compatible under existing tests. The item is ready for acceptance review with the manual browser exercise disclosed above.

### Mini recap

Hosts can now choose inert images or inspectable same-document SVG, resolve only the supported outer identity hook, pair actions with accessible external controls, and clean up safely. The next planned consumer is `INFOSCHEMATICS-SITE-016`; no separate learning or remedial roadmap item is required unless review finds browser-specific behaviour not represented by the focused tests.

## Done

Accepted 2026-09-13 by the project owner on the review packet above.

## Discussion

### Identity contract

Outer data attributes are the public hooks. Native SVG IDs remain document-owned because several inline Infoschematics may contain the same authored identity.

### Interaction ownership

The host owns listeners, transient selection, navigation, details, and announcements. Authored product data remains serialisable and static renderer output remains deterministic.

### Accessibility

Pointer inspection can decorate surrounding content without changing SVG semantics. Any action available by clicking an artefact needs a keyboard-equivalent host control with visible focus and a name for that action rather than assigning a generic role to every group.

### Editing boundary

Inline DOM access supports inspection and host interaction, but moving an SVG node does not update the authored model. Persistent geometry changes continue through configuration, Canvas, or Studio followed by rerendering.
