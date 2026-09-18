---
id: INFOSCHEMATICS-TOOL-086
area: TOOL
title: An announcement with no sentence when filtering hid everything
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: b8325a18298dfc8967da31de7c22cc22a58d53d7
created_at: 2026-09-17T09:42:00Z
updated_at: 2026-09-18T04:45:00Z
---

# An announcement with no sentence when filtering hid everything

## Goal

Keep the polite live region silent when visibility filtering removed every element an accepted occurrence would have been drawn on, so a screen-reader user is not told that something happened and denied what.

## Context

Found by hand while delivering `INFOSCHEMATICS-TOOL-057`, and recorded there and as `COMPOSE-004` in `docs/specs/composition.md`.

On the site Playground in Present, with the `PACKAGE` Flow family switched off, rehearsing the Dynamic that signals a packaged segment draws no signal — correctly, because the Flow is not in the drawn set — and the live region reads `Signal update 1.` with nothing after it. Switching the family back on and rehearsing again reads the Flow's code and both endpoint labels, so the sentence composition itself is fine.

`DiagramAnnouncements` in `packages/view-canvas/src/announcements.tsx` composes the sentence from the Flows the Diagram drew, then prefixes the revision counter before that filter has had any say. The prefix is therefore unconditional: it is emitted whether or not a sentence follows it. The treatment obeys the filter and the announcement does not.

## Boundary

This does not change which elements a filter hides, and does not change the announcement's wording when something was drawn. It does not remove the revision counter, which is what makes two identical consecutive announcements distinguishable.

## Current state

Read against `b8325a18` on 2026-09-18. The defect is exactly where the record says, and it is two defects of one shape rather than one.

- `packages/view-canvas/src/announcements.tsx:57` emits `Signal update {revision}.` whenever a signal announcement exists, and the sentence that should follow is composed after it from `signals.signals` filtered against the Flows the Diagram drew. An empty drawn set leaves the prefix alone in the live region.
- `:72` has the same shape for element emphasis: `Dynamic update {revision}.` is emitted before the Dynamic labels are resolved, so a Dynamic whose every target was filtered out announces a revision and nothing else. The record's step 2 anticipated this; it is present.
- The sentence composition itself is sound, and neither the revision counter nor the filter is in question.

## Steps

1. [x] Compose the sentence first and emit the revision prefix only when there is a sentence, so an empty drawn set yields an empty live region.
2. [x] Fix the emphasis path at `:72` the same way, which the reading above confirms has the same defect.
3. [x] Add the case `COMPOSE-004` names, both halves: filtered and silent, unfiltered and announced once. Prove it by restoring the unconditional prefix.
4. [x] Move `COMPOSE-004` to `conforming` and repoint its evidence at the case.

## Files touched

- `packages/view-canvas/src/announcements.tsx` — each sentence composed before its revision counter, both halves, and a `drawnElements` prop
- `packages/view-canvas/src/drawn-elements.ts` — new: `drawnElementIds`, the one derivation of what a rendering drew
- `packages/view-canvas/src/Canvas.tsx` — derives its emphasis set through it and passes the same set to the surface
- `packages/view-canvas/src/index.ts` — exports the derivation, because the other host needs it too
- `packages/view-studio/src/app/App.tsx` — supplies its own drawn set, which is where the emphasis half of the defect actually lived
- `packages/view-canvas/src/announcements.test.tsx` — new: the four cases, composed against the surface itself
- `docs/specs/composition.md` — `COMPOSE-004` conforming, evidence repointed
- `docs/specs/diagram-dynamics.md` — `DYNAMIC-006` gains the conditional-announcement rule, with its verification and evidence

## Verify

`bun run test --filter=@infoschematics/view-present`, `bun run test --filter=@infoschematics/view-canvas`, and by hand on the Playground: switch off `PACKAGE`, rehearse, and read the live region.

## Dependencies / blocks

None.

## Documentation impact

### Specifications

