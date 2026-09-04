---
id: INFOSCHEMATICS-SITE-005
area: SITE
title: Card shape variety
theme: site-experience
horizon: soon
status: draft
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Let Cards take a wider range of shapes and proportions than the current default, so authored Infoschematics composing other diagram styles are not implicitly steered toward one landscape aspect.

## Context

A Card's box geometry is already freely resizable — the Studio editor's own minimum is 40×40 (`docs/design/view-studio.md`) — but the Library's seed templates default to a fixed landscape aspect (`packages/view-studio/src/app/editor/library.ts:64` seeds a "Service card" at 160×80, a 2:1 ratio; another template seeds 240×140). Card presentation itself — corner radius, and the internal layout of tag, title, and description (`docs/design/visual-language.md`'s "consistent shape language") — is tuned around that landscape assumption in both renderers, with no stated contract for how it should read at markedly different proportions (tall, square) or non-rectangular shapes.

## Boundary

This item does not change the default Card's current appearance or the existing 40×40 minimum. It does not commit to non-rectangular (hexagon, pill, etc.) shapes without an explicit design decision — the initial scope may be aspect-ratio variety alone, with true shape variety following if warranted.

## Shaping

The intended pass will:

- Decide, as a design question, what "shape variety" means in scope for this item: aspect-ratio freedom alone, or genuinely different Card silhouettes.
- Define how Card-internal layout (tag, title, description, metadata) degrades or adapts gracefully outside the current landscape assumption, for both `view-canvas` and `render-svg`.
- Decide whether new Library seed templates are needed to make the variety discoverable, or whether resize alone is sufficient.
- Establish parity tests analogous to `scripts/visual-treatment-parity.test.ts` for the chosen shapes.

Known dependency: a design decision on scope (aspect-ratio-only vs. true shape variety) before this item can promote to Next with concrete Steps.

## Discussion

### Why not just document the existing resize freedom

Cards can already be resized to any aspect within the 40×40 minimum, but the visual and layout language was designed around one landscape ratio; simply permitting a different box size without adapting internal layout and presentation would produce a Card that merely looks broken rather than one that legitimately supports another diagram style.
