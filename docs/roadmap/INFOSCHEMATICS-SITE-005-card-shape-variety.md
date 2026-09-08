---
id: INFOSCHEMATICS-SITE-005
area: SITE
title: Card shape variety
theme: site-experience
horizon: soon
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Let Cards take a wider range of shapes and proportions than the current default, so authored Infoschematics composing other diagram styles are not implicitly steered toward one landscape aspect.

## Context

A Card's box geometry is already freely resizable — the Studio editor's own minimum is 40×40 (`docs/design/view-studio.md`) — but the Library's seed templates default to a fixed landscape aspect (`packages/view-studio/src/app/editor/library.ts` seeds a "Service card" at 160×80, a 2:1 ratio; another template seeds 240×140). Card presentation itself — corner radius, and the internal layout of tag, title, and description (`docs/design/visual-language.md`'s "consistent shape language") — is tuned around that landscape assumption in both renderers, with no stated contract for how it should read at markedly different proportions (tall, square) or non-rectangular shapes.

## Boundary

This item does not change the default Card's current appearance or the existing 40×40 minimum. It does not commit to non-rectangular (hexagon, pill, etc.) shapes without an explicit design decision — the initial scope may be aspect-ratio variety alone, with true shape variety following if warranted.

## Current state

Both renderers place a Card's internals from constants tuned for a 160×80 box, and the two sets of constants do not agree.

Canvas (`packages/view-canvas/src/InfoschematicDiagram.tsx`) puts a non-compact label at an absolute baseline of `46` for one line and `39` for two, regardless of the box's height: a 200-tall Card draws its title near the top with two-thirds of the box empty beneath it. Static SVG (`packages/render-svg/src/index.ts`) centres the same label on `box.height / 2`, so the two renderers already disagree about every Card that is not 80 tall. Their compact stacks disagree too — left inset `14` against `10`, label at `30`/`39` against `28`/`38` — and nothing catches it, because `scripts/visual-treatment-parity.test.ts` compares semantic flags and Region paths, never Card text positions.

Nothing degrades. The identity chip is `Math.max(42, code.length * 6.5 + 14)` wide, pinned `8` from the right edge in both renderers; on a 40-wide Card it starts off the left edge of its own box and lands on top of the stereotype. A compact stack at 40 tall draws its description below the box's floor in Canvas and clamps it onto the label in SVG.

## Shaping decisions

- **Scope is aspect-ratio variety, not new silhouettes.** The Boundary offers this as the initial scope and it is what the evidence supports: the Card already resizes to any aspect, and what breaks is the internal layout, not the rectangle. A hexagon or pill vocabulary would be a change to the authored appearance contract and to `docs/design/visual-language.md`'s shape language; it earns its own record once there is a diagram style that needs it.
- **One shared card-layout calculation in View Model, consumed by both renderers.** Card internals become a function of the box rather than constants tuned for 160×80, and the duplication that let the two renderers drift apart is removed rather than duplicated once more. This follows the dependency direction the architecture already sets: View Model owns framework-neutral calculation, and both renderers consume it.
- **One baseline convention.** A shared `y` can only mean one thing, so every Card text element is placed by its visual centre and drawn with `dominant-baseline: middle` in both renderers. Canvas's label, stereotype and description gain the declaration; its absolute `46` — a baseline compensating for the missing declaration in an 80-tall box — goes.
- **The default Card's appearance is preserved; the opt-in treatments converge.** A default Card carries a label alone, and a centred label at `height / 2` is exactly what SVG draws today and what Canvas's `46` renders visually in an 80-tall box. The identity chip, stereotype and description are authored opt-ins (`appearance.card.*` all default false), and where the two renderers disagree about those by a few pixels this item makes them agree rather than preserving both.
- **Detail drops rather than overflows.** Each of the identity chip, stereotype and description renders only when its band fits inside the box and clears its neighbour; the label always renders. A Card too small for its metadata is a legible Card with less on it, not a Card with text through its own border.
- **The Library seeds one non-landscape Card**, so the freedom is discoverable from the panel rather than only from a resize handle.
- **Parity is proved on geometry, not flags.** The parity suite gains Cards at landscape, square and tall proportions and compares the placed text positions across the two renderers, which is the check whose absence let them drift.

## Steps

- [ ] Add `packages/view-model/src/card-layout.ts`: a pure, total `resolveCardLayout` from a box, the resolved Card treatment and the authored text to the placement of label lines, stereotype, identity chip and description, with each optional element absent when it does not fit. Export it from `packages/view-model/package.json`.
- [ ] Consume the layout in `packages/render-svg/src/index.ts`, replacing `compactLabelX`, `compactLabelY`, `identityWidth` and the inline `y` expressions.
- [ ] Consume the layout in `packages/view-canvas/src/InfoschematicDiagram.tsx`, removing the height-independent `labelY`, and give the Card text elements the shared baseline convention in `packages/view-canvas/src/styles.css`.
- [ ] Seed one non-landscape Card template in `packages/view-studio/src/app/editor/library.ts`.
- [ ] Cover the layout directly: each element's placement at the reference 160×80, at square and tall proportions, and each element's drop when the box has no room for it.
- [ ] Extend `scripts/visual-treatment-parity.test.ts` to compare Card text geometry across both renderers at several aspects.

## Files touched

- `packages/view-model/src/card-layout.ts`, new, with its tests, and `packages/view-model/package.json` for the export
- `packages/render-svg/src/index.ts` and `packages/view-canvas/src/InfoschematicDiagram.tsx` for the consumption, with `packages/view-canvas/src/styles.css` for the baseline convention
- `packages/view-studio/src/app/editor/library.ts` for the seed template
- `scripts/visual-treatment-parity.test.ts` for the cross-renderer geometry
- `packages/domain-model/` is **not** touched: no authored field is added, and the 40×40 minimum is unchanged

## Verify

Prove that a Card's internals are placed from its own box in both renderers — the same positions for the same box, at landscape, square and tall proportions — that a default Card's label stays where it is drawn today, and that metadata a small box cannot hold is dropped rather than drawn outside it. Run `bun run self:check`.

## Dependencies / blocks

None. True silhouette variety (hexagon, pill) remains unshaped and would be a new record against the appearance contract; this item leaves that door open by changing no authored field.

## Documentation impact

### Specifications

Add a View Model requirement that Card internal layout resolves from the Card's own box and drops what does not fit, and record in the Canvas and static SVG specifications that both consume that one resolution.

### Design

Note in [the visual language](../design/visual-language.md) that the Card's shape language holds across proportions, and how its internals adapt.

### Decision Records

None expected: this moves an existing calculation to the package that already owns framework-neutral view calculation, which is the documented dependency direction rather than a change to it.

## Discussion

### Why not just document the existing resize freedom

Cards can already be resized to any aspect within the 40×40 minimum, but the visual and layout language was designed around one landscape ratio; simply permitting a different box size without adapting internal layout and presentation would produce a Card that merely looks broken rather than one that legitimately supports another diagram style.
