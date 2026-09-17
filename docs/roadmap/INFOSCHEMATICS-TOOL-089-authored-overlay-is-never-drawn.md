---
id: INFOSCHEMATICS-TOOL-089
area: TOOL
title: An authored Overlay is never drawn outside Design mode
theme: rendering
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-17T10:55:00Z
updated_at: 2026-09-17T10:55:00Z
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

There are at least three candidate shapes and they are not equivalent, which is why this is triage rather than a fix: let an authored Scene name a `graphic` (smallest contract change, keeps the scene-scoped default meaningful); give the CLI a visibility flag (host-facing, does nothing for Present); or make an authored Overlay diagram-scoped and always drawn, with Scene-named Overlays as the exception (largest change, and it reverses the current default).

## Boundary

Whichever shape is chosen, `packages/domain-core` is involved if a Scene gains a key, `packages/cli` if a flag appears, and both renderers if the default changes — visual treatment parity is a root check. This does not change what an Overlay is or how a host-supplied Graphic renderer is resolved.

## Steps

1. [ ] Choose between the three shapes above; the choice is a public contract decision, not treatment.
2. [ ] Implement it in whichever of `domain-core`, `cli`, `render-svg` and `view-canvas` it touches, and keep the two renderers in step.
3. [ ] Prove it from an authored document rather than a hand-built model — the showcase already carries `OVL-01`.
4. [ ] Repoint the requirement that owns Overlay visibility, which today describes a resolution no authored document can reach.

## Files touched

- `packages/domain-core/src/schema.ts` — `sceneShape`, if a Scene may name a Graphic
- `packages/cli/src/index.ts`, `packages/cli/src/options.ts` — if visibility becomes a flag
- `packages/render-svg/src/index.ts` — the `'scene'` default and its resolution
- `packages/view-canvas/src/InfoschematicDiagram.tsx` — the `editing ?` gate on `diagram.overlays`
- `packages/view-present/src/Present.tsx` — what Present passes down

## Verify

Render `examples/is-showcase/infoschematic.yaml` through `infoschematics render` and see `OVL-01`; play its Story in Present and see it there; `bun run self:scripts:test` for parity and the schema projection.

## Dependencies / blocks

None. Independent of `INFOSCHEMATICS-TOOL-088`.

## Documentation impact

### Specifications

The requirement governing Graphic visibility has to change: as written it is satisfied by a resolution path no authored document can enter, which is the same defect shape as a check that measures nothing.

### Decision Records

Likely. Any of the three shapes changes what a document can say or what a default means, and the reversal option changes an established default.

### Guides

`apps/site/content/authoring.md` needs it either way — an author can currently write an Overlay with no way to learn that only Design mode draws it.

## Discussion

Anticipated while planning `TOOL-087`, which said that if the CLI turned out to have no way to render an unscened Graphic it would be recorded as a gap rather than fixed. It did.
