---
id: INFOSCHEMATICS-TOOL-086
area: TOOL
title: An announcement with no sentence when filtering hid everything
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: b8325a18298dfc8967da31de7c22cc22a58d53d7
created_at: 2026-09-17T09:42:00Z
updated_at: 2026-09-18T02:40:00Z
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

1. [ ] Compose the sentence first and emit the revision prefix only when there is a sentence, so an empty drawn set yields an empty live region.
2. [ ] Fix the emphasis path at `:72` the same way, which the reading above confirms has the same defect.
3. [ ] Add the case `COMPOSE-004` names, both halves: filtered and silent, unfiltered and announced once. Prove it by restoring the unconditional prefix.
4. [ ] Move `COMPOSE-004` to `conforming` and repoint its evidence at the case.

## Files touched

- `packages/view-canvas/src/announcements.tsx` — the prefix computed before the drawn-set filter
- `packages/view-present/src/Present.dynamics.test.tsx` — the announcement case, currently covering nothing filtered out
- `docs/specs/composition.md` — `COMPOSE-004`'s conformance and evidence

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

## Discussion

Shaped on 2026-09-18 against `b8325a18`. Step 2 was written as a question and the reading answered it: the emphasis announcement at `:72` carries the same unconditional prefix, so both halves are in scope and the requirement should be worded for the shape rather than the instance.
