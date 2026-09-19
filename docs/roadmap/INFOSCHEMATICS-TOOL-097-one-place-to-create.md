---
id: INFOSCHEMATICS-TOOL-097
area: TOOL
title: One place to create
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 3c9c6ef1b45b1e1370877569057746a9d51454a0
created_at: 2026-09-19T13:06:00Z
updated_at: 2026-09-19T13:52:00Z
---

# One place to create

## Goal

Let a Producer find every way of adding something to a Diagram in one place, so creating a Card, an Adapter, a Region, a Graphic or a library artefact is one habit rather than a search across two surfaces.

## Context

Raised by user-acceptance testing on 2026-09-19, second item of the 12:10 recording, verbatim: _"Also I noticed that we've got this here, we've got these create buttons, but we've also got this one which is to add a standard card, so I suspect we can probably do something a little bit better with all the creation tools that we've got here."_

There were two creation surfaces, and they divided by neither kind nor frequency.

`EditorTools.tsx` — the Canvas toolbar — carried `Add a Card` (titled _"Add a standard card"_) and `Add an adapter around the selected card`, beside waypoint tools that are route edits rather than creation.

`ArtefactControls.tsx` — the Design controls in the Details panel — carried a `CREATE` heading over a `Create structural artefact` group holding `Region` and `Graphic`, and below it `LibraryPanel`, which instantiates authored library entries.

So a Card was created from the toolbar, a Region from the panel, and a library Card from a third control below the second. The reporter found the Card button after the Region and Graphic buttons, which is the order that makes the split visible.

## Boundary

This is about where creation is offered and how it is grouped. It does not change what is created — the default geometry, the generated code, the validity rules in `artefact-factories.ts` — or the library's contents and instantiation semantics. It does not change the waypoint tools that share the toolbar, which are edits to an existing Flow rather than creation. It does not introduce placement-by-drawing or a drag-from-palette gesture; that is a larger interaction change and should be raised on its own evidence if it is wanted.

## Current state

`ArtefactControls` renders one `role="group"` labelled `Create an element` under the `CREATE` heading, holding Card, Adapter, Region and Graphic in that order. Card and Adapter call the host's `createCard`, which `App.tsx` supplies because identity and Scope come from the Infoschematic rather than from Studio; Region and Graphic call the local `createArtefact` factories as before. `LibraryPanel` sits beneath with a note saying its entries are starting points that produce one of the kinds above.

`EditorTools` carries no creation control. Its `canWrap` and `onCreateCard` props are gone, and `DetailsPanel` threads `onCreateCard` to `DesignDetails` instead.

## Steps

- [x] Move Card and Adapter creation into the `CREATE` group in `ArtefactControls`, ahead of Region and Graphic.
- [x] Take both buttons, their props and their icons out of `EditorTools`, leaving the selection, layer, align, distribute and waypoint tools it already had.
- [x] Rethread `onCreateCard` from `App.tsx` through `DetailsPanel` to `DesignDetails` and `artefactControlsEditorFor`, and carry `canWrap` on the controls editor.
- [x] Keep the Adapter present and disabled with nothing selected, with its precondition in the title rather than a control that vanishes.
- [x] Name the library as a set of starting points, so four kind buttons above a list does not read as five kinds.
- [x] Record the arrangement as a requirement and prove both halves of it — what the panel offers and what the toolbar no longer does.

## Files touched

- `packages/view-studio/src/app/editor/ArtefactControls.tsx` — Card and Adapter in the one group; `canWrap` and `createCard` on `ArtefactControlsEditor`
- `packages/view-studio/src/app/editor/EditorTools.tsx` — both creation buttons, their props and their icons removed
- `packages/view-studio/src/app/editor/LibraryPanel.tsx`, `packages/view-studio/src/styles.css` — the library note and its rule
- `packages/view-studio/src/app/panels/DetailsPanel.tsx` — `onCreateCard` threaded to `DesignDetails` rather than to `EditorTools`
- `packages/view-studio/src/app/editor/ArtefactControls.test.tsx`, `packages/view-studio/src/app/panels/DetailsPanel.artefacts.test.tsx`
- `docs/specs/design-editing.md` — `EDIT-023`

