---
id: INFOSCHEMATICS-TOOL-085
area: TOOL
title: An accepted document throws a geometry error at the command line
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-084]
baseline_ref: b8325a18298dfc8967da31de7c22cc22a58d53d7
created_at: 2026-09-17T09:41:00Z
updated_at: 2026-09-18T11:55:00Z
---

# An accepted document throws a geometry error at the command line

## Goal

Make a document the contract accepts either render or be refused in the shape `AUTHOR-005` defines, so an author is told which Flow is wrong rather than shown a stack trace from inside the geometry module.

## Context

Found by hand while delivering `INFOSCHEMATICS-TOOL-057`, and recorded there and as `COMPOSE-003` in `docs/specs/composition.md`.

A document whose single Flow is authored `LEFT E1 -> RIGHT W1` between two Cards at different vertical positions passes `parseInfoschematic` with no issues — the referential checks confirm both Cards and both ports exist, and nothing in the contract requires the two to be axis-aligned. `infoschematics render` on the same document then exits non-zero having printed an interpreter stack trace whose innermost frame is `routePath` in `packages/view-model/src/geometry.ts`. The exit status and the stream are both correct, which is why `CLI-003` stays conforming; what the author is handed is the trace.

Same root cause as `INFOSCHEMATICS-TOOL-084` — geometry refuses a route the contract admitted — but a different surface and a different required shape: there, a host must stay mounted; here, a caller must receive a result it can act on.

## Boundary

This item does not decide that unaligned ports become legal. It adds the refusal where a caller can read it, or renders something legible, and it does not silently repair authored geometry.

## Current state

Read against `b8325a18` on 2026-09-18, and reproduced from a document written for the purpose: two Cards at different vertical positions, one Flow authored `link: LEFT E1 -> RIGHT W1`, nothing else.

`parseInfoschematic` accepts it with no issues. `infoschematics render` on the same document then prints an interpreter stack trace and exits non-zero:

```text
error: A route may not run diagonally: 140,50 to 240,230
      at routePath (packages/view-model/src/geometry.ts:45:17)
      at <anonymous> (packages/view-model/src/runtime.ts:310:10)
      at createInfoschematicRuntime (packages/view-model/src/runtime.ts:289:49)
      at renderInfoschematicSvg (packages/render-svg/src/index.ts:417:19)
      at <anonymous> (packages/cli/src/index.ts:104:15)
```

Every frame in that trace is current at this baseline. `scripts/render-example.ts` catches the same throw and prints one clean line, which is why the defect is invisible from the repository's own render script and visible only on the published command.

`INFOSCHEMATICS-TOOL-084` has now settled the shared root cause in favour of deriving the bend, so this item is that fix seen from the command line plus the case that holds it there.

## Steps

1. [x] Decide whether the constraint belongs in validation or in the derivation. **The derivation**, following `INFOSCHEMATICS-TOOL-084`: unaligned ports stay legal and the route bends. Tightening validation instead would reject documents the contract has always accepted, and would still leave the interactive hosts unmounting.
2. [x] Land `INFOSCHEMATICS-TOOL-084`'s derivation first, then confirm this document renders rather than throws.
3. [x] Add the command-line case `COMPOSE-003` names, on the published surface rather than the parser alone, proving it fails when the naked two-point derivation is restored.
4. [x] Give the command a legible failure for a geometry error that does survive, so no future construction throw reaches an author as a stack trace: `packages/cli/src/index.ts:104` calls `renderInfoschematicSvg` outside any handling of its own.
5. [x] Move `COMPOSE-003` to `conforming` and repoint its evidence at the case.

## Files touched

- `packages/cli/src/index.ts:104` — the unguarded `renderInfoschematicSvg` call whose throw reaches the author
- `packages/cli/src/index.test.ts` — the published-surface case, and the legible failure
- `docs/specs/composition.md` — `COMPOSE-003`'s conformance and evidence
- `docs/specs/command-line-rendering.md` — `CLI-003` gains the construction failure, and its gap goes
- `packages/view-model/src/runtime.test.ts` — the new cases' configurations, which did not typecheck as first written

