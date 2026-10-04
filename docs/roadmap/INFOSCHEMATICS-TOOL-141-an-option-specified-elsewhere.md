---
id: INFOSCHEMATICS-TOOL-141
area: TOOL
title: An option specified elsewhere
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: c70df23730a545f9c6bfcbc47c1f1818552d832f
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-10-04T13:25:00Z
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

- [x] Add `CLI-014` under User-observable behaviours in `docs/specs/command-line-rendering.md`: `render` accepts `--detail` naming one of the four bands, defaults to `full`, rejects any other value as a usage error, and draws the band as `STATIC-021` defines it.
- [x] Name `--scale` in `CLI-006` as the raster-only option it is, and `--port` in `CLI-010`, so the command's full option surface is assembled from this one specification.
- [x] Leave `STATIC-021` as it stands; its command-line sentence and the new requirement agree.

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

## Review

### Delivered

The command-line specification now names every `render` option a caller can pass except `--help`: `CLI-014` specifies `--detail` (the four bands, the `full` default, and the usage error for any other value, drawn as `STATIC-021` defines), `CLI-006` names `--scale` with `--font` as the raster-only options, and `CLI-010` names `--port`, its default and `0`, and the usage error for `--host` or `--port` without `--serve`. Each statement describes behaviour the code and its existing tests already show; nothing in the command changed. Baseline `c70df23730a545f9c6bfcbc47c1f1818552d832f`.

The specification edit was staged as a blob built from `HEAD` plus only this item's hunks, so another agent's uncommitted `CLI-013` change stays out of this commit and in that agent's working tree.

### Change Summary

- `docs/specs/command-line-rendering.md` - new `CLI-014 — A caller names a detail band` under User-observable behaviours, with conformance, verify and evidence; `CLI-006` names `--scale` (positive, default `1`) and `--font` as raster-only and adds a non-positive scale to its Verify; `CLI-010` names `--port` (default `4680`, `0` lets the system choose) and the usage error for `--host` or `--port` without `--serve`, and adds that case to its Verify. `CLI-013` and `STATIC-021` untouched.
- `docs/roadmap/INFOSCHEMATICS-TOOL-141-an-option-specified-elsewhere.md` - this packet.

### Verification

- `for o in detail font format help host mode output port scale scheme serve watch; do grep -q -- "--$o" docs/specs/command-line-rendering.md || echo "$o"; done` - prints only `help`.
- From source against `examples/is-system/infoschematic.yaml`: `bun packages/cli/src/bin.ts render <doc> --detail outline` exit `0` and output differs from the default render; no option and `--detail full` exit `0` and are byte-identical; `--detail wide` exit `2`, standard output empty, standard error `Unsupported detail band wide. Expected minimal, outline, identified, full.` followed by usage.
- The `--scale` and `--port` statements checked against `scaleOf`, `portOf` and the `--serve` guard in `packages/cli/src/options.ts`, and the existing `--scale wide`/`0`, `--port 0` and `--port 8080` without `--serve` cases in `packages/cli/src/index.test.ts`.
- `bunx vitest run --root . scripts/specification-evidence.test.ts` - 6 passed.
- `ki repo audit --skill ki-specs` - PASS.
- `bunx rumdl check docs/specs/command-line-rendering.md` - no issues.
- `bun run self:check` - passed (52 of 52 tasks).

### Outstanding concerns

- `CLI-014` is evidenced by the parser and the renderer's band cases, not by a command-level test: `packages/cli/src/index.test.ts` was under another agent's uncommitted change, so no `--detail` case was added. A small follow-up could add one; the behaviour was observed directly above.
- Another agent's concurrent commit briefly swept the staged specification blob into its own commit and then recut it without it; the change is in this item's commit only.

### Post-change review

The goal is met: a reader can assemble the command's whole option surface from this one specification, and every new sentence matches the code. Scope held to the three named requirements; `STATIC-021` already agreed with `CLI-014` and was left as it stands. Ready for acceptance.

### Mini recap

`--detail`, `--scale` and `--port` are now specified in the command-line specification, confirmed against the running command. Learning route (not promoted): with several agents committing from one checkout, staging ahead of the commit leaves the index exposed, so stage and commit in one command.

## Discussion

Found on 2026-09-24 while delivering `INFOSCHEMATICS-TOOL-114`, whose boundary did not include the command-line specification. Captured rather than reached for.

Small, and worth doing for that reason: a specification a reader cannot trust to be complete costs more than the one requirement missing from it.

Adopted 2026-10-04 under the owner's delegated estate-push authority, moved from Triage to Now and shaped to Ready in the same change.
