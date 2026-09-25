---
id: INFOSCHEMATICS-TOOL-129
area: TOOL
title: Mode, style and hue
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: a7b186329c71e6f8936ecf9ee652e04c13a16da6
created_at: 2026-09-22T18:20:00Z
updated_at: 2026-09-25T13:08:18Z
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

- [x] Record the model as an amendment to `ADR-INFOSCHEMATICS-037`, keeping `status: current`. A mode is `light` or `dark` and nothing else. A style owns every role an author cannot colour. An authored colour is a hue the style realises per mode, rather than a value pinned against it. Note why the alternative — a closed role vocabulary, which is what the comparable tool does — is rejected: it would remove a capability this product already offers.
- [x] Split `PaintScheme` into `mode: 'light' | 'dark'` and a separate style axis, so the palette manifest becomes style × mode and no type carries both. Keep the generator's refusal to write a stylesheet when palettes disagree about their roles, now across every pair.
- [x] Give blueprint a light realisation across all 36 roles plus the artwork inks, and look at it. A blueprint is a dark-ground convention, so its light form is a real design question — cyanotype ink on paper, not the dark palette lightened.
- [x] Resolve an authored colour as a hue seed: the style derives the per-mode brightness step from it, so one authored value reads on either ground. Keep an explicit opt-in pin for an author who means that exact value, and make the seed the default rather than the exception.
- [x] Settle fill opacity alongside it, so the style's own ground reads through a coloured fill rather than being covered by it — a grid of lines or dots is part of what a blueprint is, and an opaque Collection fill erases it. Opacity is a style decision resolved per mode, not an authored value, unless a reason appears to make it one.
- [x] Add `diagram.appearance.mode` with values `light`, `dark` and `system`, authored as the document's default and defaulting to `system` when absent, and a companion field stating whether a reader may change it. The two are orthogonal: `system` locked means the drawing tracks the machine and offers no control, which is a coherent thing to want.
- [x] Keep `system` out of the resolved type. It is a refusal to pick, not a third mode, so it resolves to `light` or `dark` before any palette is chosen and no paint code ever sees it. `packages/view-canvas/src/colour-scheme.ts` already implements the state unnamed — storage empty means follow the machine, and withdrawing a choice resumes tracking it rather than freezing on its current value — so this names an existing behaviour in the control rather than building one.
- [x] Offer the reader all three, labelled without a noun: light, dark, system. Reserve the word _mode_ for what Studio already uses it for — design, direct, producer, present — and keep _theme_ as the single identifier for this axis, so the contract, the type, the attribute and the flag agree on one word.
- [x] Rename `surface` to `style` in the authored contract, carrying the old name through `packages/view-model/src/compatibility.ts` so existing documents keep working, and drop `neutral` unless a second style arrives to justify it.
- [x] Rename the render flag to `--mode light | dark | system`, retiring `adaptive`, which `packages/cli/src/options.ts:73` already documents as "not a palette but a refusal to pick one" — the same idea under a fourth name. Keep the old flag accepted, keep the refusal for `--format png`, and let it carry both blueprint palettes by removing the suppression at `packages/render-svg/src/index.ts:609`.
- [x] Migrate the five published documents: existing hexes become hue seeds, and anything copied from a palette token is replaced rather than seeded.
- [x] Make Studio's colour control pick a hue rather than an arbitrary value, so the editor offers what the model now means. This is the natural split point if the rest proves large enough to land first. Found on inspection to have no subject: Studio renders authored colours as swatches (`packages/view-studio/src/app/editor/FamilyChoice.tsx:35`, `panels/ProducerControls.tsx:73`, `panels/ModelRegister.tsx:125`) and offers no control that picks one, so the seed model reaches Studio through the document rather than through an editor. Nothing to convert.
- [x] Rewrite the browser assertions that prove the pin so they prove the new behaviour, in a browser, through the scheme command rather than from the stylesheet.
- [x] Correct the guide copy at `apps/site/src/VisualGuide.tsx:254`, which tells a reader a blueprint stays a blueprint in either scheme.

## Files touched

