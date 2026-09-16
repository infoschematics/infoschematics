---
id: INFOSCHEMATICS-TOOL-064
area: TOOL
title: Editor stylesheet shadowing
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: dbd57e2f5abf88681c0f4a2f68917b32fca38d28
created_at: 2026-09-15T13:30:00Z
updated_at: 2026-09-16T11:36:04Z
---

# Editor stylesheet shadowing

## Goal

Let the editor surface read the Canvas stylesheet, so a Canvas treatment reaches Studio once it is written rather than only after someone copies it, and so Canvas affordances that Studio never copied stop rendering unstyled.

## Context

Found while delivering Multi-selection alignment (`INFOSCHEMATICS-TOOL-046`). Its held-group treatment was written in `packages/view-canvas/src/styles.css`, the class reached the element, the whole suite was green — and the editor drew held elements exactly like unheld ones. The reason recorded at the time was that `packages/view-studio/src/styles.css` never loads the Canvas stylesheet, because its `@import "@infoschematics/view-present/styles.css"` sits on the last line and an `@import` that follows other statements is dead.

That diagnosis was half right. The rule about `@import` position is real and the authored file was invalid CSS, but neither consumption path was affected: `packages/view-studio/build.mjs` lifts every `@import` to the head of the file it emits, and Vite's `postcss-import` does the same for the site. The Canvas rules were arriving. What actually drew held elements like unheld ones is that Studio carried its own copy of the held-group treatment further down the same file, and a later rule of equal specificity wins.

So the cost is one thing rather than two: every treatment has to be written twice, which is how a green suite reports a feature that is not there. The copies are written with literal colours rather than the generated visual tokens, so a token change stops at the editor as well.

## Boundary

This item makes one stylesheet read another and removes the duplication that stands in for it. It does not redesign the editor's appearance, change the visual tokens, or move Studio's own application chrome into Canvas.

## Current state

- `packages/view-studio/src/styles.css` is 81 KB across 469 rules, and carries its own copies of the Canvas selection, hover, layer and handle treatments, in hex rather than `var(--infoschematic-canvas-*)`.
- Its `@import` of the Present stylesheet sits at the end of the file. Both build paths hoist it, so the chain is loaded; the authored file is still invalid CSS and nothing checks that it stays hoisted.
- `.artefact-action` and `.artefact-resize-handle` are styled, from Canvas, in the deployed editor today. Studio's copy of the Design grid is the visible defect instead: `.edit-grid rect { fill: url(#edit-grid-major) }` names a pattern no renderer defines anywhere in the repository, so the Design grid paints nothing.
- `packages/view-canvas/src/styles.css` imports the generated tokens and is the only stylesheet the Canvas browser suites load, which is why those suites cannot see any of this.

## Steps

- [x] Move the `@import` to the head of the Studio stylesheet and record what the cascade then does: the imported rules come first, so Studio's own copies still win where they disagree.
- [x] Render the editor before and after and compare, because this changes the appearance of every selection treatment at once.
- [x] Remove each Studio copy that the Canvas stylesheet now supplies, keeping only rules that are genuinely about the editor rather than the diagram.
- [x] Confirm `.artefact-action` and `.artefact-resize-handle` are styled in Studio, which is the defect a reader can see today.
- [x] Decide whether the remaining Studio copies should read the visual tokens rather than literal hex, and either convert them or state why not.
- [x] Give the browser suite a case that would have caught the original defect: a Canvas treatment asserted on the Studio surface, not only on a Canvas fixture.

## Files touched

- `packages/view-studio/src/styles.css`
- `packages/view-studio/src/app/App.treatments.browser.test.tsx` — new, for the Studio-surface treatment cases
- `packages/view-studio/src/app/viewport-frame.test.ts` — its frame assertion now reads the stylesheet that owns the rule
- `scripts/stylesheet-shadowing.test.ts` — new, the mechanical guard across the import chain
- `docs/specs/design-session.md` — `DESIGN-006` and `DESIGN-010` citations, which staled as the rules moved to Canvas
- `scripts/specification-evidence.test.ts` — its new case reading cited content rather than only a resolving path
- `docs/specs/authoring.md` — `AUTHOR-011`'s stale symbol, surfaced by that case

