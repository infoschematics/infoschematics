---
id: INFOSCHEMATICS-SITE-011
area: SITE
title: Interactive visual guide
theme: site-experience
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: 0bb213dd11b686f75bcb302d2a6c08160eacc5a0
---

## Goal

Turn the visual guide from a wall of specimens into a guide that introduces one concept at a time, in the product's own vocabulary, with controls underneath each specimen that change its options in place — so a reader can see what turning an option on actually does.

## Context

`apps/site/src/VisualGuide.tsx` renders four sections of static SVG images built from `apps/site/src/visual-guide/specimens.ts`. Each specimen is a fixed `InfoschematicConfig` rendered once through `renderInfoschematicSvg` and shown as an `<img>`. It answers "what values does this option have" and nothing else: the reader cannot combine two options, cannot see an option against their own arrangement, and meets `grid` and `surface` before meeting Region or Card.

The comparison the user drew is MUI's component reference and Storybook: introduce a piece, show it rendered, then expose its options beneath it so they can be tried. That also makes the guide the natural home for the vocabulary — a concept is best defined by naming it, showing it, and letting the reader change it — which is why [the vocabulary reference](../reference/vocabulary.md) becomes design documentation rather than a glossary read separately from the pictures.

## Boundary

This item does not add or change any appearance option, and does not change either renderer's output. It is not an editor: nothing is saved, exported, or persisted across a reload. It does not replace [the authoring guide](../guides/authoring.md) or the vocabulary reference; it renders their content alongside live specimens. Reusable control rendering does not land in Site.

## Current state

The guide is a static gallery, described above. Site already mounts the interactive Canvas — `apps/site/src/InfoschematicsExample.tsx` and `SystemExample.tsx` render authored examples through Studio — so an interactive specimen needs no new dependency, only a place to put the controls. `packages/view-studio/src/app/editor/region-treatments.ts` is the only control-shaping code in the repository, and it is Region-specific and private to Studio's app.

There is no ordering of concepts anywhere: `specimens.ts` groups by option family, not by what a reader needs to know first.

## Shaping decisions

- **A specimen is state, not a picture.** One `InfoschematicConfig` in React state per concept; a control writes a patch into it and the specimen re-renders. That is the whole mechanism, and it is why no renderer change is needed.
- **The interactive specimen renders through Canvas.** It is the surface a reader will actually meet, and it is already mounted in Site. Static SVG parity is not weakened: `scripts/visual-treatment-parity.test.ts` continues to prove the two renderers agree, so what the guide shows is what a static export produces.
- **Controls are derived from the option catalogue, not written.** A `choice` descriptor becomes a select, a `flag` becomes a checkbox, and both read their values from `INFOSCHEMATICS-TOOL-026`'s catalogue. Adding an option therefore adds a control with no guide change.
- **The control component lives in `view-studio`, not Site.** Studio's Details panel is where option editing already lives, Site already depends on Studio, and the alternative — a control surface inside Site — would put reusable capability in a composition root, which the repository forbids. See the Discussion for the alternative considered.
- **The curriculum is data.** An ordered list of concepts, each naming its vocabulary term, its starting specimen, and which catalogue options it exposes. Ordering the guide is then an edit to a list, and coverage becomes testable.
- **Coverage is asserted.** Every option in the catalogue appears in at least one concept, so an option cannot ship undocumented — the failure that put `dots` on the site with no gallery entry.

## Steps

- [ ] Add `packages/view-studio/src/app/controls/option-control.tsx`: render one catalogue descriptor as a select or a checkbox, reporting its new value, with no knowledge of what is being configured.
- [ ] Export the control from `packages/view-studio/src/index.ts` so Site consumes a public surface rather than reaching into `src/app`.
- [ ] Add `apps/site/src/visual-guide/curriculum.ts`: an ordered list of concepts, each with its vocabulary term id, its starting config, the catalogue option keys it exposes, and a short lead-in.
- [ ] Replace the specimen groups in `apps/site/src/visual-guide/specimens.ts` with the starting configs the curriculum needs, keeping the existing generated coverage where it still serves.
- [ ] Add `apps/site/src/visual-guide/ConceptSection.tsx`: holds one concept's config in state, renders it through Canvas, and renders its controls beneath.
- [ ] Rewrite `apps/site/src/VisualGuide.tsx` as the curriculum in order, each concept introduced by its vocabulary term and lead-in.
- [ ] Add a reset affordance per concept, so a reader who has changed several options can return to the introduced state.
- [ ] Add `apps/site/src/visual-guide/curriculum.test.ts`: every catalogue option appears in at least one concept, every cited vocabulary term id exists, and concepts are uniquely keyed.
- [ ] Update `apps/site/src/styles.css` for the control rows, and check the page against a narrow viewport.
- [ ] Link the guide and the vocabulary reference to each other from [the design language guide](../design/visual-language.md) and the `/docs/` index.

## Files touched

- `packages/view-studio/src/app/controls/option-control.tsx` and its test, new
- `packages/view-studio/src/index.ts`
- `apps/site/src/visual-guide/curriculum.ts`, `curriculum.test.ts`, `ConceptSection.tsx`, new
- `apps/site/src/visual-guide/specimens.ts` and its test
- `apps/site/src/VisualGuide.tsx`, `apps/site/src/styles.css`
- `docs/design/visual-language.md`, `apps/site/src/DocsIndex.tsx`

## Verify

`bun run self:check`. The curriculum test proves every catalogue option is reachable and every cited term exists. On a dev server, walk the guide top to bottom: each concept renders, each control changes the specimen it sits under and nothing else, reset returns the introduced state, and the page is usable at a narrow width.

## Dependencies / blocks

No lifecycle blockers are declared. This item consumes the catalogue delivered by `INFOSCHEMATICS-TOOL-026` and is sequenced after it in practice, stated here rather than declared, following the decision recorded on `INFOSCHEMATICS-SITE-008`. It supersedes the static gallery delivered by `INFOSCHEMATICS-SITE-008`, which remains `awaiting-review`; if that review changes the gallery's shape, this item absorbs the change.

## Documentation impact

### Decision Records

None expected, unless the control component's ownership is contested — see the Discussion. If it is, that is an architecture decision and gets its own record rather than a paragraph here.

### Specifications

Add a requirement to [the view studio specification](../specs/view-studio.md) covering the derived option control: it renders a catalogue descriptor and reports a value, and it decides nothing about what the option means.

### Guides

Update [the design language guide](../design/visual-language.md) to point at the interactive guide as its rendered counterpart, and cross-link the vocabulary reference.

### Roadmap

Record implementation and verification evidence in this item before acceptance.

## Discussion

### Where the control component belongs

Three homes were considered. Site is the obvious one and is wrong: the repository requires reusable capability to sit below a composition root, and a derived option control is exactly the thing a second host would want. `view-canvas` is wrong for a different reason — it owns the diagram surface, not the chrome around it, and a select element is not part of an Infoschematic. `view-studio` already owns option editing in its Details panel, is already a Site dependency, and would consume the same component to replace `region-treatments.ts`'s hand-written controls later. If that later consolidation shows the component wants a home of its own, splitting it out is a smaller move than starting with a package nobody has needed yet.

### Why not Storybook itself

Storybook would give the control panel for free, and cost a second build, a second deployment target, and a documentation surface that lives outside the site the reader already has. The guide is a page in the product's own site, rendered by the product's own renderer; that is worth more here than the tooling would save, and the catalogue does the part Storybook's controls addon would have done.