`packages/view-model/src/tokens.ts`, `tokens.test.ts`, `tokens.generated.css` and `appearance.ts`; `packages/domain-model/src/appearance.ts` and `model.ts`; `packages/domain-core/schema/infoschematic.schema.json` via `scripts/generate-schema.ts`; `packages/view-model/src/compatibility.ts` and `runtime.ts`; `scripts/generate-visual-tokens.ts`; `packages/render-svg/src/index.ts`; `packages/cli/src/options.ts`; `packages/view-canvas/src/Canvas.schemes.browser.test.tsx`, `tokens.test.tsx`, `colour-scheme.ts` and `styles.css`; `packages/view-studio` for the hue control; `apps/site/src/VisualGuide.tsx`; the five documents under `examples/`; `docs/specs/appearance.md` and `docs/specs/command-line-rendering.md`; `ADR-INFOSCHEMATICS-037`.

## Verify

`bun run self:check`. The generated stylesheet is checked in and verified by `self:tokens:verify`, so regeneration is part of the change rather than a follow-up. `scripts/ibc-visual-compatibility.ts` holds a rendered baseline at `scripts/fixtures/ibc-2026-visual-baseline.json`; expect it to move, and review the movement rather than accepting it.

The evidence that matters is visual and comes from a real browser per `AGENTS.md`: the showcase in light and dark, captured to `reports/`, asking the page for each preference through the browser command rather than reading the resolved value out of the stylesheet. A derived brightness step can satisfy every role-floor assertion and still put an unreadable fill next to a legible one, and a fill opacity that looks right on one ground routinely hides the grid on the other.

## Dependencies / blocks

Nothing blocks it. This work needs the word `mode`, which Studio's production enum held until the split that freed it; that work is delivered and accepted, so the word is available here.

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

## Review

### Delivered

The two axes the Goal asked for. A **style** is what the drawing is and is authored — `neutral` or `blueprint`; a **mode** is the ground the reader is on and is resolved — `light` or `dark`. `system` is a document declining to pick, and it is kept out of the resolved type, so no paint code ever sees it. An authored colour is read as a **hue seed**: the author's hue, their saturation, and the ordering they chose all survive, while the lightness band belongs to the ground, with a trailing `!` pinning a literal for an author who meant exactly that value. The four palettes are those two axes crossed, so a blueprint is realised on both grounds — navy paper in the dark, cyanotype on light.

Approved boundary exclusions held: `readableInk` still measures what it measured, Card detail disclosure is untouched and stays with `INFOSCHEMATICS-TOOL-130`, and the identity-chip overlap with `INFOSCHEMATICS-TOOL-121` was left where that record holds it.

Baseline `a7b186329c71e6f8936ecf9ee652e04c13a16da6`. The delivery landed in two parts: `f208527e` carried the contract, the view model, both renderers, the CLI and the corpus; this commit carries the documentation, the site, the probe and the two defects found by looking.

### Change Summary

**Contract and model.** `packages/domain-model/src/appearance.ts` gains `style`, `mode` and `modeLocked`, keeping `surface` as a retired spelling that still answers; `option-catalogue.ts` excludes it from the option surface so the same choice is not offered twice. `packages/domain-core/src/schema.ts` and `define.ts` follow, and `packages/domain-core/schema/infoschematic.schema.json` is regenerated.

**Colour.** `packages/view-model/src/colour.ts` is new and is the only place the seed/pin distinction is interpreted: `parseAuthoredColour`, `resolveAuthoredColour`, and `seedResolver`, which realises seeds against one ground or, when the rendering defers, against both by declaring a pooled custom property per distinct pair. `ColourJob` names the three jobs — `fill`, `ground`, `ink` — where `fill` and `ground` share a band and differ only in translucency, so a Region no longer erases the grid beneath it. `packages/view-model/src/tokens.ts` carries the four palettes.

**Renderers and command.** `packages/render-svg/src/index.ts` writes both palettes for a deferring rendering including a blueprint one, the old suppression having been removed. `packages/cli/src/options.ts` takes `--mode light | dark | system`, still accepts `--scheme` with `adaptive` reading as `system`, and still refuses an unresolved mode for `--format png`, because a raster cannot carry two palettes.

