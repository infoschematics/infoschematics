---
id: INFOSCHEMATICS-TOOL-066
area: TOOL
title: Panels follow the mode
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T14:05:00Z
updated_at: 2026-09-15T15:00:00Z
---

# Panels follow the mode

## Goal

Make switching into Design or Direct open the docked panels those modes work in, so a mode switch lands a Producer somewhere they can work rather than on a collapsed rail.

## Context

The Studio panel dock collapses to a rail and remembers that choice per document. Present needs nothing from the dock — the Infoschematic is the whole surface — so collapsing it there is the right default and is what a Producer will have left it on. Design and Direct are the opposite: the properties for the element in hand, the tools row, and the Scene being composed all live in the dock, so entering either while collapsed hides the half of the mode that does the work and gives no hint that a rail has to be expanded first.

Raised directly: "we could do with the docked sidebar populating for the design and direct mode, so switching modes maybe should force the expanded view."

## Boundary

This item changes when the dock is open and what it shows on entering a mode. It does not change the panels' content, the mode set, what any mode can do, or the persisted collapse preference as a preference.

## Current state

- `packages/view-studio/src/app/App.tsx` holds `collapsed` in `usePersistentState` keyed `<storage>.panels.collapsed`, defaulting to collapsed, and renders `PanelRail` in place of the dock while it is true.
- `packages/view-studio/src/app/panels/TitleBar.tsx` switches mode through `presentation.setMode(mode)` over `['present', 'design', 'direct']`, with no side effect on the dock.
- `packages/view-studio/src/app/hooks/use-presentation.ts` reduces the mode in `@infoschematics/view-present`; the mode and the collapse state are independent and nothing relates them.

## Steps

- [ ] Decide whether entering Design or Direct opens the dock permanently or only for the visit, and whether leaving for Present restores what the Producer had — a forced open that overwrites the Present preference is the trap to avoid.
- [ ] Open the dock on entry to Design and Direct, keyed on the transition rather than held open continuously, so a Producer who collapses it while in the mode is not overridden.
- [ ] Decide which tab the dock lands on per mode, so the panel is populated with the mode's own work rather than whatever was last open.
- [ ] Cover each transition in the rendered browser matrix, including the persisted preference surviving a reload.
- [ ] Render the three modes and look at each, since the fault being fixed is one a green suite did not show.

## Files touched

- `packages/view-studio/src/app/App.tsx`
- `packages/view-studio/src/app/panels/` where the tab choice lives
- `packages/view-studio/src/app/App.browser.test.tsx`
- `docs/specs/design-session.md` if the mode contract gains the dock behaviour

## Verify

Run `bun run self:check`. In a browser fixture, collapse the dock in Present, switch to Design and confirm it opens on the mode's own tab, collapse it again within Design and confirm it stays collapsed, return to Present and confirm the preference is whatever was decided in the first step.

## Dependencies / blocks

None.

## Documentation impact

### Decision Records

Unlikely. If the persisted preference becomes per-mode rather than per-document, that is worth recording.

### Specifications

State the dock behaviour on mode entry wherever the Design session specification covers entering the mode.

### Guides

Producer guidance mentions the dock opening with the mode, once it does.

### Roadmap

None.

## Discussion

### Forced or remembered

A mode that forces a layout every time is as annoying as one that hides its own tools. Shaping should decide between opening on the transition only, remembering a preference per mode, and opening only when the dock has never been touched for the document.
