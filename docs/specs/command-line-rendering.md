# Command-line rendering — CLI

Portable document-to-image behaviour exposed by the published renderer command. Part of the [Specifications corpus](index.md).

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

### CLI-006 — Opt-in raster output

The command MUST write SVG when no format is named, and MUST write PNG bytes when `--format png` is given, leaving standard output binary-clean so the result can be piped or redirected. Raster-only options MUST be rejected as usage errors when the output stays SVG.

_Conformance:_ conforming

_Verify:_ render one document with and without `--format png`, assert the PNG signature on standard output and in a written file, and provoke a raster option against SVG output.

_Evidence:_ `packages/cli/src/index.test.ts` and `scripts/release/pack-smoke.ts`.

### CLI-007 — Raster determinism and the font boundary

Rendering one document to PNG twice on one machine MUST produce identical bytes, and equivalent YAML and JSON documents MUST produce identical bytes. Text is the only host-dependent part: without `--font` the host font stack is used and identity is not promised across machines; with `--font` only the named files are consulted. An unreadable `--font` file MUST fail with the input status rather than falling back silently to the host stack.

_Conformance:_ conforming

_Verify:_ compare repeated renders byte for byte in the workspace and from a packed clean consumer, and name a missing font file.

_Evidence:_ `packages/cli/src/index.test.ts`, `packages/cli/src/raster.ts`, and `scripts/release/pack-smoke.ts`.

### CLI-008 — Watched authoring loop

`--watch` MUST require `--output` and a file input, render once on start, and re-render after each change to the named document. It MUST watch only that document, and MUST coalesce a burst of writes — including a save that replaces the file by rename — into a single render.

_Conformance:_ conforming

_Verify:_ through the injected watch primitive, assert the initial render, a render per change, one render for a burst, and the usage failures for standard output and standard input; assert the real primitive against a rename on disk.

_Evidence:_ `packages/cli/src/index.test.ts` and `packages/cli/src/index.ts`.

### CLI-009 — Retained output and recovery

A watched render that fails MUST write its diagnostic to standard error, leave the last successful output untouched, and keep watching, recovering on the next document that validates. Interruption MUST release the watcher and return status `130`, distinct from every failure status.

_Conformance:_ conforming

_Verify:_ invalidate a watched document, assert the retained output and the diagnostic, restore it, and cancel the session.

_Evidence:_ `packages/cli/src/index.test.ts`.

## Quality properties

### CLI-005 — Publishable package boundary

The CLI package MUST remain a Node 22 ESM adapter whose workspace dependencies are limited to Domain Core and the static SVG renderer. Its third-party runtime dependencies MUST be limited to the named raster conversion engine `@resvg/resvg-js`, per [ADR-INFOSCHEMATICS-024](../decisions/ADR-INFOSCHEMATICS-024-rasterise-with-a-native-resvg-binding.md); any further third-party runtime dependency requires amending this requirement.

_Conformance:_ conforming

_Verify:_ build, typecheck, dependency-cruise, pack, install, and execute its binary from a clean consumer.

_Evidence:_ `packages/cli/package.json`, `.dependency-cruiser.ts`, `scripts/release/packages.ts`, and `scripts/release/pack-smoke.ts`.