**Documents and specifications.** `APPEAR-019`, `CLI-013` and `STATIC-020` were each rewritten wholesale rather than patched, because each stated the old one-enum model as its subject. [ADR-INFOSCHEMATICS-037](../decisions/ADR-INFOSCHEMATICS-037-a-palette-belongs-to-a-colour-scheme-not-an-outlet.md) is amended in place at `status: current`. [The visual-language reference](../decisions/references/design-visual-language.md) restates the palette rule as the two axes crossed.

**Site and guides.** `apps/site/src/VisualGuide.tsx` teaches style and mode as separate things and its gallery demonstrates the claim; `apps/site/content/authoring.md` gains two sections, one for each axis; `studio.md` and `present.md` each carried a sentence that was materially false under the new model and were rewritten.

Three material decisions departed from the Steps as written, each stated where it lands:

`neutral` was **kept** as a style value, against the step's "drop `neutral` unless a second style arrives". A single-valued enum is a worse contract than a two-valued one, `neutral` is the documented default in `define.ts`, and the option catalogue needs a name for the thing an author gets by omission.

**Print gives blueprint its light realisation as a cyanotype**, which reverses the position [ADR-INFOSCHEMATICS-037](../decisions/ADR-INFOSCHEMATICS-037-a-palette-belongs-to-a-colour-scheme-not-an-outlet.md) originally took. The reversal is recorded in the record rather than left for a reader to infer from the palette.

The **naming sweep was deferred**, not dropped. `useColourScheme`, `data-infoschematic-scheme`, `infoschematics.colour-scheme`, `ColourSchemeButton`, `SchemeGallery` and `schemeSpecimen` still spell the axis the old way. Only what a reader or an author is taught was moved here; the internals are captured as [INFOSCHEMATICS-TOOL-143](INFOSCHEMATICS-TOOL-143-one-word-for-mode.md), whose Boundary flags that the attribute and the storage key are browser-observable and need a migration or a stated decision that a remembered choice is expendable.

### Verification

`bun run self:check` passes: 52 of 52 Turborepo tasks, including every workspace suite, both browser suites, the typechecks, the dependency-boundary cruise, the unused-code and unused-export checks, and the production site build. `ki repo audit --skill ki-work-roadmap --repo .` passes.

The evidence that mattered was visual and came from a real browser, per `AGENTS.md`. `scripts/probes/style-mode.ts` is a new probe for `self:browser:look` that sets both the application's own switch and the browser's `prefers-color-scheme`, then asserts the page actually resolved the ground asked for rather than trusting that it did. Captures are at `reports/style-and-mode/`: the mode gallery on each ground, and a blueprint drawing on each ground.

Looking found a real defect that the suite did not. In a deferring rendering, `resolveReadableInk` was measured at the resolved mode, which is `light` whenever a rendering defers, so a Card label was written in dark ink over a fill that becomes dark for a reader whose browser prefers dark. Half of it pre-dated this work and half was new with the seeds; both are fixed by `SeedResolver.pair`, which sends a value that varies by ground but was never authored through the same custom-property mechanism as a seed. Confirmed in the recaptured dark PNG, where the labels are now light and legible.

`scripts/dependency-boundaries.test.ts` was timing out at Vitest's default five seconds under the gate while passing in under a second standalone: every case there drives a real TypeScript cruise, and the default was measuring contention rather than a boundary violation. It now carries a 60-second timeout with the reason beside it.

### Outstanding concerns

**A person has to look at the blueprint light palette.** It is built, and the contrast ratios check out — text 12.99:1, muted 4.89:1 — but no test can tell you whether a cyanotype reads as a blueprint. My own reading of `reports/style-and-mode/blueprint-playground-light.png` is that it lands as a legible whiteprint — blue lines on near-white — rather than the classic white-on-blue cyanotype. That is a design judgement and it is not mine to make. This is the one thing in this packet that acceptance should not wave through.

**The IBC visual baseline could not be recaptured here, and the record's expectation that it would move was wrong.** `scripts/ibc-visual-compatibility.ts` is reachable from no command in this repository, and its `loadSharp` walks upward from an external `--fixture` workspace looking for a `sharp` this repository does not depend on. `scripts/fixtures/ibc-2026-visual-baseline.json` is external-fixture evidence; it did not move, and nothing in this change could have moved it.

