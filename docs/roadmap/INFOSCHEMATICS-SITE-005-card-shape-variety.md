---
id: INFOSCHEMATICS-SITE-005
area: SITE
title: Card shape variety
theme: site-experience
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 532dab29f967edc0af0bd3142d7a1e9f2e62cf61
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

- [x] Add `packages/view-model/src/card-layout.ts`: a pure, total `resolveCardLayout` from a box, the resolved Card treatment and the authored text to the placement of label lines, stereotype, identity chip and description, with each optional element absent when it does not fit. Export it from `packages/view-model/package.json`.
- [x] Consume the layout in `packages/render-svg/src/index.ts`, replacing `compactLabelX`, `compactLabelY`, `identityWidth` and the inline `y` expressions.
- [x] Consume the layout in `packages/view-canvas/src/InfoschematicDiagram.tsx`, removing the height-independent `labelY`, and give the Card text elements the shared baseline convention in `packages/view-canvas/src/styles.css`.
- [x] Seed one non-landscape Card template in `packages/view-studio/src/app/editor/library.ts`.
- [x] Cover the layout directly: each element's placement at the reference 160×80, at square and tall proportions, and each element's drop when the box has no room for it.
- [x] Extend `scripts/visual-treatment-parity.test.ts` to compare Card text geometry across both renderers at several aspects.

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

### Decision Records

None expected: this moves an existing calculation to the package that already owns framework-neutral view calculation, which is the documented dependency direction rather than a change to it.

### Specifications

Add a View Model requirement that Card internal layout resolves from the Card's own box and drops what does not fit, and record in the Canvas and static SVG specifications that both consume that one resolution.

### Guides

Note in [the visual language](../design/visual-language.md) that the Card's shape language holds across proportions, and how its internals adapt.

### Roadmap

Record implementation and verification evidence in this item before acceptance.

## Review

### Delivered

A Card's internals are now placed from that Card's own box, by one calculation both renderers consume. A square, tall or minimum-sized Card reads as a deliberate shape: its label centres on the height it actually has, and the metadata it has no room for is withheld rather than drawn through its own border. The Canvas and the static SVG place the same Card in the same position at every proportion, which they did not before.

The default Card's appearance is unchanged, the 40×40 minimum is untouched, no authored field was added, and the Card remains a rectangle: silhouette variety stays unshaped and open.

### Summary of changes

- `packages/view-model/src/card-layout.ts` — new. `resolveCardLayout` maps a box, the resolved treatment and the authored text to the placement of the label, description, stereotype and identity chip. It is pure and total: the label is always placed, and each optional element returns `null` when its band does not fit or when the identity chip would sit on the stereotype. Widths come from a fixed advance per character, because static output has no text metric and both renderers must estimate alike.
- `packages/render-svg/src/index.ts` — consumes the layout in place of `compactLabelX`, `compactLabelY`, `identityWidth` and the inline `y` expressions, and draws the stereotype and description with a middle dominant baseline so one shared number means one thing.
- `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/view-canvas/src/styles.css` — the same, losing the height-independent `labelY` whose `46` only ever suited an 80-tall Card, and gaining the shared baseline convention on the label, stereotype and description.
- `packages/view-studio/src/app/editor/library.ts` — a "Square card" seed at 120×120 with ports on all four sides, so the proportion freedom is reachable from the Library rather than only from a resize handle.
- `scripts/visual-treatment-parity.test.ts` — compares placed Card geometry, not only treatment flags.
- Documentation — VIEW-025, CANVAS-010 and SVG-012 in the specifications, and a paragraph in [the visual language](../design/visual-language.md) on how the shape language holds across proportions.

### Verification

