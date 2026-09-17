---
id: INFOSCHEMATICS-TOOL-079
area: TOOL
title: Studio announces nothing
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: ae031c1a73af64537727148ca61b35c0b779ea76
created_at: 2026-09-16T15:30:00Z
updated_at: 2026-09-17T09:40:00Z
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

1. [x] Establish where the obligation belongs: whether the live region is `InfoschematicDiagram`'s to render, so any host gets it by mounting the Diagram, or `Canvas`'s to keep with Studio composing its own. The first makes it impossible for a host to omit; the second keeps the Diagram free of page-level furniture. Verifiable by the reasoning being written where a future host author reads it, and by which package the change lands in.
2. [x] Make the case that would have caught this, before fixing it: assert that the Studio surface reports a rehearsed Flow signal and a rehearsed Dynamic to assistive technology. Verifiable by that case failing against today's tree.
3. [x] Deliver step 1's answer, and confirm Present's existing announcement is unchanged rather than duplicated — two live regions reporting the same event is its own defect.
4. [x] Check the remaining hosts. `apps/site` mounts Studio at `apps/site/src/Playground.tsx:134` and its only `Canvas` at `apps/site/src/visual-guide/DemoFrame.tsx:107` — two cases, not three; `DocumentPage.tsx` renders imported Markdown and mounts no Diagram.
5. [x] State the host obligation in DYNAMIC-006 (`docs/specs/diagram-dynamics.md:93`), which already owns the announcement, so a host that mounts the Diagram directly is told what it still owes — and correct that requirement's conformance state if step 3 has not yet made it true.

## Files touched

- `packages/view-canvas/src/announcements.tsx` — new
- `packages/view-canvas/src/Canvas.tsx` and `packages/view-canvas/src/index.ts`
- `packages/view-studio/src/app/App.tsx`
- `packages/view-studio/src/app/App.browser.test.tsx`
- `docs/decisions/ADR-INFOSCHEMATICS-033-a-diagram-host-mounts-the-announcement-surface.md` — new
- `docs/decisions/README.md`
- `docs/specs/diagram-dynamics.md`

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

## Review packet

### Delivered

Studio announces a rehearsed Flow signal and a rehearsed Diagram Dynamic, over the same live regions and the same sentences `Canvas` reads. The announcement surface is now one component, `DiagramAnnouncements`, that every host mounting the Diagram mounts; `DYNAMIC-006` says so in words and `ADR-INFOSCHEMATICS-033` records why.

### Summary of changes

Step 1 went neither way the record offered. The live region cannot move into `InfoschematicDiagram`, which renders an `<svg>` root — a status paragraph is not SVG content, and the only ways to put one there are a `<foreignObject>` or a new wrapper around the element every host already positions and styles. Nor can Studio simply mount `Canvas`: `Canvas` builds a runtime from `config` while Studio's runtime carries the draft overlay, so one inside the other would put two runtimes behind one surface. So the third answer is the surface as its own component, beside the Diagram, mounted by both hosts — which keeps the composed sentence in one place, because what a reader hears is a product decision and two hosts writing it separately is how they come to differ.

The occurrence lifecycle stays with the host, because the hosts genuinely differ. `Canvas`'s accepted set is not its active set — an occurrence arriving for a hidden element is never accepted — so it advances the announcement inside the reconciliation that decides acceptance, and that machinery is untouched. Studio draws what it resolved, so accepted is active, and `useDiagramAnnouncements` over the same `advance…Announcement` functions is the whole of what it needs.

### Verification

Step 2's case came first and was proved to catch it: with the `DiagramAnnouncements` mount removed from `App.tsx`, `Studio announces a rehearsed Flow signal and a rehearsed Dynamic to assistive technology` fails with `expected [] to have a length of 2`; with it, the Studio browser suite passes 20 of 20. `bun run self:check` — 45 of 45 tasks successful. The Canvas suite passes 84 of 84 with its regions moved out of its JSX unchanged.

Step 4's host check found two hosts, not three, as the record said: `Present.tsx:152` mounts `Canvas`, `App.tsx` mounts the Diagram, and nothing else in `packages`, `apps` or `examples` mounts either. Present therefore gains nothing and duplicates nothing; its Scene Callout live region announces something else and stays as it is.

### Outstanding concerns

Nothing mechanically makes a third host mount the surface. The requirement now states the obligation and the Studio case has a vacuity check written into `_Verify:_`, but a future host that forgets is silent in exactly the way Studio was — that is the residual risk `ADR-033` names rather than solves.

The announcement was read from the DOM by a browser case, not heard. The text and the `aria-live`/`role` pair are what the case asserts, which is the same evidence `Canvas` has had; neither is a screen-reader rehearsal.

### Post-change review

The contract was tested thoroughly in both hosts that satisfied it, and the host that did not satisfy it was never asked. Worse, Studio announces plenty — Callout text, source-panel status — so the page had live regions and the absence read as presence. A requirement written about "an interactive renderer" and verified against one component is a requirement about that component; naming the obligation as the host's is what makes the second host's silence a failure rather than an omission nobody asked about.

### Mini recap

One component, two hosts, one requirement sentence; the Dynamic a reader could not see is now one a reader can hear in Studio too.
