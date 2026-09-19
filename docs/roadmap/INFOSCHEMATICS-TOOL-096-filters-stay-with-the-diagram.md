---
id: INFOSCHEMATICS-TOOL-096
area: TOOL
title: Filters stay with the Diagram
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 70f9474c35a5419b4edef88147ab78a2658bd592
created_at: 2026-09-19T13:06:00Z
updated_at: 2026-09-19T13:06:00Z
---

# Filters stay with the Diagram

## Goal

Keep the Architectural Scope and Flow family banks beside the Diagram in every Production mode, and make them work there. Which scopes and which families are drawn is a question about the Diagram, not about presenting it, so a Producer laying a Diagram out should be able to ask it.

## Context

Found by user-acceptance testing on 2026-09-19, first item of the 12:10 recording, verbatim: _"So you can see on the edit mode that we lose the bottom bar still, I'm not sure we should have lost that really."_

The word _still_ matters: the bar's disappearance had been reported before and had not moved. The bottom bar is `ProducerControls`, the `producer-controls legend` section carrying the Architectural scopes bank, the Flow families bank, and — while presenting — the Dynamics and Sequences banks.

## Boundary

This is about where the visibility banks live and whether they work there. It does not change what a Scope or a Flow family means, the banks' own appearance, the persisted Audience preferences, or the compact `PanelRail`, which stays Present-only under `PRESENT-009`. It does not bring Sequence or Dynamic playback into a Producer mode: running the view through states a Producer is in the middle of authoring is the part that genuinely belongs to Present.

## Current state

`ProducerControls.tsx` opened with `if (presentation.mode !== 'present') return null`, so nothing of the bar was rendered outside Present.

Removing that line alone would have been cosmetic, and the first browser case written against it proved so: a Scope button appeared in Design, its `aria-pressed` stayed `true` when pressed, and the Diagram did not change. Two further mechanisms held the old behaviour in place.

`reduceProduction` in `packages/view-present/src/production.ts` dropped every `presentation` action whose mode was not `present` — `if (state.mode !== 'present') return state` — so the toggle never reached presentation state.

`use-presentation.ts` then substituted complete authored content in a Producer mode, under a comment saying so: `visibleFamilies`, `visibleScopes`, `visibleCards`, `visibleFabrics` and `visibleFlows` were each replaced by the full authored set whenever `production.mode !== 'present'`. Even a toggle that landed would have drawn nothing.

`DESIGN-005` required exactly that substitution, so this is a requirement change and not only a defect fix.

## Steps

- [x] Render the Scope and Flow family banks in every mode, and gate only the Dynamics and Sequences banks on Present.
- [x] Admit visibility actions to the production reducer in any mode, and hold everything that moves through Scenes, Stories and Sequences to Present as before.
- [x] Stop substituting complete authored content for a Producer, so a toggle changes what is drawn wherever it is pressed.
- [x] Prove it in a browser test that presses a Scope button in Design and reads `aria-pressed` back, and that returning to Present makes the Sequences bank appear — so the bank's absence in Design is a decision rather than an empty fixture.
- [x] Rewrite `DESIGN-005`, which required the substitution this removes.

## Files touched

- `packages/view-studio/src/app/panels/ProducerControls.tsx`
- `packages/view-present/src/production.ts` — `changesWhatIsDrawn`
- `packages/view-studio/src/app/hooks/use-presentation.ts`
- `packages/view-studio/src/app/App.browser.test.tsx`
- `packages/view-present/src/production.test.ts`
- `packages/view-studio/src/app/panels/ProductionControls.test.tsx`
- `docs/specs/design-session.md` — `DESIGN-005`

## Verify

`bun run self:check`, then open the playground, enter Design, and press a Scope: the button reads as off and its elements leave the Canvas; press it again and they return. The Sequences and Dynamics banks are absent in Design and present in Present.

## Dependencies / blocks

None. `INFOSCHEMATICS-TOOL-099`, `-100` and `-102` were raised from the same recording and touch routing and pointer handling rather than the panels.

## Documentation impact

### Decision Records

None. `ADR-INFOSCHEMATICS-028` records that panels follow the mode and is untouched: the compact rail is still Present-only, and this changes which banks the full dock carries, which the Specifications corpus states directly.

