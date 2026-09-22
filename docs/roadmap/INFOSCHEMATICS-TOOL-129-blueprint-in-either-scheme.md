---
id: INFOSCHEMATICS-TOOL-129
area: TOOL
title: Blueprint in either scheme
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T18:20:00Z
updated_at: 2026-09-22T18:20:00Z
---

# Blueprint in either scheme

## Goal

Switching a page between light and dark changes the drawing on it, not only the interface around it, for the documents people actually read.

## Context

`packages/view-model/src/tokens.ts:176` types `PaintScheme` as `'blueprint' | 'dark' | 'light'`, which puts an authored treatment in the same enum as a reader's context. `scripts/generate-visual-tokens.ts:35` then emits the blueprint palette last, on `.infoschematic-svg.surface-blueprint, [data-surface-treatment="blueprint"]`, at higher specificity than either scheme selector — so a blueprint drawing resolves one fixed dark palette whatever the page is in.

That is deliberate and recorded. `ADR-INFOSCHEMATICS-041` says "a scheme is not authored data, and `blueprint` is not a scheme"; `docs/specs/appearance.md:133` requires an authored blueprint to pin its palette in either scheme; `packages/render-svg/src/index.ts:609` suppresses `--scheme adaptive` for a blueprint document; `packages/cli/src/options.ts:47` tells the caller so; and the visual guide states it in prose at `apps/site/src/VisualGuide.tsx:254`.

What makes it wrong in practice is the corpus. **Every published example authors `surface: blueprint`** — `examples/is-blank`, `is-infoschematics` (both documents), `is-showcase` and `is-system`. So the scheme control in the site nav changes the chrome and leaves every drawing on the page dark, which reads as a control that does not work rather than as a treatment being honoured.

The reversal is not the only way out, and probably not the right one. `blueprint` is a treatment — a technical-drawing look — and a treatment can have a palette per scheme exactly as the neutral surface does. Reading it as a third peer of `light` and `dark` is the category error `ADR-INFOSCHEMATICS-041` otherwise argues against: a palette belongs to a colour scheme. Making blueprint a treatment realised by two palettes honours the author's choice and the reader's context at once, where making the scheme outrank the surface honours only the reader and discards what the author asked for.

## Boundary

How an authored surface treatment is realised across colour schemes, and the token, generator, renderer, command and specification surfaces that currently encode "one treatment, one palette".

It does not add an authored field for the colour scheme — a scheme stays the reader's context, which is the part of `ADR-INFOSCHEMATICS-041` this keeps. It does not change the neutral surface's palettes, the readable-ink pair chosen from an authored fill's luminance, or the print rule. It does not make `blueprint` offerable from `--scheme`, which `docs/specs/command-line-rendering.md:123` forbids for a reason that still holds: the renderer must not contradict the document.

## Current state

One role set of 36 paint roles plus the standard-artwork inks, realised by three palettes — `light`, `dark`, `blueprint` — with the generator refusing to write the stylesheet if any palette omits a role. The blueprint block redeclares paint roles only; chrome stays in the reader's scheme, per `ADR-INFOSCHEMATICS-041`, so the interface around a blueprint drawing already follows the page.

The static outlet mirrors it: `packages/render-svg/src/index.ts:614` resolves a blueprint document to the blueprint palette and marks the output `blueprint` rather than `adaptive`, so an adaptive SVG of a blueprint document carries one palette rather than two. `packages/view-canvas/src/Canvas.schemes.browser.test.tsx` asserts the pin in a browser, and `docs/specs/appearance.md:137` names it as a verification.

## Steps

- [ ] Decide the model and record it as an amendment to `ADR-INFOSCHEMATICS-041` rather than a new record: a surface treatment is realised by one palette per scheme, so the palette axis becomes treatment × scheme and `PaintScheme` stops carrying a treatment name. Note explicitly why the alternative — letting a scheme outrank an authored surface — is rejected: it discards the author's choice instead of realising it.
- [ ] Design the light blueprint palette across all 36 roles plus the artwork inks, and look at it: a blueprint is a dark-ground convention, so a light realisation is a real design question — cyanotype ink on paper rather than the dark palette lightened — and is exactly the case `AGENTS.md` says a green suite cannot settle.
- [ ] Widen the token manifest and `paintDeclarations` to the two-axis shape, keeping the generator's refusal to write a stylesheet when palettes disagree about their roles, now across every treatment and scheme pair.
- [ ] Emit the blueprint palettes under both the treatment selector and each scheme, so a blueprint drawing follows the page's preference and a host's `data-infoschematic-scheme` override alike, and keep the print rule restoring a light palette.
- [ ] Let `--scheme adaptive` carry both blueprint palettes, removing the suppression at `packages/render-svg/src/index.ts:609`, and correct the CLI help at `packages/cli/src/options.ts:47`.
- [ ] Rewrite the browser assertions that currently prove the pin so they prove the new behaviour, in the browser, through the scheme command rather than from the stylesheet.
- [ ] Correct the guide copy at `apps/site/src/VisualGuide.tsx:254`, which currently tells a reader a blueprint stays a blueprint in either scheme.

