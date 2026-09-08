---
id: INFOSCHEMATICS-TOOL-024
area: TOOL
title: Card text fits its Card
theme: tool
horizon: soon
status: ready
blocks: []
blocked_by: []
baseline_ref: null
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

- [ ] Extend `resolveCardLayout` to fit text: the label as the lines it will be drawn on, and the stereotype and description as the strings that fit their own bands.
- [ ] Consume the fitted text in `packages/render-svg/src/index.ts`.
- [ ] Consume it in `packages/view-canvas/src/InfoschematicDiagram.tsx` and retire `splitLabel`.
- [ ] Cover the fitting directly: short text untouched, a wrapped label at the box's width, a compact label truncated, a single word too long for its line, and a stereotype and description fitted to their bands.
- [ ] Extend `scripts/visual-treatment-parity.test.ts` with long text, proving both renderers draw the same strings and both keep the authored text accessible.

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

## Discussion

### Why not measure the text properly

A browser can measure text and a static renderer cannot, so a real metric would make the two renderers disagree by construction — the exact failure SITE-005 removed. A shared estimate is worse at the margin and right in the only way that matters here.
