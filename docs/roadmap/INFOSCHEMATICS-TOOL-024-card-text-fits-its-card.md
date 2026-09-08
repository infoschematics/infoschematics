---
id: INFOSCHEMATICS-TOOL-024
area: TOOL
title: Card text fits its Card
theme: tool
horizon: soon
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: ee4aaacb7df43088b55c866adaaf2502378deb81
---

## Goal

Make a Card's drawn text fit the Card it is drawn on, in both renderers and at any proportion: a long label, stereotype or description wraps or truncates by one deterministic rule instead of running out through the Card's own border.

## Context

This is INFOSCHEMATICS-TOOL-014's compact-Card long-text residual, split out because it needs no external authority and no release window, while the rest of that record waits on npm scope ownership, trusted publishing and a browser observation pass. TOOL-014 keeps its other residuals.

INFOSCHEMATICS-SITE-005 moved Card placement into `packages/view-model/src/card-layout.ts` and left the fitting behind, recording as an open concern that "the Canvas still wraps labels and static SVG still does not". Canvas wraps through `splitLabel`, which balances a label onto two lines when it exceeds 22 characters and contains a space — a character count that knows nothing about the box's width, so it wraps a short label on a narrow Card not at all and a long one on a wide Card unnecessarily. Static output never wraps. Neither renderer truncates anything: an over-long label, stereotype or description simply overruns the Card, and on a compact Card it runs under the identity chip.

## Boundary

This item changes what text is drawn, never what is authored: the Card's accessible name and the document description keep the authored values in full, as CANVAS-007 requires. It adds no authored field, no per-Card typography override and no font metric dependency, and it does not change the resize minimum or any element's position beyond the line count a fitted label implies.

## Current state

`resolveCardLayout` places elements and takes a label line count from its caller; the caller decides the text. Canvas passes `splitLabel(card.label).length` for the legacy treatment and one line for a compact Card; static SVG always passes one and draws `card.label` whole. Both renderers already estimate width from a fixed advance per character for the identity chip and the stereotype, which is the same estimate a fitted line needs.

## Shaping decisions

- **Fitting belongs with placement.** `resolveCardLayout` already knows the box, the treatment and the authored text, and is already the reason both renderers agree on position. Returning the fitted strings alongside the positions is what makes them agree on content too; a renderer that fits its own text is a renderer that will drift again.
- **One estimate, as SITE-005 established.** Width comes from a fixed advance per character per element, since static output has no text metric. The estimate can be a little wrong; it cannot be differently wrong in the two renderers.
- **A compact Card keeps one label line.** Its stack is a top band, a label and a description, and wrapping the label would push the description into the floor. Long text on a compact Card truncates, which is the explicit policy TOOL-014 asked for.
- **The legacy treatment keeps its two-line wrap, made width-aware.** It wraps on word boundaries against the box's usable width rather than a character count, and truncates when two lines are still not enough.
- **Truncation ends in an ellipsis character.** One `…` says the text continues; a bare cut reads as authored.
- **The accessible text is untouched.** Every renderer's accessible name and title keep the full authored label, stereotype and description, so fitting is a visual reduction and never a loss of meaning.
- **`splitLabel` retires.** Two wrapping rules is how the renderers came to disagree; the Canvas takes its lines from the layout.

## Steps

- [x] Extend `resolveCardLayout` to fit text: the label as the lines it will be drawn on, and the stereotype and description as the strings that fit their own bands.
- [x] Consume the fitted text in `packages/render-svg/src/index.ts`.
- [x] Consume it in `packages/view-canvas/src/InfoschematicDiagram.tsx` and retire `splitLabel`.
- [x] Cover the fitting directly: short text untouched, a wrapped label at the box's width, a compact label truncated, a single word too long for its line, and a stereotype and description fitted to their bands.
- [x] Extend `scripts/visual-treatment-parity.test.ts` with long text, proving both renderers draw the same strings and both keep the authored text accessible.

## Files touched

- `packages/view-model/src/card-layout.ts` and its tests, for the fitting
- `packages/render-svg/src/index.ts` and `packages/view-canvas/src/InfoschematicDiagram.tsx` for the consumption
- `scripts/visual-treatment-parity.test.ts` for the cross-renderer text
- `docs/specs/view-model.md` for the requirement; `packages/domain-model/` is **not** touched

## Verify

Prove that both renderers draw the same strings for the same Card, that a label too long for its box is wrapped or ended with an ellipsis rather than drawn past the border, and that the authored text survives in full in the accessible name. Run `bun run self:check`.

## Dependencies / blocks

Split from INFOSCHEMATICS-TOOL-014, which retains the registry publication, the renderer schema-version contract, the narrow-width density pass and the repository audit and conform cycle. Builds on INFOSCHEMATICS-SITE-005's shared Card layout.

## Documentation impact

### Specifications

Extend the View Model Card-layout requirement to cover fitted text, and record that a fitted string is a visual reduction that leaves the accessible name whole.

### Decision Records

None expected: this completes an existing calculation rather than establishing a boundary.

## Review

### Delivered

A Card's drawn text now fits the Card it is drawn on, by one rule shared by both renderers. `resolveCardLayout` returns the strings as well as the positions: the lines the label is drawn on, and the stereotype and description as they fit their own bands. Text that will not fit is wrapped on word boundaries against the box's usable width, then ended with an ellipsis; a compact Card keeps one label line, the legacy treatment may take a second where the box is tall enough. Nothing runs through a Card's border any more, and nothing is authored differently: the accessible name still carries the full authored label, stereotype and description.

