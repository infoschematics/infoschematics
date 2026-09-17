---
id: INFOSCHEMATICS-TOOL-085
area: TOOL
title: An accepted document throws a geometry error at the command line
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-17T09:41:00Z
updated_at: 2026-09-17T09:41:00Z
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

## Steps

1. [ ] Decide whether the constraint belongs in the contract's validation (an issue whose path names the Flow) or in the renderer (a derivation that produces a drawable route). If `INFOSCHEMATICS-TOOL-084` picks the derivation, this becomes the same fix seen from the command line and mostly needs the case.
2. [ ] If validation: add the check beside the referential checks in `packages/domain-core/src/parse.ts`, carrying the Flow's id and both port references in the issue path.
3. [ ] Add the command-line case `COMPOSE-003` names, on the published surface rather than the parser alone, proving it fails when the check is removed.
4. [ ] Confirm no authored Infoschematic in `examples/` relies on an unaligned two-port Flow before any validation tightening lands.
5. [ ] Move `COMPOSE-003` to `conforming` and repoint its evidence at the case.

## Files touched

- `packages/domain-core/src/parse.ts` — the discriminated result this has to extend, if the answer is validation
- `packages/domain-core/src/parse.test.ts` — the issue's shape and path
- `packages/cli/src/index.test.ts` — the published-surface case
- `docs/specs/composition.md` — `COMPOSE-003`'s conformance and evidence

## Verify

`bun run test --filter=@infoschematics/domain-core`, `bun run test --filter=@infoschematics/cli`, and by hand: render a document with an unaligned two-port Flow and read what the command prints.

## Dependencies / blocks

Nothing blocks it. Shares a root cause with `INFOSCHEMATICS-TOOL-084`; deciding that item's step 1 first avoids fixing the same thing twice in two shapes.

## Documentation impact

`docs/specs/composition.md` changes conformance state. If validation tightens, `AUTHOR-005`'s issue vocabulary and `docs/specs/authoring.md` gain the new issue.