`bun run test --filter=@infoschematics/cli`, and by hand: render a document with an unaligned two-port Flow and read what the command prints.

`INFOSCHEMATICS-TOOL-084` carries the derivation this item's step 2 depends on; land it first. The command's own failure shape — step 4 — is independent of it.

## Documentation impact

### Specifications

`docs/specs/composition.md` changes `COMPOSE-003`'s conformance state. `AUTHOR-005`'s issue vocabulary is untouched, because the answer is derivation rather than a new validation issue. `docs/specs/command-line.md` may gain a sentence requiring a legible failure for a construction error, which is what step 4 delivers.

### Decision Records

None. The decision that mattered belongs to `INFOSCHEMATICS-TOOL-084` and does not change what a document may say.

### Guides

None.

## Review

### Delivered

`infoschematics render` no longer hands an author a stack trace. A document whose two-port Flow is not axis-aligned now renders, because the command shares `INFOSCHEMATICS-TOOL-084`'s derivation, and a geometry error that survives that — a diagonal an author wrote as waypoints — is reported as one sentence naming the document, with the validation status, on standard error alone.

### Summary of changes

- `packages/cli/src/index.ts` — `renderDocument` wraps `renderInfoschematicSvg`, returning `Cannot render <document>: <reason>` with `rendererCliExit.validation`, in the same shape as the input and rasterise failures beside it.
- `packages/cli/src/index.test.ts` — two cases on the published surface: the unaligned document renders with an orthogonal path that has a bend, and the authored diagonal produces exactly that one-line diagnostic with no stack frame and empty standard output.
- `docs/specs/composition.md` — `COMPOSE-003` moves to `conforming`, its evidence repointed at those cases and the guard.
- `docs/specs/command-line-rendering.md` — `CLI-003` requires a construction failure to be reported in the same shape rather than as an interpreter stack trace, and its gap paragraph is gone.
- `packages/view-model/src/runtime.test.ts` — the cases delivered with `INFOSCHEMATICS-TOOL-084` ran green but did not typecheck: the configurations were missing `scope`, `scopes`, a family `prefix` and a flow `id`, and the port was a bare `string`. Corrected here.

### Verification

| Gate | Outcome |
| --- | --- |
| `bunx turbo run test typecheck --filter=@infoschematics/cli --filter=@infoschematics/view-model --force` | Pass — 34 and 196 tests, both typechecks clean |
| `bunx turbo run typecheck` | Pass — 13 workspaces |
| `bunx vitest run --root .` | Pass — 95 tests |
| Non-vacuity, naked two-point derivation restored | The unaligned case fails as required |
| Hand check, `render` on an unaligned document | Exit 0, route `M140 50 H220 V230 H240` |
| Hand check, `render` on an authored diagonal | Exit 4, one sentence, no frames |

### Post-change review

The guard matters beyond this defect: `scripts/render-example.ts` already caught the same throw and printed one clean line, which is precisely why the repository's own tooling never showed the problem and the published command did. A surface that is only exercised through a wrapper hides its own failure shape.

The typecheck miss on `runtime.test.ts` is the useful finding: `bunx turbo run test typecheck --filter=…` reported green for `INFOSCHEMATICS-TOOL-084` because the typecheck task was replayed from cache against inputs that predated the test file's last edit, so a suite that ran and a compiler that did not both read as one pass. `--force` is what distinguishes them.

### Outstanding concerns

The validation status now covers two different causes — a parse issue and a construction error — and a caller matching on status alone cannot tell them apart. The diagnostics differ, and `CLI-003` promises only the status and the stream, so this is a naming judgement rather than a defect; a distinct status would be a public-contract change and is not taken here.

### Mini recap

One derivation shared with `INFOSCHEMATICS-TOOL-084` removes the common case; a guard at the published surface keeps every remaining geometry error legible.

## Discussion

Shaped on 2026-09-18 against `b8325a18`. The record's own step 1 anticipated this outcome: with `INFOSCHEMATICS-TOOL-084` deriving the bend, what is left here is the published-surface case and the command's behaviour when a construction does throw. The second is worth keeping even after the first is fixed — a stack trace is the wrong answer for any geometry error, not just this one.