## Verify

Run `bun run self:check`, and confirm the PostCSS `@import` warning is gone from the site build. Render the editor in a browser at a realistic size and look at a selected Card, a held group, a selected Region, a selected Flow and a closed interaction layer, before and after, because the only honest check on a cascade change is the rendered surface.

## Dependencies / blocks

None. Multi-selection alignment (`INFOSCHEMATICS-TOOL-046`) declares its held-group treatment in both stylesheets; this item removes the second copy.

## Documentation impact

### Decision Records

None. The conditional was "if the editor deliberately keeps its own copy of diagram treatments", and it does not: every copy is gone and the guard keeps it that way. What remains in Studio is application chrome with no Canvas counterpart, which needs no boundary claim.

### Specifications

None expected. This is how a stated treatment reaches a surface, not a change to what is stated.

### Guides

None.

### Roadmap

None.

## Review

### Delivered

The editor reads the Canvas stylesheet rather than a copy of it, and the check that says so can now see the rules it is checking. Baseline `dbd57e2f5abf88681c0f4a2f68917b32fca38d28`; the first delivery's baseline was `df05c180942ccfb9b0b992745d54a4fbbb918496`.

Within the boundary: making one stylesheet read another, removing the duplication that stands in for it, and the mechanical guard over the chain. Outside it and untouched: the editor's appearance, the visual tokens, and Studio's own application chrome. `packages/view-canvas/src/styles.css`'s `defs`-id rule is left to Scoped renderer definition identity (`INFOSCHEMATICS-TOOL-058`).

The review's three findings all reproduced, and all three are fixed. The scanner was dropping the first rule of every stylesheet in the chain plus every rule inside a conditional group; `.infoschematic` was a live shadow on the diagram's own container, pinned by a test that asserted the literal; and the `DESIGN-006` and `DESIGN-010` citations had staled. The guard was fixed first, because a guard with a blind spot certifies whatever follows it.

### Summary of changes

- `scripts/stylesheet-shadowing.test.ts` — `selectorsOf` rewritten. It scans for the next structural character rather than the next `{`, skipping any that is only string or `url()` content; a statement at-rule ending in `;` is consumed without being mistaken for a selector; `@media`, `@container`, `@supports`, `@layer` and `@scope` bodies are descended into; `@keyframes`, `@font-face`, `@page` and `@property` bodies are not. Eight fixtures now hold the scanner to CSS a reader can read off by eye, plus one case asserting it sees `.infoschematic`, the Canvas rule it used to discard. Selector count over the real chain went from 170 to 187 for Canvas, and from 361 to 393 for Studio.
- `packages/view-studio/src/styles.css` — Studio's copy of `.infoschematic` removed, eleven declarations identical to Canvas's but for `#081725` where Canvas writes `var(--infoschematic-canvas-surfaces-backdrop)`. The narrow-viewport override of the same selector inside `@media (max-width: 1199px)` was rescoped to `.infoschematic-panel > .infoschematic`, matching the panel rule above it: `.infoschematic` is always a direct child of `.infoschematic-panel` in `App.tsx`, so this is behaviour-preserving, and it says what the rule is actually about — Studio's live panel, not the Infoschematic container.
- `packages/view-studio/src/app/viewport-frame.test.ts` — both assertions now read the Canvas stylesheet that owns the rule, and expect the token rather than the `#081725` it happens to generate today. The second case asserts Studio redeclares neither `.infoschematic` nor `.infoschematic-frame`.
- `packages/view-studio/src/app/App.treatments.browser.test.tsx` — a third case on the Studio surface: the diagram container's painted colour equals `color-mix(in srgb, <token> 72%, #000)` resolved by the browser from the token it reads at runtime, and Studio's panel override of `aspect-ratio` and `place-items` still holds.
- `docs/specs/design-session.md` — `DESIGN-006` and `DESIGN-010` repointed from `packages/view-studio/src/styles.css` to `packages/view-canvas/src/styles.css`, and each now names what it is citing: the `edit-grid`, `audit-port` and `artefact-resize-handle` layers, and the `pointed` and `selected` treatments.
- `scripts/specification-evidence.test.ts` — a fourth case. Where a citation names a thing in backticks and then the file it lives in, every cited file must still contain it. 75 such pairs across the corpus; the rule is `every` cited path rather than `some`, because a requirement citing two files and supported by one is exactly how `DESIGN-006` kept its old proof.
- `docs/specs/authoring.md` — `AUTHOR-011` cited `infoschematicConfigSchema`; the export is `infoschematicSchema`. Found by the new case, not by reading.

