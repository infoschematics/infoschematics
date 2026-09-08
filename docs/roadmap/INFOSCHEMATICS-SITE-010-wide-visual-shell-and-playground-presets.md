---
id: INFOSCHEMATICS-SITE-010
area: SITE
title: Wide shell playground presets
theme: site-experience
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Give the visually dense pages the homepage's width, promote the playground to a full-viewport split view, and add a preset picker so predefined definitions — the format-parity seed and the three hosted examples — can be loaded into a playground buffer. Prose documentation keeps its narrow measure; examples and playground stay separate concepts.

## Context

The homepage `.page-shell` is `width: min(1600px, 100%)` while every sub page sits in `.document-shell` at `min(960px, 100%)`. That gap is deliberate and correct for Markdown prose (readable line length) but starves the diagram-heavy pages: the examples index, the visual guide, and especially the `/playground/` split view `INFOSCHEMATICS-SITE-009` delivered, whose editor and preview share half of 960px each. The user assessed this interactively ("difficult to see or understand what's going on") and approved this exact resolution: wide shell for visual pages, narrow shell retained for prose, playground promoted to a full-view sandbox with presets, examples pages otherwise untouched.

## Boundary

No merging of examples into the playground — they remain separate site sections with separate nav entries. No auto-conversion between playground formats and no code-editor dependency (unchanged from `INFOSCHEMATICS-SITE-009`). No change to the Markdown document pages' 960px measure, the homepage, or the example pages themselves beyond an optional "open in playground" link on the examples index. No new packages; preset serialisation uses existing config inputs already available to the site.

## Current state

`apps/site/src/styles.css` defines `.page-shell` (1600px, homepage only) and `.document-shell` (960px, every other page). `Playground.tsx`, `VisualGuide.tsx`, `ExamplesIndex.tsx`, and `DocsIndex.tsx` all wrap content in `.document-shell`. The playground has three fixed seed buffers with no way to load other definitions. The three examples (`@infoschematics/is-blank`, `is-infoschematics`, `is-system`) export authored config inputs the site already depends on.

## Steps

- [ ] Introduce a wide variant of the document shell (e.g. `.document-shell--wide` or reuse of `.page-shell` semantics) and apply it to the examples index, the visual guide, and the playground; Markdown document pages and the docs index keep the 960px shell.
- [ ] Restructure `/playground/` into a full-viewport split layout in the example-page spirit: `SiteNav` on top, then an editor panel on the left (format tabs, preset picker, textarea, issue list) and the rendered view filling the remaining width and height on the right; stacked on narrow viewports.
- [ ] Add a preset picker to the playground: the format-parity seed plus the three hosted examples, each loadable into the active buffer. Example presets serialise the example's config input to pretty-printed JSON (`JSON.stringify(input, null, 2)`) into the JSON buffer; the seed continues to provide all three formats. Loading a preset over an edited buffer asks for no confirmation but is a plain replace — document this in the UI copy.
- [ ] Add an "open in playground" link from the examples index entries via a query parameter (e.g. `/playground/?preset=system`) that the playground reads on mount to select the matching preset.
- [ ] Extend `apps/site/src/Playground.test.tsx`: preset list renders, an example preset parses successfully through `parseInfoschematic` as JSON, and the query parameter selects the right preset.
- [ ] Update `docs/guides/authoring.md`'s playground pointer if the wording changes, and check whether `docs/design/*` describes page layout anywhere that needs the width split recorded.

## Files touched

- `apps/site/src/styles.css`, `apps/site/src/Playground.tsx`, `apps/site/src/Playground.test.tsx`, `apps/site/src/ExamplesIndex.tsx`, `apps/site/src/VisualGuide.tsx`
- Possibly `apps/site/src/routes.ts` (query-parameter helper) and `docs/guides/authoring.md`

## Verify

`bun run self:check`. Extended playground component tests as above. Manual walk on a dev server: homepage, docs page (still narrow), examples index, visual guide, and playground (all wide); playground fills the viewport, presets load, `?preset=` deep link works, narrow-viewport stacking intact.

## Dependencies / blocks

Builds directly on `INFOSCHEMATICS-SITE-009` (awaiting-review; its delivery is on `main`, so it is context rather than a blocker).

## Documentation impact

### Decision Records

None expected — ADR-INFOSCHEMATICS-007 already assigns navigation, page metadata, and layout to the Site application.

### Specifications

None.

### Guides

`docs/guides/authoring.md` playground pointer reviewed for wording only.

### Roadmap

None beyond this item.

## Review

Pending.

## Discussion

### Why two shell widths rather than one

A single 1600px shell would fix the visual pages but damage the prose ones: documentation set at that measure is markedly harder to read. The homepage/document split already encodes the right instinct; this item extends the wide treatment to the pages that are diagrams rather than paragraphs.

### Why presets rather than merging examples into the playground

An example is a curated authored artefact mounted as a full interactive view; the playground is a document sandbox validating the loader boundary. Serialising an example's config input into a playground buffer gives the "predefined definitions to play with" the user described while keeping the two concepts — and their nav entries — distinct, which the user confirmed.
