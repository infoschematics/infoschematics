---
id: INFOSCHEMATICS-SITE-027
area: SITE
title: Authoring guide learns depicts
theme: site
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: 99d68b5fdeb2d645d4349dd8383eaef82aa294a7
created_at: 2026-09-16T16:10:00Z
updated_at: 2026-09-16T16:49:00Z
---

# Authoring guide learns depicts

## Goal

Teach the consumer authoring guide the one new authored field in Diagram Dynamics, without breaking the promise the surrounding paragraph makes.

## Context

`INFOSCHEMATICS-TOOL-059` added `depicts: 'event' | 'state'` to an `emphasise-elements` declaration, settled by [ADR-INFOSCHEMATICS-029](../decisions/ADR-INFOSCHEMATICS-029-author-what-an-emphasis-means.md): a document may say what a change is, never how a renderer carries it. `INFOSCHEMATICS-TOOL-060` then added a travelling mark as a pure renderer interpretation with no authored surface at all. Repository documentation is current; the Site-owned guide at `apps/site/content/authoring.md` is not.

The care this needs is in one sentence already there, at `apps/site/content/authoring.md:149`:

> What a Dynamic never carries is how to depict it. There is no duration, easing, colour, selector, callback, event source, or element geometry to author.

That sentence is still true, and a field named `depicts` sitting a paragraph above it will read as though it is not. The distinction is the whole of `ADR-029` — `depicts` states whether the change is an event or a state, which is a property of the change and something a Producer would say out loud; it does not name a treatment. A careless edit here either drops the portability promise or makes `depicts` look like the animation hook the decision refused, and the guide is the first place a document author meets the field.

Also stale in the same section: `emphasise-elements` is described as briefly emphasising its targets, and a state's emphasis is not brief.

## Boundary

Site-owned consumer content for authoring Dynamics. Repository documentation under `docs/` is already correct and is not copied here.

## Steps

1. [ ] Add `depicts` where the guide introduces `emphasise-elements`, with a worked example that contrasts one of each — an event that reports something happened, a state that says where a walkthrough is. The existing `playback-stalled` example is a state in everything but its declaration, so it is the natural one to change.
2. [ ] Rewrite the "never carries how to depict it" paragraph so it stays true and distinguishes itself from `depicts` explicitly, rather than leaving the reader to reconcile them. Name the test `ADR-029` uses: whether a Producer would say it out loud while presenting.
3. [ ] Correct "briefly emphasises", which no longer covers a state.
4. [ ] Say what a host owes a state, because it differs and the guide's occurrence paragraph currently implies otherwise: an event ends on the renderer's own duration, a state ends only when the host withdraws the occurrence, replays it under a new key, or stops drawing the element.
5. [ ] Leave the travelling mark out of the authored surface entirely. If it is worth mentioning, it belongs wherever the guide describes what a renderer may do with a Dynamic, phrased so no reader tries to ask for it.
6. [ ] Read the rendered page, not the Markdown.

## Files touched

- `apps/site/content/authoring.md`

## Verify

- The page renders and reads correctly at `bun run self:dev`.
- `bun run self:check`.

## Dependencies / blocks

Follows `INFOSCHEMATICS-TOOL-059` and `INFOSCHEMATICS-TOOL-060`, both merged.

## Discussion

Captured separately rather than folded into either feature, which is the standing pattern here: the feature and its repository documentation land together, and Site prose becomes its own record. Worth keeping that way in this case especially, because step 2 is a genuine writing problem rather than a transcription — the field's name and the paragraph's promise pull against each other, and getting it wrong teaches document authors that `diagram.dynamics` is where animation goes.