Selector identity is the line the guard defends, and that is now written down in the guard rather than left as an open concern. Two rules with the same selector along an import chain are a shadow whether their declarations agree or not: identical declarations are a copy that will drift, and differing ones are already the drift. A declaration comparison would have passed the case that motivated the guard — Studio's `.infoschematic` wrote a literal where Canvas wrote the token, so comparing declaration text would have called them different rules and said nothing. A difference that is deliberate belongs under a selector that says so, which is what the rescoped media rule now does.

### Verification

- `bun run self:check` — green, 43 tasks.
- The guard's new fixtures were run against the previous scanner, unchanged, before being trusted: 5 of 9 failed, including the first rule after `@import` statements, a rule inside `@media`, a rule inside `@container`, a rule after a brace that is only string content, and the real-file case asserting `.infoschematic` is visible in the Canvas stylesheet. `Tests 5 failed | 4 passed (9)`.
- The fixed guard over the real chain reported exactly one duplicate before any stylesheet was touched — `shadowed: [".infoschematic"], stylesheet: "packages/view-studio/src/styles.css"` — then a second, the bare `.infoschematic` inside Studio's `@media (max-width: 1199px)`, which the previous scanner could not see at all. Both resolved: `Tests 11 passed (11)`.
- The duplicate was copied back afterwards to confirm the guard still fails on it, and removed again.
- `Tests 12 passed (12)` for the Studio browser suite. With Studio's `@import` of the Present stylesheet commented out, three of those cases fail — the selection token reads `''`, the backdrop token reads `''`, and the identity chip's stroke reads `none` — so they are observing the chain rather than a fixture that loads Canvas directly.
- The new evidence case was proved against the defect it was written for: with `DESIGN-006`'s citation reverted to `packages/view-studio/src/styles.css`, it fails with `DESIGN-006 cites "audit-port" in files that do not contain it: ["packages/view-studio/src/styles.css"]`. Restored, the corpus is green.
- `turbo.json` needed no change. Every path cited anywhere in `docs/specs` already falls inside `//#self:verify:repo`'s `inputs` globs, which was checked rather than assumed, so the new case that reads cited file contents cannot replay stale.

Rendered, because a green suite is not evidence that output looks right and the surviving duplicate proved it. Studio was rendered in Chromium at 1680×1050 with two Cards, identity chips and the major-plus-minor grid, in Design mode with Card A selected — and the same document was rendered through `Canvas` alone at the same size, for comparison.

What the editor looked like: dark application chrome, the Design panel docked right with its tool banks, Create, Library, Selection reading `CARD CARD-A  Box at 80, 120; 200 × 120`, and Changes. The diagram sat in the centre panel as a white grid band — major and minor lines both painted — inset in the dark container, with Card A carrying the green selection stroke, its full ring of port handles, a resize handle at the bottom-right corner and three artefact actions, and Card B carrying its own blue Scope stroke and identity chip. Canvas alone drew the same document identically: same container band above and below, same white grid surface, same Card fill, stroke, identity chip and drop shadow, same grid pattern. Nothing about the diagram surface distinguished the editor from Canvas.

