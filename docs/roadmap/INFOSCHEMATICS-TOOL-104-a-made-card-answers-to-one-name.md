---
id: INFOSCHEMATICS-TOOL-104
area: TOOL
title: A made Card answers to one name
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 62292ab43e512e5367423997f9bf3d6df6ee8148
created_at: 2026-09-19T17:50:00Z
updated_at: 2026-09-19T18:05:00Z
---

# A made Card answers to one name

## Goal

A Card added from the Library drags exactly like an authored one.

## Context

Found by user-acceptance testing on 2026-09-19: a Card added from the Library could be selected — it took the selection outline — and then would not move, resize, or show its properties. An authored Card beside it did all three.

## Boundary

This is about the identity a creation issues. It does not change what the Library offers, where a template is placed, or what a drag does; it does not touch draft creation through `editor.createCard`, which never issued a second name.

## Current state

`createLibraryIdentityAllocator` issued two identities per element: a code, `CRD-002`, and an id of its own, `card-2`. Both were carried into the create operation, and the element was then drawn under its code, because past the authored document a coded element is known by its code — `infoschematicModelOf` reads an established `id` as an alias and publishes the code in its place (`packages/domain-core/src/model.ts`).

So the drawn Card said `CRD-002` while the operation that made it said `card-2`, and everything that matches what is drawn against the operation that made it — `createdArtefactDetailsFor`, the extension move, the resize properties — missed. Selection is drawn from the Canvas's own hit test and needs no such match, which is why selecting worked and nothing else did.

## Steps

- [x] Issue one identity, the code, from the Library allocator.
- [x] Keep the collision check against both authored sets, since an authored `id` may equal a code.
- [x] Prove it by dragging a Library-added Card in a browser test and reading where it rests.
- [x] State the rule as `EDIT-024`.

## Files touched

- `packages/view-studio/src/app/editor/library.ts` — `createLibraryIdentityAllocator`
- `packages/view-studio/src/app/editor/library.test.ts`
- `packages/view-studio/src/app/App.browser.test.tsx`
- `docs/specs/design-editing.md` — `EDIT-024`

## Verify

`bun run self:check`, then in Studio's Design mode add a Card from the Library and drag it: it follows the pointer and rests where it is dropped, and the properties below read the Card that was made.

## Dependencies / blocks

None. `INFOSCHEMATICS-TOOL-105` was found while proving this one and is fixed alongside it; nothing written reached the document until both were right.

## Documentation impact

### Decision Records

None. One element having one name is not a choice between alternatives.

### Specifications

`EDIT-024` added to `docs/specs/design-editing.md`: a created coded element carries a single identity and that identity is its code.

### Guides

None. No guide describes how Studio issues identities.

### Roadmap

`docs/roadmap/_ISSUES.md` reserves `TOOL` through `106`.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `62292ab43e512e5367423997f9bf3d6df6ee8148`.

### Summary of changes

The allocator now builds one string and uses it for both `code` and `id`. The loop that skips already-taken names still checks both authored sets, so a document whose authored `id` happens to read like a code still pushes the sequence on.

The browser case hosts Studio over a document, enters Design, adds a Card from the Library, presses it, moves through four positions, and asserts it follows the hand; then lifts and asserts it rests where it was dropped, and that the written record names it and leaves it there. On the unfixed allocator the Card does not move at all.

### Verification

`bun run self:check` — green, 48 tasks.

### Outstanding concerns

An authored document whose `id` and `code` genuinely differ still works, because the model publishes the code either way. What this change forecloses is Studio itself minting the divergence.

### Post-change review

The Goal is met. The risk is concentrated in one function, and the collision check is what keeps it from issuing a name the document already uses.

Worth saying plainly: the bug looked like a drag bug and was an identity bug. Selection was the only thing in the path that does not ask which operation made the element, and the appearance of "it selects, so it exists" is what made it read as a broken drag.

### Mini recap

A Card added from the Library was issued a code and a separate id, was drawn under its code, and so could not be matched to the operation that made it — selectable, immovable, unreadable. The Library now issues one identity, the code, and `EDIT-024` states the rule.

## Done

Closed 2026-09-19 under the standing instruction to progress every record that is not `waiting-for` or `parked`. Awaiting the reporter's own testing pass.

## Discussion

### Why not teach the lookups about both names

Every lookup could have been taught to try the code and then the id. That is one more rule to remember at each of them, and it would still leave the element drawn under a name its operation did not use — so the properties panel, the change record and the written document would each have had to choose which name to show. One identity removes the question rather than answering it repeatedly.
