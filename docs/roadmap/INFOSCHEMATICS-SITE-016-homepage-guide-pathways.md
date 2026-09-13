---
id: INFOSCHEMATICS-SITE-016
area: SITE
title: Homepage guide pathways
theme: site-experience
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 6e2c957ac37f4349d3e70bc213d17ea777fde986
---

# Homepage guide pathways

## Goal

Help a first-time visitor move directly from the homepage promise and its visual model into the most relevant user-guide path.

## Context

The homepage explains Infoschematics well, but its hero offers no explicit next action and the five labelled artefacts in the overview are inert. The authored overview already gives those artefacts stable identities, so the Site can map them to guide destinations once generated SVG can be mounted inline and inspected safely.

## Boundary

This item does not redefine the homepage diagram, add navigation callbacks to authored Infoschematic data, make every SVG descendant interactive, or duplicate guide content on the homepage.

## Current state

The hero ends with descriptive text before a data-URI SVG image. Neither the lede nor the overview artefacts link into the guide, and image embedding prevents the Site from observing the authored artefact metadata already present in static SVG output.

## Steps

- [x] Add a clear “Getting started” call to action beneath the homepage lede.
- [x] Replace the inert homepage image with the supported Site-owned inline SVG host from `INFOSCHEMATICS-TOOL-038`.
- [x] Map `STR-01`, `PRS-02`, `INFO-03`, `OUT-04`, and `OUT-05` to stable guide destinations owned by `INFOSCHEMATICS-SITE-017`.
- [x] Provide focusable, named keyboard equivalents for every pointer-activated artefact pathway.
- [x] Preserve the existing visual treatment and verify the pathways across desktop and narrow layouts.

## Files touched

- `apps/site/src/App.tsx`
- `apps/site/src/App.test.tsx`
- Site-owned homepage inline-SVG component and focused tests
- `apps/site/src/styles.css`

## Verify

Run focused homepage and inline-SVG component tests, `bun run --cwd apps/site build`, and `bun run self:check`. Inspect the built homepage at desktop and 390-pixel widths; confirm the CTA and all five artefact pathways reach their intended guide sections by pointer and keyboard without changing the authored Infoschematic definition.

## Dependencies / blocks

`INFOSCHEMATICS-SITE-017` must establish stable guide destinations. `INFOSCHEMATICS-TOOL-038` must establish the safe inline-SVG host pattern and artefact-event boundary. `INFOSCHEMATICS-SITE-015` is related visual tuning but is not a build-order dependency.

Both build-order dependencies have landed: the guide routes are stable and the supported inline-SVG reference host is available. The homepage can now consume those results without defining a second interaction boundary.

## Delegation

A bounded Site implementation lane may add the homepage CTA, artefact-to-guide mapping, keyboard-equivalent controls, styling, and focused tests. The primary agent retains integration, visual inspection, full verification, lifecycle evidence, and the commit boundary.

## Documentation impact

### Decision Records

No decision record is expected because interaction remains Site-owned and follows the existing serialisable-data boundary.

### Specifications

No reusable behaviour-level specification changes are expected; the SVG integration contract belongs to `INFOSCHEMATICS-TOOL-038`.

### Guides

Use only stable destinations established by the guide information architecture; do not add duplicate homepage-only explanations.

### Roadmap

Keep future homepage storytelling changes separate from the reusable inline-SVG integration work.

## Review

### Delivered

From baseline `6e2c957ac37f4349d3e70bc213d17ea777fde986`, the approved homepage pathway work is implemented within Site-owned scope. `apps/site/src/App.tsx` now places a Getting started CTA beneath the hero lede and replaces the data-URI image with the committed `InlineSvgReference` host. `apps/site/src/HomepageGuideDiagram.tsx` maps all five authored card identities to the locked guide destinations and routes pointer activation through named host controls. `apps/site/src/styles.css` preserves the blueprint preview mask and adds responsive CTA/control treatment with visible focus states. `apps/site/src/App.test.tsx` now covers inline SVG output, all five identities, CTA, and named controls. Renderer, generic inline host, authored Infoschematic data, non-Site roadmap items, and non-Site files were not changed by this implementation.

### Summary of changes

Added `HomepageGuideDiagram`, using `resourceIdPrefix="homepage"` to consume the safe inline renderer result and the host-owned action boundary. The locked destinations are Structure → `/docs/visual-guide/#anatomy`, Presentation → `/docs/authoring/#add-presentation-material`, Infoschematic → `/docs/`, Rendered → `/docs/static-rendering/`, and Presented → `/docs/present/`. Each destination has a visible native button supplied by `InlineSvgReference`, so keyboard users have an equivalent named control; pointer activation of each matching outer SVG artefact invokes the same route callback. No approved deviation was required.

### Verification

`bunx biome check apps/site/src/App.tsx apps/site/src/App.test.tsx apps/site/src/HomepageGuideDiagram.tsx apps/site/src/styles.css` passed. `bunx tsc --noEmit -p apps/site` passed. `bunx vitest run apps/site/src/App.test.tsx apps/site/src/InlineSvgReference.test.tsx` passed with 2 files and 26 tests. `bun run --cwd apps/site build` and the final `bun run self:check` pass. Chromium inspection at 1440 by 1000 and through a true 390 by 844 device-metric override confirmed the CTA placement, proportional faded diagram, wrapped controls, visible focusable button semantics, and `scrollWidth` equal to the 390-pixel viewport. A delegated SVG click reached `/docs/static-rendering/`, the Presented control reached `/docs/present/`, and pointer entry and exit updated and cleared the polite status.

### Outstanding concerns

None. The concurrent non-Site browser-test work that temporarily prevented the full gate from completing has landed and the combined repository now passes. Visual verification used temporary ports 4317 and 9322, which were stopped immediately afterward; ports 4173, 4317, and 9322 were confirmed free.

### Post-change review

The goal is met without changing the authored definition or renderer contract. The inline SVG remains the generated 1268 × 408 blueprint treatment and keeps the accepted vertical spacing and fade. Navigation is Site-owned, limited to the five authorised identities, paired with visible native controls and global focus styling, and has been exercised in Chromium at desktop and narrow widths. The item is ready for acceptance review.

### Mini recap

Homepage visitors now have a direct Getting started CTA plus five interactive diagram pathways with keyboard-equivalent named controls. Focused checks, rendered inspection, the production Site build, and the full repository gate pass; no follow-up concern was found.

## Discussion

### Destination map

Structure should lead to the visual guide, Presentation to the authoring or presentation explanation selected during implementation, Infoschematic to Getting started, Rendered to Static rendering, and Presented to Present. Link text and adjacent controls must make those destinations understandable without relying on the diagram alone.

### Interaction ownership

The Site maps authored identities to routes. The definition remains inert serialisable data, and the renderer remains unaware of navigation.