Measured alongside the capture, Studio and Canvas agree on the container to the character: `background=color(srgb 0.0225882 0.0649412 0.104471)` on both, which is what `color-mix(in srgb, var(--infoschematic-canvas-surfaces-backdrop) 72%, #000)` resolves to — so removing Studio's literal copy moved nothing. Studio's panel override still reads `aspect=auto maxWidth=none` against Canvas's `aspect=3 / 2 maxWidth=100%`, which is the intended difference and the only one. `.edit-grid rect` computes `url("#infoschematic-grid-major-plus-minor")`, and the surface carried 44 ports, 1 resize handle and 3 artefact actions. The rescoped narrow-viewport rule was checked by resizing the same page to 1100px: `maxHeight` becomes `none`, exactly as the bare selector produced before.

### Outstanding concerns

The guard still compares selectors after flattening combinators, so two stylesheets can say the same thing under genuinely different selector shapes — `.infoschematic-region path` shadowing `.infoschematic-region-frame` is the known example. That is not the same gap as the one the review found: it is a limit of selector text, not a blind spot in the scanner, and closing it means resolving what each rule matches, which is a CSS engine rather than a check. The scanner-level blind spots are gone and fixtured.

The evidence gate now reads content, but only where a citation names it in backticks. `DESIGN-006`'s own citation said "editing layers" in prose, which no gate can check, so it was rewritten to name `edit-grid`, `audit-port` and `artefact-resize-handle` — the fix and the convention are the same act. Citations that name nothing still rest on a path that resolves and nothing more. Making that the corpus-wide convention is a separate pass over roughly 150 requirements, not this item.

The browser case for the diagram container cannot, on its own, distinguish a literal copy that agrees with the token today from the token itself; it catches the chain breaking, and the guard catches the copy. The two together are the cover, which is worth knowing when reading either alone.

### Post-change review

The goal holds and is now actually true: a treatment written in Canvas reaches the Studio surface uncopied, and no selector along the chain is declared twice — verified by a scanner that has been shown to see the rules it claims to compare. The boundary held; nothing in the editor's appearance, the tokens, or Studio's chrome was redesigned.

Regression risk is low and was measured rather than argued. The one behavioural question was the rescoped media rule, and it was checked in the browser at the width that triggers it. The container's painted colour is identical before and after, on the same page, to the same character.

Two things went beyond the literal steps. Rescoping `.infoschematic` inside Studio's media query was not named in the rework steps, because the previous scanner could not see it to name it; it is the same defect class and the same fix. And the new evidence case found a stale citation in `AUTHOR-011` that belongs to nobody's item — corrected in place, because a gate that cannot be green is not a gate.

The reopened packet's central claim was false, and the lesson generalises past this item: the earlier delivery asserted "no selector is declared twice" while its scanner had discarded the first rule of all three stylesheets. A check's own reading has to be evidenced before its green means anything, which is why the scanner now carries fixtures a reader can verify by eye and why every fixture was run against the old code first.

### Mini recap

The editor was still drawing the diagram's own container from its own copy of the Canvas rule, with a literal where Canvas writes the token, and the check written to prevent exactly that could not see it — it silently dropped the first rule of every stylesheet in the chain, and every rule inside a media or container query. The scanner is rewritten and fixtured, the duplicate is gone, Studio's narrow-viewport override now says it is about the panel, the two stale specification citations name what they cite, and the evidence gate reads the content rather than only the path. Rendered and compared against Canvas: identical diagram surface, identical container colour, the panel override the only difference.

Learning routes, proposed and not promoted: a check that parses a format needs fixtures for its own reading, not only for its subject; and a citation that names prose can only ever be checked as a path, so naming the identifier is what makes evidence verifiable.

## Discussion

### The cascade is the risk, not the import

