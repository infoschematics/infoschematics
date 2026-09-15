# Command-line rendering — CLI

Portable document-to-SVG behaviour exposed by the published renderer command. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### CLI-001 — Portable document input

The `infoschematics render` command MUST accept canonical `.yaml`, `.yml`, and `.json` files or `-` for standard input through the Domain Core parser.

_Conformance:_ conforming

_Verify:_ exercise each accepted input form through the package tests and packed clean-consumer smoke.

_Evidence:_ `packages/cli/src/index.test.ts` and `scripts/release/pack-smoke.ts`.

### CLI-002 — Composable SVG output

The command MUST write deterministic SVG to standard output by default or only to the path named by `--output` when that option is present.

_Conformance:_ conforming

_Verify:_ compare YAML, JSON, standard-input, and explicit-file output byte for byte.

_Evidence:_ `packages/cli/src/index.test.ts` and `scripts/release/pack-smoke.ts`.

### CLI-003 — Clean diagnostic streams

Input, validation, usage, and output failures MUST return their documented non-zero status and write diagnostics only to standard error.

_Conformance:_ conforming

_Verify:_ provoke every failure class and assert status plus empty standard output.

_Evidence:_ `packages/cli/src/index.test.ts`; packed malformed, missing, and unsupported-input checks in `scripts/release/pack-smoke.ts`.

### CLI-004 — Inert authoring boundary

The command MUST reject executable TypeScript modules as input with guidance to use the programmatic libraries. Rejection MUST NOT depend on an option that makes execution follow from the pathname, per [ADR-INFOSCHEMATICS-021](../decisions/ADR-INFOSCHEMATICS-021-keep-command-line-input-inert.md).

_Conformance:_ conforming

_Verify:_ pass a `.ts` pathname and inspect the usage diagnostic and status.

_Evidence:_ `packages/cli/src/index.test.ts` and `scripts/release/pack-smoke.ts`.

## Quality properties

### CLI-005 — Publishable package boundary

The CLI package MUST remain a Node 22 ESM adapter whose workspace dependencies are limited to Domain Core and the static SVG renderer.

_Conformance:_ conforming

_Verify:_ build, typecheck, dependency-cruise, pack, install, and execute its binary from a clean consumer.

_Evidence:_ `packages/cli/package.json`, `.dependency-cruiser.ts`, `scripts/release/packages.ts`, and `scripts/release/pack-smoke.ts`.
