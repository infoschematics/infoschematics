---
id: INFOSCHEMATICS-TOOL-138
area: TOOL
title: An arrival nobody sees
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-09-25T00:00:00Z
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

## Discussion

Found on 2026-09-24 in the browser look that delivered `INFOSCHEMATICS-TOOL-115`. The suites were green and stayed green: the selection they assert on is present in the DOM, so nothing mechanical could have caught this. It is exactly the case `AGENTS.md` has in mind when it says a passing suite is not evidence that output looks right.

Worth settling when this is shaped: whether centring should do something when the whole document is already in view, since an arrival that moves nothing and paints nothing is indistinguishable from an address that did not resolve — and those two are supposed to be told apart.
