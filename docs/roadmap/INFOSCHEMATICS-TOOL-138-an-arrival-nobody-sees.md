---
id: INFOSCHEMATICS-TOOL-138
area: TOOL
title: An arrival nobody sees
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 817da6ada51ef41c6db27e93fcd06d539858d185
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-10-04T20:33:42Z
---

# An arrival nobody sees

## Goal

When prose points at one part of an embedded [Infoschematic](../reference/vocabulary.md#infoschematic) and the reader arrives there, a sighted reader can see which part was addressed.

## Context

`INFOSCHEMATICS-TOOL-115` delivered arrival: a host resolves an address to an artefact code or a [Scope](../reference/vocabulary.md#scope) id, and the Diagram centres the viewport and selects the named part. The selection is real — it is in the DOM, it is announced to an assistive reader, and it is reported back to the host.

It is also invisible. The `.selected` and `.group-held` treatments in `packages/view-canvas/src/styles.css` are gated behind `.infoschematic-svg.editing`, so a read-only Canvas — which is every embedded Infoschematic that is not [Design](../reference/vocabulary.md#design) — paints nothing. A reader following a link from surrounding prose gets a viewport that has moved and no indication of what it moved to. Where the whole document already fits in view, centring is a no-op as well, so arriving can produce no visible change at all.

The asymmetry is the sharp part: the assistive reader is told exactly what happened and the sighted reader is told nothing, which is the reverse of the usual gap and just as wrong.

## Boundary

The visual treatment an arrival gets in a read-only Canvas, and nothing about addressing. What is addressable, who owns the address, and what arriving means are settled by [ADR-INFOSCHEMATICS-041](../decisions/ADR-INFOSCHEMATICS-041-a-link-names-a-part-and-arriving-centres-and-selects-it.md) and are not re-opened here.

It deliberately does not simply ungate the editing treatments. Those were drawn for a Producer choosing what to change, and a reader who has just arrived somewhere is not selecting anything — the same paint may read as an invitation to edit. Whether an arrival wants its own treatment, or the existing one relaxed, is the question.

It also does not make arrival emphasise or magnify. ADR-INFOSCHEMATICS-041 rejected both, an emphasis because it would collide with authored Dynamics and magnification because it would move the detail band `ADR-INFOSCHEMATICS-039` resolves, and neither rejection is disturbed by giving the selection a visible form.

## Current state

The paint already exists and is right for the job: every `.selected` and `.group-held` treatment in `packages/view-canvas/src/styles.css` - the anchor's stroke and glow, and the broken stroke and softer glow on the rest of a Scope - sits behind `.infoschematic-svg.editing`, and `InfoschematicDiagram.tsx` adds `editing` only when `editor === 'design'`. An arrival is the Diagram's own state (`arrival`, consulted only when the host holds no selection), so the Diagram already knows when the selection it draws is an arrival rather than a host's.

A read-only Canvas can also hold a selection that is not an arrival: Studio passes its editor's selection in every mode, and in Direct the Diagram is mounted with `editor` set to `scenes` or `stories`, which is not `design`. Ungating the treatments for every read-only surface would therefore change Direct as well, which is outside this boundary.

### Decisions

- **The existing selection treatment, shown for an arrival, rather than a new arrival treatment.** The Diagram marks its surface `arrived` while the selection it draws is the arrival's, and each selected and group-held treatment gains an `.infoschematic-svg.arrived` twin of equal specificity. What the editing gate withheld from a reader was the paint, not the editing affordances: handles, pointer cursors, ports, the grid and the selectable hover states stay behind `.editing`, so nothing on a read-only surface invites an edit. A host-held read-only selection, such as Studio's Direct, is unchanged. Decided by Fable/agent under delegated autonomy (2026-10-04), reversible: the twin selectors and one class are the whole of it.
- **Arriving does nothing further when the whole document is already in view.** `ADR-INFOSCHEMATICS-041` already records this as the honest outcome - there is nothing to centre - and it rejects magnifying and emphasising. With the selection visible, an arrival that moves nothing is still told apart from an address that did not resolve, because the latter selects nothing. Decided by Fable/agent under delegated autonomy (2026-10-04), reversible.

## Steps

- [x] In `InfoschematicDiagram.tsx`, add `arrived` to the surface's class while an arrival stands and the host holds no selection.
- [x] In `styles.css`, give every `.infoschematic-svg.editing` selected and group-held treatment an `.infoschematic-svg.arrived` twin, and say why beside the selection treatments.
- [x] Add a browser case reading the resolved styles of an arrival in a read-only Canvas against an unaddressed part, and one showing a host-held read-only selection is still unpainted.
- [x] State the behaviour as a Canvas requirement in `docs/specs/diagram-elements.md` beside `DIAGRAM-012`.
- [x] Look at the result in a real browser with `bun run self:browser:look`, on the site's destination demonstration, and write the captures to `reports/`.

## Files touched

- `packages/view-canvas/src/InfoschematicDiagram.tsx`
- `packages/view-canvas/src/styles.css`
- `packages/view-canvas/src/InfoschematicDiagram.destination.browser.test.tsx`
- `docs/specs/diagram-elements.md`
- This record

Not touched: addressing and resolution (`packages/view-model/src/destination.ts`), Studio, Present, `docs/specs/design-editing.md`, and Site content, which `AGENTS.md` routes to a follow-up record.

## Verify

`bunx vitest run --project browser` (or the package's `test:browser`) for `@infoschematics/view-canvas` passes, including the new case: an arrived Card's resolved stroke differs from an unaddressed Card's, its stroke width is the selection's and it carries a glow, and a held Point is broken in the selection's colour. Removing the `arrived` twins makes the case fail. A read-only Diagram whose host holds the selection draws it unpainted. `bun run self:check` passes, and a browser look at `/docs/react-integration/?artefact=STORE` shows the addressed part outlined without zooming.

## Dependencies / blocks

None. `INFOSCHEMATICS-TOOL-115` delivered arrival and is done.

## Documentation impact

### Decision Records

None. `ADR-INFOSCHEMATICS-041` already says the selection is the whole of an arrival when nothing moves; this item makes that selection visible and does not change the decision.

### Specifications

A new requirement in `docs/specs/diagram-elements.md`, after `DIAGRAM-012`, stating that an arrival's selection is painted in a read-only Canvas with the selection treatment and without editing affordances.

### Guides

None here. Site content, if it should mention the visible arrival, is a follow-up record under `AGENTS.md`.

### Roadmap

None.

## Review

### Delivered

An arrival in a read-only Canvas now paints its selection: the anchor with the selection stroke and glow, and the rest of a Scope with the broken held stroke, exactly as Design draws them. The treatment is scoped to the arrival - the Diagram marks its surface `arrived` only while the drawn selection is the arrival's - so a host-held read-only selection such as Studio's Direct is unchanged, and editing affordances (handles, cursors, ports, grid, selectable hover) stay behind `.editing`. Arriving still neither magnifies nor emphasises, and does nothing further when the whole document is already in view. Excluded and untouched: addressing and resolution, Studio, Present, `docs/specs/design-editing.md`, and Site content. Baseline `817da6ada51ef41c6db27e93fcd06d539858d185`; the change is the commit carrying this packet.

### Change Summary

- `packages/view-canvas/src/InfoschematicDiagram.tsx` - derives `arrived` (an arrival stands and the host holds neither a selected artefact nor a selection set) and adds it to the surface class.
- `packages/view-canvas/src/styles.css` - every `.infoschematic-svg.editing` selected and group-held treatment gains an `.infoschematic-svg.arrived` twin of equal specificity, with the rationale beside the selection treatments.
- `packages/view-canvas/src/InfoschematicDiagram.destination.browser.test.tsx` - one case reads resolved styles of a Scope arrival against an unaddressed Card and a held Point; a second shows a host-held read-only selection is unpainted.
- `docs/specs/diagram-elements.md` - new `DIAGRAM-013`, "An arrival is visible to a sighted reader".
- Deviation from the partial work found in the tree: it ungated the treatments for every read-only surface with `:not(.editing)`. That would have painted Studio's Direct selection too, outside this boundary, so the twins were retargeted to `.arrived`.

### Verification

- `bunx vitest run --config vitest.browser.config.ts src/InfoschematicDiagram.destination.browser.test.tsx` in `packages/view-canvas` - 10 passed. With the `arrived` class removed from the surface, the arrival case fails (1 failed, 9 passed), so the case measures the treatment rather than the markup.
- `bun run self:check` - exit 0, 52 of 52 tasks, run with the unrelated `INFOSCHEMATICS-TOOL-139` edits also present in the working tree.
- `bunx vitest run --root . scripts/specification-evidence.test.ts` - 6 passed; `ki repo audit --skill ki-specs` and `--skill ki-work-roadmap` - PASS.
- `bun run self:browser:look -- --name TOOL-138-arrival --path "/docs/react-integration/?artefact=STORE" --probe reports/TOOL-138-arrival-probe.ts` - captures in `reports/TOOL-138-arrival/`. With the whole document in view (viewBox unchanged), `STORE` is outlined in the selection green with its glow; after `?scope=edge`, `CLIENT` is the 3px green anchor and `INTAKE` the dashed held Card. Looked at, not only measured.
- `ki repo audit --repo .` - BIO-1 FAIL, caused only by files outside this item: `biome.json` declares schema 2.5.12 against CLI 2.5.14, and `noNonNullAssertion` in committed `packages/view-model/src/artefact-draft.test.ts` and `packages/view-canvas/src/InfoschematicDiagram.preview.test.tsx`. The three files this item changes pass Biome.

### Outstanding concerns

- `ki repo audit` BIO-1 remains red for the pre-existing causes above, which are neither this item's nor `INFOSCHEMATICS-TOOL-139`'s.
- An unresolvable address after a resolved one leaves the earlier arrival painted (the look's third capture). That is `INFOSCHEMATICS-TOOL-115`'s quiet no-op keeping prior state, now visible rather than introduced; whether a failed address should withdraw a standing arrival is a question for `ADR-INFOSCHEMATICS-041`, not this item.
- A Point anchor carries the selection stroke but no glow, as it does in Design; it reads, but is the faintest of the treatments.

### Post-change review

The goal is met: a sighted reader arriving at a part sees which part was addressed, including when nothing moves, and the assistive and visual accounts now agree. Scope held to the treatment an arrival gets; addressing is untouched and the editing cascade is unchanged because the twins share its specificity. Regression risk is low: only a surface with an arrival and no host selection gains paint, and the second browser case pins the host-held read-only case. Ready for acceptance.

### Mini recap

Arrival selection is painted on read-only Canvases through an `arrived` surface class and twin selectors; browser case, spec requirement and a real-browser look land with it, and `self:check` passes. Learning route (not promoted): when a state is gated behind a mode class, decide whether the gate protects the paint or the affordance before relaxing it - here only the affordance needed protecting.

## Discussion

Found on 2026-09-24 in the browser look that delivered `INFOSCHEMATICS-TOOL-115`. The suites were green and stayed green: the selection they assert on is present in the DOM, so nothing mechanical could have caught this. It is exactly the case `AGENTS.md` has in mind when it says a passing suite is not evidence that output looks right.

Worth settling when this is shaped: whether centring should do something when the whole document is already in view, since an arrival that moves nothing and paints nothing is indistinguishable from an address that did not resolve — and those two are supposed to be told apart.

Adopted 2026-10-04 under the owner's delegated estate-push authority, moved from Triage to Now and shaped to Ready in the same change.
