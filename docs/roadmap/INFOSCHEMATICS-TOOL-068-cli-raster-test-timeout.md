---
id: INFOSCHEMATICS-TOOL-068
area: TOOL
title: Raster CLI test timeout
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 6921b1606dbfd754ac7209483e920c1b6a98ce47
created_at: 2026-09-15T14:50:00Z
updated_at: 2026-09-16T10:35:00Z
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

- `packages/cli/src/index.test.ts` has four rasterising cases; the scale case invokes the renderer twice and asserts the second output is twice the size.
- Neither `packages/cli/vitest.config.ts` nor `scripts/vitest-workspace.ts` sets `testTimeout`, so every workspace inherits the 5000 ms default.
- `bun run self:check` runs the twelve node suites concurrently with the typechecks and the website build.

## Steps

- [x] Measure what the raster cases cost alone and under a loaded gate, enough times to tell a slow test from a contended one, on a quiet tree.
- [x] Decide between a `testTimeout` for the raster cases, a package-level timeout, and a shared default in the generated workspace configuration — a repository-wide raise would hide genuinely hung tests elsewhere.
- [x] Consider whether the scale assertion needs two full rasterisations or can prove the same thing from one plus a cheaper measurement.
- [x] Confirm the choice holds under a forced full gate rather than a single suite run.

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

## Review

### Delivered

The four rasterising cases in `packages/cli/src/index.test.ts` run under a 20 000 ms suite budget instead of Vitest's 5000 ms default. Nothing else in the repository moved: the other eleven workspaces, and every other case in this one, keep the default.

### Summary of changes

- `packages/cli/src/index.test.ts` — `describe('renderer CLI raster output', { timeout: 20_000 }, …)`, with a comment recording the measurement that chose the number rather than the number alone.

`packages/cli/vitest.config.ts` and `scripts/vitest-workspace.ts` are untouched. Both were candidates in Files touched; the measurement ruled them out, because a package-level or generated-default raise would have covered the preview-server and argument-parsing cases that have no reason to be slow.

### Verification

- The raster cases alone, four runs on a quiet tree: the first to execute cost 1536 ms, 150 ms, 187 ms and 183 ms; the scale case, which rasterises twice, cost 426 ms, 365 ms, 398 ms and 463 ms; the file-output case 180–232 ms.
- The same cases under `turbo run test --force`, twelve suites competing for twelve cores: 1293 ms for the first, 371 ms for the scale case — within the spread of the unloaded runs.
- The budget was proved load-bearing by lowering it to 1 ms, which failed five cases with `test timed out in 1ms`, then restored.
- `bun run self:check --force` four times: 43/43 successful each time, 12.3 s, 13.5 s, 12.8 s, 12.3 s.

### Outstanding concerns

The 5002 ms failure seen during `TOOL-052` was never reproduced, so this is a budget set from measurement rather than a diagnosis of that run. The measurement does explain it: the first case to rasterise pays sharp's native initialisation, which varied tenfold — 150 ms to 1536 ms — on an otherwise quiet machine, while the image work either side of it stayed near 400 ms. A one-off with that spread, on a machine also swapping its TypeScript and Vite majors, is a plausible route to ten times the median. If the case times out again at 20 000 ms, the cause is not contention and the fix is not a larger number.

### Post-change review

The scale case was the suspect, and measurement cleared it: at 371–463 ms it is not meaningfully more expensive than the single-rasterisation cases, because the cost that matters is paid once per worker by whichever case runs first. Halving its rasterisations would have removed roughly 200 ms from a case that was never the problem, and cost the assertion that the option changes real output. It stands unchanged.

### Mini recap

A fixed 5000 ms budget was being asked to cover a one-off native initialisation with a tenfold spread. The rasterising cases now say what they cost; everything else still says 5000 ms, so a hung test elsewhere is still caught within five seconds.

## Discussion

### What the gate should tolerate

Shaping should decide the principle before the number: whether a test is allowed to be slow enough that its budget depends on machine load, or whether a case that costs seconds belongs behind a deliberate longer timeout that says so.