`docs/specs/composition.md` changes `COMPOSE-004`'s conformance state. `DYNAMIC-006` gains a sentence saying an announcement is conditional on something having been drawn, so the rule holds for any future announcement path rather than for the two that exist.

### Decision Records

None. Nothing about what a document may say changes.

### Guides

None.

## Review

### Delivered

The polite live region is silent when visibility filtering removed every element an accepted occurrence would have been drawn on, for the Flow signal half and the element emphasis half, in both hosts that mount a Diagram. `COMPOSE-004` is conforming, and `DYNAMIC-006` now carries the rule for any announcement path rather than for the two that exist.

### Summary of changes

Each sentence is composed first and its revision counter is read only when a sentence follows it. That alone fixes the signal half, because the signal sentence was already composed against the Flows the Diagram drew.

The emphasis half needed the drawn set itself. Reading `COMPOSE-004` in full changed the fix's shape: it asks for silence when every element an occurrence would have drawn on is filtered out, and the emphasis sentence was composed from resolved labels with no filter in it at all. So `drawnElementIds` in `packages/view-canvas/src/drawn-elements.ts` derives what a rendering drew — the drawn Flow ids, every Region, and each Card and Fabric its Scopes leave visible — and both halves filter against it. Canvas already reconciled emphasis against that set before accepting it, so it now derives it once and passes the same set to the announcement surface. Studio accepts whatever it resolved, so it supplies its own; that is where the emphasis defect actually was, and why the prop is optional: a host whose accepted set is its drawn set omits it and announces everything, which is right for it.

### Verification

| Gate | Outcome |
| --- | --- |
| `bun run --cwd packages/view-canvas test` | 13 files, 90 tests passed (baseline 12 files, 86) |
| `bun run --cwd packages/view-present test` | 6 files, 43 tests passed |
| `bun run --cwd packages/view-studio test` | 22 files, 118 tests passed |
| `bun run --cwd packages/view-studio test:browser` | 2 files, 21 tests passed |
| `bunx turbo run typecheck --filter=@infoschematics/view-canvas --filter=@infoschematics/view-studio` | 6 successful |
| `bunx vitest run --root . scripts/specification-evidence.test.ts` | 1 file, 6 tests passed |
| `bunx rumdl check docs/specs/composition.md docs/specs/diagram-dynamics.md` | no issues |

The cases are not vacuous, and the first attempt at them was. Two browser cases in `Canvas.dynamics.browser.test.tsx` passed with and without the fix, because `reconcileOccurrences` gates acceptance on `isShown`, so Canvas can never announce a hidden occurrence and the browser suite cannot reach the defect. The cases were rewritten against `DiagramAnnouncements` itself, where a host supplies the accepted set and the drawn set independently, and then proven by restoring both unconditional counters: the filtered case failed with `expected [ 'Signal update 1. ', … ] to deeply equal [ '', '' ]`, and the partly filtered case failed too.

### Post-change review

The aggregate gate is deferred to the batch's final pass; the focused gates above are the item's own evidence.

`drawnElementIds` is now the single answer to "what did this rendering draw", asked by `DYNAMIC-003` for the treatment and by `COMPOSE-004` for the announcement. Before this, Canvas answered it inline for the treatment and nothing answered it for the announcement, which is exactly how a live region came to report something no reader could see.

### Outstanding concerns

The by-hand check named in Verify — switch off `PACKAGE` on the site Playground, rehearse, read the region — has not been repeated since the fix; the cases stand in for it, and the site's Present path is the one the original observation came from. Worth a look during the manual review pass.

### Mini recap

One defect of one shape in two places, and the shape was worth naming in the specification rather than patching twice. The lesson worth keeping: a case that passes before the fix is not a case. Locating the real defect path — Studio's `useDiagramAnnouncements`, not Canvas's reconciliation — is what made the fix the right size.

## Discussion

Shaped on 2026-09-18 against `b8325a18`. Step 2 was written as a question and the reading answered it: the emphasis announcement at `:72` carries the same unconditional prefix, so both halves are in scope and the requirement should be worded for the shape rather than the instance.
