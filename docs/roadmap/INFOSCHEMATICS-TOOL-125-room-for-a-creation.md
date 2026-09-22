---
id: INFOSCHEMATICS-TOOL-125
area: TOOL
title: Room for a creation
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T15:30:00Z
updated_at: 2026-09-22T15:30:00Z
---

# Room for a creation

## Goal

A new [Card](../reference/vocabulary.md#standard-card) made in [Design](../reference/vocabulary.md#design) lands somewhere a [Producer](../reference/vocabulary.md#producer) can see it and drag it from, without landing on top of something already drawn.

## Context

`roomForCard` in `packages/view-studio/src/app/App.tsx:183` puts a new Card at the centre of the view box, stepped twenty units per creation already made in the session. Its comment states the reasoning deliberately: the Card is put somewhere visible rather than somewhere correct, because where a Card belongs is a judgement about architecture and dragging it there is a gesture the editor already has.

That reasoning is sound and this is not a request to overturn it. What it does not cover is landing on top of an authored artefact. Opening the Playground on 2026-09-22 and making a Card put it squarely over the Message bus [Fabric](../reference/vocabulary.md#fabric) — visible, but overlapping, and the Producer's first action has to be to move it off something rather than to place it.

`INFOSCHEMATICS-TOOL-113` measures exactly this: `artefacts-overlap` reports two artefacts drawn over each other, with the overlap in diagram units. So the product can already tell whether a candidate position is clear, and the creation path does not ask it.

## Boundary

Where a created Card is first placed, and only that. It does not change the creation route, which `INFOSCHEMATICS-TOOL-112` and `ADR-INFOSCHEMATICS-042` settled, and it does not introduce automatic layout — the Card still goes somewhere provisional that the Producer is expected to move.

An [Adapter](../reference/vocabulary.md#adapter-card) is out of scope: `ADR-INFOSCHEMATICS-036` draws it from the Card it clasps, so its authored box is a starting value nothing depends on.

## Discussion

Found on 2026-09-22 during the browser look for `INFOSCHEMATICS-TOOL-112`, and deliberately not folded into it — that item converged the creation route and this is about placement, which was unchanged by it and equally true before.

The obvious implementation is to search outward from the centre for a clear box, testing candidates with the same overlap measurement `INFOSCHEMATICS-TOOL-113` already computes, and to keep the current position as the fallback when nothing is clear. Worth settling when shaped: whether reusing the diagnostics rule is right, or whether the checker reviewing a document and the editor choosing a position should stay separate, since `ADR-INFOSCHEMATICS-040` says a checker measures and never repairs — a creation surface asking it for a measurement is not a repair, but the boundary is close enough to state rather than assume.

Per `AGENTS.md` this needs the browser look to verify, since where a Card lands is exactly what a green suite cannot tell anyone.