- `bun run self:check` exit 0: 58 test files, 390 tests, every TypeScript workspace clean, dependency-cruiser clean at 211 modules and 491 dependencies, production site build in 8.37s.
- `packages/view-model/src/card-layout.test.ts` — new, 9 tests: the compact stack at the reference 160×80, the legacy centring at 80 and 240 tall, a wrapped label centred as one block, the lift that makes room for a description, a square Card carrying everything, a short Card that drops its band and keeps its label, a narrow Card that drops the chip it cannot hold and the one it would sit on, treatment and authoring withholding each element, and a box too small even for the bare stack.
- `scripts/visual-treatment-parity.test.ts` — a fourth fixture places landscape, square, tall and 40×40 Cards and asserts that the Canvas and the static SVG produce identical Card text geometry, then pins that geometry to expected values.
- The existing Canvas and static-SVG treatment suites pass unchanged, which is the evidence that no treatment flag, accessible label or `data-` attribute moved.
- `bunx @biomejs/biome check` — clean on the six touched sources; `bunx rumdl check` clean on the four documents.

### Outstanding concerns

- **The two renderers converge, so opt-in treatments move by a few pixels.** A compact Card's left inset was 14 on the Canvas and 10 in static output; the stereotype sat at two different heights in the two renderers, and now sits on the identity chip's centre line in both. The default Card — label only, centred — is unchanged, but an authored Infoschematic using compact Cards with metadata will render very slightly differently from the version committed before this change.
- **Fit is decided from an estimated text width.** There is no server-side text metric, so a stereotype's width is `characters × 5.8` and a code chip's is `max(42, characters × 6.5 + 14)`. A font substitution or an unusually wide glyph set could make an element that is drawn overlap slightly, or make one that would fit be withheld. The estimate is at least the same estimate in both renderers.
- **Nothing yet warns an author that a Card is too small for what it carries.** The Studio drops the metadata silently at the geometry the editor itself permits; a producer sees the chip disappear as they resize, without being told why.
- **The Canvas still wraps labels and static SVG still does not.** The layout accepts a line count from each renderer and centres the block correctly for either, so the two agree for the single-line case that both produce, but a long label is one line in a file and two on screen. That predates this item and is untouched by it.

### Post-change review

The scope decision the record left open resolved itself once the code was read. Nothing about the _rectangle_ was broken; what was broken was that both renderers placed Card text from constants tuned for a 160×80 box, and had drifted apart while doing so. Canvas drew a non-compact label at an absolute baseline regardless of the box's height, so a 240-tall Card put its title near the top; static SVG centred the same label. Aspect-ratio variety was therefore not a feature to add so much as an assumption to remove, and silhouette variety would have been a second change layered on an unsound base.

The parity suite's blind spot is the more general finding. It compared semantic flags and Region path geometry, and passed happily while the two renderers placed every Card's title in different places. A cross-renderer suite that does not compare positions cannot notice a position drifting; the new fixture closes that for Cards, and the same question is worth asking of every other artefact it covers.

One judgement is worth flagging for review rather than burying: where the renderers disagreed, this change makes them agree instead of preserving both. The alternative — a per-renderer inset knob — would have kept every existing pixel and reintroduced exactly the divergence the item set out to remove.

### Mini recap

INFOSCHEMATICS-SITE-005 gives Cards their shape freedom by removing the landscape assumption from both renderers rather than by adding a shape vocabulary. `resolveCardLayout` in View Model places a Card's label, description, stereotype and identity chip from that Card's own box; both renderers consume it, share one baseline convention, and withhold what a small box cannot hold. The Library seeds a square Card so the freedom is discoverable.

Verification is `bun run self:check` at exit 0 with 390 tests, of which 10 are new: 9 over the layout itself and a cross-renderer fixture that compares Card geometry at landscape, square, tall and 40×40 proportions — a comparison the parity suite could not previously make. VIEW-025, CANVAS-010 and SVG-012 record the requirement.

Four concerns are open: opt-in treatments shift by a few pixels as the renderers converge, fit is decided from an estimated text width, nothing tells an author why metadata vanished as they resized, and the Canvas still wraps labels where static output does not. True silhouette variety remains unshaped, and this change adds no authored field that would constrain it.

## Done

Accepted 2026-09-08 by Kris Brown on review of the packet above.

## Discussion

### Why not just document the existing resize freedom

Cards can already be resized to any aspect within the 40×40 minimum, but the visual and layout language was designed around one landscape ratio; simply permitting a different box size without adapting internal layout and presentation would produce a Card that merely looks broken rather than one that legitimately supports another diagram style.
