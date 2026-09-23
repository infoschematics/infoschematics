---
id: INFOSCHEMATICS-TOOL-129
area: TOOL
title: Mode, style and hue
theme: tool
horizon: now
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-131]
baseline_ref: null
created_at: 2026-09-22T18:20:00Z
updated_at: 2026-09-22T19:10:00Z
---

# Mode, style and hue

## Goal

A reader switching a page between light and dark sees the drawing change with it, an author picks a colour once and it reads on either ground, and a document that must be one or the other can say so.

## Context

One field is doing three jobs. `packages/view-model/src/tokens.ts:176` types `PaintScheme` as `'blueprint' | 'dark' | 'light'`, putting an authored treatment in the same enum as a reader's context, and `scripts/generate-visual-tokens.ts:35` emits the blueprint palette last at higher specificity than either scheme selector — so a blueprint drawing resolves one fixed dark palette whatever the page is in. Every published example authors `surface: blueprint`, so in practice the scheme control changes the interface and leaves every drawing dark.

Underneath that is the larger gap. An author may colour a Collection, a Flow family, a Fabric or a Point with a literal hex, and `ADR-INFOSCHEMATICS-037` holds that a scheme must never repaint an authored colour. So an authored colour is pinned in both modes, and only the ink over it flips, via `readableInk` in `packages/view-model/src/appearance.ts:126` measuring the fill's WCAG relative luminance against a 0.179 threshold. Everything else — backdrop, grid, strokes, text, annotations, and the Fabric paint roles — comes from the palette and follows the mode.

The corpus shows what that costs. The showcase's two Fabrics author `#4d7ea8` and `#6c8ebf`; its Collections and families author `#9673a6`, `#6c8ebf`, `#82b366`, `#79c9ff` and `#f5a742`. Those are the draw.io default stroke palette, chosen for a white ground — and `#4d7ea8` is verbatim the light palette's own `artwork-accent` token, hand-copied into authored data where no mode can ever reach it again. A Fabric therefore renders two entirely different ways depending on whether its author happened to set a colour, which is not a distinction any author made deliberately.

### What a comparable tool does

