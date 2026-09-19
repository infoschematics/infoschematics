---
id: INFOSCHEMATICS-TOOL-106
area: TOOL
title: No Scope, no Card
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 62292ab43e512e5367423997f9bf3d6df6ee8148
created_at: 2026-09-19T18:00:00Z
updated_at: 2026-09-19T18:05:00Z
---

# No Scope, no Card

## Goal

Pressing Create Card against a document that declares no Scope leaves the app standing.

## Context

Found on 2026-09-19 while building the test for `INFOSCHEMATICS-TOOL-104`. The first fixture declared no Scope, and clicking Create Card threw `TypeError: Cannot read properties of undefined (reading 'id')` from `App.tsx`, taking the tree down mid-render. The fixture was given a Scope to get on with that record, and this one was filed for the defect itself.

## Boundary

This is about the one creation the host owns — the draft Card and its Adapter, which need a Scope to start in and a Scope prefix to take a code from. It does not change what a Scope is, what happens when several are declared, or the Library creations, which are handed their Scope by the panel.

## Current state

`createCard` in `App.tsx` read `infoschematicScopes[0].id` without asking whether there was a first Scope. The control that calls it is always offered: `ArtefactControls` disables the Card button when no `createCard` is supplied, and the app always supplied one.

A document with no Scope is a document Studio will parse and draw, so this was reachable from ordinary use rather than only from a malformed file.

## Steps

- [x] Read the first Scope defensively, and issue nothing without one.
- [x] Withhold the control entirely where the document declares no Scope, so the button is disabled rather than throwing.
- [x] Say why in the button's title, as `EDIT-023` requires of an unmet precondition.
- [x] Cover it in a browser test that presses the disabled control.

## Files touched

- `packages/view-studio/src/app/App.tsx` — `createCard`, the `onCreateCard` prop
- `packages/view-studio/src/app/panels/DetailsPanel.tsx` — `onCreateCard` is optional
- `packages/view-studio/src/app/editor/ArtefactControls.tsx` — the Card button's title
- `packages/view-studio/src/app/App.browser.test.tsx`

## Verify

`bun run self:check`, then open Studio over a document with no `scopes:` section and enter Design: the Card button is disabled and its title says the document declares no Scope. Pressing it does nothing. Every other creation still works.

## Dependencies / blocks

None. Found under `INFOSCHEMATICS-TOOL-104`, unrelated to it in cause.

## Documentation impact

### Decision Records

None.

### Specifications

None added. `EDIT-023` already requires that a creation whose precondition is unmet stays present, disabled, with the precondition stated — this is a second case of that rule rather than a new one, and the Adapter button was the first.

### Guides

None.

### Roadmap

`docs/roadmap/_ISSUES.md` reserves `TOOL` through `106`.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `62292ab43e512e5367423997f9bf3d6df6ee8148`.

### Summary of changes

`createCard` reads `infoschematicScopes[0]?.id` and returns without a Scope or a prefix, so no caller can crash it. The app passes `onCreateCard` only when a Scope is declared, which is what disables the button, and `DetailsPanel`'s prop is now optional to allow that. The Card button's title states the precondition when it is unmet, matching how the Adapter button already behaves.

Both were done rather than one: the guard keeps the function honest for any future caller, and withholding the callback is what the Producer actually sees.

### Verification

`bun run self:check` — green, 48 tasks.

The browser case hosts Studio over a document with no `scopes:` section, enters Design, asserts the Card button is present, disabled, and says why, then presses it and asserts the app is still in Design with the authored Card still drawn. On the unfixed code the button is enabled and the press throws.

### Outstanding concerns

A document with no Scope can be drawn and edited in every other way, so a Producer meeting this has no route from Studio to declaring their first Scope — they must add one in the source. That is a gap in what Studio can author, not a crash, and it is not closed here.

### Post-change review

The Goal is met. The change is small and its reasoning is the same one `EDIT-023` already states, which is why no new rule was written.

Worth saying plainly: the crash was found by a test fixture that happened to be minimal, not by anyone exercising Studio. A fixture that omits an optional section is a cheap source of this class of defect, and this one was worth keeping.

### Mini recap

Create Card read the first declared Scope without checking there was one, so a document with no `scopes:` section crashed the app on click. The control is now withheld and disabled with the precondition stated, and the handler refuses without a Scope.

## Done

Closed 2026-09-19 under the standing instruction to progress every record that is not `waiting-for` or `parked`. Awaiting the reporter's own testing pass.

## Discussion

### Why not create the Scope

Creating the missing Scope on the Producer's behalf would have made the button work everywhere, at the cost of Studio inventing a structural element nobody asked for and naming it. A Scope carries a label and a prefix that every later code depends on, so guessing them is a decision that outlives the click. Disabling states the situation and leaves the choice where it belongs.
