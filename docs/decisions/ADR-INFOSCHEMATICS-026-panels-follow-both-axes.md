---
id: ADR-INFOSCHEMATICS-026
title: Panels follow both axes
date: 2026-09-16
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [PDR-INFOSCHEMATICS-001, ADR-INFOSCHEMATICS-025]
---

# ADR-INFOSCHEMATICS-026: Panels follow both axes

## Context

Studio's panel dock collapses to a forty-eight pixel rail, remembers that choice per document in `localStorage`, and defaults to collapsed. [`PRESENT-009`](../specs/presentation.md) designed that layout for [Present](../reference/vocabulary.md#present): the Infoschematic takes the whole window, and the rail keeps Architectural Scope, Flow Family and Sequence controls reachable so an audience-facing diagram can still be filtered.

[Design](../reference/vocabulary.md#design) and [Direct](../reference/vocabulary.md#direct) inherited the geometry of that layout and none of its content. `PanelRail` returns nothing outside Present, and collapse is a cascade state over a mounted [Details panel](../reference/vocabulary.md#details-panel) rather than a render branch, so a [Producer](../reference/vocabulary.md#producer) entering Design collapsed got an empty column beside a diagram whose properties, tools, interaction-layer controls and change set were all `display: none`. The only way back was the title bar. A dead `.panel-rail .rail-restore` rule in the stylesheet, used by no component, suggests someone once meant to put at least a restore button there.

There are two ways to fix that, and they are not variants of one change.

The rail could gain a Design and Direct branch. Collapsed Design would then be a usable narrow layout, and forcing the dock open would be an override a Producer never asked for. But it means designing a compact control surface for two workspaces, deciding what of a six-kind properties panel, a tools row, six interaction layers, a change set and a target chooser belongs in forty-eight pixels, and widening `PRESENT-009` rather than narrowing it. Scope, Family and Sequence fit a rail because each is a small set of mutually exclusive choices. Nothing a Producer workspace owns is shaped like that.

Or producing opens the dock, and the rail is stated to be what it already is.

A forced open then raises its own question, because the preference is persisted. Writing `panels.collapsed = false` on entering Design means one visit to Design permanently changes what Present looks like for that document — the opposite of the premise the collapsed layout rests on. Not writing it means the dock opens on every entry to Design forever, including for the Producer who has deliberately collapsed it there ten times. Session-scoped memory sits between the two, but it adds a third lifetime for panel state beside the persisted preference and plain component state, and three lifetimes for one panel is something to choose rather than accumulate.

Separately, the tab the dock lands on was already wrong. `sourceOpen` is plain component state that only the tab buttons ever set, and it takes priority over the entered workspace's own panel, so leaving Present with the YAML open and entering Design showed the YAML. The tab strip reads identically either way, which is why no rendered case had ever caught it.

## Decision

Two axes carry the Producer's position, not one. Whether a [Producer](../reference/vocabulary.md#producer) is producing is one question; which workspace — `design` or `direct` — they are in is another. Each clause below depends on one of them, and the panels follow both.

The collapsed rail is a Present affordance. It carries Present's compact filters and gains no Producer branch, and the dead `.panel-rail .rail-restore` rule is removed rather than given a component to style.

Entering a Producer workspace therefore opens the dock. The open is a transient override held beside the persisted preference, not a write to it: `App.tsx` keeps a nullable override, sets it to open whenever either axis moves while the Producer is producing, and drops it to null when the tools go down, where the document's own preference decides again. The preference is never rewritten by a move on either axis, so a visit to Design leaves Present exactly as the Producer left it, and a reload restores the preference and no part of the producing that opened the dock.

Because the override is set on the transition rather than held across the visit, collapsing the dock inside Design stands for the rest of that visit — through re-renders and selection changes — and the panel toggle writes the override rather than the preference while a Producer workspace is current. Entering the other Producer workspace is another entry, and opens the dock again; the dock follows the workspace, and each workspace's tools are different.

A move on either axis also lands on that entered workspace's own panel. `sourceOpen` resets when either axis moves, so entering Design shows Design's tools and entering Direct shows Direct's chooser, whatever was last read.

Two lifetimes, not three: `localStorage` for what a Producer chose for the document, and ordinary component state for what this entry did. Nothing about panel visibility reaches the authored document.

## Consequences

Taking up the tools lands a Producer somewhere they can work, and the empty-rail dead end is gone. What replaces it is stated rather than implied: `PRESENT-009` now scopes the collapsed layout to Present, and [`DESIGN-021`](../specs/design-session.md) owns what a Producer workspace does to the dock on entry.

The cost is the one the alternative would have avoided. A Producer who prefers to work in Design with the dock collapsed reopens it on every entry, because nothing remembers that preference per workspace. That is deliberate, and it is the cheap end of the trade: the dock is one keystroke away, whereas the state this replaces was unreachable except through a control in a different region of the window.

Because collapse is CSS over a mounted panel, every dock control answers `querySelector` while hidden. The rendered suite had been operating the Design interaction-layer controls and the Direct Scene editor with the dock collapsed for its whole run, green over a surface nobody could press. Studio's own stylesheet is now loaded in that suite and reachability is asserted through `offsetParent`, which is the assertion that can tell the difference. Any future case that reads a dock control has the same obligation.

Direct still does not preselect a target when it opens. The chooser lists the document's targets and the Scene editor is there beside it, so the panel is not empty, but `reconcileDirectTargets` is declared and never called. That is the panel's own content rather than the dock's visibility, and it is left where it is.
