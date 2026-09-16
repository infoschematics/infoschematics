---
id: INFOSCHEMATICS-TOOL-079
area: TOOL
title: Studio announces nothing
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T15:30:00Z
updated_at: 2026-09-16T20:30:00Z
---

# Studio announces nothing

## Goal

Give the Studio surface the accessible announcement its renderers already compose, so a Flow signal or a Diagram Dynamic rehearsed in Studio is reported to assistive technology as it is in Present.

## Context

Reported by the delivery of held element emphasis (`INFOSCHEMATICS-TOOL-059`) and confirmed independently on 2026-09-16. `packages/view-canvas/src/Canvas.tsx:203` and `:218` hold the two `role="status"` live regions that announce a signal or an emphasis. Studio does not mount `Canvas`: nothing under `packages/view-studio/` imports it, and `packages/view-studio/src/app/App.tsx:1044` mounts `InfoschematicDiagram` directly. So Studio mounts no live region for a Flow signal or an element emphasis in any mode, and rehearsing a Dynamic there announces nothing.

This is wider than the item that found it. It is not specific to held emphasis, or to Dynamics — a Flow signal rehearsed in Studio is equally silent, and has been for as long as Studio has mounted the Diagram directly. `packages/view-present/src/SceneCallout.tsx:164` and `packages/view-studio/src/app/panels/SceneCallout.tsx:189` each carry their own `role="status"` for Callout text, and `packages/view-studio/src/app/panels/SourcePanel.tsx:68` is polite too, which is why the absence is easy to miss: Studio does announce things, just never the thing a renderer composed.

The obligation is not only a decision record: DYNAMIC-006 (`docs/specs/diagram-dynamics.md:103`) states that "an interactive renderer MUST announce each newly accepted occurrence once through a concise polite live region", and that requirement reads `_Conformance:_ conforming` at `:107` with a `_Verify:_` line at `:109` naming "the live regions in `packages/view-canvas/src/Canvas.tsx`". So this is a conformance regression against a requirement the corpus already asserts, not merely an unstated host duty. `ADR-INFOSCHEMATICS-026` placed the obligation on the Dynamic kind list and `ADR-INFOSCHEMATICS-029` extended it to `depicts: state`; all three are satisfied by the renderer and defeated by the host.

## Boundary

The announcement path from renderer to Studio's page. Not the wording of announcements, not Callout announcement, and not a change to what `Canvas` composes.

## Steps

1. [ ] Establish where the obligation belongs: whether the live region is `InfoschematicDiagram`'s to render, so any host gets it by mounting the Diagram, or `Canvas`'s to keep with Studio composing its own. The first makes it impossible for a host to omit; the second keeps the Diagram free of page-level furniture. Verifiable by the reasoning being written where a future host author reads it, and by which package the change lands in.
2. [ ] Make the case that would have caught this, before fixing it: assert that the Studio surface reports a rehearsed Flow signal and a rehearsed Dynamic to assistive technology. Verifiable by that case failing against today's tree.
3. [ ] Deliver step 1's answer, and confirm Present's existing announcement is unchanged rather than duplicated — two live regions reporting the same event is its own defect.
4. [ ] Check the remaining hosts. `apps/site` mounts Studio at `apps/site/src/Playground.tsx:134` and its only `Canvas` at `apps/site/src/visual-guide/DemoFrame.tsx:107` — two cases, not three; `DocumentPage.tsx` renders imported Markdown and mounts no Diagram.
5. [ ] State the host obligation in DYNAMIC-006 (`docs/specs/diagram-dynamics.md:93`), which already owns the announcement, so a host that mounts the Diagram directly is told what it still owes — and correct that requirement's conformance state if step 3 has not yet made it true.

## Files touched

- `packages/view-canvas/src/Canvas.tsx` and `InfoschematicDiagram.tsx`, depending on step 1
- `packages/view-studio/src/app/App.tsx`
- `packages/view-studio/src/app/App.browser.test.tsx`
- `docs/specs/diagram-dynamics.md`, and possibly `docs/specs/flow-signals.md`

## Verify

- The new Studio case fails on today's tree and passes after.
- Present's announcement is asserted unchanged, and no surface announces twice.
- `bun run self:check`.

## Dependencies / blocks

None. Independent of the emphasis work that found it.

## Documentation impact

### Specifications

Required, not optional. DYNAMIC-006 (`docs/specs/diagram-dynamics.md:93`) states at `:103` that "an interactive renderer MUST announce each newly accepted occurrence once through a concise polite live region", reads `_Conformance:_ conforming` at `:107`, and has a `_Verify:_` line at `:109` that names only `packages/view-canvas/src/Canvas.tsx`. So the requirement is asserted conforming while one of the repository's own hosts does not satisfy it. Whatever step 1 decides, DYNAMIC-006 gains the host obligation in words, and if delivery does not land in the same change its conformance state has to say so. FLOW-00x in `docs/specs/flow-signals.md` may want the same sentence for the signal case.

### Decision Records

Likely. Step 1 decides whether a live region is `InfoschematicDiagram`'s to render or the host's to compose, which is a package-boundary choice of exactly the kind `ADR-INFOSCHEMATICS-026` and `ADR-INFOSCHEMATICS-029` already record for Dynamics. If the answer is that the Diagram owns it, that reverses the current division of labour and needs its own record rather than a line in this one.

### Guides

None. No guide tells a host what it owes; the specification is the right place for it.

## Batch exclusion

Excluded from `INFOSCHEMATICS-BATCH-018` on 2026-09-16. Step 1 decides whether the live region belongs to `InfoschematicDiagram` or stays the host's to compose. Moving it into the Diagram changes what every host gets by mounting it, which is a package-boundary decision needing its own record rather than an autonomous choice. The DYNAMIC-006 conformance regression stands meanwhile and is the reason this should not wait long.

## Discussion

Worth noting how it stayed hidden: every announcement assertion in the suite runs against `Canvas` or against `Present`, both of which compose the live region, so the announcement contract is thoroughly tested — in the two hosts that satisfy it. Studio's browser suite asserts plenty about Studio, but never that it announces, because nothing in Studio was ever written to. A contract tested only where it holds is the same shape as the checks collected in `INFOSCHEMATICS-TOOL-074` and `INFOSCHEMATICS-TOOL-078`.
