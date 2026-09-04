---
id: INFOSCHEMATICS-SITE-004
area: SITE
title: Homepage real rendering
theme: site-experience
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 11d6a0692eb215649375199c5409291565e11f55
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

- [x] Replace the `.comparison-lane` markup in `apps/site/src/App.tsx` with the shared-renderer output as the sole hero visual; drop the `bespoke` `<article>`, the now-unused `stages`/`connectorLabels`/`FlowConnector`/`BrandMark`-adjacent bespoke pieces, and the `data-treatment` comparison scaffolding.
- [x] Decide the fate of the "Trace the idea" `signal-button` and its `aria-live` announcement now that there is no bespoke flow-map to pulse — remove it or repoint it at a no-animation acknowledgement consistent with the Boundary.
- [x] Remove the dead CSS selectors listed in Current state from `apps/site/src/styles.css`.
- [x] Update `apps/site/src/App.test.tsx` to assert the single real-rendered hero (drop the bespoke/`data-treatment` assertions, keep the shared-SVG assertions).

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

## Review

### Delivered

All four steps delivered within the stated boundary: no homepage animation added, the "Trace the idea" signal button was removed rather than repointed (there is no bespoke flow-map left to pulse), the `examples/is-system` definition is unchanged, and `/examples/system/` / `/examples/infoschematics/` are untouched. Baseline: `11d6a0692eb215649375199c5409291565e11f55`.

### Summary of changes

- `apps/site/src/App.tsx` — removed the bespoke `<article>` panel (`stages`, `connectorLabels`, `FlowConnector`, the `signal-button` and its `aria-live` announcement, the `useState` import) and the `.comparison-lane`/`data-treatment` scaffolding. The shared-renderer `<img>` is now the sole hero visual, placed directly inside `.hero` alongside `.hero__copy`.
- `apps/site/src/App.test.tsx` — dropped the bespoke/`data-treatment` assertions; added negative assertions (`comparison-lane`, `data-treatment`, `system-card`, `flow-connector` absent) alongside the retained shared-SVG assertions.
- `apps/site/src/styles.css` — removed `.signal-button*`, `.comparison-lane`, `.comparison-treatment*`, `.instrument*`, `.stage*`, `.flow-map*`, `.system-card*`, `.flow-connector*`, `.legend-line`, the `trace-signal`/`reduced-signal` keyframes, and their responsive-media-query variants (502 lines removed). `.shared-preview*` rules and the `prefers-reduced-motion` scroll-behaviour rule were kept.

No deviations from the approved plan.

### Verification

- `bunx vitest run apps/site/src/App.test.tsx` — 5/5 passed (scoped, before the full run).
- `bun run test` — 331/331 passed across all 51 test files.
- `bun run ki:verify:typecheck` — clean across every workspace, including `apps/site`.
- `bun run --cwd apps/site build` — production build succeeds (pre-existing, unrelated chunk-size advisory only).
- `grep` confirmed no remaining references to any removed CSS selector.

### Outstanding concerns

A live rendered-pixel visual check of `/` could not be performed this session: the sandboxed browser tool refuses all `localhost` and private-IP navigation (`Access to private/internal IP address ... is not allowed`), and no headless-browser tooling (Playwright/Puppeteer) is installed in the repo to work around it. The SSR-equivalent markup is asserted byte-for-byte by `App.test.tsx`, and the production build succeeds, but nobody has looked at the rendered page. A human visual check of `/` before acceptance is recommended.

### Post-change review

Goal met: the homepage hero is now the real shared-renderer output of `examples/is-system`, with the bespoke comparison panel fully retired. Scope stayed within the stated boundary — no animation, no signal wiring, no changes to the interactive example routes. Regression risk is low: the change is a deletion-heavy simplification with full test and typecheck coverage; the one gap is the unverified visual render, called out above. Ready for review pending that visual check.

### Mini recap

Delivered: `apps/site` homepage now renders only the shared-renderer SVG hero; the bespoke instrument/flow-map panel and its CSS are gone. Verification: full test suite (331/331), full typecheck (clean), production build (succeeds). Outstanding: no live visual check possible in this sandboxed session — recommend a human check of `/` before closing. No learnings proposed for promotion beyond this record.

## Discussion

### Why its own item rather than inside TOOL-014

`TOOL-014` bundles five other concerns (registry publication, renderer schema-version, dense-diagram responsiveness, compact-Card long-text policy, full audit/conform) that do not yet have the authority or decisions this one already has. Splitting keeps the newly-approved, well-understood homepage swap moving without waiting on unrelated authority windows.
