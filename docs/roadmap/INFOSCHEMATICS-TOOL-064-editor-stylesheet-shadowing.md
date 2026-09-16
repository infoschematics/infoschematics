---
id: INFOSCHEMATICS-TOOL-064
area: TOOL
title: Editor stylesheet shadowing
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: df05c180942ccfb9b0b992745d54a4fbbb918496
created_at: 2026-09-15T13:30:00Z
updated_at: 2026-09-16T10:45:00Z
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

The editor reads the Canvas stylesheet rather than a copy of it. Studio's stylesheet lost 103 of its 469 rules — 81 KB down to 63 KB — and what remains is application chrome with no Canvas counterpart. A treatment written in Canvas now reaches the Studio surface uncopied, and a repository check fails if a copy comes back.

### Summary of changes

- `packages/view-studio/src/styles.css` — `@import "@infoschematics/view-present/styles.css"` hoisted to the head, and 103 rules removed: 91 token-equivalent duplicates of Canvas selectors, 8 combinator near-misses, a `prefers-reduced-motion` copy, the dead `.edit-grid-line` pair, and the Design grid rule pointing at a pattern that does not exist.
- `scripts/stylesheet-shadowing.test.ts` — new, in the repository-level suite. Two cases: no selector is declared twice across the Canvas → Present → Studio chain, and each stylesheet actually imports the one it is compared against, at the head of the file where a conforming parser will keep it.
- `packages/view-studio/src/app/App.treatments.browser.test.tsx` — new. A selected Card on the Studio surface is painted from `--infoschematic-canvas-selection-selected`, and its identity chip keeps its own Scope colour rather than inheriting the Card's selection treatment.
- `packages/view-studio/src/app/viewport-frame.test.ts` — the `.infoschematic-frame` assertion moved to the Canvas stylesheet that now owns the rule, with a second case asserting Studio does not redeclare it.

### Verification

- Removal was established as appearance-neutral before anything was removed, by expanding every generated token and comparing normalised rule bodies: 83 of the 86 overlapping rules were byte-identical once tokens resolved, and each of the 3 that differed had Canvas as the better version.
- Rendered and compared, because a green suite is not evidence that output looks right. Present mode is byte-identical across every pass. The one pixel movement in the whole change was 1.18% of the Design surface, and the crop showed exactly the intended effect: Card identity chips losing the Card's own selection stroke and drop-shadow, which is what Canvas's `>` scoping exists to prevent. The final two removals moved zero pixels on all four captures, with a Region on screen.
- The Design grid now paints. Before, `.edit-grid rect` computed `fill: url("#edit-grid-major")`, a reference nothing in the repository defines, so the grid rendered nothing; after, it computes `url("#infoschematic-grid-major-plus-minor")`, which the Canvas renderer emits.
- Held-group treatment read from the live editor after adding the class by hand: `rgb(130, 179, 102)`, `5px, 4px`, `2px` — Canvas's rule supplying precisely what Studio's deleted copy said.
- Every new assertion was proved to fail against a deliberate breakage and then restored: the import moved back to the end of the file, a Canvas rule copied back into Studio, the Studio stylesheet removed from the browser fixture, and the identity-chip scoping loosened.
- `bun run self:check` green, 43 tasks.

### Outstanding concerns

`.artefact-action` and `.artefact-resize-handle` were never the defect. The record claimed they rendered as unstyled black shapes; measurement found them painted from Canvas, correctly, before this change. The item's premise was carried forward from a diagnosis nobody had re-checked, and the real defect — the grid painting nothing — was sitting next to it unrecorded.

The shadowing check compares selectors, not declarations. Two stylesheets can still say the same thing under different selector shapes, which is how `.infoschematic-region path` shadowed `.infoschematic-region-frame` until it was read by hand. Catching that class mechanically means resolving what each rule matches, which is a CSS engine rather than a check.

The intended browser case for the Design grid was dropped. `grid={editor.editing}` stayed false in the fixture even with the surface in Design mode and the Design toolbar rendered, because the editor mode is set from an effect that appears to want an authored document. The shadowing check covers that defect class mechanically, which is the stronger guard, but the rendered assertion is missing.

### Post-change review

The question the item asked — convert the remaining literals to tokens, or record why not — resolved into neither answer. Every generated token is `--infoschematic-canvas-*`: it is the diagram's vocabulary, and after the removals nothing in Studio's stylesheet is about the diagram. Of 104 remaining literals, five coincide with a token value, and all five are chrome: a focus ring, a pressed toggle border, an eyebrow. Writing `var(--infoschematic-canvas-selection-pointed)` on `.eyebrow` would assert a relationship that is not there. The editor chrome has no token vocabulary, and inventing one is not this item.

The stale premise is the part worth keeping. Two of the three defects the record named were fixed or never existed, and the one that was real went unmentioned — so the record was describing the repository as it stood when someone last looked, which is exactly what a `ready` item is at risk of being. Measuring first cost an hour and changed what was delivered.

### Mini recap

The editor was drawing the diagram from its own 81 KB copy of the Canvas rules, so a treatment written once arrived nowhere and a token change stopped at the editor door. The copies are gone, the chain is loaded from the head of the file, and a check now fails if a selector is declared twice along it.

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

- [ ] Rewrite `selectorsOf` so it cannot silently drop a rule: consume at-rule statements ending in `;` separately from blocks, descend into `@media` and `@container` bodies, and skip only `@keyframes` contents. Prove each case with a fixture that fails first.
- [ ] Re-run the guard over the real chain and fix every duplicate it now reports, including `.infoschematic`. Removing Studio's copy means changing the assertion at `packages/view-studio/src/app/viewport-frame.test.ts:12` to expect the token rather than the literal.
- [ ] Decide whether the guard should compare declarations rather than selectors, or state in the record why selector identity is the line being defended — the packet's outstanding concerns name this limitation without resolving it.
- [ ] Repoint `DESIGN-006` and `DESIGN-010` at evidence that exists, and consider whether the evidence gate can be made to notice content that no longer supports a requirement rather than only a path that no longer resolves.
- [ ] Re-render Studio and look at the diagram surface against Canvas, since the surviving duplicate was invisible to a fully green run.
