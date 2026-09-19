---
id: INFOSCHEMATICS-TOOL-097
area: TOOL
title: One place to create
theme: tool
horizon: soon
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-19T13:06:00Z
updated_at: 2026-09-19T13:06:00Z
---

# One place to create

## Goal

Let a Producer find every way of adding something to a Diagram in one place, so creating a Card, an Adapter, a Region, a Graphic or a library artefact is one habit rather than a search across two surfaces.

## Context

Raised by user-acceptance testing on 2026-09-19, second item of the 12:10 recording, verbatim: _"Also I noticed that we've got this here, we've got these create buttons, but we've also got this one which is to add a standard card, so I suspect we can probably do something a little bit better with all the creation tools that we've got here."_

There are two creation surfaces, and they divide by neither kind nor frequency.

`EditorTools.tsx` — the Canvas toolbar — carries `Add a Card` (titled _"Add a standard card"_) and `Add an adapter around the selected card`, beside waypoint tools that are route edits rather than creation.

`ArtefactControls.tsx` — the Design controls in the Details panel — carries a `CREATE` heading over a `Create structural artefact` group holding `Region` and `Graphic`, and below it `LibraryPanel`, which instantiates authored library entries.

So a Card is created from the toolbar, a Region from the panel, and a library Card from a third control below the second. The reporter found the Card button after the Region and Graphic buttons, which is the order that makes the split visible.

## Boundary

This is about where creation is offered and how it is grouped. It does not change what is created — the default geometry, the generated code, the validity rules in `artefact-factories.ts` — or the library's contents and instantiation semantics. It does not change the waypoint tools that share the toolbar, which are edits to an existing Flow rather than creation. It does not introduce placement-by-drawing or a drag-from-palette gesture; that is a larger interaction change and should be raised on its own evidence if it is wanted.

## Shaping

The decision that comes first is which surface wins, and the two are not interchangeable.

**Consolidate into the panel.** `ArtefactControls` already has a `CREATE` heading, a group and the library beneath it, so Card and Adapter move up beside Region and Graphic with no new structure. The cost is that the two most frequent creations move off the Canvas toolbar into a panel that can be collapsed, and the Adapter button is selection-dependent — it wraps the selected Card — which reads more naturally next to the Canvas than in a list.

**Consolidate into the toolbar.** Region and Graphic join the toolbar, and the panel keeps only the library. The cost is toolbar width and the loss of the labelled group: the toolbar is icon-only with titles, so `Region` and `Graphic` become two more glyphs to learn, and the library still has nowhere else to be.

**Keep both, but split on a stated rule.** For example: the toolbar creates what needs the Canvas or a selection, the panel creates what needs naming first. That is defensible but needs the rule written down and applied, or it decays into the split reported here.

Known dependencies: none in build order. The creation operations already run through one path — `createArtefactOperation` via `artefact-factories.ts` and `library.ts` — so this is presentation of existing commands rather than new capability.

Promotion condition: the surface chosen, and a statement of what the Adapter button does when nothing is selected, since it is the one creation that cannot stand alone.

## Discussion

### Why this is shaping rather than a defect

Nothing here is wrong: both surfaces work, both are reachable, and a Producer who knows the tool finds them. The complaint is that the arrangement has to be learnt rather than inferred, which is a design judgement about grouping and belongs in a decision, not a patch.

### What the library complicates

Region, Graphic, Card and Adapter are kinds. A library entry is an authored thing that happens to produce one of those kinds. Putting all four kind buttons next to a list of library entries invites the reading that the list is a fifth kind. Whichever surface wins, the library needs a heading that says what it is, or the consolidation trades one confusion for another.
