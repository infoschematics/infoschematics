---
id: INFOSCHEMATICS-TOOL-121
area: TOOL
title: One chip, two colours
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: d9e6125359531ef47fef1577c4a199a0979181f9
created_at: 2026-09-22T12:20:00Z
updated_at: 2026-09-24T16:00:00Z
---

# One chip, two colours

## Goal

A [Standard Card](../reference/vocabulary.md#standard-card)'s identity chip is the same chip whichever renderer drew it, so a rendered file and the interactive Diagram show one document rather than two treatments of it.

## Context

The two renderers disagree about what paints that chip. `packages/render-svg/src/index.ts:1344` writes `fill: paint.annotationFill` with `paint.annotationText` for the code — a contrast chip, dark on light paper and light on dark. `packages/view-canvas/src/styles.css:733` paints `color-mix(in srgb, var(--infoschematic-canvas-paint-backdrop) 88%, transparent)` with `--infoschematic-canvas-paint-text-strong` — a paper chip, the drawing's own ground showing through. Side by side the rendered Card carries a dark tab and the interactive Card carries a pale one.

Every other annotation agrees. The code badge is the same construction and the same `annotationFill`/`annotationText` pair in both (`index.ts:232`, `styles.css:785`), which is what makes the chip an exception rather than a convention. The stroke agrees too: both take the Scope's authored colour, falling back to the unauthored role.

Neither treatment is obviously the right one. The contrast chip is legible at nine pixels and reads as a label attached to the Card; the paper chip is quieter and lets the Scope stroke carry the identity. The question this needs to settle is which the product means, and then to have one place say it — the disagreement exists because the value was written twice, not because two outlets were given different instructions.

## Boundary

A treatment-parity defect across two renderers, resolved by choosing one chip and deleting the other spelling. It touches `packages/render-svg/src/index.ts`, `packages/view-canvas/src/styles.css`, and whatever parity check is extended to hold the result — `scripts/` already carries a visual-treatment parity task, and a chip that can drift again is the actual defect. It does not change the identity chip's geometry, its `card.identity` appearance flag, the Scope colour it strokes with, or the annotation roles the palettes define.

## Current state

The two renderers each hold their own spelling of the identity chip's fill and text. `packages/render-svg/src/index.ts:1344` writes `paint.annotationFill` and `paint.annotationText` directly. `packages/view-canvas/src/styles.css:733` writes a `color-mix()` of the canvas backdrop at 88% against the strong text token. Both outlets do have the same `annotationFill`/`annotationText` pair available and use it identically elsewhere — `index.ts:232` and `styles.css:785` — so the chip is an exception to a convention the repository otherwise keeps. The stroke agrees across both: the Scope's authored colour, falling back to the unauthored role.

Nothing catches the divergence. `scripts/visual-treatment-parity.test.ts` is the parity task that exists for exactly this class of drift, and it does not currently cover the chip.

## Steps

- [x] Choose the chip's treatment, in both colour schemes, by looking at a rendered example rather than by reading tokens: the contrast chip against the blueprint `surface` and the paper chip against a dark backdrop are the two cases where a token that reads well in one scheme vanishes in the other.
- [x] Apply the chosen treatment in whichever outlet is wrong and delete the other spelling, so the value exists once.
- [x] Extend `scripts/visual-treatment-parity.test.ts` to hold the chip, so a future divergence fails rather than accumulates.
- [x] Capture both schemes from a real browser into `reports/` as the evidence for the choice.

## Files touched

`packages/render-svg/src/index.ts`, `packages/view-canvas/src/styles.css`, `scripts/visual-treatment-parity.test.ts`, and the generated visual tokens if the chosen treatment needs a token that does not exist.

## Verify

`bun run self:check`, with the extended parity task proving it covers the chip by failing against the current divergence before the fix lands. Per `AGENTS.md` a green parity run says nothing about whether the chosen chip is legible; the browser capture in both schemes is the evidence that matters.

## Dependencies / blocks

Nothing blocks it and it blocks nothing. It is downstream of the colour-scheme work only in the sense that `INFOSCHEMATICS-TOOL-117` made the divergence visible — `git show 9f0503bb~1` carries both spellings, so the defect predates it.

## Documentation impact

### Decision Records

None. Choosing between two spellings of one intended treatment is not a decision the repository needs to carry forward; if the chip turns out to want a role the palette does not name, that is a different item.

### Specifications

`docs/specs/appearance.md` states the identity chip's treatment once, so the parity task has a contract to hold rather than a fixed value copied from whichever renderer won.

### Guides

None. The scheme gallery in the visual guide shows the result without needing new prose.

### Roadmap

Nothing follows. If the parity task turns out to miss other paired values, widening its coverage is its own record.

## Review

### Delivered

A [Standard Card](../reference/vocabulary.md#standard-card)'s identity chip is now one treatment named in one vocabulary. Both outlets take `annotationFill` and `annotationText`, the pair every other annotation in the repository already takes, and `scripts/visual-treatment-parity.test.ts` fails if either outlet stops naming them.

### Change Summary

The contrast chip won, and the argument is checkable rather than aesthetic. The paper chip is not a colour: it is `color-mix(in srgb, var(--infoschematic-canvas-paint-backdrop) 88%, transparent)` composited over whatever fill the Card's Scope authored, so it resolves differently on every Card and no palette role could name it. The framework-neutral renderer has to write a resolved value — that is what its `scheme` option exists for — so the paper chip could never be the single spelling, whichever outlet was asked to adopt it. Both chips are legible at nine pixels, which is why the choice could not be made on legibility.

`packages/view-canvas/src/styles.css` therefore changes and `packages/render-svg/src/index.ts` does not. `.infoschematic-card-identity rect` takes `--infoschematic-canvas-paint-annotation-fill`, its `text` takes `--infoschematic-canvas-paint-annotation-text`, and the `color-mix()` and `text-strong` spellings are gone.

`scripts/visual-treatment-parity.test.ts` gains `paints the Card identity chip from the annotation roles in both renderers`. Canvas writes no `fill` into markup, so the test compares the role Canvas names in the stylesheet against the colour the static renderer resolves for each of the three schemes. It also holds the code badge to the same pair, so drift in the convention cannot silently redefine the chip that now follows it.

`docs/specs/appearance.md` states the rule once, in `APPEAR-008`: where a treatment pairs a fill with type read against it, both outlets name the same two roles; a treatment one outlet can only compose at draw time cannot be that shared spelling.

### Verification

`bun run self:check` — 52 tasks, all successful.

The check was proved to cover the chip before the fix landed: with the previous stylesheet restored, the new assertion failed with `AssertionError: expected 'color-mix(in srgb, var(--infoschemati…' to be 'var(--infoschematic-canvas-paint-anno…'`.

Its own coverage is asserted three ways, per `AGENTS.md`: a selector heading no rule throws, a selector whose rules declare no fill or two fills throws, and the pair is asserted to differ — two equal values would satisfy the comparison and draw an unreadable chip.

The chip was looked at in a real browser rather than asserted. `reports/tool-121-chip/` captures the Cards page in both reader schemes at three times magnification, and `reports/tool-121-scheme/` captures the guide's scheme gallery, which is the one drawing that authors no surface and so shows the chip against the scheme's own paper: dark chip on white, light chip on slate. `reports/tool-121-before/` and `reports/tool-121-before-canvas/` hold the same pages beforehand. `reports/TOOL-121-one-chip.md` carries the account.

### Outstanding concerns

The parity test reads a stylesheet as text, which is the weakest part of it. A rule moved into a media query or a cascade layer would still match, and a value changed through a second rule later in the file would not be seen. The exactly-one-fill invariant is what keeps that honest for now — a second rule adding a fill throws rather than being silently ignored — but a stylesheet that grows conditional treatment will need the resolved value from a browser instead.

Separately, the fix removes the only use of `--infoschematic-canvas-paint-text-strong` in that region; the role is still used elsewhere, so nothing is now unreferenced.

### Post-change review

The useful generalisation is that a parity question is sometimes not a question of taste. Both chips looked defensible in isolation, and the record left the choice to the browser capture expecting legibility to settle it. What actually settled it was that one of the two candidates could not be expressed once: a value composed at draw time out of the drawing's own paper has no name in the palette, so adopting it would have meant keeping two spellings and calling that agreement. When a treatment disagreement is a spelled-twice defect, ask first which spelling could survive being the only one — that eliminates a candidate before any capture is taken.

The looking still earned its place, in an unplanned way: the scheme gallery was where the chip could be seen against unauthored paper, and it exposed that the gallery's adaptive drawing does not follow the site's own scheme switch, because the adaptive SVG keys off `prefers-color-scheme` while the switch sets a document attribute. That is out of this item's boundary and is not fixed here.

### Mini recap

One chip, one pair of roles, stated once in `APPEAR-008` and held by a parity test that fails when either outlet stops naming them. The contrast chip won because the paper chip could not be written down as a colour, and both schemes were looked at in a browser to confirm the chip that resulted reads in either direction.

## Done

Accepted 2026-09-24 by Kris Brown on the review packet above.

## Discussion

Found on 2026-09-22 while delivering `INFOSCHEMATICS-TOOL-118`, comparing the rendered and interactive drawings in both colour schemes on the guide's own scheme gallery. It predates both palette items: `git show 9f0503bb~1` carries the same two spellings, so `INFOSCHEMATICS-TOOL-117` made it visible rather than causing it, and neither record is widened to absorb it.

Per `AGENTS.md`, whichever chip is chosen has to be looked at rather than asserted: the contrast chip against a blueprint `surface` and the paper chip against a dark backdrop are the two cases where a token that reads well in the light scheme can vanish, and a green parity check would say nothing about either.

### Adoption

Adopted into Now on 2026-09-22 while shaping the queue before a pause. The choice of treatment is taken as part of delivery, on the evidence of the browser capture rather than in advance.
