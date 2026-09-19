---
id: INFOSCHEMATICS-SITE-029
area: SITE
title: Specimen chrome crowds the property grid
theme: site
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: fed0588b2a4bab1a7491c5377b605108553315ac
created_at: 2026-09-19T11:30:00Z
updated_at: 2026-09-19T13:40:00Z
---

# Specimen chrome crowds the property grid

## Goal

Put every control that acts on a component specimen's snippet in the snippet's own toolbar, report a copy without reserving a line for it, and show the property reference as a table a reader can read without opening anything.

## Context

Found by user-acceptance testing on 2026-09-19, reviewing the docs component pages (Canvas, Regions, Fabrics) against a running Site. The docs read well overall; these are three snags against that, reported together because they are one piece of work on the specimen frame.

Reset and expand sit at the right-hand end of the property grid, where a reader meets them as two more properties rather than as actions on the specimen. They belong beside the copy control, which is already the toolbar for the snippet the expand control expands.

The copy result is a permanently reserved strip under the code block. A line of page furniture that is empty until a reader copies something, and says one word afterwards, is not worth its space: a transient notice beside the button that produced it says the same thing where the reader is already looking.

The property reference is a `details` disclosure introduced by "Open the reference for the portable fields represented by this component", carrying a group count on its summary. The table it hides is short and is the reference the section is named for. Nothing is served by the fold.

## Boundary

This changes where the specimen's own controls sit and how a copy is reported. It does not change what the controls do, the snippet's content or formats, the Rendered and Design modes, the property controls themselves, or any element treatment inside the preview — specimen treatment is `INFOSCHEMATICS-SITE-030`. It does not restyle the docs page beyond the rules these moves require.

## Current state

`DemoFrame` renders the property controls and a `demo-frame__actions` group holding reset and expand in one `demo-frame__controls` row, then mounts `SpecimenSnippet` beneath it. `SpecimenSnippet` owns a `specimen-snippet__toolbar` header carrying the format tabs and the copy button, and ends with a `specimen-snippet__feedback` element that is `aria-live="polite"` and holds the copy result until the format changes. `VisualGuide` wraps the property table in `details.visual-guide__property-reference`.

The expand control already acts on the snippet across the component boundary: `DemoFrame` holds `expanded` and passes it down as a prop.

## Steps

- [x] Move reset and expand into the snippet toolbar, keeping `DemoFrame` the owner of both actions and passing them to `SpecimenSnippet`.
- [x] Replace the reserved feedback strip with a transient notice anchored beside the copy button, retaining a polite live region so the result is still announced.
- [x] Unfold the property reference into a plain table, dropping the disclosure, its group count and the sentence that told a reader to open it.
- [x] Carry the stylesheet across: rules for the toolbar's new occupants and the notice, and removal of the rules the disclosure and the strip leave behind.
- [x] Extend the Site cases to assert each of the three, including that the copy result is still announced politely rather than only drawn.

## Files touched

- `apps/site/src/visual-guide/DemoFrame.tsx`, `apps/site/src/visual-guide/SpecimenSnippet.tsx`
- `apps/site/src/visual-guide/DemoFrame.css`, `apps/site/src/styles.css`
- `apps/site/src/VisualGuide.tsx`
- `apps/site/src/visual-guide/DemoFrame.test.tsx`, `apps/site/src/visual-guide/DemoFrame.browser.test.tsx`, `apps/site/src/VisualGuide.test.tsx`

## Verify

`bun run self:check`, and read a component page in a browser: the property grid holds only properties, reset and expand sit with copy, copying shows a notice that clears itself, and the property table is visible without interaction.

## Dependencies / blocks

None. `INFOSCHEMATICS-SITE-030` touches the same pages but not these elements; the two can land in either order.

## Documentation impact

### Decision Records

None. Where a specimen's own controls sit is a presentation choice inside one Site component, with no durable consequence to record.

### Specifications

None. No behaviour-level contract changes: the specification corpus governs the product's notation and views, and this moves Site-owned docs chrome that no requirement names.

### Guides

None. The guidance text changes only by deletion — the sentence instructing a reader to open the reference goes with the disclosure it described.

### Roadmap

None beyond this record. The treatment snags reported in the same session are `INFOSCHEMATICS-SITE-030`, already filed.

## Review

### Delivered

Every Step. Reset and expand now sit in the snippet toolbar beside copy, the copy result is a transient notice anchored to the button that raised it, and the property reference is a plain table with no disclosure around it.

### Summary of changes

`Icon` moved to `apps/site/src/visual-guide/Icon.tsx` so the frame and the snippet toolbar share one set of glyphs without importing each other in a circle. `DemoFrame` keeps ownership of both actions and passes them to `SpecimenSnippet` as `onReset` and `onToggleExpand`, which renders them only when given; its `demo-frame__actions` group is gone and `demo-frame__controls` now holds properties alone. `SpecimenSnippet` replaces the reserved feedback strip with a `specimen-snippet__notice` live region in the toolbar, clearing a success after 2.4s and leaving a failure up. `VisualGuide` unfolds the table and drops the sentence that told a reader to open it. Stylesheets follow, including removal of the disclosure's summary rules and the strip's reserved height.

### Verification

`bun run self:check` — 48 of 48 tasks successful. Site node suite 153 cases, site browser suite 10 cases across 7 files, both green.

### Outstanding concerns

The notice reports its own emptiness through `data-empty` rather than relying on CSS `:empty`, because React's empty-string child produced a text node that defeated it — worth knowing before anyone reaches for `:empty` on a live region here again. The rule that hides the empty notice lives in `DemoFrame.css` rather than `styles.css`, matching how the snippet's other overrides already travel with the component; the browser suite mounts `DemoFrame` without the page chrome, so a rule placed in `styles.css` is not loaded there and silently does nothing.

### Post-change review

The copy notice was exercised through a stubbed clipboard rather than the runner's own, because the headless browser's clipboard availability decides which path the real button takes. Both paths are now asserted deliberately: the success notice clears itself, the failure instruction stays.

### Mini recap

Three snags from one acceptance session, landed as one pass over the specimen frame. Nothing about what the controls do changed — only where they are and how long a notice lives.

## Done

Accepted 2026-09-19 by Kris Brown on the review packet above.

## Discussion

### Why the three travel together

Each is small, each touches the specimen frame, and two of them move controls between the same two components. Splitting them would mean three passes over `DemoFrame` and `SpecimenSnippet` and three rounds of stylesheet reconciliation for one visible outcome. The owner asked for them as a single set of changes.

### Keeping the copy result announced

The reserved strip is going, but it is a live region, and the copy result is the only confirmation a screen-reader user gets that the clipboard write succeeded — or, on the failure path, the instruction to select the snippet manually. The notice that replaces it has to stay a polite live region, and the failure message has to stay legible rather than being reduced to an icon flash. That is the one part of this item where the obvious visual simplification would cost something real.

### What the stylesheet split taught

`DemoFrame.css` already carried `specimen-snippet__source` overrides, which looked like duplication until the notice rule was placed in `styles.css` and the browser case failed on a rule that was never loaded. The component's own stylesheet is the only one guaranteed to travel with the component into a mount that has no page around it, which is what the browser suite is.
