---
id: INFOSCHEMATICS-TOOL-050
area: TOOL
title: TypeScript CLI input
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-15T05:10:00Z
---

# TypeScript CLI input

## Goal

Decide whether trusted command-line workflows should be able to render an Infoschematic exported by an executable TypeScript module without weakening the canonical serialisable-data boundary.

## Context

The renderer command intentionally accepts YAML and JSON and rejects executable TypeScript. Programmatic TypeScript callers can already construct the canonical model through the library, but there is no CLI bridge for those trusted projects.

## Boundary

This item does not permit callbacks or runtime state in authored Infoschematic data, execute remote modules, silently trust arbitrary source, or replace YAML as the preferred authoring format.

## Current state

Rejection is an accepted, conforming contract, not an accident. `CLI-004` in [the command-line rendering specification](../specs/command-line-rendering.md) requires the command to reject executable TypeScript with guidance towards the programmatic libraries, and `packages/cli/src/index.ts` carries that guidance in its usage text. `packages/cli/src/index.test.ts` and `scripts/release/pack-smoke.ts` both hold evidence for it.

The examples confirm the workaround already works: `scripts/render-example.ts` imports the example packages directly and renders them through the library without any CLI bridge. So the open question is genuinely a decision, and the honest outcomes include keeping `CLI-004` exactly as it stands.

## Steps

- [ ] Gather the concrete workflows that motivate the request, and for each one record whether the programmatic library or a documented wrapper already serves it.
- [ ] Evaluate at least three options: retain rejection and document the programmatic path; publish a thin supported wrapper that loads a module and renders it; and add an explicit trusted-input mode to the command.
- [ ] Assess the trust boundary for each option, since loading a module executes code with the invoking user's authority, and state what an attacker gains from a malicious document path.
- [ ] Require that no option permits format auto-detection into execution: any executing path must be selected by an explicit flag whose name states that it runs code.
- [ ] Confirm that every option preserves the serialisable-data boundary in AGENTS.md, so no callback, store, or runtime state can enter an authored Infoschematic through a CLI route.
- [ ] Write the decision record with the chosen option and its rejected alternatives, and treat retention of `CLI-004` as a first-class acceptable outcome.
- [ ] Raise a separate implementation record only if the decision selects a change; this item completes when the decision is recorded.

## Files touched

- `docs/decisions/` for the decision record
- `docs/specs/command-line-rendering.md` to reference the governing decision from `CLI-004`
- `docs/guides/rendering-from-the-command-line.md` for the documented programmatic path

## Verify

Run `bun run self:check`. The deliverable is a decision, so verification is review-based: confirm the record states the chosen option, the evaluated alternatives, the trust-boundary reasoning, and the consequence for `CLI-004`; confirm `CLI-004` either cites the decision or has been amended by it; and confirm no product behaviour changed unless the decision explicitly selected a change.

## Dependencies / blocks

No dependency. This item deliberately precedes any implementation record so the trust boundary is settled before code executes untrusted input.

## Documentation impact

### Decision Records

This item exists to produce one. It must record the trust boundary, the options considered, and the outcome for `CLI-004`.

### Specifications

Amend or annotate `CLI-004` only as the decision directs. Retaining it unchanged with a citation is a valid result.

### Guides

Make the supported programmatic path easy to find, so the rejection diagnostic leads somewhere useful.

### Roadmap

Any implementation the decision selects becomes a separate record; this item is complete when the decision is recorded.

## Discussion

### Trust boundary

Loading a TypeScript module executes code with the user's authority and is fundamentally different from parsing data. Any future support needs an explicit trusted-input mode with clear security guidance rather than format auto-detection.

### Alternatives

A small programmatic wrapper around the renderer library may remain safer and clearer than adding module execution to the general command. Shaping should retain rejection if no compelling CLI-specific workflow exists.
