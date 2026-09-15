---
id: INFOSCHEMATICS-TOOL-058
area: TOOL
title: Scoped renderer definition identity
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T07:05:00Z
updated_at: 2026-09-15T07:05:00Z
---

# Scoped renderer definition identity

## Goal

Make each rendered Infoschematic resolve its own SVG definitions, so two Infoschematics sharing one document cannot borrow each other's arrowheads or grid patterns.

## Context

Found while completing [Inline browser verification](INFOSCHEMATICS-TOOL-051-inline-browser-verification.md). Two inline Canvases mounted in one host document emit `defs` children with fixed, document-global identifiers: one `marker` per Flow family as `infoschematic-arrow-<family>`, and four grid patterns as `infoschematic-grid-minor`, `-major`, `-major-plus-minor`, and `-dots`. Every instance emits the same identifiers, and every Flow references its arrowhead as `url(#infoschematic-arrow-<family>)`.

SVG resolves such a reference to the first matching element in document order. A browser fixture mounting a purple `request` family above a red one confirmed the consequence directly: both documents emit their own correct `marker`, and both render with the first one. Authored appearance is correct, definitions are correct, and output is still wrong.

Grid patterns carry the same defect with a wider blast radius, because grid size and treatment are authored per Diagram: a second Diagram declaring a different `gridSize` paints the first Diagram's grid.

Interaction, accessible naming, and authored artefact identity are unaffected — those are attributes and per-instance state, and `DESIGN-017` now covers them with a passing browser suite. This item is only about renderer-internal identifiers.

## Boundary

This item does not change authored appearance, the artefact identity contract in `STATIC-010`, or any interaction behaviour. A host may supply a prefix as the static renderer already allows, but it must never have to: an unconfigured host that mounts two Canvases is correct by default, because a contract that requires hosts to name their instances would be a worse outcome than the bug.

## Current state

`packages/view-canvas/src/InfoschematicDiagram.tsx` hard-codes the identifiers in its `defs` block and in the `markerEnd`, `markerStart`, and `fill` references that consume them. `packages/view-canvas/src/styles.css` also names `url(#infoschematic-grid-major-plus-minor)` in a rule, so a scoping change has to keep that rule working or move the declaration inline.

The static renderer already solved this. `STATIC-015` requires a deterministic host-owned resource prefix, and `packages/render-svg/src/index.ts` applies `resourceIdPrefix` to every marker and pattern identifier and reference. Canvas has no equivalent, which is the whole gap: the same product renders the same document safely through one renderer and unsafely through the other.

Unit tests assert the literal Canvas identifiers in `packages/view-canvas/src/tokens.test.tsx` and `packages/view-canvas/src/InfoschematicDiagram.treatments.test.tsx`.

## Steps

- [ ] Give Canvas the `STATIC-015` mechanism: an optional host-supplied resource prefix, defaulting to a per-mount value from `useId` so an unconfigured host is correct by default.
- [ ] Confirm the static renderer needs no change beyond documenting that the two renderers now share one scoping contract.
- [ ] Apply the chosen scoping to every `defs` child and every reference to one, including the stylesheet rule.
- [ ] Extend the host-fixture browser suite so a second instance with a differently coloured Flow family renders its own arrowhead, and a differently sized grid paints its own pattern.
- [ ] Update the requirements that record the identifiers, and clear the known exception recorded against `DESIGN-017`.

## Files touched

- `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/view-canvas/src/styles.css`
- `packages/view-canvas/src/InfoschematicDiagram.host.browser.test.tsx`, `tokens.test.tsx`, and `InfoschematicDiagram.treatments.test.tsx`
- `packages/render-svg/src/` only if the shared contract needs restating
- `docs/specs/design-session.md` and `docs/specs/static-rendering.md`

## Verify

Run `bun run test:browser` and `bun run self:check`. The extended host fixture must fail when scoping is removed. Render two Infoschematics with different family colours and different grid sizes into one page and look at the result, because this is a defect a passing suite did not notice.

## Dependencies / blocks

None. `DESIGN-017` records the exception this item removes.

## Documentation impact

### Decision Records

None expected. `STATIC-015` already settled the mechanism; this item applies it to the renderer that lacks it.

### Specifications

Add the Canvas counterpart of `STATIC-015`, amend any requirement naming the fixed Canvas identifiers, and clear the exception on `DESIGN-017`.

### Guides

Host-integration guidance needs a line only if hosts gain a responsibility, which the boundary above says they should not.

### Roadmap

None.
