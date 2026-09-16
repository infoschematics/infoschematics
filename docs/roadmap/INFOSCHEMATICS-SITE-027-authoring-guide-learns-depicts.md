---
id: INFOSCHEMATICS-SITE-027
area: SITE
title: Authoring guide learns depicts
theme: site
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T16:10:00Z
updated_at: 2026-09-16T18:20:00Z
---

# Authoring guide learns depicts

## Goal

Teach the consumer authoring guide the one new authored field in Diagram Dynamics, without breaking the promise the surrounding paragraph makes.

## Context

`INFOSCHEMATICS-TOOL-059` added `depicts: 'event' | 'state'` to an `emphasise-elements` declaration, settled by [ADR-INFOSCHEMATICS-029](../decisions/ADR-INFOSCHEMATICS-029-author-what-an-emphasis-means.md): a document may say what a change is, never how a renderer carries it. `INFOSCHEMATICS-TOOL-060` then added a travelling mark as a pure renderer interpretation with no authored surface at all. Repository documentation is current; the Site-owned guide at `apps/site/content/authoring.md` is not.

The care this needs is in one sentence already there, at `apps/site/content/authoring.md:151`:

> What a Dynamic never carries is how to depict it. There is no duration, easing, colour, selector, callback, event source, or element geometry to author — that is what keeps the document portable and keeps every Dynamic meaningful in a still image.

That sentence is still true, and a field named `depicts` sitting a paragraph above it will read as though it is not. The distinction is the whole of `ADR-029` — `depicts` states whether the change is an event or a state, which is a property of the change and something a Producer would say out loud; it does not name a treatment. A careless edit here either drops the portability promise or makes `depicts` look like the animation hook the decision refused, and the guide is the first place a document author meets the field.

Also stale in the same section, two lines above at `apps/site/content/authoring.md:149`: `emphasise-elements` is described as briefly emphasising its targets, and a state's emphasis is not brief.

One thing the guide must get right that `ADR-029` settles elsewhere: `depicts` is optional. `packages/domain-core/src/schema.ts:446` declares it `z.enum(['event', 'state']).optional()`, and `docs/specs/diagram-dynamics.md:13` requires an absent `depicts` to read as `event`. A guide that presents it as required would make every existing document look wrong.

## Boundary

Site-owned consumer content for authoring Dynamics. Repository documentation under `docs/` is already correct and is not copied here.

## Steps

1. [ ] Add `depicts` where the guide introduces `emphasise-elements`, with a worked example that contrasts one of each — an event that reports something happened, a state that says where a walkthrough is. The existing `playback-stalled` example is a state in everything but its declaration, so it is the natural one to change.
2. [ ] Rewrite the "never carries how to depict it" paragraph so it stays true and distinguishes itself from `depicts` explicitly, rather than leaving the reader to reconcile them. Name the test `ADR-029` uses: whether a Producer would say it out loud while presenting.
3. [ ] Correct "briefly emphasises", which no longer covers a state.
4. [ ] Say what a host owes a state, because it differs and the guide never says: an event ends on the renderer's own duration, a state ends only when the host withdraws the occurrence, replays it under a new key, or stops drawing the element. The occurrence paragraph at `:153` is silent on how an emphasis ends rather than wrong about it, so this is an addition there; the sentence that actively misleads is `:149`, which step 3 owns.
5. [ ] Leave the travelling mark out of the authored surface entirely. If it is worth mentioning, the place the guide already describes what a renderer may do is `:161` — but that paragraph is about a `signal-flow`'s travel along a route, not an emphasis mark circling a perimeter, so say which is which or the two will be read as one treatment.
6. [ ] Read the rendered page, not the Markdown.

## Files touched

- `apps/site/content/authoring.md`

## Verify

- The page renders and reads correctly at `bun run self:dev`.
- `bun run self:check`.

## Dependencies / blocks

Follows `INFOSCHEMATICS-TOOL-059` and `INFOSCHEMATICS-TOOL-060`, both merged.

## Documentation impact

### Specifications

None. `depicts` is already stated by DYNAMIC-003 (`docs/specs/diagram-dynamics.md:47`), which requires resolution to carry a declared state depiction onto every emphasis it resolves; this item only teaches the guide what the corpus already requires.

### Decision Records

None. `ADR-INFOSCHEMATICS-029` settled the field and needs no amendment for a guide to describe it.

### Guides

This item _is_ the guide change. `apps/site/content/authoring.md` is Site-owned content under the rule at `AGENTS.md:11`, so nothing under `docs/guides/` moves.

## Discussion

Captured separately rather than folded into either feature, which is the standing pattern here: the feature and its repository documentation land together, and Site prose becomes its own record. Worth keeping that way in this case especially, because step 2 is a genuine writing problem rather than a transcription — the field's name and the paragraph's promise pull against each other, and getting it wrong teaches document authors that `diagram.dynamics` is where animation goes.
