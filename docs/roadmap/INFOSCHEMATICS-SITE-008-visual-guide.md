---
id: INFOSCHEMATICS-SITE-008
area: SITE
title: Appearance options visual guide
theme: site-experience
horizon: now
status: in-progress
blocks: []
blocked_by: [INFOSCHEMATICS-SITE-007]
baseline_ref: 2976e69ab1711bdb2f9cd25aa1b0bc51d04f005b
---

## Goal

Add a gallery of small rendered SVG specimens at `/docs/visual-guide/`, one per appearance option value, so an option like `grid: 'dots'` or `card: { stereotype: true }` is seen rendered rather than only described in prose — in the spirit of a component library's "getting started" visual reference.

## Context

`SurfaceTreatment`, `GridTreatment`, and `RegionLabelPlacement` (`packages/domain-model/src/appearance.ts`) are type-only unions today; nothing in the codebase enumerates their members at runtime. `scripts/visual-treatment-parity.test.ts` hand-writes one dense config to prove Canvas/static-SVG rendering parity — it is not a source of individual option values and does not need reshaping for this item. Without a runtime enumeration, a hand-listed gallery silently goes stale the next time a treatment is added, as happened when `dots` landed under `INFOSCHEMATICS-SITE-003` with nothing forcing a gallery update.

Requested directly by the user, drawing the comparison to `https://mui.com/material-ui/getting-started/`'s visual component reference, and extended to demonstrate `CardDetailDefaults` combinations (label only; label and stereotype; and so on).

## Boundary

This item does not change any renderer's visual output, add new appearance options, or replace `scripts/visual-treatment-parity.test.ts`'s existing parity coverage. It does not enumerate all 16 `CardDetailDefaults` boolean combinations — see Discussion. It depends on `INFOSCHEMATICS-SITE-007` landing first, since it needs `SiteNav` and the `/docs/` folder to exist.

## Current state

`SurfaceTreatment`, `GridTreatment`, and `RegionLabelPlacement` (`packages/domain-model/src/appearance.ts`) are type-only unions with no runtime enumeration anywhere in the codebase. `scripts/visual-treatment-parity.test.ts` renders one dense hand-written config to prove Canvas/static-SVG parity; it does not enumerate individual option values. No page or component renders a per-option specimen today.

## Steps

- [ ] Add `surfaceTreatments`, `gridTreatments`, and `regionLabelPlacements` as exported `readonly [...]` tuples in `packages/domain-model/src/appearance.ts`, each built via a `Record<Union, true>` exhaustiveness trick (a literal object keyed by every union member, then `Object.keys(...)`) so a future treatment added without updating the tuple fails typecheck.
- [ ] Extend `packages/domain-model/src/appearance.test.ts` to assert each tuple's length and content against its union, alongside the existing closed-type assertions.
- [ ] Add `apps/site/src/visual-guide/specimens.ts`: one small `InfoschematicConfig` per specimen (one region, one card, via `defineInfoschematic`), generated from the domain tuples for the surface/grid/region-label groups, and from a curated progressive `CardDetailDefaults` sequence (label only → + stereotype → + identity → + description → all details, compact) for the card-detail group.
- [ ] Add `apps/site/src/visual-guide/specimens.test.ts`: a count check per group against its source tuple/array, plus an assertion that every `CardDetailDefaults` key is `true` in at least one card-detail specimen.
- [ ] Add `apps/site/src/VisualGuide.tsx`: renders `SiteNav` (`section="visual-guide"`), then one section per group (Surface, Grid, Card detail, Region label placement), each a grid of specimen cards showing the rendered SVG (via `renderInfoschematicSvg` from `@infoschematics/render-svg`, the same call `App.tsx` already makes for the homepage preview) captioned with its option value.
- [ ] Add `visualGuidePath = '/docs/visual-guide/'` and `isVisualGuidePath` to `apps/site/src/routes.ts`, and a `Visual guide` entry to `SiteNav`.
- [ ] Wire the route into `apps/site/src/main.tsx`, matching the existing lazy-import-and-set-title pattern.
- [ ] Link the guide from `docs/design/visual-language.md` and the `/docs/` index as the rendered counterpart to that prose document.

## Files touched

- `packages/domain-model/src/appearance.ts`, `packages/domain-model/src/appearance.test.ts`
- `apps/site/src/visual-guide/specimens.ts`, `apps/site/src/visual-guide/specimens.test.ts`, `apps/site/src/VisualGuide.tsx`
- `apps/site/src/routes.ts`, `apps/site/src/main.tsx`, `apps/site/src/SiteNav.tsx`
- `docs/design/visual-language.md`, docs index page added by `INFOSCHEMATICS-SITE-007`

## Verify

`bun run ki:check`. New tests: `appearance.test.ts` tuple/union parity; `specimens.test.ts` group counts and the card-detail flag-coverage check. Manually visit `/docs/visual-guide/` on a dev server and confirm a distinct rendered SVG per specimen and correct captions.

## Dependencies / blocks

Blocked by `INFOSCHEMATICS-SITE-007` (needs `SiteNav` and `/docs/` to exist).

## Documentation impact

### Decision Records

None — additive tuples following the existing enum-then-render pattern established by `INFOSCHEMATICS-SITE-003`, not a new architectural decision.

### Specifications

None — the tuples are a convenience enumeration of an already-specified closed type, not a new contract.

### Guides

None beyond the `docs/design/visual-language.md` cross-link noted above.

### Roadmap

None beyond this item and `INFOSCHEMATICS-SITE-007`.

## Review

_Pending delivery._

## Discussion

### Where the specimen definitions live

Discussed directly with the user, who asked whether specimens should be generated dynamically or checked in, and whether tracking them helps visibility of changes. Resolved as: generate dynamically from checked-in code, not checked-in rendered output. The `InfoschematicConfig` objects and the generator function are ordinary TypeScript — reviewable in diffs like any other change — and because one generator shapes every specimen, they are consistent by construction rather than by convention. Nothing is committed as a rendered SVG or JSON fixture, so there is no output artifact to drift out of format or go stale; only the source tuples and the generator need to stay current, and the domain-model exhaustiveness trick enforces that for the three closed unions.

Specimens live site-local (`apps/site/src/visual-guide/specimens.ts`), not in a new `examples/is-*` package: they illustrate the renderer's option space for this guide rather than being independently reusable authored content, matching the boundary AGENTS.md draws between authored Infoschematic examples and site-owned presentation.

### Proceeding ahead of SITE-007's acceptance

`ki-work-roadmap`'s dependency audit (ITEM-5) correctly flags this item's blocker, `INFOSCHEMATICS-SITE-007`, as not yet `done` (it is `awaiting-review`). Discussed directly with the user, who chose to progress this item anyway so both could be reviewed and accepted together. `SiteNav` and `/docs/` already exist on `main` from SITE-007's delivery commit (`263a42d5`), so the technical dependency is satisfied even though the lifecycle acceptance is not; the risk accepted is that a review of SITE-007 could still request a change to `SiteNav` or the `/docs/` route shape that this item would then need to absorb.

### Why `CardDetailDefaults` is curated, not exhaustive

`CardDetailDefaults` (`compact`, `identity`, `stereotype`, `description`) is four independent booleans, not a closed union — 16 combinations is exhaustive but not illustrative. Per the user's own framing ("what if it's only got a title", "what if it's got a title and a stereotype"), the card-detail group is a curated, progressive sequence instead, each specimen adding one flag to the last. This is presentation judgement, not a domain contract, so it is not enumerated via the exhaustiveness trick like the three closed unions — but the flag-coverage test keeps a newly added flag from going silently unrepresented.
