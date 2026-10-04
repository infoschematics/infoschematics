---
id: INFOSCHEMATICS-TOOL-141
area: TOOL
title: An option specified elsewhere
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-10-04T12:10:00Z
---

# An option specified elsewhere

## Goal

Every option the rendering command accepts is stated where a reader looks for command options.

## Context

`INFOSCHEMATICS-TOOL-114` added `--detail`, which hands the still renderer the same band the Canvas resolved from scale. Its requirement landed as `STATIC-021` in [the static-rendering specification](../specs/static-rendering.md), because that is where the band behaviour it describes belongs and it was the file the delivering boundary held.

Every other option is specified in [the command-line rendering specification](../specs/command-line-rendering.md) under the `CLI` prefix, which runs through `CLI-013`. So a reader assembling the command's full surface from its specification finds all of it in one place except this, and a reader who finds all of it in one place concludes wrongly that they have it all.

## Boundary

Where one requirement is stated, not what it requires. The detail band, its resolution from scale, and the split that keeps hysteresis in the view are settled by [ADR-INFOSCHEMATICS-039](../decisions/ADR-INFOSCHEMATICS-039-detail-is-a-band-of-scale-and-the-view-holds-the-hysteresis.md) and are unaffected.

The likely answer is a `CLI` requirement naming the option and deferring to `STATIC-021` for what a band means, rather than moving the text and leaving the still specification with a hole. Which of those it is, is the decision.

`GDR-INFOSCHEMATICS-005` holds the command-surface conventions and a single test over them, so whether that test should have caught this is part of the question.

## Current state

`render` accepts `--detail` (`packages/cli/src/options.ts`, `detailOf` rejects anything but the four bands), and only `STATIC-021` in `docs/specs/static-rendering.md` says so. The record's premise that every other option is in the `CLI` specification is also not quite true: `--scale` is named nowhere in `docs/specs/command-line-rendering.md` (`CLI-006` speaks only of "raster-only options"), and `--port` is only implied by `CLI-010`'s occupied-port status. Both are tested in `packages/cli/src/index.test.ts`.

`GDR-INFOSCHEMATICS-005` could not have caught this. It governs repository script names and states that it says nothing about how a command parses its own arguments; its `scripts/command-surface.test.ts` reads `package.json` scripts, not the published command's options. No check ties the option table to the specification, and adding one is a separate decision rather than part of this repair.

The answer to the Boundary's question is a `CLI` requirement naming the option and deferring to `STATIC-021` for what a band means. Moving the text would leave the still specification with a hole where its own option belongs.

## Steps

- [ ] Add `CLI-014` under User-observable behaviours in `docs/specs/command-line-rendering.md`: `render` accepts `--detail` naming one of the four bands, defaults to `full`, rejects any other value as a usage error, and draws the band as `STATIC-021` defines it.
- [ ] Name `--scale` in `CLI-006` as the raster-only option it is, and `--port` in `CLI-010`, so the command's full option surface is assembled from this one specification.
- [ ] Leave `STATIC-021` as it stands; its command-line sentence and the new requirement agree.

## Files touched

`docs/specs/command-line-rendering.md` only. `CLI-013` is left alone: `INFOSCHEMATICS-TOOL-129` rewrites it concurrently.

## Verify

Every option key in the `render` option table in `packages/cli/src/options.ts` appears in `docs/specs/command-line-rendering.md` (`for o in detail font format help host mode output port scale scheme serve watch; do grep -q -- "--$o" docs/specs/command-line-rendering.md || echo "$o"; done` prints only `help`). Run the command from source against an example document with `--detail outline` (exit `0`) and `--detail wide` (usage exit `2`) so the new requirement's behaviour is observed, not read. `bunx vitest run scripts/specification-evidence.test.ts` passes over the new requirement, `ki repo audit --skill ki-specs` passes, and `bun run self:check` passes.

## Dependencies / blocks

None blocking. `INFOSCHEMATICS-TOOL-129` edits `CLI-013` in the same file; this change keeps clear of that section and pulls before committing.

## Documentation impact

### Decision Records

None.

### Specifications

`docs/specs/command-line-rendering.md` gains `CLI-014` and names two existing options. `docs/specs/static-rendering.md` is unchanged.

### Guides

None.

### Roadmap

None.

## Discussion

Found on 2026-09-24 while delivering `INFOSCHEMATICS-TOOL-114`, whose boundary did not include the command-line specification. Captured rather than reached for.

Small, and worth doing for that reason: a specification a reader cannot trust to be complete costs more than the one requirement missing from it.

Adopted 2026-10-04 under the owner's delegated estate-push authority, moved from Triage to Now and shaped to Ready in the same change.
