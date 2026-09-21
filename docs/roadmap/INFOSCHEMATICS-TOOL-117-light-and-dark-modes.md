---
id: INFOSCHEMATICS-TOOL-117
area: TOOL
title: Light and dark modes
theme: tool
horizon: now
status: draft
blocks: [INFOSCHEMATICS-TOOL-118]
blocked_by: []
baseline_ref: null
created_at: 2026-09-21T20:15:00Z
updated_at: 2026-09-21T23:20:00Z
---

# Light and dark modes

## Goal

One [Infoschematic](../reference/vocabulary.md#infoschematic) draws correctly in a light and a dark colour scheme, in the interactive Diagram and in static output, with the scheme chosen by the reader's context rather than by which outlet happens to be drawing.

## Context

[PDR-INFOSCHEMATICS-004](../decisions/PDR-INFOSCHEMATICS-004-product-messaging.md) positions an Infoschematic as an input embedded where it is read — in a document, a website, a build pipeline, or a presentation. A definition that can only be drawn dark cannot honour that: embedded in a light document it is a black rectangle in the middle of the page, and an SVG committed to a README is wrong for half the people who open it.

The palette today belongs to the outlet. `packages/view-model/src/tokens.ts` says so in as many words — "the interactive surface is dark and the static renderer's paper is light, so one palette per outlet is the agreement" — and the tokens follow: `canvas.surfaces.backdrop` is `#081725` while `canvas.output.backdrop` is `#ffffff`, and `canvas.artwork` carries two complete ink groups, `ink` for Canvas and `output` for the static renderer. That agreement is exactly what a colour mode contradicts, because a mode is a property of where the drawing is read and an outlet is not.

Nothing in the repository reads the reader's preference: `prefers-color-scheme` appears in no TypeScript, stylesheet, document, or manifest here.

[Archify](https://tt-a1i.github.io/archify/), recorded in [the related-tools reference](../reference/related-tools.md), does this part well and is worth copying closely. Its artefact carries `data-theme` on the root element with every colour behind a CSS variable redefined per scheme; it resolves the scheme before first paint, so a light-preference reader never sees a dark flash; the order is an explicit URL parameter, then a stored preference, then `prefers-color-scheme`, then the default; a toggle reports state through `aria-pressed` and keeps following the operating system while no explicit preference is stored. Two further details are the ones that matter most for us. Its colour mode is independent of its visual preset, so switching light and dark never changes which visual style is drawn. And its exports split: a raster locks the resolved scheme because a PNG cannot react to anything after it is encoded, while its downloadable SVG emits **both** variable sets plus a `@media (prefers-color-scheme)` rule, so the file self-themes wherever it is embedded.

## Boundary

This is the drawn Infoschematic — the Diagram's own surface and the static renderer's output — in two schemes. It is not a recolouring of the surrounding chrome: Studio's panels, Present's shell, and the website hold 534 hard-coded hex literals between them (`packages/view-studio/src/styles.css` alone has 297), and that work is its own item rather than a clause inside this one. A Diagram that draws correctly in both schemes inside chrome that is still dark is a coherent delivery; the reverse is not.

A mode is not authored data. A Domain carries an authored `color`, and `packages/view-model/src/appearance.ts` chooses readable ink over a fill by relative luminance; the author's colours mean the same thing in both schemes, so a mode changes the surround and re-resolves readable ink against it, and never repaints an authored choice. This follows `ADR-INFOSCHEMATICS-011`, which already keeps authored appearance apart from output-detail policy.

A mode is also not resolved inside a package. `ADR-INFOSCHEMATICS-005` gives the host runtime composition, page metadata, and URL ownership, so reading a URL parameter, storing a preference, or listening to the operating system is host work; the packages take a resolved scheme, or follow `prefers-color-scheme` through CSS with no script at all. Archify can own all of it because its artefact is a whole HTML document; ours cannot.

Colour scheme stays independent of the authored `appearance.surface` and of the standard artwork catalogue in `ADR-INFOSCHEMATICS-035`: a blueprint stays a blueprint in either scheme.

## Current state

The token manifest is already the single source of colour for the drawing, which is what makes this tractable. `scripts/generate-visual-tokens.ts` flattens `visualTokens` into one `:root` block in `packages/view-model/src/tokens.generated.css`, `self:tokens:verify` fails when the generated file drifts, and `packages/view-canvas/src/tokens.test.tsx` asserts that every `--infoschematic-*` variable the view packages use — 48 distinct names — is declared there. So a second scheme is a second set of values for a known set of names, not a hunt through stylesheets.

The static renderer is the harder half. `packages/render-svg/src/index.ts` writes token values straight into SVG attributes, so its output is already committed to one palette by the time it is a file, and `packages/cli/src/options.ts` has no flag that could say otherwise. `ADR-INFOSCHEMATICS-024` rasterises PNG through a pinned resvg binding, which is the same constraint Archify names: a raster cannot react to a preference, so its scheme has to be resolved before encoding.

`scripts/visual-treatment-parity.test.ts` holds the two renderers to the same treatment and already asserts that both "resolve the same readable ink from the same fills". It compares geometry rather than palette, because the palettes are currently allowed to differ by outlet — that assumption is part of what changes here.

## Steps

- [ ] Take the decision that a palette belongs to a colour scheme rather than to an outlet, and write it as a Decision Record that supersedes the agreement stated in `tokens.ts`.
- [ ] Restructure the colour tokens into two complete schemes over one set of paint roles, so every role resolves in both and a role that exists in only one fails the generator.
- [ ] Emit both schemes from `scripts/generate-visual-tokens.ts`: the default under `:root`, the other under a `@media (prefers-color-scheme)` rule and an explicit attribute selector, so a host can either follow the reader or state a scheme.
- [ ] Resolve readable ink per scheme in `packages/view-model/src/appearance.ts`, so authored Domain colours keep legible text in both without the author changing anything.
- [ ] Give the Diagram a resolved-scheme input that a host may set, defaulting to following the reader, and mount the drawing so no script is needed for the default path.
- [ ] Teach `packages/render-svg` to emit either a scheme-locked document or a self-theming one that carries both variable sets and a `@media (prefers-color-scheme)` rule.
- [ ] Add the matching command surface per `GDR-INFOSCHEMATICS-005`, with raster output requiring a resolved scheme because it cannot carry both.
- [ ] Draw both schemes in the website's visual guide so the palette is reviewable, and check the print path, where a dark palette on white paper is the failure Archify's print stylesheet exists to prevent.

## Files touched

`packages/view-model/src/tokens.ts`, `appearance.ts` and the generated stylesheet; `scripts/generate-visual-tokens.ts` and its test; `packages/view-canvas` styles, mount, and `tokens.test.tsx`; `packages/render-svg/src/index.ts`; `packages/cli` options and help; the visual guide in `apps/site`; `scripts/visual-treatment-parity.test.ts`; a new Decision Record; and the vocabulary reference if a scheme needs a canonical term.

Studio and Present stylesheets are touched only where the drawing surface they host resolves its own variables — their chrome is out of scope.

## Verify

`bun run self:check`, with `self:tokens:verify` proving the generated stylesheet matches the manifest and the variable-declaration floor in `tokens.test.tsx` extended to require every paint role in both schemes — a scheme that silently declares half its roles is the failure mode this check exists to catch.

Renderer parity runs per scheme, including readable ink over the same authored fills. The static renderer gets both output shapes asserted: a locked document containing one palette, and a self-theming document containing both variable sets and the media rule.

The resolved scheme is proved in a browser, not read out of a stylesheet: the browser suites already ask the runner for `prefers-reduced-motion` through a browser command because a rule read from source is not the rule the browser resolved, and colour scheme is the same case. Both schemes are then rendered and looked at, per `AGENTS.md`.

## Dependencies / blocks

Nothing blocks it. It is independent of [INFOSCHEMATICS-TOOL-113](INFOSCHEMATICS-TOOL-113-where-a-drawing-fails.md) and [INFOSCHEMATICS-TOOL-107](INFOSCHEMATICS-TOOL-107-an-agent-written-first-document.md), though a scheme-aware palette is one more thing a diagnostic surface could check contrast against later.

It blocks [INFOSCHEMATICS-TOOL-118](INFOSCHEMATICS-TOOL-118-chrome-in-both-schemes.md), which extends the same schemes to Studio, Present, and the website and adds the reader's switch; the two are delivered in that order rather than as one change.

## Documentation impact

### Decision Records

A new record deciding that a palette belongs to a colour scheme rather than an outlet, stating who resolves the scheme — host, not package — and why a raster locks it while an SVG may carry both.

### Specifications

`docs/specs/appearance.md` states the requirement that a drawing resolves in either scheme with authored colours unchanged; `docs/specs/static-rendering.md` and `docs/specs/command-line-rendering.md` state the locked and self-theming output shapes and which one a raster may take.

### Guides

The consumer guide says how to embed an Infoschematic that follows the reader's scheme, and how to pin one deliberately; the visual guide shows both palettes. The vocabulary reference gains a term only if the product needs to name the concept publicly.

### Roadmap

[INFOSCHEMATICS-TOOL-118](INFOSCHEMATICS-TOOL-118-chrome-in-both-schemes.md) carries the chrome recolouring of Studio, Present, and the website, and the reader-facing scheme switch, once this establishes the paint roles both schemes resolve.

## Review

The review packet carries the generated stylesheet diff, the per-scheme parity results, the browser evidence for each resolved scheme, and a rendering of the same document in both — the palette claim is a perceptual one, and a green suite is not evidence that either scheme reads well.

## Done

The same authored document draws legibly in light and in dark, in the Diagram and in static SVG, with authored Domain colours unchanged and readable ink correct in both; a host can follow the reader or pin a scheme; PNG output states its scheme; and the visual guide shows both palettes.

## Discussion

### Why this is a now item

Raised by the owner on 2026-09-21 as long-outstanding and valuable, immediately after the positioning work that makes it load-bearing rather than cosmetic: the product has just said in public that an Infoschematic is embedded where it is read, and a dark-only drawing cannot be embedded in most of the places people read.

### What is genuinely worth copying from Archify

The resolution order, the pre-paint resolution, the independence of scheme from visual style, and the export split between a locked raster and a self-theming SVG. The self-theming SVG is the detail that most directly serves our own positioning, because it is the one form of our output that gets committed to somebody else's repository and read by people whose preference we will never know.

### What cannot be copied

Every mechanism Archify uses to remember a preference — `localStorage`, a URL parameter, a toolbar toggle — belongs to a whole HTML document it owns end to end. Ours is a component inside a host's page, so the same behaviour has to arrive as a resolved input, and the default path has to work with no script at all.
