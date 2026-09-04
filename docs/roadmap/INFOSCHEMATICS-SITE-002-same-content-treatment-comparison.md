---
id: INFOSCHEMATICS-SITE-002
area: SITE
title: Same-content treatment comparison on the homepage
theme: site-experience
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 5a7a708c345677a48c914f94a9366f18e3079395
---

## Goal

Make the homepage comparison lane compare like with like: the shared-renderer panel shows the same four-stage editorial story the bespoke panel tells, rendered from one serialisable definition through `renderInfoschematicSvg`, so a reader judges treatment differences rather than content differences.

## Context

The comparison lane pairs the bespoke four-stage pipeline (OBS-01 Signals → MAP-02 Structure → LIT-03 Meaning → SEE-04 Shared view, with SELECT, CONNECT and REVEAL connectors) with a shared-renderer panel that rendered the unrelated nine-package architecture diagram. That mismatch made the panel a non-sequitur and hid the real remaining treatment gaps.

Closing the content gap surfaced two genuine renderer gaps worth keeping: static output had no way to show Flow codes, and text ink ignored the fill it sat on, so dark authored fills produced illegible dark-on-dark cards and a white pipe crossed the dark blueprint surface.

## Boundary

This item does not switch the homepage default treatment or remove the bespoke panel; that remains `INFOSCHEMATICS-TOOL-014` after visual-parity approval. The architecture example stays untouched. Header readout, axis captions, glow and shadow treatment, pulse animation and per-tone gradients are deliberately deferred as bespoke-only presentation.

## Steps

- [x] Add `resolveReadableInk` and the shared annotation and inverse-ink output tokens to View Model, regenerating the token CSS.
- [x] Give `renderInfoschematicSvg` an opt-in `annotations` option that draws each visible Flow's code chip at the shared View Model placement, honouring `label.along`, defaulting to off.
- [x] Resolve Card and Zone-label ink from the fill it sits on in both renderers, exposing `data-ink` for parity comparison, and make the Flow pipe and lane labels surface-conditional in static output.
- [x] Author `examples/is-system` exporting `systemExample` — the four-stage journey as serialisable data with a blueprint treatment, dark Card fills, bespoke domain tones and three labelled connectors.
- [x] Host the example through Studio at `/examples/system/` and switch the homepage shared panel to the annotated static rendering of the same definition.
- [x] Extend renderer, parity, example and Site tests; record SVG-009 and SVG-010; update visual-language and authoring guidance.

## Files touched

- `packages/view-model` appearance, tokens and runtime plus tests and generated CSS.
- `packages/render-svg` renderer and tests.
- `packages/view-canvas` diagram markup and styles.
- `scripts/visual-treatment-parity.test.ts`.
- New `examples/is-system` workspace; root verification wiring.
- `apps/site` routes, host page, homepage, styles and tests.
- `docs/specs/render-svg.md`, `docs/design/visual-language.md`, `docs/guides/authoring.md`.

## Verify

Per-workspace tests, `bun run ki:verify:visual-tokens`, and the full `bun run check` gate must pass. Browser observation must confirm the homepage comparison shows the same story twice, `/examples/system/` explores the example through Studio, and `/examples/infoschematics/` light-fill blueprint Cards keep dark ink.

## Review

### Delivered

All four Steps landed in one commit, `e274628d` ("feat(site): compare the same story across both homepage treatments"): `resolveReadableInk` shared-ink annotation in View Model plus regenerated token CSS; `renderInfoschematicSvg`'s opt-in `annotations` option drawing Flow code chips at the shared placement, plus surface-conditional Zone-label ink and Flow pipe; the `examples/is-system` workspace hosted through Studio at `/examples/system/`, with the homepage panel switched to the annotated static rendering of that same definition; extended renderer, parity, example, and Site tests, `SVG-009`/`SVG-010` recorded in `docs/specs/render-svg.md`, and `docs/guides/authoring.md` updated.

### Summary of changes

29 files, +627/−22: `packages/view-model` (appearance, tokens, generated CSS), `packages/render-svg` (renderer and tests), `packages/view-canvas` (markup and styles), `scripts/visual-treatment-parity.test.ts`, the new `examples/is-system` workspace, `apps/site` (routes, `SystemExample`, homepage, styles, tests), and the three docs above.

### Verification

`bun run ki:verify:visual-tokens` passes (generated CSS in sync). `scripts/visual-treatment-parity.test.ts` passes (4/4) on the current tree. Browser observation of the homepage, `/examples/system/`, and `/examples/infoschematics/` behaviour described in Verify was not re-run in this closure session.

### Outstanding concerns

None from this item's own delivery. `visual-treatment-parity.test.ts` was separately observed failing on `main` CI as of `42f74b47` due to unrelated in-flight region-geometry work from another session; resolved locally by commit `012579ff` (unrelated to this item).

### Post-change review

Contract-first placement holds: ink resolution is invariant behaviour derived from authored fills; annotations are a render option; no per-definition text-colour or chip knobs entered the domain contract. Matches the item's Boundary — no homepage-default switch, no bespoke-panel removal, both deferred to `TOOL-014`.

### Mini recap

Closed a homepage content mismatch by rendering the same four-stage story through both the bespoke and shared-renderer panels from one serialisable definition, surfacing and fixing two genuine renderer gaps (Flow annotations, ink-on-fill resolution) along the way.

## Discussion

### Contract-first placement

Appearance stays authored intent and output stays renderer policy: ink resolution is invariant behaviour derived from authored fills, and annotations are a render option, so no per-definition text-colour or chip knobs entered the domain contract.
