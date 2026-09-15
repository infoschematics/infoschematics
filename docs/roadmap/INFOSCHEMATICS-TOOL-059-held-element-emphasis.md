---
id: INFOSCHEMATICS-TOOL-059
area: TOOL
title: Held element emphasis
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-055]
baseline_ref: null
created_at: 2026-09-15T07:25:00Z
updated_at: 2026-09-15T07:25:00Z
---

# Held element emphasis

## Goal

Let a Dynamic emphasise an element for as long as a state lasts, so a presenter can say "this stage is the one we are on" and have the treatment stay rather than fire once and vanish.

## Context

Raised while reviewing Diagram dynamics (`INFOSCHEMATICS-TOOL-055`, delivered) against a real presentation. The IBC 2026 5G-EMERGE walkthrough wants the final step's element to keep pulsating while that step is on screen, which is a different statement from "something just happened here".

Every Dynamic occurrence delivered by TOOL-055 is finite: `emphasise-elements` outlines its targets for one token-owned duration and retires itself, and the only way to prolong it is to keep supplying new occurrence keys. That produces a stutter rather than a hold, makes the announcement repeat, and puts a timing loop in the host for something the document could state once.

[Scene signal treatments](INFOSCHEMATICS-TOOL-023-scene-signal-treatments.md) chooses when and how often a Dynamic plays from a Scene. This item is the other half: what a renderer does when asked to sustain one, which is a contract question rather than a playback policy.

## Boundary

This item does not introduce authored durations, easing, keyframes, timelines, offsets, or callbacks, and does not make a held treatment the default. It does not create persistent authored state: a held emphasis remains a runtime occurrence whose life the host or Scene still owns, and withdrawing the occurrence must end it. It does not change the finite kinds, and it does not make motion the only carrier of the state it depicts.

## Current state

`packages/view-canvas/src/element-emphasis.ts` retires every accepted emphasis after `visualTokens.canvas.emphasis.duration`, and `packages/view-canvas/src/styles.css` animates the outline once with `both` fill. The announcement in `Canvas.tsx` revises per accepted occurrence, so repeated re-triggering would also repeat the spoken text.

Static output already has the right answer for a held state: `packages/render-svg/src/index.ts` draws the still outline whenever a caller supplies the occurrence, with no notion of elapsed time.

## Steps

- [ ] Decide the authored surface: a held variant of `emphasise-elements`, or an occurrence-level statement that the host is describing a state rather than an event. Prefer the smaller of the two and record why.
- [ ] Give the held treatment its own full-motion, reduced-motion, and still interpretations, sharing the existing emphasis tokens; reduced motion must be a steady treatment rather than a slower pulse.
- [ ] Announce a held emphasis once when it begins and not again while it is held, and say something when it ends if a reader needs to know the state cleared.
- [ ] Keep withdrawal, replacement, scope filtering, and Scene change ending the hold exactly as they end a finite occurrence.
- [ ] Prove in a browser that a held emphasis is still painted after several times the finite duration, and that it stops when the occurrence is withdrawn.

## Files touched

- `packages/domain-model/src/` and `packages/domain-core/src/` if the authored surface changes
- `packages/view-model/src/dynamics.ts`
- `packages/view-canvas/src/element-emphasis.ts`, `Canvas.tsx`, and `styles.css`
- `packages/render-svg/src/` only if the still treatment needs to distinguish held from finite
- `docs/specs/diagram-dynamics.md` and `docs/decisions/`

## Verify

Run `bun run self:check`, then watch a held Dynamic in the browser for longer than the finite duration in both motion preferences and confirm the live region says its meaning once. Confirm still output is unchanged from the finite case unless the decision says it should differ.

## Dependencies / blocks

Needs the Dynamics contract from `INFOSCHEMATICS-TOOL-055`. Composes with `INFOSCHEMATICS-TOOL-023` rather than replacing any part of it.

## Documentation impact

### Decision Records

`ADR-INFOSCHEMATICS-026` excluded persistent presentation state deliberately. A held treatment needs that record extended or a companion decision saying why a host-owned hold is not the persistence it ruled out.

### Specifications

Add the held treatment's obligations to the `DYNAMIC` area, including its announcement and reduced-motion behaviour.

### Guides

Host-binding guidance gains the distinction between reporting an event and describing a state.

### Roadmap

None.