[Archify](https://tt-a1i.github.io/archify/), recorded in [the related-tools reference](../decisions/references/related-tools.md), keeps two independent axes: four visual presets — classic, signal-flow, blueprint, editorial — and two themes — its word for this axis — with its contract stating that switching light and dark preserves the preset, and its blueprint preset shipping coordinated light and dark variables rather than one fixed palette. Its exported SVG carries both variable sets behind `prefers-color-scheme`, which is what `--scheme adaptive` already does here. Its theme resolution is near-identical to `packages/view-canvas/src/colour-scheme.ts`, arrived at independently: an attribute on the document element resolved from a URL parameter, then storage, then `matchMedia`, applied before first paint so a light-preference reader never sees a dark flash.

Its palette rule is the transferable part. The colours are Tailwind's defaults, and they are not chosen to work neutrally on either ground: the hue stays constant and the lightness step moves. A dark theme strokes with the 400 step and a light theme with the 600, and the light fill reuses the dark stroke's hue at low alpha.

What does not transfer is its answer to authored colour, because it has none. `componentType` is a closed seven-value enum in its shared schema, its contract says not to invent fields, and while an author names a lane or a boundary there is no mechanism for colouring one — inline literal colours are forbidden outright as breaking light/dark parity. Archify avoided this problem by never offering the capability. Infoschematics offers it, and so owns the job of making an author's colour work on two grounds.

## Boundary

The model: a mode a document may default and may lock, a style that owns everything an author cannot colour, and an authored colour resolved as a hue whose brightness follows the mode. It includes migrating the five published documents, because leaving them on pinned literals would keep the defect visible in the corpus that demonstrates the product.

It does not add a second style. Blueprint is the only one, and the work is to make the axis honest rather than to populate it. It does not change what `readableInk` measures, and it does not touch Card detail disclosure, which `INFOSCHEMATICS-TOOL-130` takes.

## Current state

One role set of 36 paint roles plus the standard-artwork inks, realised by three palettes — `light`, `dark`, `blueprint` — with `scripts/generate-visual-tokens.ts` refusing to write the stylesheet if any palette omits a role. Blueprint redeclares paint roles only; chrome stays in the reader's scheme, so the interface around a blueprint drawing already follows the page.

`diagram.appearance` carries `surface` (`neutral`, `blueprint`), `grid` (`none`, `major`, `major-plus-minor`, `dots`), `identity`, and a `card` object. There is no mode field: a document cannot state a default, and cannot say whether a reader may change it. `surface` does exactly one thing — select a palette — and `surface: neutral` is authored nowhere in the repository.

The static outlet mirrors the pin: `packages/render-svg/src/index.ts:609` suppresses `--scheme adaptive` for a blueprint document and `:614` resolves it to the blueprint palette, so an adaptive SVG of a blueprint document carries one palette rather than two. `packages/view-canvas/src/Canvas.schemes.browser.test.tsx` asserts the pin in a browser and `docs/specs/appearance.md:133` requires it.

## Steps

- [ ] Record the model as an amendment to `ADR-INFOSCHEMATICS-037`, keeping `status: current`. A mode is `light` or `dark` and nothing else. A style owns every role an author cannot colour. An authored colour is a hue the style realises per mode, rather than a value pinned against it. Note why the alternative — a closed role vocabulary, which is what the comparable tool does — is rejected: it would remove a capability this product already offers.
- [ ] Split `PaintScheme` into `mode: 'light' | 'dark'` and a separate style axis, so the palette manifest becomes style × mode and no type carries both. Keep the generator's refusal to write a stylesheet when palettes disagree about their roles, now across every pair.
- [ ] Give blueprint a light realisation across all 36 roles plus the artwork inks, and look at it. A blueprint is a dark-ground convention, so its light form is a real design question — cyanotype ink on paper, not the dark palette lightened.
- [ ] Resolve an authored colour as a hue seed: the style derives the per-mode brightness step from it, so one authored value reads on either ground. Keep an explicit opt-in pin for an author who means that exact value, and make the seed the default rather than the exception.
- [ ] Settle fill opacity alongside it, so the style's own ground reads through a coloured fill rather than being covered by it — a grid of lines or dots is part of what a blueprint is, and an opaque Collection fill erases it. Opacity is a style decision resolved per mode, not an authored value, unless a reason appears to make it one.
- [ ] Add `diagram.appearance.mode` with values `light`, `dark` and `system`, authored as the document's default and defaulting to `system` when absent, and a companion field stating whether a reader may change it. The two are orthogonal: `system` locked means the drawing tracks the machine and offers no control, which is a coherent thing to want.
- [ ] Keep `system` out of the resolved type. It is a refusal to pick, not a third mode, so it resolves to `light` or `dark` before any palette is chosen and no paint code ever sees it. `packages/view-canvas/src/colour-scheme.ts` already implements the state unnamed — storage empty means follow the machine, and withdrawing a choice resumes tracking it rather than freezing on its current value — so this names an existing behaviour in the control rather than building one.
- [ ] Offer the reader all three, labelled without a noun: light, dark, system. Reserve the word _mode_ for what Studio already uses it for — design, direct, producer, present — and keep _theme_ as the single identifier for this axis, so the contract, the type, the attribute and the flag agree on one word.
- [ ] Rename `surface` to `style` in the authored contract, carrying the old name through `packages/view-model/src/compatibility.ts` so existing documents keep working, and drop `neutral` unless a second style arrives to justify it.
- [ ] Rename the render flag to `--mode light | dark | system`, retiring `adaptive`, which `packages/cli/src/options.ts:73` already documents as "not a palette but a refusal to pick one" — the same idea under a fourth name. Keep the old flag accepted, keep the refusal for `--format png`, and let it carry both blueprint palettes by removing the suppression at `packages/render-svg/src/index.ts:609`.
- [ ] Migrate the five published documents: existing hexes become hue seeds, and anything copied from a palette token is replaced rather than seeded.
- [ ] Make Studio's colour control pick a hue rather than an arbitrary value, so the editor offers what the model now means. This is the natural split point if the rest proves large enough to land first.
- [ ] Rewrite the browser assertions that prove the pin so they prove the new behaviour, in a browser, through the scheme command rather than from the stylesheet.
- [ ] Correct the guide copy at `apps/site/src/VisualGuide.tsx:254`, which tells a reader a blueprint stays a blueprint in either scheme.

## Files touched

`packages/view-model/src/tokens.ts`, `tokens.test.ts`, `tokens.generated.css` and `appearance.ts`; `packages/domain-model/src/appearance.ts` and `model.ts`; `packages/domain-core/schema/infoschematic.schema.json` via `scripts/generate-schema.ts`; `packages/view-model/src/compatibility.ts` and `runtime.ts`; `scripts/generate-visual-tokens.ts`; `packages/render-svg/src/index.ts`; `packages/cli/src/options.ts`; `packages/view-canvas/src/Canvas.schemes.browser.test.tsx`, `tokens.test.tsx`, `colour-scheme.ts` and `styles.css`; `packages/view-studio` for the hue control; `apps/site/src/VisualGuide.tsx`; the five documents under `examples/`; `docs/specs/appearance.md` and `docs/specs/command-line-rendering.md`; `ADR-INFOSCHEMATICS-037`.

## Verify

`bun run self:check`. The generated stylesheet is checked in and verified by `self:tokens:verify`, so regeneration is part of the change rather than a follow-up. `scripts/ibc-visual-compatibility.ts` holds a rendered baseline at `scripts/fixtures/ibc-2026-visual-baseline.json`; expect it to move, and review the movement rather than accepting it.

The evidence that matters is visual and comes from a real browser per `AGENTS.md`: the showcase in light and dark, captured to `reports/`, asking the page for each preference through the browser command rather than reading the resolved value out of the stylesheet. A derived brightness step can satisfy every role-floor assertion and still put an unreadable fill next to a legible one, and a fill opacity that looks right on one ground routinely hides the grid on the other.

## Dependencies / blocks

`INFOSCHEMATICS-TOOL-131` blocks it: this work needs the word `mode`, which Studio's production enum holds until that record splits it.

It overlaps `INFOSCHEMATICS-TOOL-121` — the identity chip's two spellings — in `packages/render-svg/src/index.ts` and `packages/view-canvas/src/styles.css`. That record now sits in Next, so expect to resolve the chip here rather than inherit it resolved. `INFOSCHEMATICS-TOOL-130` is adjacent and deliberately separate.

## Documentation impact

### Decision Records

`ADR-INFOSCHEMATICS-037` is amended in place. Its "a scheme is not authored data, and `blueprint` is not a scheme" clause becomes the sharper claim it was reaching for: a style is not a mode, and an authored colour is a hue a style realises rather than a value a mode must not touch.

### Specifications

`docs/specs/appearance.md:133` reverses, and gains the mode field with its three authored values, the lock, the hue-seed resolution and the opacity rule. `docs/specs/command-line-rendering.md:121` becomes `--mode` with `light`, `dark` and `system`, keeps its prohibition on offering a style from the flag and its refusal of an unresolved mode for a raster, and drops the consequence at `:127` that a blueprint document renders identically under both modes.

### Guides

`apps/site/content/authoring.md` gains the mode field, what `system` means for a document that declines to choose, and what a hue seed means for an author picking a colour. The visual guide's scheme section is rewritten and its gallery gains a blueprint pair, so the claim is shown rather than stated.

### Roadmap

`INFOSCHEMATICS-TOOL-130` covers Card detail disclosure. If a second style is wanted, populating the axis is its own record.

## Discussion

Raised on 2026-09-22 from the reader's side — the light/dark control changes the page and not the drawing — and worked through with the owner into a model rather than a fix. The behaviour is correct against `ADR-INFOSCHEMATICS-037` and the four surfaces that encode it, and is still the wrong outcome, because every document in the corpus authors the treatment that opts out.

The hue-seed decision is the substance. Two answers were on the table: close the colour vocabulary to a fixed set of roles a style can guarantee, or keep authored colour open and make the style resolve its brightness. The first is the comparable tool's answer and it is coherent, but it removes a capability this product already ships. The second keeps the capability and costs a contrast obligation the product must now meet rather than delegate to the author's taste — which is the right trade, because the author was never in a position to meet it for two grounds at once.

The naming is part of the work rather than a tidy-up after it, because this axis currently answers to four words — `PaintScheme` in the view model, `--scheme` and `adaptive` at the command line, and _theme_ in the authored contract this record adds. Two of those name the same refusal to choose. One word, `mode`, with `system` as the value that declines: _mode_ stays with Studio's design, direct, producer and present, where it means what the tool is doing rather than how the drawing is painted.

Worth stating plainly: this reverses a recorded decision made recently and deliberately, and it is safe to reverse because the decision's principle survives. "A palette belongs to a colour scheme" is the argument for giving a style two palettes, not against it. What does not survive is one enum carrying a treatment and two contexts, which is what made a single blueprint palette look like a complete answer.

### Adoption

It is fully shaped but held at `draft` rather than `ready`, because `INFOSCHEMATICS-TOOL-131` is open and the roadmap standard does not permit active blocked work. It becomes `ready` the moment that record lands; nothing else about it is outstanding.

Adopted into Now on 2026-09-22, with the model agreed with the owner in the same conversation: a resolved mode of light or dark with `system` as a third authored and reader-facing choice that resolves to one of them, style owning what cannot be colourised, authored colour as a hue seed, opacity settled so the style's ground reads through, and the five published documents migrated as part of the work rather than after it.