`splitLabel` is gone. Static output now emits one `tspan` per fitted line, as the Canvas already did, so a wrapped label is the same label in both outputs.

### Summary of changes

- `packages/view-model/src/card-layout.ts` — the request takes the authored `label` and `description` instead of a caller-supplied `labelLines` count. New pure helpers `fits`, `truncate` and `wrap` do the fitting from the same fixed advance per character the chip and stereotype already used, with a per-element advance (label 7.28, compact label 6.76, stereotype 5.8, description 5). `CardLabelPlacement` gained `lines`; the stereotype and description placements became `CardFittedPlacement`, carrying the `text` that was placed. An element whose fitted text is empty is withheld, which is how a box with no room for even one character stays clean.
- `packages/render-svg/src/index.ts` — passes `card.label` and `card.detail` into the layout, draws `layout.stereotype.text`, `layout.description.text`, and one `<tspan x dy>` per `layout.label.lines` entry.
- `packages/view-canvas/src/InfoschematicDiagram.tsx` — same, from `card.name` for the description; `splitLabel` and its character-count wrap are deleted. The `tspan` key is now index-qualified, since two fitted lines can be the same string.
- `packages/view-model/src/card-layout.test.ts` — 3 new cases and updated expectations across the existing 9.
- `scripts/visual-treatment-parity.test.ts` — a new `cardStrings` extractor and a long-text case across three proportions.
- Documentation — VIEW-026 in the [View Model specification](../specs/view-model.md), with a sentence added to CANVAS-010 and SVG-012 that each renderer draws the text the layout fits rather than fitting its own.

### Verification

- `bun run self:check` exit 0: 58 test files, 394 tests, every TypeScript workspace clean, dependency-cruiser clean at 211 modules and 491 dependencies, production site build in 8.42s.
- `packages/view-model/src/card-layout.test.ts` — 12 tests. New: a wrap that follows the width rather than a character count (the same label is one line at 320 wide and two at 120); an ellipsis for a compact overflow, for a single word too long for its line, and an empty line where a 14-wide box holds nothing; a stereotype and a description fitted to their own bands. An unauthored description is withheld like an unauthored stereotype.
- `scripts/visual-treatment-parity.test.ts` — the new case renders three long-text Cards through both renderers, asserts the drawn label lines, stereotype and description strings are identical, pins them, and asserts the full authored text is still in the accessible name of both.

### Outstanding concerns

- **A narrow Card now shows a truncated stereotype where it previously showed none.** Under SITE-005 a stereotype that did not fit was dropped; it is now cut to the width, so a 60-wide Card reads `servi…`. That follows the item's rule — a string is fitted to its band — but it is a visible change to a case SITE-005 pinned, and the expectation in `card-layout.test.ts` was updated to match.
- **The advances are estimates, tuned by eye.** They are deliberately shared rather than accurate, so a proportional font will sometimes fit a character more or less than the estimate allows. A label can therefore truncate a little early on narrow letters.
- **Word-boundary wrapping only.** A long unbroken token — a URL, a hyphenated compound — is truncated rather than broken, because breaking mid-word without a metric produces worse output than an ellipsis.
- **Fitting reads the same field in each renderer as before.** The Canvas description comes from `card.name` and static output's from `card.detail`; this item did not change that pairing, only the fitting applied to it.

### Post-change review

The plan held, including the parts that could have gone wrong. Returning the fitted strings from the layout rather than a fitting helper the renderers call is what makes the parity assertion cheap: the new test compares drawn strings and they match by construction, not by two implementations agreeing.

One shaping decision needed a real answer during the work. SITE-005 gave the identity chip a rule about the stereotype it would sit on, and a fitted stereotype can always be made to clear the chip — which would have silently reversed that rule. The stereotype is therefore fitted to the box, not to the space beside the chip, so the chip still gives way rather than the stereotype quietly shrinking to accommodate it. That keeps SITE-005's behaviour intact for the repository's own fixtures.

Static output's `tspan` emission is where the two renderers came closest to drifting again. Emitting `dy="0"` on the first line rather than omitting it is what keeps the two outputs structurally the same, which matters because the parity extractor reads lines out of `tspan`s.

### Mini recap

INFOSCHEMATICS-TOOL-024 completes the Card-layout calculation SITE-005 started: `resolveCardLayout` now fits a Card's text as well as placing it, and both renderers draw what it returns. Labels wrap on word boundaries against the box's width and end in an ellipsis when they still do not fit; stereotypes and descriptions are cut to their own bands; the Canvas's 22-character `splitLabel` heuristic is deleted.

Verification is `bun run self:check` at exit 0 with 394 tests, 4 of them new, covering the fitting directly and across both renderers with long text. VIEW-026 records the requirement, including that a fitted string is a visual reduction that leaves the accessible name whole.

Open for review: a narrow Card now shows a truncated stereotype where SITE-005 dropped it, the character advances remain shared estimates rather than metrics, and an unbroken token is truncated rather than broken.

## Discussion

### Why not measure the text properly

A browser can measure text and a static renderer cannot, so a real metric would make the two renderers disagree by construction — the exact failure SITE-005 removed. A shared estimate is worse at the margin and right in the only way that matters here.