### Specifications

`DESIGN-005` rewritten in `docs/specs/design-session.md`, from _"Producer modes use complete authored content"_ to _"Producer modes control what they draw"_. It now requires the bank to be offered in every mode with its state carried across a mode change, forbids filtering by a control the mode withholds, and states separately that Scene focus and playback remain Present's own.

### Guides

None. No guide describes the bar's disappearance in Design; the behaviour was stated in `DESIGN-005` and nowhere else.

### Roadmap

None. The remaining six items from this recording are independent.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `70f9474c35a5419b4edef88147ab78a2658bd592`.

### Summary of changes

`ProducerControls.tsx` replaces its early return with `const presenting = presentation.mode === 'present'` and gates the Dynamics and Sequences banks on it. `production.ts` gains `changesWhatIsDrawn`, naming the four visibility actions — `toggle-scope`, `toggle-family`, `show-all-scopes`, `show-all-families` — and the `presentation` case admits those in any mode. `use-presentation.ts` drops the Producer substitution entirely, so visible content comes from `derived` and from presentation state in every mode; the comment records why, and records that Scene focus is not in that path because `derived` narrows by scope and family membership only, and entering a Producer mode clears focus besides.

One unit test changed meaning rather than being repaired. `'removes Present controls in Producer modes'` asserted `markup === ''`; it is now `'keeps visibility banks in Producer mode'` and asserts both bank labels are present. Its old companion assertion — that `'Sequences'` was absent — was dropped rather than kept, because that fixture authors no sequences and the assertion could never have failed. The playback-withheld claim is proved in `App.browser.test.tsx` instead, on a fixture that does author one.

### Verification

`bun run self:check` — green, 48 tasks. `packages/view-present` 46 cases, `packages/view-studio` 120 unit and 24 browser cases, all green.

The Design-mode browser case presses the Scope button and reads `aria-pressed` back as `'false'` then `'true'`, which is the assertion that failed against the cosmetic first attempt and located the other two causes.

### Outstanding concerns

One, non-blocking and out of scope. In the `dockDocument` fixture the Scope declares its membership through `elements: [CARD-A]`, and toggling that Scope off did not remove the Card from the Canvas: `membershipVisible` treats an element with `scopes.length === 0` as always visible, and the Card does not carry the Scope on itself. The browser case therefore asserts the control's state rather than the Card's disappearance. Whether a Scope's `elements` list should hide its members is a separate question about membership resolution, not about where the bank lives, and widening this item to answer it would have changed what `derived` means for Present too.

### Post-change review

The Goal is met: the bank is beside the Diagram in every mode and operating there. The regression risk is that a Producer can now enter Design with an Audience filter applied and see less than the complete authored content — which is precisely what `DESIGN-005` used to forbid. The new `DESIGN-005` accepts that trade deliberately, on the grounds that the control is now visible and operable on the same surface, and its Verify line asks for exactly that case: hide a Scope in Present, enter Design, and confirm the bank shows it as off and restores it.

Acceptance needs the live check in Verify, not only the suite: the browser case proves the control and the state, and the Canvas consequence is what a reader sees.

### Mini recap

The bottom bar vanished in Design because `ProducerControls` returned null outside Present. Restoring it needed two more changes — the production reducer dropped visibility actions outside Present, and the Studio substituted complete authored content for a Producer — so the first fix was cosmetic and a browser test caught it. The bank now holds in every mode; playback banks stay with Present. `DESIGN-005` required the old behaviour and has been rewritten.

## Discussion

### Why playback is the part that stays behind

Scope and family visibility answers "what is on the surface", which is a property of the drawing. A Sequence or a Dynamic moves the view through a composed sequence of states, which is a property of a performance. A Producer part-way through authoring that performance does not want it running underneath the edit, so the line falls between the two rather than at the mode boundary.

### Why the cosmetic fix failed usefully

Deleting the early return made the bank appear, and a screenshot would have accepted it. The browser case read `aria-pressed` back after a press, which is the difference between "the control is on screen" and "the control does something", and it is what surfaced both remaining causes in one run.
