---
id: INFOSCHEMATICS-TOOL-050
area: TOOL
title: TypeScript CLI input
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-15T06:25:00Z
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

- [x] Gather the concrete workflows that motivate the request, and for each one record whether the programmatic library or a documented wrapper already serves it.
- [x] Evaluate at least three options: retain rejection and document the programmatic path; publish a thin supported wrapper that loads a module and renders it; and add an explicit trusted-input mode to the command.
- [x] Assess the trust boundary for each option, since loading a module executes code with the invoking user's authority, and state what an attacker gains from a malicious document path.
- [x] Require that no option permits format auto-detection into execution: any executing path must be selected by an explicit flag whose name states that it runs code.
- [x] Confirm that every option preserves the serialisable-data boundary in AGENTS.md, so no callback, store, or runtime state can enter an authored Infoschematic through a CLI route.
- [x] Write the decision record with the chosen option and its rejected alternatives, and treat retention of `CLI-004` as a first-class acceptable outcome.
- [x] Raise a separate implementation record only if the decision selects a change; this item completes when the decision is recorded.

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

## Review

### Delivered

A decision on executable command-line input, recorded as [ADR-INFOSCHEMATICS-021](../decisions/ADR-INFOSCHEMATICS-021-keep-command-line-input-inert.md): retain `CLI-004` unchanged, leave TypeScript execution with the consumer, and reject extension-driven auto-detection permanently rather than deferring it. No product behaviour changed, because the decision selected retention.

### Summary of changes

`docs/decisions/ADR-INFOSCHEMATICS-021-keep-command-line-input-inert.md` is new and records the trust boundary, the two declined alternatives (a module-loading `--typescript` flag, and a separate executable-input command), and the condition any future revisit must meet. `docs/decisions/README.md` lists it at 27 and renumbers the two repository-operation entries. `CLI-004` in `docs/specs/command-line-rendering.md` keeps its conforming status and gains a requirement that rejection must not depend on an option making execution follow from the pathname, citing the record. `docs/guides/rendering-from-the-command-line.md` replaces its one-line deferral with a `## Render a TypeScript definition` section carrying a four-line worked snippet and the reasoning, so the rejection diagnostic now leads somewhere useful.

### Verification

`bun run self:check`. The deliverable is a decision, so the substantive check is review-based: the record states the chosen option, the evaluated alternatives, the trust-boundary reasoning, and the consequence for `CLI-004`; `CLI-004` cites the record; no source file under `packages/` changed.

### Outstanding concerns

The guide's snippet is prose, not an executed example, so it is not covered by a test. `scripts/render-example.ts` exercises the same call shape, which is why the section points at it. Nothing here blocks review.

### Post-change review

The trust argument is the load-bearing part and should be read as such: extension-driven execution is rejected because `render model.ts` and `render model.yaml` are indistinguishable at a call site, not because TypeScript authoring is discouraged. The record deliberately leaves an explicit-flag route open to a future decision rather than closing the subject.

### Mini recap

Decision-only item, no code. `CLI-004` stands, now with a recorded reason and a guide section that makes the supported programmatic path easy to find.
