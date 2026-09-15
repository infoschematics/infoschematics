---
id: INFOSCHEMATICS-TOOL-068
area: TOOL
title: Raster CLI test timeout
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T14:50:00Z
updated_at: 2026-09-15T15:00:00Z
---

# Raster CLI test timeout

## Goal

Give the rasterising command-line cases a time budget that reflects what they actually do, so the gate does not report a failure that says only that the machine was busy.

## Context

`packages/cli/src/index.test.ts` covers `--format png`, which rasterises a rendered document through `sharp`. One case renders the same document twice at different scales to prove the scale option changes the output. That is real image work, and it runs under Vitest's default 5000 ms per-test timeout.

During `TOOL-052` the scale case timed out once at 5002 ms, then passed on its own and under four subsequent full gates. What changed around it is the gate: `TOOL-067` made every stage a Turborepo task, so where the stages used to run in series, thirteen typechecks, twelve node suites, three browser suites and the website build now compete for the same cores. A test whose cost is CPU-bound rather than fixed is exactly the kind that becomes marginal when the run around it stops being serial.

A one-in-five failure that a rerun clears is worse than a slow test. It teaches the reader to rerun the gate rather than read it, and the next real failure arrives looking the same.

## Boundary

This item changes test time budgets and, if measurement justifies it, how many times these cases rasterise. It does not change the `--format png` behaviour, the raster pipeline, `sharp`, or the gate's task graph.

## Current state

- `packages/cli/src/index.test.ts` has three PNG cases; the scale case invokes the renderer twice and asserts the second output is wider.
- Neither `packages/cli/vitest.config.ts` nor `scripts/vitest-workspace.ts` sets `testTimeout`, so every workspace inherits the 5000 ms default.
- `bun run self:check` runs the twelve node suites concurrently with the typechecks and the website build.

## Steps

- [ ] Measure what the raster cases cost alone and under a loaded gate, enough times to tell a slow test from a contended one, on a quiet tree.
- [ ] Decide between a `testTimeout` for the raster cases, a package-level timeout, and a shared default in the generated workspace configuration — a repository-wide raise would hide genuinely hung tests elsewhere.
- [ ] Consider whether the scale assertion needs two full rasterisations or can prove the same thing from one plus a cheaper measurement.
- [ ] Confirm the choice holds under a forced full gate rather than a single suite run.

## Files touched

- `packages/cli/src/index.test.ts`
- `packages/cli/vitest.config.ts` or `scripts/vitest-workspace.ts`, depending on the scope chosen

## Verify

Run `bun run self:check --force` several times on an otherwise quiet tree and confirm the raster cases pass every time with margin, not just once.

## Dependencies / blocks

None. Found during `INFOSCHEMATICS-TOOL-052`, caused by neither of that item's upgrades.

## Documentation impact

### Decision Records

None.

### Specifications

None. The command-line behaviour is unchanged.

### Guides

Contributor guidance if a per-workspace timeout convention comes out of it.

### Roadmap

None.

## Discussion

### What the gate should tolerate

Shaping should decide the principle before the number: whether a test is allowed to be slow enough that its budget depends on machine load, or whether a case that costs seconds belongs behind a deliberate longer timeout that says so.