## Verify

`bun run self:check`, then open the playground in Design: the `CREATE` group holds Card, Adapter, Region and Graphic in that order, the Canvas toolbar holds none of them, and Adapter is disabled until a Card without an Adapter is selected — hovering it then says so.

## Dependencies / blocks

None. Creation already ran through one path — `createArtefactOperation` via `artefact-factories.ts` and `library.ts` — so this moved presentation rather than capability. `INFOSCHEMATICS-TOOL-101` had already removed the snapping toggle from the same toolbar and landed first; the two do not overlap.

## Documentation impact

### Decision Records

None. Where a control lives is a requirement about observable arrangement, and `EDIT-023` records it; there is no durable trade-off here that a reader would need the reasoning for beyond what this record holds.

### Specifications

`EDIT-023` added to `docs/specs/design-editing.md`: creation of every directly creatable kind is offered from a single labelled group, and a creation whose precondition is unmet stays present and disabled with the precondition stated.

### Guides

None. `apps/site/content/studio.md` never named the toolbar as a creation surface — its one sentence about creates is about the change set, not about where a create is started — and `docs/design/view-studio.md` does not name the toolbar at all.

### Roadmap

None raised.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `3c9c6ef1b45b1e1370877569057746a9d51454a0`.

The Shaping left the surface choice and the Adapter's no-selection behaviour for the user. Under the instruction to progress every open item to `done`, both were decided here, and both are flagged for the next testing pass:

**Which surface wins: the panel.** `ArtefactControls` already had the heading, the group and the library beneath it, so the four kinds fit an existing structure rather than needing a new one. The toolbar was rejected because it is icon-only: `Region` and `Graphic` would become two more glyphs to learn, and a creation that needs naming immediately afterwards — which all four do — starts a trip to the panel anyway. The Card button's own title said _"a default card to name in the properties below"_, so the toolbar was already sending the Producer to the panel on every use.

The named cost is real and stands: the two most frequent creations now live in a panel that can be collapsed. If that bites in use, the answer is a keyboard shortcut or a Canvas context menu, not a second button.

**What the Adapter does with nothing selected: stays, disabled, and says why.** An Adapter is drawn around the Card it holds, so it is the one creation with a precondition. Disabling it with the reason in the title keeps the group's shape stable — four buttons, always — and teaches the rule; hiding it would make the group change size and tell the Producer nothing.

### Summary of changes

`ArtefactControlsEditor` gained `canWrap` and an optional `createCard`. The optionality is load-bearing: Card and Adapter need identity and a Scope the Infoschematic supplies, so a host that does not wire `createCard` gets both buttons visible and disabled rather than a differently shaped panel. Region and Graphic have no such dependency and are unconditional, as before.

The group's `aria-label` changed from `Create structural artefact` to `Create an element`, because two of the four are not structural in the sense that label meant.

`EditorTools` lost `canWrap`, `onCreateCard`, the two buttons, one divider and the `SquarePlus` and `SquareStack` imports. `DetailsPanel` stopped passing `onCreateCard` to it and passes it to `DesignDetails` instead, which hands it to `artefactControlsEditorFor`.

`LibraryPanel` gained one line under its heading — _"Starting points that create one of the elements above."_ — which is the Discussion's point made in the product rather than left in the record: four kind buttons directly above an unexplained list invites reading the list as a fifth kind.

### Verification

`bun run self:check` — 48 tasks, all successful.

Five cases, chosen so the two halves of the claim are proven by different means:

