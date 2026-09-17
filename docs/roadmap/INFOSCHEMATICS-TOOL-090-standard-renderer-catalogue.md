---
id: INFOSCHEMATICS-TOOL-090
area: TOOL
title: The product offers a standard renderer catalogue
theme: rendering
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 8bdd95df60ad61283d78ddc2737ff6c1d06d18c3
created_at: 2026-09-17T16:40:00Z
updated_at: 2026-09-17T20:18:30Z
---

# The product offers a standard renderer catalogue

## Goal

Offer a catalogue of named [Fabric](../reference/vocabulary.md#fabric) and [Overlay](../reference/vocabulary.md#overlay) treatments the product draws itself — nine keys, identical in the interactive Diagram and in `infoschematics render` — so naming a `kind` draws something without host code, while a host registering the same key still wins.

## Context

Before this item the product shipped no named renderer at all. One generic plane (`DefaultFabric`) and one dashed placeholder (`DefaultGraphic`) were the whole supply, and every named `kind` drew a fallback until a host wrote a component. `INFOSCHEMATICS-TOOL-087`'s showcase made that visible: its `message-bus`, `object-store` and `annotation` all drew fallbacks in the document whose purpose is to show what the product can do, and the only real Fabric artwork in existence lived in one exhibit repository as React components baked to that document's absolute coordinates, painted from a host stylesheet.

Copying those components here would have failed on three counts — coordinates from one document, paint from a host's CSS, and a React shape `render-svg` cannot emit — and a catalogue only the interactive view could draw would repeat the defect `TOOL-088` and `-089` already record.

## Boundary

The catalogue's artwork, both renderers' walks of it, the resolution path that reaches it, two requirements, one decision record, the visual guide's treatment comparison, and this record. No change to how a host registers a renderer, and none to the registry contract `ADR-INFOSCHEMATICS-009` states. `TOOL-088` and `TOOL-089` stay recorded and unfixed; `-089` bounds what the standard `annotation` can reach, which the showcase README states rather than works around. No edits to the exhibit repository — renaming its four keys and deleting its renderer directory is its own follow-up there.

## Steps

1. [x] State each piece once in View Model as geometry plus paint roles, with the `defs` it needs declared as named resources.
2. [x] Walk that description into React elements in Canvas, as versioned definitions with a real property validator.
3. [x] Walk it into SVG strings in `render-svg`, resolving paint for the outlet and naming resources per piece.
4. [x] Reach the catalogue only where the host collection answers nothing, and report an unsupported version rather than an unknown key.
5. [x] Compare every key's two drawings piece by piece, and close each rendering's `url(#…)` loop.
6. [x] State `EXTEND-008` and `STATIC-017`, amend `EXTEND-007`, and record `ADR-INFOSCHEMATICS-035`.
7. [x] Show the catalogue: the showcase draws standard treatments, and the visual guide compares every key.

## Files touched

- `packages/view-model/src/standard-artwork.ts` — the nine pieces, their key lists, and the schema version
- `packages/view-model/src/tokens.ts`, `src/tokens.generated.css`, `package.json` — the artwork token group and its export
- `packages/view-model/src/card-layout.ts` — `truncateToWidth` and `wrapToWidth` exported, so a caption fits text the way a Card does
- `packages/view-canvas/src/standard-renderers.tsx`, `src/renderers.tsx`, `src/renderers.test.tsx`, `src/index.ts` — the interactive walk, the fallback path, and the public key lists
- `packages/view-canvas/src/renderer-contract.ts` — the contract's types, moved out of the resolver so the catalogue and the resolution that reaches it do not import each other
- `packages/render-svg/src/index.ts`, `src/index.test.ts` — the static walk
- `scripts/visual-treatment-parity.test.ts` — the nine-key comparison
- `docs/specs/renderer-extensions.md`, `docs/specs/static-rendering.md`, `docs/decisions/ADR-INFOSCHEMATICS-035-*.md`, `docs/decisions/README.md`
- `examples/is-showcase/infoschematic.yaml`, `src/infoschematic.ts`, `README.md` — the showcase's own description of what it draws
- `apps/site/src/VisualGuide.tsx`, `src/visual-guide/{curriculum.ts,specimens.ts,InteractiveSpecimen.tsx}` — a treatment comparison per standard key

## Verify

- `bun run self:check`.
- `scripts/visual-treatment-parity.test.ts` — every key drawn in both renderers and compared.
- By eye, both palettes and both renderers, because a green suite is not evidence it looks right.

## Dependencies / blocks

None. It extends `ADR-INFOSCHEMATICS-009` rather than reversing it, and `INFOSCHEMATICS-TOOL-089` limits the `annotation` graphic's reach without blocking the catalogue.

## Documentation impact

### Specifications

`docs/specs/renderer-extensions.md` gains `EXTEND-008` and amends `EXTEND-007`; `docs/specs/static-rendering.md` gains `STATIC-017`.

### Decision Records

`ADR-INFOSCHEMATICS-035` — the product may offer renderer realisations it does not impose, and renderer artwork is data rather than components so every output can draw it.

### Guides

None beyond the visual guide's own pages, which the Fabric and Graphic components now describe. Site prose about choosing a treatment is a follow-up rather than part of this delivery.

## Discussion

Raised by the owner alongside `TOOL-087`: "can we take the fabrics and graphics from IBC and add them into the list of supported standard graphics?", then "Licensing — sure fine, I'm happy with it. Make the artwork more transferable to both renderers." Generic product keys and nine treatments — six Fabrics plus the showcase's three kinds — were the owner's choices.

## Review packet

### Delivered

Nine standard treatments: `internet-cloud`, `message-bus`, `mobile-network`, `object-store`, `satellite-link` and `telemetry-plane` as Fabrics; `annotation`, `cycle` and `gap-marker` as Graphics. Each is stated once in `packages/view-model/src/standard-artwork.ts` as primitives carrying geometry and a paint role, drawn from its own bounds and nothing else, with patterns and markers declared as named resources. Canvas walks that description into React elements; `render-svg` walks it into SVG strings. A host registration under a standard key still wins, resolving to the catalogue reports no diagnostic, and a standard key at an unstated schema version reports an unsupported version.

### Summary of changes

Artwork is data because it has to reach two outlets that share no element model: `render-svg` emits strings and cannot mount a component, and Canvas inlines no stylesheet a string renderer could read. So the description states geometry and a paint role, and each renderer resolves the role through `visualTokens` — the interactive palette for the dark canvas, the paper palette for output, and the interactive one where a document asks for the blueprint surface. Resources are named locally and emitted under each rendering's own id prefix and the piece's ordinal, so two Fabrics of one kind at different sizes do not share the first one's lattice.

Both renderers mark each drawn piece `data-artwork="<key>"`. That is what makes the comparison possible at all: whole-page counts are dominated by chrome the two renderers do not share, so the parity check isolates the group by depth and compares shape counts, geometry, drawn strings and paint for that piece alone. The catalogue documents ask for the blueprint surface so paint is comparable too, and each rendering's `url(#…)` references are resolved within itself rather than across renderers.

`truncateToWidth` and `wrapToWidth` are now exported from Card layout, so a piece's caption fits its band the same way a Card's label fits its box rather than by a second rule.

The renderer contract's types moved out of `renderers.tsx` into `renderer-contract.ts`. Resolution reaches the catalogue, and the catalogue's definitions are typed by the contract, so with the types declared beside the resolver the two modules each imported the other — a cycle `no-circular` caught. The contract is what both depend on, so it is its own module and neither owns the other.

### Verification

`bun run self:check` — green. `scripts/visual-treatment-parity.test.ts` — 12 tests, including the nine-key comparison; `packages/view-canvas` 88, `packages/view-model` 194, `packages/render-svg` 19, `apps/site` 148, `scripts/specification-evidence.test.ts` 6. `bun run self:tokens:verify` and `self:schema:verify` — the generated projections agree with their manifests. `bun run --cwd examples/is-showcase check` — the document renders through the command line.

Rendered and looked at, all nine pieces in both renderers and both palettes, plus the showcase as a PNG. Six drawing defects were found that way and fixed, every one invisible to the suite: captions struck through by the rail, the trace, the node field and the orbit arc; a constellation that read as a sparkline rather than a mesh; ties that ended in open space instead of at the mark they tie; and stacked translucent caps that drew a dot at every arrowhead of the cycle.

### Outstanding concerns

`INFOSCHEMATICS-TOOL-089` still stops an authored Overlay reaching a static rendering or Present, so the standard `annotation` is drawn in Design and by a Scene that names it, and nowhere else. The catalogue supplies the drawing, not the route it travels.

The catalogue is now a public surface: a key is as stable as any renderer key, and changing what a piece draws changes every document that names it, so an incompatible change needs `EXTEND-002`'s versioning rather than an edit.

### Post-change review

The gap was not subtle — a Fabric is a whole element kind and the product drew none of them — and every gate stayed green for as long as nothing asked whether a named treatment drew anything. The check that closes it is the one that compares the two renderers against each other rather than each against itself.

### Mini recap

Nine treatments, one description, two renderers, and a comparison that fails when they disagree.
