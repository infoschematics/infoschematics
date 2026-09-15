---
id: INFOSCHEMATICS-TOOL-048
area: TOOL
title: Renderer watch mode
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-15T05:10:00Z
---

# Renderer watch mode

## Goal

Let command-line users keep a rendered output up to date while editing its YAML or JSON source.

## Context

The renderer command currently performs one explicit input-to-output conversion and exits. Authoring loops must rerun it manually or supply their own file watcher.

## Boundary

This item does not start an HTTP server, edit source documents, choose a general task runner, or make rendering failures overwrite the last successful output.

## Current state

`runRendererCli` performs one conversion and returns an exit code. Its `RendererCliIo` seam injects `readFile`, `readStdin`, `writeFile`, `writeStderr`, and `writeStdout`, which is what makes `packages/cli/src/index.test.ts` able to test the command without touching the filesystem. That seam has no concept of a long-lived process, a file watcher, or a cancellation signal.

`parseArguments` is a hand-rolled loop that accepts only `--output` and `--help`, and rejects any other token as a usage error. Watching is the first capability that makes the command a process with a lifetime rather than a single call, so the seam and the argument surface both need deliberate extension.

## Steps

- [ ] Extend `RendererCliIo` with a watch primitive and a cancellation signal so watch behaviour stays injectable and testable without real filesystem events.
- [ ] Add `--watch`, requiring `--output` because a repeatedly rewritten standard-output stream is not a useful contract.
- [ ] Watch only the named source document; do not follow includes or assets, which would make the command a build system.
- [ ] Perform one render on start so the output is correct before any edit occurs.
- [ ] On invalid intermediate source, write the diagnostic to standard error, leave the last successful output untouched, and keep watching.
- [ ] Recover automatically once the source parses and validates again, without requiring a restart.
- [ ] Debounce and coalesce rapid successive writes so a single editor save produces one render, and handle atomic-rename saves that replace rather than modify the file.
- [ ] Exit cleanly on interrupt, releasing the watcher and returning a defined status distinct from the failure codes.

## Files touched

- `packages/cli/src/index.ts` and `packages/cli/src/bin.ts`
- `packages/cli/src/index.test.ts`
- `docs/specs/command-line-rendering.md`
- `docs/guides/rendering-from-the-command-line.md`

## Verify

Run the CLI package suite and `bun run self:check`. Through the injected watch primitive, assert an initial render, a render on change, a retained previous output plus a stderr diagnostic on invalid source, automatic recovery on the next valid write, one render for a burst of rapid writes, correct behaviour for an atomic rename, and clean shutdown on cancellation. Confirm a single non-watch invocation is byte-identical to current behaviour.

## Dependencies / blocks

No build-order dependency, but this item should land before [Renderer preview server](INFOSCHEMATICS-TOOL-049-renderer-preview-server.md), which is expected to reuse the same watch primitive rather than implement a second one. Coordinate the option surface with [Raster renderer output](INFOSCHEMATICS-TOOL-047-raster-renderer-output.md).

## Documentation impact

### Decision Records

Record a decision only if watch mode requires a dependency beyond the Node standard library, which would touch the `CLI-005` boundary.

### Specifications

Add requirements for watch activation, initial render, retained output on failure, automatic recovery, coalescing, and clean shutdown.

### Guides

Add an authoring-loop section covering watch invocation, the required output path, failure reporting, and how to stop the process.

### Roadmap

Serving and browser refresh belong to [Renderer preview server](INFOSCHEMATICS-TOOL-049-renderer-preview-server.md); this item owns file watching and re-rendering only.

## Discussion

### Failure behaviour

A watch process should report invalid intermediate source clearly, retain the last valid output, and resume automatically after the source becomes valid again.

### Watch boundary

Shaping must define whether only the named source is watched or whether supported include and asset dependencies can participate without turning the command into a build system.
