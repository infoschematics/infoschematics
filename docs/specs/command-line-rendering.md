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

Input, validation, usage, and output failures MUST return their documented non-zero status and write diagnostics only to standard error. A failure raised while constructing or rendering a document MUST be reported in that same shape — the document named, the reason in one sentence — and MUST NOT reach a caller as an interpreter stack trace.

_Conformance:_ conforming

_Verify:_ provoke every failure class and assert status plus empty standard output, including a document whose geometry the renderer refuses: its diagnostic MUST name the document and carry no stack frame.

_Evidence:_ `packages/cli/src/index.test.ts`, whose cases include an authored diagonal reported as one sentence with the validation status; packed malformed, missing, and unsupported-input checks in `scripts/release/pack-smoke.ts`.

### CLI-004 — Inert authoring boundary

The command MUST reject executable TypeScript modules as input with guidance to use the programmatic libraries. Rejection MUST NOT depend on an option that makes execution follow from the pathname, per [ADR-INFOSCHEMATICS-017](../decisions/ADR-INFOSCHEMATICS-017-the-renderer-command-is-thin-and-its-input-is-inert.md).

_Conformance:_ conforming

_Verify:_ pass a `.ts` pathname and inspect the usage diagnostic and status.

_Evidence:_ `packages/cli/src/index.test.ts` and `scripts/release/pack-smoke.ts`.

### CLI-006 — Opt-in raster output

The command MUST write SVG when no format is named, and MUST write PNG bytes when `--format png` is given, leaving standard output binary-clean so the result can be piped or redirected. Raster-only options MUST be rejected as usage errors when the output stays SVG.

_Conformance:_ conforming

_Verify:_ render one document with and without `--format png`, assert the PNG signature on standard output and in a written file, and provoke a raster option against SVG output.

_Evidence:_ `packages/cli/src/index.test.ts` and `scripts/release/pack-smoke.ts`.

### CLI-007 — Raster determinism and the font boundary

Rendering one document to PNG twice on one machine MUST produce identical bytes, and equivalent YAML and JSON documents MUST produce identical bytes. Text is the only host-dependent part: without `--font` the host font stack is used and identity is not promised across machines; with `--font` only the named files are consulted. An unreadable `--font` file MUST fail with the input status rather than falling back silently to the host stack. Determinism is not fidelity: the converter implements a subset of SVG, so output a browser draws correctly MAY rasterise wrongly and do so identically every time. PNG output MUST be the same picture as the SVG the command would have written for the same document, which puts the rasteriser-safe static output STATIC-013 in [the static rendering specification](static-rendering.md) requires inside this promise rather than outside it, where a byte comparison cannot see it.

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

### CLI-010 — Local preview surface

`--serve` MUST bind loopback only unless another interface is named by `--host`, which MUST report that the preview is reachable from the network. It MUST serve exactly the preview page, the current render, and a refresh stream, returning 404 for every other pathname without consulting the filesystem, per [ADR-INFOSCHEMATICS-023](../decisions/ADR-INFOSCHEMATICS-023-keep-the-preview-server-local-and-in-memory.md). Responses MUST forbid caching. An occupied port MUST fail with status `6` rather than binding a different one.

_Conformance:_ conforming

_Verify:_ fetch the render and compare it with the equivalent file render, request paths outside the served surface, inspect cache headers, and start a session against a port already bound.

_Evidence:_ `packages/cli/src/index.test.ts` and `packages/cli/src/serve.ts`.

### CLI-011 — Preview refresh and retained render

A served session MUST re-render on change and push a refresh to open pages. A render that fails MUST leave the previous render served and show its diagnostic on the page as text. Interruption MUST release the socket and the watcher.

_Conformance:_ conforming

_Verify:_ subscribe to the refresh stream and change the document; invalidate the document and assert the retained render and the escaped diagnostic; cancel the session and assert the socket is refused.

_Evidence:_ `packages/cli/src/index.test.ts`.

### CLI-012 — Checking the drawing a document describes

The `infoschematics check` command MUST accept the same inputs as `render` and report what is wrong with the drawing the document describes, per [the drawing diagnostics specification](diagnostics.md). It MUST write the findings to standard output, MUST offer `--json` for a caller that parses rather than reads, and MUST change nothing: no file is written and no repair is applied. It MUST exit `0` when the drawing reads and `1` when a finding says it cannot be read as authored, so a pipeline can gate on the status alone. A document that does not parse MUST fail with the validation status, exactly as rendering does, rather than being reported as a drawing fault.

_Conformance:_ conforming

_Verify:_ check a well-drawn document, a document with an error, and a document whose only finding is an observation, and read the status and the streams of each; then check an invalid document and confirm it fails as a validation failure.

_Evidence:_ `packages/cli/src/index.test.ts`, whose `drawing check` cases cover the clean, error, observation, `--json`, rejected-option and invalid-document paths.

## Quality properties

### CLI-013 — A caller names a ground, not a style

`render` MUST accept `--mode` as `light`, `dark`, or `system`. A named mode MUST be resolved once and written as colours, so the file keeps the ground it was given rather than becoming another one later. `system` MUST write one SVG carrying both palettes behind `prefers-color-scheme`, and MUST be refused with the usage exit for `--format png`, because a raster's colour is settled before its pixels exist.

Absence MUST NOT mean `light`. A document may author its own mode, and a flag defaulted to a value would overrule it on every render; the command MUST pass nothing on rather than choosing for the document. Where neither the caller nor the document names a ground, the rendering MUST resolve to `light`, because a still picture has no reader's preference to read and an unresolved palette rasterises to nothing.

`--scheme` MUST keep working as the retired spelling of `--mode`, with `adaptive` accepted for `system`. It MUST also accept `blueprint`, which named a palette under the retired vocabulary and names a style now, and MUST treat it as naming no ground at all: a style is authored by the document per [ADR-INFOSCHEMATICS-037](../decisions/ADR-INFOSCHEMATICS-037-a-palette-belongs-to-a-colour-scheme-not-an-outlet.md), and letting a caller name one here would let whoever renders a document contradict what it is.

_Conformance:_ conforming

_Verify:_ Render one document under each mode and confirm the outputs differ; render a document authoring a blueprint style under both grounds and confirm it stays a blueprint on each while the two differ; confirm `--scheme blueprint` renders the same bytes as passing no option at all; confirm `--mode system` emits the media rule, and that `--mode system --format png` and `--scheme sepia` both exit with the usage status and write nothing to standard output.

_Evidence:_ `packages/cli/src/options.ts` and `packages/cli/src/index.test.ts`.

### CLI-005 — Publishable package boundary

The CLI package MUST remain a Node 22 ESM adapter whose workspace dependencies are limited to Domain Core, the static SVG renderer, and View Model, whose drawing review CLI-012 reports. Its third-party runtime dependencies MUST be limited to the named raster conversion engine `@resvg/resvg-js`, per [ADR-INFOSCHEMATICS-022](../decisions/ADR-INFOSCHEMATICS-022-rasterise-with-a-native-resvg-binding.md); any further third-party runtime dependency requires amending this requirement.

_Conformance:_ conforming

_Verify:_ build, typecheck, dependency-cruise, pack, install, and execute its binary from a clean consumer.

_Evidence:_ `packages/cli/package.json`, `.dependency-cruiser.ts`, `scripts/release/packages.ts`, and `scripts/release/pack-smoke.ts`.
