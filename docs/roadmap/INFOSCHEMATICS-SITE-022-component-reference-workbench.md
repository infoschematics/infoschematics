---
id: INFOSCHEMATICS-SITE-022
area: SITE
title: Component reference workbench
theme: site-experience
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-14T01:29:44Z
updated_at: 2026-09-14T01:29:44Z
---

# Component reference workbench

## Goal

Turn the Components page into a readable component-library reference: large visual examples, compact editorial controls, copyable authored snippets, and precise separation between supported properties and candidate notation.

## Context

The first Components revision isolates artefact specimens and exposes authored fields, but its complete-example key is squeezed beside the image, each workbench repeats a large reset button, the reference cards consume space without behaving like a reference table, and the page cannot show how a selected control maps to YAML or TypeScript. Supported Adapter Cards and port counts are omitted, while unsupported variants risk being mistaken for existing behaviour.

## Boundary

This item changes only Site-owned teaching, specimens, snippets, and controls. It does not add authored fields, renderer behaviour, Fabric or Graphic registries to static SVG, redefine the presentation concept Theme, or present Decision Cards, stacked Cards, semantic Point roles, arbitrary Canvas colours, Fabric presets, or Flow endpoint markers as supported.

## Current state

The complete example uses a narrow side key. Each component places controls to the right of a specimen and renders property descriptions as permanently expanded cards. Focused specimens retain coordinates from the complete example. Card and Fabric controls omit port counts, the Card section omits the existing Adapter Card, and the Graphic example shows only the static renderer's fallback box.

## Steps

- [ ] Place the complete-example key beneath a full-width diagram and remove numbered side labels.
- [ ] Centre every focused specimen independently on a grid-aligned coordinate and size baseline.
- [ ] Combine each rendering and its compact property controls in one workbench with a small reset action.
- [ ] Rename the Canvas control to Surface and describe inherited neutral output versus the authored blueprint value without conflating presentation Themes with colour styling.
- [ ] Add Card and Fabric port-count controls and introduce Port before the Flow section relies on it.
- [ ] Let the Card specimen switch between supported Standard and Adapter Cards and explain the authored `wraps` relationship.
- [ ] Replace permanently expanded reference cards with a collapsible property table.
- [ ] Add copyable YAML and TypeScript snippets reflecting the current specimen and expose the Graphic host-renderer boundary clearly.
- [ ] Record unsupported Canvas, Fabric, Card, Point, Flow, and data-flow notation as future contract work rather than live controls.
- [ ] Verify responsive layout, control-to-render updates, snippet copying, and current-contract terminology.

## Files touched

- `apps/site/src/VisualGuide.tsx`
- `apps/site/src/VisualGuide.test.tsx`
- `apps/site/src/visual-guide/`
- `apps/site/src/styles.css`

## Verify

Run focused Components tests and `bun run self:check`. Inspect desktop and 390-pixel Components output, exercise every new control, switch Standard and Adapter Card examples, expand property tables, copy both snippet formats, and confirm no horizontal overflow or console errors.

## Dependencies / blocks

None for the current-contract Site work. Candidate capabilities require separate Domain Model, View Model, renderer, and Studio shaping by the non-website workstream before the Site can publish them as supported.

## Documentation impact

### Decision Records

No decision changes; Site continues consuming the existing serialisable-data and renderer-registry boundaries.

### Specifications

No product behaviour changes. Site tests must continue projecting the canonical appearance catalogue and must exercise existing Adapter Card and port contracts accurately.

### Guides

Restructure the Components guide around visual workbenches, snippets, and collapsible API reference. Keep Explanation and presentation material on their own pages.

### Roadmap

Keep future product capabilities outside this Site item and hand them to the non-website workstream for independent shaping.

## Discussion

### Surface defaults and Themes

Omitted appearance currently resolves to the neutral surface and authored appearance can select neutral or blueprint. The canonical Theme concept groups Scenes, so visual-theme inheritance must not be claimed unless a separate contract is designed.

### Renderer-backed Fabrics and Graphics

Fabrics and Graphics name host renderer keys and carry serialisable properties. Canvas can resolve registered React renderers; deterministic static SVG currently emits portable fallback shapes and has no renderer registry. The guide should show this boundary rather than presenting a fallback as the limit of the concept.

### Candidate notation

Arbitrary Canvas colour and opacity, named Fabric presets such as Internet, Decision and stacked Cards, semantic start/end/off-page Points, configurable Flow markers and cardinality, and data-flow notation all require product-level semantics and renderer parity before they become component controls.
