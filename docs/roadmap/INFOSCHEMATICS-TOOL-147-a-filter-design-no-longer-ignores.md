---
id: INFOSCHEMATICS-TOOL-147
area: TOOL
title: Design ignores filters
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: db6b2d8a1df72c86f461458258b436de13677639
created_at: 2026-10-04T13:30:00Z
updated_at: 2026-10-11T03:10:00Z
---

# Design ignores filters

## Goal

The design-editing specification agrees with the design-session specification and the code about whether the Scope and Flow-family filters narrow the Design Canvas.

## Context

`EDIT-014` in `docs/specs/design-editing.md` requires that "Design MUST start from complete authored content rather than Audience filters", and its `_Verify:_` line says to "apply an Audience filter and confirm the Design preview ignores it". It is marked `conforming`.

`DESIGN-005` in `docs/specs/design-session.md` requires the opposite, and so does the code. Which Scopes and Flow families are drawn is a question about the Diagram, so the bank that answers it is offered on either axis, its state carries across every move, and Design keeps an artefact reachable by showing which Scopes and families are hidden and letting the Producer restore them. Its `_Verify:_` line hides a Scope, enters Design, and expects the Scope bank to read as off. `packages/view-studio/src/app/hooks/use-presentation.ts` explains the change in its own comment: "The Producer's workspaces used to substitute the complete authored content here". Verified on 2026-10-04.

So a reader following `EDIT-014`'s verification would expect a result the product no longer gives and would read the product as failing. The conforming mark is wrong as well as the wording.

## Boundary

Amend `EDIT-014` so its requirement, `_Verify:_` and `_Evidence:_` lines agree with `DESIGN-005`. The likely shape is that Design materialises its draft over the authored content the Producer's own filters leave drawn, and that Scene focus, which is Present's alone, never narrows it. Check `APPEAR`, `PRESENT` and `CHANGE` requirements for the same stale phrase while there.

It does not change behaviour; the code and `DESIGN-005` already agree. If the review finds the code wrong rather than the specification, that is a different item.

## Current state

`EDIT-014` in `docs/specs/design-editing.md` still says Design starts "from complete authored content rather than Audience filters", calls Present's preview "Design's complete-content Overlay preview", and verifies by applying an Audience filter and confirming Design ignores it. Its `_Evidence:_` names `App.tsx` and `InfoschematicDiagram.tsx` but not `use-presentation.ts`, where the visibility the requirement describes is derived. A grep of the `APPEAR`, `PRESENT` and `CHANGE` specifications for the same claim finds one more: `PRESENT-006` says Design and Direct must not use "that filtered Audience projection", and its `_Verify:_` expects their editable content not to be "the Audience projection a filter just narrowed", which a reader takes to mean a Scope hidden in Present is drawn in Design. `appearance.md` and `change-management.md` carry no such claim.

### Decisions

- **Both requirements are amended, not only `EDIT-014`.** `PRESENT-006`'s second paragraph makes the same stale claim the Boundary asks to look for, and leaving it would keep one specification contradicting `DESIGN-005`. Decided under state-of-play Decision 42 (2026-10-11), reversible.
- **No Decision Record.** The change brings two requirements into line with an existing one and the code; it sets no new rule.

## Steps

- [x] Rewrite `EDIT-014`'s requirement so Design materialises its draft over the authored content the Producer's bank leaves drawn, never narrowed by Scene focus, and drop "complete-content" from the Overlay sentence.
- [x] Rewrite `EDIT-014`'s `_Verify:_` opening to hide a Scope, enter Design, and expect the bank to read off, restore the Scope's artefacts as editable, and show no Scene focus.
- [x] Add `packages/view-studio/src/app/hooks/use-presentation.ts` to `EDIT-014`'s `_Evidence:_`.
- [x] Amend `PRESENT-006`'s Design and Direct paragraph and the matching `_Verify:_` sentence to the same shape.
- [x] Record the review packet in this record.

## Files touched

- `docs/specs/design-editing.md`
- `docs/specs/presentation.md`
- This record

Not touched: code, `docs/specs/design-session.md` (already right) and Site content.

## Verify

- `grep -rn -i "ignores it\|complete authored content\|complete-content\|filtered Audience projection" docs/specs` finds only the unrelated `FLOW` line in `flow-signals.md` about an unknown Flow identifier.
- `EDIT-014` and `PRESENT-006` read consistently with `DESIGN-005` and the comment in `use-presentation.ts`.
- `bunx rumdl check` is clean on the touched Markdown through the commit hook; `bun run self:check` passes.

## Dependencies / blocks

None.

## Documentation impact

### Decision Records

None; see `### Decisions`.

### Specifications

`EDIT-014` and `PRESENT-006` as above.

### Guides

None.

### Roadmap

None.

## Review

### Delivered

`EDIT-014` and `PRESENT-006` now agree with `DESIGN-005` and the code: Design materialises its draft over the authored content the Producer's Scope and Flow-family bank leaves drawn, and the presented Scene's focus never narrows a Producer workspace. Within the boundary; no code or behaviour changed. Baseline `db6b2d8a1df72c86f461458258b436de13677639`; delivery `8a6ce1f4` (`docs(specs): align EDIT-014 and PRESENT-006 with DESIGN-005 filters`) and review follow-up `ed881fa2`.

### Change Summary

- `docs/specs/design-editing.md`: `EDIT-014` requirement, Overlay sentence, `_Verify:_` opening and `_Evidence:_` (adds `use-presentation.ts`).
- `docs/specs/presentation.md`: `PRESENT-006`'s Design and Direct paragraph and its `_Verify:_` sentence; the follow-up says the presented Scene's focus narrows neither workspace, since Direct still previews focus on its own draft target.
- This record: shaped in `b513e562`, review packet here.

### Verification

- Residual claims: the grep in `## Verify` finds only the unrelated `flow-signals.md` line.
- `bun run self:check`: exit 0, 52 of 52 tasks successful.
- Markdown: rumdl clean through the commit hook on both specifications.
- Independent read-only review (Claude subagent, 2026-10-11): ACCEPT. It confirmed `reduceProduction` admits only Scope and family toggles while producing and clears focus, `use-presentation.ts` narrows `derived` by Scope and family only, `App.tsx` feeds the visible Scopes and Flows into the Design preview, and every `_Evidence:_` path exists. Its one wording note on `PRESENT-006` is fixed in `ed881fa2`.

### Outstanding concerns

None.

### Post-change review

The goal asked that `EDIT-014` agree with `DESIGN-005` and the code; both stale requirements now do, and a reader following either `_Verify:_` line gets the result the product gives. Regression risk is nil: documentation only.

### Mini recap

Rewrote `EDIT-014` and `PRESENT-006` so Design is described as drawing what the Producer's bank leaves drawn. Learning route: none beyond this record.

## Done

Accepted 2026-10-11 on the review packet above, after the independent review returned ACCEPT and its one wording note was fixed in `ed881fa2`. Closure is authorised by Kris in state-of-play Decision 42 (2026-10-11), which approved doing, closing and pruning this record.

## Discussion

Found on 2026-10-04 by the second drift read under [INFOSCHEMATICS-TOOL-135](INFOSCHEMATICS-TOOL-135-where-a-claim-lives.md), which repaired the same stale claim in `design-view-present.md` and `design-view-studio.md`. Captured rather than repaired there, because that item's Boundary excludes the specification corpus and a specification found to be wrong becomes its own record.