Moving one line changes the appearance of every selection treatment at once. Imported rules come first, so Studio's own copies still win wherever they disagree — which means the immediately visible change is confined to rules Studio never copied, and the invisible change is that every duplicate is now shadowing rather than defining. Appearance actually moves at the step that removes them, so that is the step to render and compare, not the import.

### Hex versus tokens

Studio's copies were written with literal colours, so they have already drifted from the generated visual tokens by construction — a token change reaches Canvas and stops at the editor. Converting them is what makes future Canvas treatments reach Studio for free. Keeping them is a decision to let the editor look deliberately different, which is defensible but needs a record rather than an accident of a misplaced `@import`.

### Why the suite could not see it

Canvas browser suites load the Canvas stylesheet directly, so a treatment written there always passes. The defect lives in what Studio loads. Only a case asserted on the Studio surface can observe it, which is the same shape of blind spot as a suite that never mounts two instances.

## Review findings

The review did not accept this item. The delivery is mostly real — 103 duplicated rules removed, 81 KB down to 63 KB, the import hoisted, the Design-grid defect genuine and fixed — but the claim the item exists to make is false, and the guard written to defend it cannot see the case that breaks it.

### The guard drops the first rule of a stylesheet

`scripts/stylesheet-shadowing.test.ts:36-56` takes everything between the previous block and the next `{` as one selector string, then skips it when it starts with `@`. A stylesheet opening with `@import` statements therefore folds its first rule's selector into that string and discards it. `packages/view-canvas/src/styles.css` opens with two `@import` lines, so running the guard's own logic over it yields 170 selectors with `.infoschematic-frame` present and `.infoschematic` absent.

Rules nested inside `@media`, `@container` or `@keyframes` are skipped as well, because the loop consumes the at-rule's whole body. Studio retains 24 such rules, including the `prefers-reduced-motion` block whose duplicate the packet reports removing. The guard also flattens combinators, so a newly written `.infoschematic-svg .edit-grid rect` would outrank an inline presentation attribute and still pass.

### A live shadow survives, on the diagram's own container

`.infoschematic` is declared at `packages/view-canvas/src/styles.css:4` and again at `packages/view-studio/src/styles.css:549`, with the same eleven declarations. They differ in one: Studio writes `background: color-mix(in srgb, #081725 72%, #000)` where Canvas writes the token, and `#081725` is what `packages/view-model/src/tokens.generated.css:59` generates for that token today. Studio's copy sits after the import, so it wins the cascade — the exact token-drift class the change deleted 91 rules to remove. `packages/view-studio/src/app/viewport-frame.test.ts:12` asserts the literal, so the duplicate is pinned in place by a test.

### Two specification citations went stale in the same pass

`adc0d6b6` removed the Studio rules that `docs/specs/design-session.md:67,69` (`DESIGN-006`) and `:107,109` (`DESIGN-010`) cite as evidence. The cited path still exists, so the evidence gate delivered alongside it passes; Studio's stylesheet now has no match for `edit-grid`, `audit-port` or `artefact-resize-handle`, and one `.selected` rule unrelated to either requirement. Neither packet mentions it.

## Rework steps

- [x] Rewrite `selectorsOf` so it cannot silently drop a rule: consume at-rule statements ending in `;` separately from blocks, descend into `@media` and `@container` bodies, and skip only `@keyframes` contents. Prove each case with a fixture that fails first.
- [x] Re-run the guard over the real chain and fix every duplicate it now reports, including `.infoschematic`. Removing Studio's copy means changing the assertion at `packages/view-studio/src/app/viewport-frame.test.ts:12` to expect the token rather than the literal.
- [x] Decide whether the guard should compare declarations rather than selectors, or state in the record why selector identity is the line being defended — the packet's outstanding concerns name this limitation without resolving it.
- [x] Repoint `DESIGN-006` and `DESIGN-010` at evidence that exists, and consider whether the evidence gate can be made to notice content that no longer supports a requirement rather than only a path that no longer resolves.
- [x] Re-render Studio and look at the diagram surface against Canvas, since the surviving duplicate was invisible to a fully green run.
