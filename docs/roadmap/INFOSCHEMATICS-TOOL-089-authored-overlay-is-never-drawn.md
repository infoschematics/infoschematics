---
id: INFOSCHEMATICS-TOOL-089
area: TOOL
title: An authored Overlay is never drawn outside Design mode
theme: rendering
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: b8325a18298dfc8967da31de7c22cc22a58d53d7
created_at: 2026-09-17T10:55:00Z
updated_at: 2026-09-18T12:40:00Z
---

# An authored Overlay is never drawn outside Design mode

## Goal

Give an authored [Overlay](../reference/vocabulary.md#overlay) some way to reach a picture, so a document that carries one is not carrying a declaration nothing can draw.

## Context

Found by hand while authoring `examples/is-showcase/` for `INFOSCHEMATICS-TOOL-087`, the first authored document in the repository to carry an Overlay.

`diagram.overlays` is authorable — `packages/domain-core/src/schema.ts:541` — and reaches the runtime. Neither outlet draws it:

- The static renderer defaults `visibility.graphics` to `'scene'` (`packages/render-svg/src/index.ts:457`) and resolves the visible set from the active [Scene](../reference/vocabulary.md#scene)'s `graphic` (`:279`). An authored Scene cannot name one: `sceneShape` in `packages/domain-core/src/schema.ts:469` has no `graphic` key and is a `strictObject`, so `SequenceScene.graphic` (`packages/domain-model/src/sequence.ts:17`) is reachable only by a host constructing a model in code. `'all'` would draw it, and `packages/cli/src/index.ts:104` calls `renderInfoschematicSvg(result.model)` with no options and the CLI has no visibility flag — so `infoschematics render` can never emit an authored Overlay.
- The interactive Canvas draws `config.diagram.overlays` only while editing: `packages/view-canvas/src/InfoschematicDiagram.tsx:663` is `editing ? config.diagram.overlays : graphic ? [graphic] : []`, and [Present](../reference/vocabulary.md#present) supplies `derived.activeSequenceScene?.graphic` (`packages/view-present/src/Present.tsx:158`), which an authored Scene cannot set. So an authored Overlay appears in Studio's Design mode and nowhere an audience looks.

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
2. [x] Draw `config.diagram.overlays` in Canvas outside Design as well as inside it, unioned with the Scene's Graphic when one is active and deduplicated, so a Scene adding a Graphic never removes an authored one.
3. [x] Default `visibility.graphics` to drawing authored Overlays in `render-svg`, keeping `'scene'` available for a caller that wants the scene-scoped set and `'none'` unchanged.
4. [x] Confirm Present needs no change beyond what Canvas now draws, and that a Scene's own Graphic still arrives.
5. [x] Prove it from an authored document rather than a hand-built model: `infoschematics render` on the showcase emits `OVL-01`, and its Story in Present shows it.
6. [x] Hold both renderers to it in `scripts/visual-treatment-parity.test.ts`, which already compares the standard `annotation` the showcase's Overlay names.
7. [x] Repoint the requirement that owns Overlay visibility, and state the new default where an author reads it.

## Files touched

- `packages/view-canvas/src/InfoschematicDiagram.tsx` — the `editing ?` gate replaced by the deduplicated union of `config.diagram.overlays` and the Scene's Graphic
- `packages/render-svg/src/index.ts` — `graphicVisibility` defaults to `'all'`, and the `SvgVisibilityOptions.graphics` comment says what `scene` now narrows
- `packages/render-svg/src/index.test.ts` — the default-draws case, and the assertion that encoded the old default removed from the Scope/Scene case
- `packages/view-canvas/src/InfoschematicDiagram.preview.test.tsx` — the Present-Graphic case now expects the authored Overlays beside it, with the pending removal still marked `going`
- `packages/view-present/src/Present.test.tsx` — an authored Overlay reaches an audience with Present unchanged
- `scripts/visual-treatment-parity.test.ts` — both renderers handed the document alone, plus the dedupe assertion
- `docs/specs/static-rendering.md` — `STATIC-019`
- `docs/specs/diagram-elements.md` — `DIAGRAM-011`
- `docs/decisions/ADR-INFOSCHEMATICS-037-an-authored-overlay-is-drawn-wherever-the-diagram-is.md` and `docs/decisions/README.md` — entry 42
- `examples/is-showcase/README.md` — the limitation paragraph replaced by what the document now shows
- `apps/site/content/authoring.md` — what an author can expect a `graphics` entry to do

`packages/view-present/src/Present.tsx` is unchanged, as step 4 required: it still supplies the active Sequence Scene's Graphic, and the authored declaration arrives because the Diagram draws it. Neither `packages/domain-core/src/schema.ts` nor the command-line options are touched.

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

## Review

### Delivered

An authored Overlay is drawn wherever the Diagram is drawn. Canvas unions `config.diagram.overlays` with the Scene's Graphic, deduplicated by id, in every mode; `renderInfoschematicSvg` defaults `visibility.graphics` to `'all'`, keeping `'scene'` and `'none'` for a caller that asks. `OVL-01` in the showcase now appears in `infoschematics render` output and in Present, drawn with the standard `annotation` treatment `INFOSCHEMATICS-TOOL-090` delivered.

### Summary of changes

Two implementation edits, both one line of behaviour: the `editing ?` gate in `InfoschematicDiagram.tsx` became a memoised union, and the static default flipped from `'scene'` to `'all'`. Everything else is evidence and contract. Three suites gained a case — the static default and its two narrowings, an authored Overlay reaching an audience through an unchanged Present, and the parity case now handed nothing but the document. Two requirements state the rule (`STATIC-019`, `DIAGRAM-011`), `ADR-INFOSCHEMATICS-037` records the reversal and why no document depended on the old default, and the showcase README and the authoring guide stop telling an author that Design mode is the only place an Overlay appears.

Two existing assertions encoded the old behaviour and were changed rather than worked around: `index.test.ts` asserted that a default render contains no `data-renderer=` at all, and the preview case asserted that an authored Overlay is absent outside Design. Both are now the opposite, and the second one documents that a pending removal stays a review state — `graphic-a` keeps its `going` treatment rather than vanishing before the host applies the change.

### Verification

| Gate | Outcome |
| --- | --- |
| `bunx vitest run --root .` | 16 files, 95 tests passed |
| `bunx turbo run test typecheck` over render-svg, view-canvas, view-present, view-studio, cli | 13 successful |
| `bunx rumdl check` over the six touched Markdown documents | no issues |
| `bun run self:examples:render examples/is-showcase/infoschematic.yaml --png` | rendered, and the Overlay looked at in an enlarged crop |

Non-vacuity was proved by reverting each half in turn: restoring `editing ? config.diagram.overlays : []` fails the parity case, and so does restoring the `'scene'` default. `grep -c OVL-01 reports/infoschematic.svg` returns `1`, from a command that passes no options at all.

### Outstanding concerns

`sceneShape` still has no `graphic` key, so `SequenceScene.graphic` remains reachable only by a host constructing a model in code. This record does not close that — it makes it irrelevant to whether an authored Overlay is drawn, rather than the reason it is not. Whether an authored Scene should be able to name a Graphic at all is a separate question and no requirement now depends on the answer.

`unfocused` still governs what a Scene's focus does to an Overlay outside it, and `DIAGRAM-011` says focus must dim or hide rather than remove. That is asserted in the static renderer and read in Canvas rather than asserted there.

### Post-change review

The visual check is the one that matters here, and the crop shows the `annotation` panel drawn as intended: dashed quiet-tone frame, bold title, body line, at the authored box. A green suite would have been satisfied by a panel drawn at the wrong size or in the wrong paint, which is what the enlargement was for.

One consequence is worth a reviewer's eye rather than a test: a document that authors a decorative Overlay now carries it into every outlet, including a still rendering. That is the intended reading of an authored declaration and it is stated in `ADR-INFOSCHEMATICS-037`, but it is a behaviour change visible to anyone who had an Overlay they only expected to see while editing. No document in the repository is in that position.

### Mini recap

The declaration was authorable, validated, counted by the coverage check, and in no picture, because the only route to a drawn Graphic was a Scene field no authored document can set. The fix is a default reversal in one renderer and a union in the other; the work was proving it from an authored document rather than a hand-built model, and holding both outlets to it.

## Done

Accepted 2026-09-18 by Kris Brown on the review packet above.

## Discussion

Shaped on 2026-09-18 against `b8325a18`, with the owner choosing the diagram-scoped default. The argument that settled it: the other two shapes each leave a document that carries an Overlay unable to show it somewhere an audience looks, and an authored element that only one mode draws is the same defect this record was opened for.

Anticipated while planning `TOOL-087`, which said that if the CLI turned out to have no way to render an unscened Graphic it would be recorded as a gap rather than fixed. It did.
