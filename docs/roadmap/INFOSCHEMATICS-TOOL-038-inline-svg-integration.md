---
id: INFOSCHEMATICS-TOOL-038
area: TOOL
title: Inline SVG integration
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

# Inline SVG integration

## Goal

Let a host place deterministic SVG output inline, inspect rendered artefacts by stable authored identity, and bind accessible host-owned interactions around them without putting browser callbacks into authored definitions.

## Context

renderInfoschematicSvg returns a serialised SVG string whose outer artefact groups expose data-artefact-id and data-artefact-kind under the contract delivered by `INFOSCHEMATICS-TOOL-028`. An image element is suitable for inert display but makes SVG descendants unavailable to the parent document for inspection or event delegation.

## Boundary

This item does not add browser globals to the static renderer, make child markup stable, copy authored IDs into native SVG id attributes, put callbacks or runtime state in InfoschematicConfig, treat DOM mutation as model editing, or replace Canvas, Present, and Studio as interactive and authoring surfaces.

## Current state

Static output is deterministic, standalone, XML-escaped, and carries stable metadata on the six outer visual-artefact groups. The Site homepage and visual guide embed data-URI image elements. Public guidance shows string rendering but does not define inline insertion, scoped event delegation, trust, accessibility, or cleanup.

## Steps

- [ ] Specify two supported delivery modes: inert image output for display and same-document inline insertion when the host needs SVG descendant access.
- [ ] Document a framework-neutral insertion and teardown pattern that accepts only output produced by renderInfoschematicSvg, scopes all queries and listeners to one host container, and tolerates multiple Infoschematics on a page.
- [ ] Define event delegation against the nearest outer data-artefact-id and data-artefact-kind group without promising child elements, CSS classes, native IDs, or tree position.
- [ ] Add a Site-owned reference component that renders generated markup inline and exposes selected or hovered artefact metadata through host state, with listeners removed on replacement and unmount.
- [ ] Provide keyboard-equivalent surrounding controls for click actions and accessible status or detail content; do not automatically turn every SVG group into a generic button.
- [ ] Prove text and authored identifiers remain escaped, generated output carries no script or inline event attributes, event resolution stays inside the mounted SVG, and duplicate authored IDs in separate diagrams do not collide.
- [ ] Update static-rendering and React integration guidance and clarify that persistent movement or editing must update the authored model through Canvas or Studio and rerender.

## Files touched

- packages/render-svg/src/index.test.ts
- apps/site/src/ inline SVG reference component and focused tests
- apps/site/content/static-rendering.md
- apps/site/content/react-integration.md
- docs/design/architecture.md
- docs/specs/render-svg.md
- docs/specs/view-canvas.md only if cross-renderer identity wording needs alignment

## Verify

Run focused bunx vitest run suites for static SVG identity and escaping plus the Site reference component, bun run --cwd apps/site build, and bun run self:check. In a browser, mount two inline Infoschematics with repeated authored IDs, confirm hover and click resolve only inside the correct host, confirm the keyboard-equivalent control exposes the same result, replace one render, and confirm stale listeners and state are removed.

## Dependencies / blocks

`INFOSCHEMATICS-TOOL-028` has landed and supplies the stable outer-group metadata. Existing renderInfoschematicSvg output is the only accepted markup source, so no renderer API or browser dependency is required.

## Documentation impact

### Decision Records

No new decision record is expected because the static renderer remains DOM-free and Site remains an outlet. Add one only if implementation needs a reusable browser package or changes those ownership boundaries.

### Specifications

Clarify the static renderer metadata and safe-output guarantees needed by inline hosts without freezing child markup.

### Guides

Add complete inert-image and inline-integration examples, event delegation, accessibility, lifecycle cleanup, and editing-boundary guidance.

### Roadmap

Keep product-specific click outcomes or homepage storytelling interactions as separate Site work once their audience behaviour is defined.

## Discussion

### Identity contract

Outer data attributes are the public hooks. Native SVG IDs remain document-owned because several inline Infoschematics may contain the same authored identity.

### Interaction ownership

The host owns listeners, transient selection, navigation, details, and announcements. Authored product data remains serialisable and static renderer output remains deterministic.

### Accessibility

Pointer inspection can decorate surrounding content without changing SVG semantics. Any action available by clicking an artefact needs a keyboard-equivalent host control and visible focus, named according to the action rather than assigning a generic role to every group.

### Editing boundary

Inline DOM access supports inspection and host interaction, but moving an SVG node does not update the authored model. Persistent geometry changes continue through configuration, Canvas, or Studio followed by rerendering.
