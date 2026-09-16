---
id: INFOSCHEMATICS-TOOL-074
area: TOOL
title: The boundary gate cruises nothing
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T13:55:00Z
updated_at: 2026-09-16T18:20:00Z
---

# The boundary gate cruises nothing

## Goal

Make the dependency-boundary check examine the repository, and fail loudly when it cannot, so the architecture guarantee [the repository guidance](../../AGENTS.md) rests on is actually enforced.

## Context

Found on 2026-09-16 while delivering scoped renderer definition identity (`INFOSCHEMATICS-TOOL-058`), and confirmed independently:

    $ bun run self:boundaries:verify
    ✔ no dependency violations found (0 modules, 0 dependencies cruised)

Zero modules. The check reports success because it found nothing to examine, and it prints the reason immediately afterwards — after the success line, not before it, so the green is read and acted on before the caveat appears: dependency-cruiser cannot use the TypeScript 7 compiler API, advises installing `typescript@^6`, and states that support for `typescript@>=7` "will follow when its API is published and stable". The repository is on `typescript: ^7.0.2`, so the boundary gate went vacuous the moment TypeScript was upgraded, and nothing said so.

This matters more than the individual finding. `AGENTS.md` states that `bun run self:check` "verifies tests, every TypeScript workspace, dependency boundaries, and the production website build", and [the architecture guide](../design/architecture.md) documents a dependency direction that this check exists to hold. Every green run since the TypeScript upgrade has asserted a boundary guarantee it did not test — including all nine items accepted at `2988e104` and pruned at `8c2a8c35`.

It is the third instance of one pattern found in a single day, which is the real lesson: a check that passes while measuring nothing is worse than no check, because it is read as evidence. The others were a raster comparison proving two outputs agree rather than either being right, and a task whose `inputs` let it replay a green it had not earned.

## Boundary

Restore real boundary enforcement and make vacuity fail. This item does not redesign the dependency rules themselves, does not change the documented dependency direction, and does not downgrade TypeScript for the repository as a whole.

## Steps

1. [ ] Make vacuity fail first, before choosing how to fix the cruise. Assert that the boundary check examined more than zero modules — a floor near the real module count, not merely non-zero — so this cannot silently recur when a future toolchain bump breaks the parser again. Verifiable by the assertion failing on today's tree, before anything else changes.
2. [ ] Establish which resolution actually works, by trying rather than by reading: a TypeScript 6 parser made available to dependency-cruiser alone without moving the repository off TypeScript 7; dependency-cruiser's own non-TypeScript resolution; or a different boundary tool. Record what each one cruised. Verifiable by the module and dependency counts each option reports.
3. [ ] Prove the restored check catches a real violation: add an import that crosses the documented dependency direction — a `packages/domain-model` file importing from `packages/view-canvas`, say — and watch it fail. Revert it. Verifiable by that failure naming the rule.
4. [ ] Confirm whether any boundary violation accumulated while the gate was blind, and report what is found. Fixing them, if there are any, is separate work and gets its own record. Verifiable by the restored check's output on the unmodified tree.
5. [ ] Correct `AGENTS.md` if the resolution changes what the gate can honestly claim, and record the vacuity floor beside the dependency rules so the next reader knows why it is there.

## Files touched

- `package.json` and possibly `bun.lock`, for whatever parser or tool step 2 settles
- `.dependency-cruiser.ts`
- `turbo.json`
- a new or existing script under `scripts/`, for the vacuity floor
- `AGENTS.md` and `docs/design/architecture.md`, if the claim changes

## Verify

- The boundary check reports a module count consistent with the repository's actual source tree, and fails when handed a deliberate violation.
- The vacuity floor fails on a tree where the parser cannot resolve anything.
- `bun run self:check` passes, and its boundary task is no longer replayable from a cache entry earned while blind — force it once with `turbo run … --force`.

## Dependencies / blocks

None, and it should not wait behind feature work. Every delivery made while this is blind carries an unproven boundary claim.

## Documentation impact

### Specifications

None expected.

### Guides

`AGENTS.md` and the architecture guide, only to the extent the gate's honest claim changes.

## Discussion

Step 1 comes first deliberately. The tempting order is to fix the parser and then trust the green, but that leaves the same trap armed for the next toolchain bump: a check whose failure mode is silence needs an assertion about its own coverage, not a better parser. The floor is the durable part of this item; which parser gets it working again is incidental and will change.
