---
id: INFOSCHEMATICS-TOOL-089
area: TOOL
title: An authored Overlay is never drawn outside Design mode
theme: rendering
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: b8325a18298dfc8967da31de7c22cc22a58d53d7
created_at: 2026-09-17T10:55:00Z
updated_at: 2026-09-18T02:40:00Z
---

# An authored Overlay is never drawn outside Design mode

## Goal

Give an authored [Overlay](../reference/vocabulary.md#overlay) some way to reach a picture, so a document that carries one is not carrying a declaration nothing can draw.

## Context

Found by hand while authoring `examples/is-showcase/` for `INFOSCHEMATICS-TOOL-087`, the first authored document in the repository to carry an Overlay.

`diagram.overlays` is authorable — `packages/domain-core/src/schema.ts:541` — and reaches the runtime. Neither outlet draws it:

- The static renderer defaults `visibility.graphics` to `'scene'` (`packages/render-svg/src/index.ts:282`) and resolves the visible set from the active [Scene](../reference/vocabulary.md#scene)'s `graphic` (`:104`). An authored Scene cannot name one: `sceneShape` in `packages/domain-core/src/schema.ts:469` has no `graphic` key and is a `strictObject`, so `SequenceScene.graphic` (`packages/domain-model/src/sequence.ts:17`) is reachable only by a host constructing a model in code. `'all'` would draw it, and `packages/cli/src/index.ts:104` calls `renderInfoschematicSvg(result.model)` with no options and the CLI has no visibility flag — so `infoschematics render` can never emit an authored Overlay.
- The interactive Canvas draws `config.diagram.overlays` only while editing: `packages/view-canvas/src/InfoschematicDiagram.tsx:667` is `editing ? config.diagram.overlays : graphic ? [graphic] : []`, and [Present](../reference/vocabulary.md#present) supplies `derived.activeSequenceScene?.graphic` (`packages/view-present/src/Present.tsx:158`), which an authored Scene cannot set. So an authored Overlay appears in Studio's Design mode and nowhere an audience looks.

`OVL-01` in the showcase is therefore in the document, in the coverage check, and in no picture.

Three candidate shapes were put to the owner and the third was chosen: **an authored Overlay is diagram-scoped and always drawn, with a Scene-named Graphic remaining the scene-scoped exception.** A Scene key alone would have left an unscened document's Overlay undrawn, and a command-line flag would have done nothing for Present. Reversing the `'scene'` default breaks no authored document, because no authored document can reach that default today; a host that passes a Scene's Graphic keeps the behaviour it has.

## Current state

Read against `b8325a18` on 2026-09-18. Every claim holds; `INFOSCHEMATICS-TOOL-090` moved two line numbers, restated here.

- `render-svg` defaults `graphicVisibility` to `'scene'` at `packages/render-svg/src/index.ts:457`, resolves a Scene's visible set from `scene.graphic` at `:279`, filters the drawn Overlays at `:512-517`, and draws them at `:1201`. So the drawing exists and the visible set is always empty for an authored document.
- `sceneShape` at `packages/domain-core/src/schema.ts:469` is still a `strictObject` with no `graphic` key, and `packages/cli/src/index.ts:104` still calls `renderInfoschematicSvg(result.model)` with no options at all.
- Canvas still gates on editing: `packages/view-canvas/src/InfoschematicDiagram.tsx:663` is `editing ? config.diagram.overlays : graphic ? [graphic] : []`. Present still supplies `derived.activeSequenceScene?.graphic` at `packages/view-present/src/Present.tsx:158`.
- `INFOSCHEMATICS-TOOL-090` has since made this gap more visible rather than less: the product now offers a standard `annotation` treatment the catalogue draws in both renderers, and the showcase's `OVL-01` names it, so what is undrawn is now a treatment the product supplies.

## Boundary

Whichever shape is chosen, `packages/domain-core` is involved if a Scene gains a key, `packages/cli` if a flag appears, and both renderers if the default changes — visual treatment parity is a root check. This does not change what an Overlay is or how a host-supplied Graphic renderer is resolved.

## Steps

1. [x] Choose between the three shapes. **Diagram-scoped and always drawn**, with a Scene-named Graphic kept as the scene-scoped exception.
2. [ ] Draw `config.diagram.overlays` in Canvas outside Design as well as inside it, unioned with the Scene's Graphic when one is active and deduplicated, so a Scene adding a Graphic never removes an authored one.
3. [ ] Default `visibility.graphics` to drawing authored Overlays in `render-svg`, keeping `'scene'` available for a caller that wants the scene-scoped set and `'none'` unchanged.
4. [ ] Confirm Present needs no change beyond what Canvas now draws, and that a Scene's own Graphic still arrives.
5. [ ] Prove it from an authored document rather than a hand-built model: `infoschematics render` on the showcase emits `OVL-01`, and its Story in Present shows it.
6. [ ] Hold both renderers to it in `scripts/visual-treatment-parity.test.ts`, which already compares the standard `annotation` the showcase's Overlay names.
7. [ ] Repoint the requirement that owns Overlay visibility, and state the new default where an author reads it.

## Files touched

- `packages/render-svg/src/index.ts:457` — the `'scene'` default and its resolution
- `packages/view-canvas/src/InfoschematicDiagram.tsx:663` — the `editing ?` gate on `diagram.overlays`
- `packages/view-present/src/Present.tsx:158` — what Present passes down, confirmed rather than changed
- `scripts/visual-treatment-parity.test.ts` — both renderers held to the authored Overlay
- `examples/is-showcase/README.md` — the paragraph that records this limitation, which `INFOSCHEMATICS-TOOL-090` left in place

Neither `packages/domain-core/src/schema.ts` nor the command-line options are touched: the chosen shape needs no new authored key and no new flag.

## Verify

Render `examples/is-showcase/infoschematic.yaml` through `infoschematics render` and see `OVL-01`; play its Story in Present and see it there; `bun run self:scripts:test` for parity and the schema projection.

## Dependencies / blocks

None. Independent of `INFOSCHEMATICS-TOOL-088`.

## Documentation impact

### Specifications

`STATIC-001` describes Scene visibility and its evidence covers the Scene selection; nothing requires an authored Overlay to be drawn at all, which is why a resolution no authored document can enter counted as conforming. `docs/specs/static-rendering.md` and `docs/specs/diagram-elements.md` gain the rule that an authored Overlay is drawn wherever the Diagram is drawn, and that a Scene's Graphic adds to that set rather than replacing it.

### Decision Records

One. The chosen shape reverses an established default: an authored Overlay is diagram-scoped and drawn everywhere, and Scene scoping becomes the exception. The reasoning — that the old default was unreachable from any authored document, so no document depended on it — belongs where a future reader meets the default.

### Guides

`apps/site/content/authoring.md` needs it either way — an author can currently write an Overlay with no way to learn that only Design mode draws it.

## Discussion

Shaped on 2026-09-18 against `b8325a18`, with the owner choosing the diagram-scoped default. The argument that settled it: the other two shapes each leave a document that carries an Overlay unable to show it somewhere an audience looks, and an authored element that only one mode draws is the same defect this record was opened for.

Anticipated while planning `TOOL-087`, which said that if the CLI turned out to have no way to render an unscened Graphic it would be recorded as a gap rather than fixed. It did.