`ArtefactControls.test.tsx` extracts the `Create an element` group from the rendered markup and asserts the four `aria-label`s appear in it in order — an assertion about the group's contents, not about the page, so a button elsewhere on the page would not satisfy it. Three more cover the Adapter: disabled with nothing selected and carrying its precondition, enabled with a wrappable Card selected and carrying the plain title, and both Card and Adapter disabled when the host offers no `createCard` while Region stays available.

`DetailsPanel.artefacts.test.tsx` renders the panel and the toolbar side by side from the same editor and asserts the four creations are in the first and the two removed labels are in neither, while the waypoint tool is still on the toolbar — so it is not satisfied by a toolbar that lost everything. It also calls `createCard('adapter')` through `artefactControlsEditorFor` and asserts the host callback is reached, which is the wiring that the render assertions alone would not catch.

Non-vacuity: before the change the group label was `Create structural artefact`, so every case that reads `Create an element` fails, and the toolbar case fails in the opposite direction because both labels were present there.

### Outstanding concerns

None blocking. Three judgements worth stating.

The frequency cost named above is the one to watch in testing: Card is the most-created kind and it now takes a panel that can be collapsed.

The toolbar renders two adjacent `tool-divider` spans in Design when the layer controls are present. That predates this item — the layer block ends with a divider and the Design block opens with one — and was left alone rather than folded into a change about creation. It is cosmetic and worth its own small item if it is visible in use.

`createCard` is optional on `ArtefactControlsEditor` while `createArtefact` is not, so the panel has two creation paths with different contracts. That is honest about the difference — one needs the Infoschematic's identity allocation and one does not — but it means a reader of the type has to know why before the optionality makes sense, and only the comment says so.

### Post-change review

The Goal is met: there is one group, it holds every kind, and the library beneath it says what it is rather than being a fourth thing to work out.

The risk in a move of this shape is a caller left behind, and there was one — `DetailsPanel` still passed `canWrap` and `onCreateCard` to an `EditorTools` that no longer declared them. The typecheck caught it, which is the safety this repository already had; what it would not have caught is the Card button reaching nothing at all, because an optional callback that is never wired type-checks perfectly. That is why the wiring assertion exists alongside the render assertions.

The second risk is that "one place" decays. Nothing structurally prevents a future creation control being added to the toolbar, and `EDIT-023` plus the comment left in `EditorTools.tsx` are the only things pointing the other way.

### Mini recap

Creation was split across two surfaces by no rule anybody could infer — Card and Adapter on the Canvas toolbar, Region and Graphic in the Design panel, the library below that. All four kinds are now in one labelled group in the panel, in the order a Producer reaches for them, with the library named beneath as starting points rather than a fifth kind. The toolbar keeps only what acts on something already drawn. Two questions the record had left for the user were decided here: the panel wins, and the Adapter stays visible and disabled with its precondition stated rather than disappearing.

## Done

Accepted 2026-09-19 by Kris Brown on the review packet above.

## Discussion

### Why this was shaping rather than a defect

Nothing was wrong: both surfaces worked, both were reachable, and a Producer who knew the tool found them. The complaint was that the arrangement had to be learnt rather than inferred, which is a design judgement about grouping and belongs in a decision rather than a patch.

### What the library complicated

Region, Graphic, Card and Adapter are kinds. A library entry is an authored thing that happens to produce one of those kinds. Putting all four kind buttons next to a list of library entries invites the reading that the list is a fifth kind, so the consolidation would have traded one confusion for another without the note. One line was the cheapest thing that could say it; a second heading level would have made the library look like a peer of `CREATE` rather than part of it.

### Why the Adapter is disabled rather than hidden

A control that disappears teaches nothing and changes the group's shape, so the Producer who saw four buttons once sees three and cannot tell whether the fourth was removed, is loading, or depends on something. A disabled control with its precondition in the title answers the question at the moment it is asked. It is the same reasoning that keeps the waypoint tools visible and disabled with no Flow selected, so the two halves of the Design surface now behave alike.
