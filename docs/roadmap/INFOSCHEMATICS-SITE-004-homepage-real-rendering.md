---
id: INFOSCHEMATICS-SITE-004
area: SITE
title: Homepage real rendering
theme: site-experience
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Make the homepage's hero visual the real shared-renderer output of an authored Infoschematic (already proven in `SITE-002`), retiring the bespoke hand-authored comparison panel now that visual-parity acceptance does not require animation.

## Context

`SITE-002` added a side-by-side comparison lane to `apps/site/src/App.tsx`: a bespoke, hand-authored "instrument" panel (`stages`, `connectorLabels`, `FlowConnector`, `.system-card`, `.flow-map`, and their CSS) next to a `shared-renderer` panel that renders `examples/is-system` through `renderInfoschematicSvg({ annotations: true })` as a data-URI `<img>`. `TOOL-014`'s Shaping deferred the default-treatment switch pending visual-parity approval; that approval is now given, explicitly without requiring the deferred animation/glow/pulse treatments SITE-002 kept bespoke-only.

## Boundary

This item does not add homepage animation, wire the existing "Trace the idea" signal button into live Flow signalling, or change the `examples/is-system` definition itself. It does not touch `/examples/system/` or `/examples/infoschematics/`, which already host the real interactive Canvas.

## Current state

The homepage renders both treatments side by side under `.comparison-lane` for comparison. The shared-renderer panel already works and is visually accepted; the bespoke panel and its supporting markup, styles, and state (`stages`, `connectorLabels`, `FlowConnector`, `signalKey`, `.instrument*`, `.stage__*`, `.flow-map*`, `.system-card*`, `.flow-connector*`) become dead weight once retired.

## Steps

- [ ] Replace the `.comparison-lane` markup in `apps/site/src/App.tsx` with the shared-renderer output as the sole hero visual; drop the `bespoke` `<article>`, the now-unused `stages`/`connectorLabels`/`FlowConnector`/`BrandMark`-adjacent bespoke pieces, and the `data-treatment` comparison scaffolding.
- [ ] Decide the fate of the "Trace the idea" `signal-button` and its `aria-live` announcement now that there is no bespoke flow-map to pulse — remove it or repoint it at a no-animation acknowledgement consistent with the Boundary.
- [ ] Remove the dead CSS selectors listed in Current state from `apps/site/src/styles.css`.
- [ ] Update `apps/site/src/App.test.tsx` to assert the single real-rendered hero (drop the bespoke/`data-treatment` assertions, keep the shared-SVG assertions).

## Files touched

- `apps/site/src/App.tsx`
- `apps/site/src/App.test.tsx`
- `apps/site/src/styles.css`

## Verify

`bun run test`, `bun run ki:verify:typecheck`, and a visual check of `/` confirm the homepage shows only the real rendered Infoschematic with no bespoke-panel remnants.

## Dependencies / blocks

None. Follows directly from `SITE-002`'s comparison work; independent of `TOOL-014` and `TOOL-015`.

## Documentation impact

### Decision Records

None — a homepage presentation change, not a contract change.

### Specifications

None.

### Guides

None.

### Roadmap

Removes the homepage-default-switch bullet from `TOOL-014`'s Shaping once this item lands, so that item no longer bundles it.

## Discussion

### Why its own item rather than inside TOOL-014

`TOOL-014` bundles five other concerns (registry publication, renderer schema-version, dense-diagram responsiveness, compact-Card long-text policy, full audit/conform) that do not yet have the authority or decisions this one already has. Splitting keeps the newly-approved, well-understood homepage swap moving without waiting on unrelated authority windows.