## Files touched

`packages/view-model/src/tokens.ts`, `tokens.test.ts` and `tokens.generated.css`; `scripts/generate-visual-tokens.ts` and `generate-visual-tokens.test.ts`; `packages/render-svg/src/index.ts` and its tests; `packages/cli/src/options.ts` and `index.test.ts`; `packages/view-canvas/src/Canvas.schemes.browser.test.tsx`, `tokens.test.tsx` and `styles.css`; `packages/view-studio/src/app/App.schemes.browser.test.tsx`; `apps/site/src/VisualGuide.tsx` and `apps/site/src/visual-guide/SchemeGallery.browser.test.tsx`; `docs/specs/appearance.md` and `docs/specs/command-line-rendering.md`; `docs/decisions/ADR-INFOSCHEMATICS-041-a-palette-belongs-to-a-colour-scheme-not-an-outlet.md`.

## Verify

`bun run self:check`. The generated stylesheet is checked in and verified by `self:tokens:verify`, so the regeneration is part of the change rather than a follow-up.

The evidence that matters is visual and must come from a real browser per `AGENTS.md`: the showcase document in light and dark, captured to `reports/`, asking the page for each preference through the browser command rather than reading the resolved value out of the stylesheet. A light blueprint is precisely the palette that can pass every role-floor assertion and still be unreadable.

## Dependencies / blocks

Nothing blocks it. It overlaps `INFOSCHEMATICS-TOOL-121` — the identity chip's two spellings — in `packages/render-svg/src/index.ts` and `packages/view-canvas/src/styles.css`; take TOOL-121 first, since resolving the chip to one value before doubling the palettes is less work than after.

## Documentation impact

### Decision Records

`ADR-INFOSCHEMATICS-041` is amended in place, keeping `status: current`. Its "a scheme is not authored data, and `blueprint` is not a scheme" clause becomes the sharper claim it was reaching for: a treatment is not a scheme, and is therefore realised by one palette per scheme rather than by a palette of its own.

### Specifications

`docs/specs/appearance.md:133` reverses: an authored blueprint keeps its treatment in either scheme and changes its palette with the reader's preference. `docs/specs/command-line-rendering.md:123` keeps its prohibition on offering `blueprint` and drops the consequence that a blueprint document renders identically under both schemes, which its verification at `:127` currently asserts.

### Guides

`apps/site/src/VisualGuide.tsx` scheme section is rewritten, and its gallery gains a blueprint pair so the claim is shown rather than stated.

### Roadmap

Nothing follows necessarily. If the light blueprint turns out to want authored control — an author choosing which realisation their document gets — that is a model change and its own record, and is explicitly not part of this.

## Discussion

Raised on 2026-09-22 from the reader's side: the light/dark control changes the page and not the drawing. The investigation is what turns that into a decision rather than a defect — the behaviour is correct against `ADR-INFOSCHEMATICS-041` and four surfaces that encode it, and it is still the wrong outcome, because every document in the corpus authors the one treatment that opts out.

Worth stating plainly when this is taken: this reverses a recorded decision made recently and deliberately, and the reason it is safe to reverse is that the decision's principle survives. "A palette belongs to a colour scheme" is the argument for giving blueprint two palettes, not against it. What does not survive is `PaintScheme` carrying a treatment name, which is what made one palette look like a complete answer.

### Adoption

Adopted into Now on 2026-09-22 on the owner's statement that the scheme control should reach the drawing. The choice between realising the treatment per scheme and letting the scheme outrank the treatment is taken as part of delivery and recorded in the ADR amendment, because it is the whole substance of the change.