**The naming sweep is open** as [INFOSCHEMATICS-TOOL-143](INFOSCHEMATICS-TOOL-143-one-word-for-mode.md), which carries the browser-observable migration question. It is a live identifier, so this concern is held elsewhere and not lost on prune.

**The Studio step had no subject**, as noted against it: Studio shows authored colours but offers no control that picks one, so there was nothing to convert to a hue.

### Post-change review

The Goal is met on both halves. A reader switching the page between light and dark now sees the drawing change with it, including a blueprint drawing, which was the concrete failure that opened this record — every published example authored `surface: blueprint` and therefore pinned itself dark whatever the reader preferred. And an author picks a colour once and it reads on either ground, with `!` available when they meant a literal.

Regression risk sits in two places. The first is the compatibility path: `surface` is accepted and mapped, and `--scheme`/`adaptive` still answer, so existing documents and existing invocations keep working; the suites cover both spellings. The second is the seed resolution itself, which changes the drawn colour of every authored value in the corpus. That is the intended behaviour rather than a regression, but it is a visible change to five published documents and the packet should be read with that in mind.

Acceptance readiness: everything mechanical is green and the deviations are stated. The blueprint light palette is the open judgement.

### Mini recap

Delivered the two-axis model — authored style, resolved mode — with authored colour read as a hue seed, across the contract, the view model, both renderers, the command, the corpus, the specifications, the decision record and the site.

Verified by `bun run self:check` green at 52 of 52 tasks, by the roadmap audit, and by four browser captures at `reports/style-and-mode/` taken through a new probe that asserts the ground it asked for. Looking at those captures found and fixed an illegible-ink defect that the green suite had not.

Concerns: the blueprint light palette needs a human eye; the IBC baseline step could not be performed here and the record's prediction about it was wrong; the internal naming sweep is deferred to [INFOSCHEMATICS-TOOL-143](INFOSCHEMATICS-TOOL-143-one-word-for-mode.md).

Learning routes proposed, not taken: that a default test timeout can measure contention rather than the thing under test is a repository-level fact and would belong in `AGENTS.md` beside the existing note about checks that measure nothing; and that a value which varies by ground but was never authored has to travel by the same mechanism as an authored one is the generalisation behind `SeedResolver.pair`, which belongs with the module rather than anywhere wider.

## Discussion

Raised on 2026-09-22 from the reader's side — the light/dark control changes the page and not the drawing — and worked through with the owner into a model rather than a fix. The behaviour is correct against `ADR-INFOSCHEMATICS-037` and the four surfaces that encode it, and is still the wrong outcome, because every document in the corpus authors the treatment that opts out.

The hue-seed decision is the substance. Two answers were on the table: close the colour vocabulary to a fixed set of roles a style can guarantee, or keep authored colour open and make the style resolve its brightness. The first is the comparable tool's answer and it is coherent, but it removes a capability this product already ships. The second keeps the capability and costs a contrast obligation the product must now meet rather than delegate to the author's taste — which is the right trade, because the author was never in a position to meet it for two grounds at once.

The naming is part of the work rather than a tidy-up after it, because this axis currently answers to four words — `PaintScheme` in the view model, `--scheme` and `adaptive` at the command line, and _theme_ in the authored contract this record adds. Two of those name the same refusal to choose. One word, `mode`, with `system` as the value that declines: _mode_ stays with Studio's design, direct, producer and present, where it means what the tool is doing rather than how the drawing is painted.

Worth stating plainly: this reverses a recorded decision made recently and deliberately, and it is safe to reverse because the decision's principle survives. "A palette belongs to a colour scheme" is the argument for giving a style two palettes, not against it. What does not survive is one enum carrying a treatment and two contexts, which is what made a single blueprint palette look like a complete answer.

### Adoption

It is fully shaped and no longer blocked: the record that held the word `mode` is delivered and accepted. It is held at `draft` only until a planning pass marks it `ready`; nothing else about it is outstanding.

Adopted into Now on 2026-09-22, with the model agreed with the owner in the same conversation: a resolved mode of light or dark with `system` as a third authored and reader-facing choice that resolves to one of them, style owning what cannot be colourised, authored colour as a hue seed, opacity settled so the style's ground reads through, and the five published documents migrated as part of the work rather than after it.
