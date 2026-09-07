---
id: INFOSCHEMATICS-TOOL-019
area: TOOL
title: Declutter design mode and repair panel chrome
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Make Design mode readable — affordances on demand instead of everything at once, overlay Graphics behind the working diagram — and give the Studio's unstyled panel sections their chrome, fixing the Direct-mode Storyboard overlap and clipping.

## Context

User review of the 5G-EMERGE IBC dashboard found present mode healthy but the studio side broken in three ways, each reproduced with headless screenshots against the linked dev server:

1. **Design mode shows everything at once** — every flow-ID chip, every port dot on every card, and every overlay Graphic (large swept arrows, question-mark circles) render simultaneously, graphics fully opaque on top of the diagram.
2. **Parts of the right panel are unstyled** — Library items render as native white buttons with list bullets and title+description run together; the Create/Selection sections are raw browser widgets. `library-panel`, `artefact-controls` and `scene-list-panel` have zero rules in `packages/view-studio/src/styles.css`.
3. **The Direct-mode Storyboard tab overlaps and clips** — `.editor-tab` declares `grid-template-rows: auto minmax(0,1fr)` for two children, but direct mode inserts a third (the target select), pushing `SplitPane` into an implicit auto row: the hint text paints over the select and the form is chopped by the CHANGES pane instead of scrolling.

## Shaping

### A. Design-mode declutter (`packages/view-canvas`)

`src/InfoschematicDiagram.tsx` + `src/styles.css`:

- **Graphics behind the diagram in design mode.** The graphics map (~lines 1926–1995, last SVG child) becomes a two-pass split: when `editing`, render the same group after the edit-grid / before fabrics (~line 1396→1397); non-editing keeps today's topmost position so present mode is unchanged. Add a CSS dim — `.infoschematic-svg.editing .infoschematic-graphic` at `--infoschematic-canvas-focus-dimmed-opacity` with the focus-transition vars (idiom at styles.css:272–283) — restored to full opacity on `.selected` and `:hover` (hover works; `.graphic-frame` is `pointer-events: all`). Selection, resize handles and Alt+Arrow reorder unchanged.
- **Port dots on demand.** The flatMap at ~line 1822 emits every port unconditionally. Gate per placeable: show a placeable's ports when it is hovered (`hovered === placeable.code` or `hovered` is one of its `port:` keys — the hover plumbing already exists, cards emit `card.code` at ~1706), when the selected artefact is that placeable or one of its ports, or when a flow-end/new-flow drag is in progress (all ports must show as drop targets — gate on the drag state around `dragAttachment`/`dragNewFlow`, ~lines 773–911). Exception: `in-use` ports (~line 1825) stay visible always — they are the anchors the diagram is read by. Port hit-areas, labels and CSS unchanged (labels are already hover-gated, styles.css:621–634).
- **Flow chips dimmed, not hidden.** Keep all chips rendered (they are the drag handles for label placement) but add `.infoschematic-svg.editing .audit-flow.editable:not(.selected):not(.pointed) { opacity: ~0.4 }` with the same focus transition. Mirrors the `.highlighting` dim at styles.css:278–283.
- Update `InfoschematicDiagram.editing`/`treatments` tests that assert unconditional port presence to the gated contract (hover/select in the test, then assert).

### B. Panel chrome (`packages/view-studio`)

- **`LibraryPanel.tsx`** (all markup unclassed): heading → `<p className="eyebrow pane-heading">`; `ul` → `library-list` with the `.scene-list` reset idiom; buttons → `library-item` styled on the `.scene-row` pattern (styles.css:3061–3116) with label `span` and muted description `small` as stacked blocks.
- **`ArtefactControls.tsx`**: bare `h3` headings ("Create", "Selection") → `.eyebrow pane-heading`; Region/Graphic and Earlier/Later/Remove buttons → the `.action-button` idiom (styles.css:1514–1555); the property `fieldset`/`textarea` restyled on the `.scene-fields` pattern; empty state → `.contract-empty`; alerts get a class and rule.
- **`SceneLibraryPanel.tsx`** root `scene-list-panel` (zero rules): a `.story-panel`-style grid-gap rule.
- **Storyboard grid fix** (`panels/DetailsPanel.tsx` ~686–727): wrap the direct-mode target select + `EditorTools` in one header `div` so `.editor-tab` always has exactly two children; `SplitPane` then gets the bounded track and `.editor-panes`/`.change-panel` scroll as designed (styles.css:1137–1140).
- **Label wrap**: "Storyboard title" / "Callout title" overflow the 54px `.text-row` label column — shorten to "Title" / "Callout" in `SceneListPanel.tsx` rather than widening the column.
- New CSS appended in `src/styles.css` **before** the trailing `@import` at line 3330, matching the file's literal-hex idiom (no new custom properties).

## Verification

- `bun run ki:packages:build`, then `bunx vitest run` (never `bun test`); the renderer parity test must stay green (render-svg output untouched by editing-only changes).
- Downstream visual check from the IBC dashboard host: design mode (graphics dimmed and behind, ports appearing on hover, chips dimmed), the Design tab panel (Library/Create/Selection styled), and the Direct-mode Storyboard tab (no overlap, panes scroll).

## Boundary

No serialisable record changes, no present-mode rendering changes, no new treatment vocabulary. IBC-specific composition stays in the dashboard repository.
