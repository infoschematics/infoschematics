---
id: INFOSCHEMATICS-SITE-027
area: SITE
title: Authoring guide learns depicts
theme: site
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T16:10:00Z
updated_at: 2026-09-16T22:45:00Z
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

1. [x] Add `depicts` where the guide introduces `emphasise-elements`, with a worked example that contrasts one of each — an event that reports something happened, a state that says where a walkthrough is. The existing `playback-stalled` example is a state in everything but its declaration, so it is the natural one to change.
2. [x] Rewrite the "never carries how to depict it" paragraph so it stays true and distinguishes itself from `depicts` explicitly, rather than leaving the reader to reconcile them. Name the test `ADR-029` uses: whether a Producer would say it out loud while presenting.
3. [x] Correct "briefly emphasises", which no longer covers a state.
4. [x] Say what a host owes a state, because it differs and the guide never says: an event ends on the renderer's own duration, a state ends only when the host withdraws the occurrence, replays it under a new key, or stops drawing the element. The occurrence paragraph at `:153` is silent on how an emphasis ends rather than wrong about it, so this is an addition there; the sentence that actively misleads is `:149`, which step 3 owns.
5. [x] Leave the travelling mark out of the authored surface entirely. If it is worth mentioning, the place the guide already describes what a renderer may do is `:161` — but that paragraph is about a `signal-flow`'s travel along a route, not an emphasis mark circling a perimeter, so say which is which or the two will be read as one treatment.
6. [x] Read the rendered page, not the Markdown.

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

## Review

### Delivered

`apps/site/content/authoring.md` now teaches `depicts` in the section that introduces `emphasise-elements`, and the portability promise a paragraph below it still reads as true, because it now says why `depicts` is not an exception rather than leaving a reader to reconcile the two.

### Summary of changes

The worked example gains a second `emphasise-elements` declaration so the page contrasts one of each: `manifest-rejected` (an event, no `depicts`, emphasising `CDN`, an identifier the Scene example above already uses) and `playback-stalled`, which becomes `depicts: state` with its label moved from "Playback has stalled" to "Playback is stalled" and a description saying what is now the case. The event example deliberately carries no `depicts` at all, so absence appears on the page as the ordinary way to write an event rather than as an omission.

The kinds paragraph drops "briefly", which never covered a state, and `depicts` gets a paragraph of its own: what the two values say, that it is optional, that an absent one reads as `event`, and that `signal-flow` cannot carry it because a passage along a Flow has nothing to sustain.

The "never carries how to depict it" paragraph keeps its list and its promise, then names `ADR-029`'s test — whether a Producer would say the thing out loud while presenting — with both sides of it quoted, and closes by saying `depicts` fixes no treatment, duration, or way of playing. Its `label` advice was event-only ("the thing that happened") and is now "the thing itself, what happened for an event and what is the case for a state".

A new paragraph after the occurrence paragraph says what a host owes a state: an event ends on the renderer's own duration; a state ends only when the host withdraws the occurrence, replays it under a new key, or stops drawing the element, and retaining the key holds it. It closes by saying none of that becomes authored data.

In the Flow signals section, the travelling mark gets one sentence distinguishing it from a signal's travel along a route, on the paragraph that already describes what a renderer may do — a renderer's own reading of an `emphasise-elements` declaration, taken from the element's geometry, with no way to author it. It gains no authored surface anywhere on the page.

### Verification

Read on the rendered page at `http://localhost:4173/docs/authoring/`, not in the Markdown, at 1280x1100 in Chromium: the example, both new paragraphs, and the Flow signals sentence. Two revisions came from looking rather than from writing. The `depicts` material was first appended to the kinds paragraph, which rendered as a six-line block on screen, so it became its own paragraph; and the travelling-mark clause was first a third semicolon-joined clause in an already long sentence, so it became its own sentence.

`bun run self:check` passes.

### Outstanding concerns

None outstanding for this item. Two things a later reader might want, both deliberately out of this boundary: the page says nothing about Studio's rehearsal becoming a toggle for a state-depicting Dynamic, which is Studio-surface material rather than authoring material; and it does not say that reduced-motion and still output cannot distinguish held from finite, which `ADR-029` records as an accepted cost and which the representations page is the better home for.

### Post-change review

The record's judgement that step 2 was the real work held up. The field's name pulls against the paragraph's promise, and the resolution was not a hedge but `ADR-029`'s own test, quoted on both sides — which is also the thing a document author can apply to the next field they wish existed.

### Mini recap

A guide that gains a field needs the paragraph that forbade the field's whole category re-read, not just a new sentence added above it. And prose length is a rendered property: both edits after the first draft came from looking at the page.

## Discussion

Captured separately rather than folded into either feature, which is the standing pattern here: the feature and its repository documentation land together, and Site prose becomes its own record. Worth keeping that way in this case especially, because step 2 is a genuine writing problem rather than a transcription — the field's name and the paragraph's promise pull against each other, and getting it wrong teaches document authors that `diagram.dynamics` is where animation goes.
