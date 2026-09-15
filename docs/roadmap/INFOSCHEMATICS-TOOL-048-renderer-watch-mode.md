---
id: INFOSCHEMATICS-TOOL-048
area: TOOL
title: Renderer watch mode
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-15T07:30:00Z
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

- [x] Extend `RendererCliIo` with a watch primitive and a cancellation signal so watch behaviour stays injectable and testable without real filesystem events.
- [x] Add `--watch`, requiring `--output` because a repeatedly rewritten standard-output stream is not a useful contract.
- [x] Watch only the named source document; do not follow includes or assets, which would make the command a build system.
- [x] Perform one render on start so the output is correct before any edit occurs.
- [x] On invalid intermediate source, write the diagnostic to standard error, leave the last successful output untouched, and keep watching.
- [x] Recover automatically once the source parses and validates again, without requiring a restart.
- [x] Debounce and coalesce rapid successive writes so a single editor save produces one render, and handle atomic-rename saves that replace rather than modify the file.
- [x] Exit cleanly on interrupt, releasing the watcher and returning a defined status distinct from the failure codes.

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

## Review

### Delivered

`infoschematics render diagram.yaml --output diagram.svg --watch` renders once and then after every save, until interrupted. An invalid save reports and leaves the last good output alone; the next valid save replaces it without a restart. Raster output watches the same way.

### Summary changes

`RendererCliIo` gains three members: `watch(pathname, onChange)` returning a closable watcher, `wait(milliseconds)` for the settle window, and an optional `signal` that ends the session. All three are injected, so the watch tests exercise the real loop without filesystem events or timers. `packages/cli/src/bin.ts` traps `SIGINT` and `SIGTERM` and supplies that signal, keeping process-signal handling in the executable rather than the library.

The single conversion moved into `renderOnce`, unchanged in behaviour; `runWatch` calls it. Renders are serialised through one drain loop: a change marks the session dirty, the loop settles, clears the mark, and renders, so a burst of writes produces one render and a slow render cannot overlap the next one. Shutdown closes the watcher and waits for any in-flight render rather than leaving a half-written file.

The host watcher observes the containing directory and filters by filename. Watching the file directly goes silent after the first editor save that replaces the inode, which is how most editors save.

`options.ts` gains `--watch` / `-w` with two usage rejections: without `--output`, and with standard input. `rendererCliExit` gains `interrupted: 130`, distinct from every failure status. `CLI-008` and `CLI-009` record the contract; [the command-line rendering guide](../guides/rendering-from-the-command-line.md) gains an authoring-loop section.

### Verification

`bun run self:check` passed. The CLI suite covers the initial render, a render per change, retained output plus diagnostic on an invalid save, automatic recovery, one render for a burst, the two usage rejections, clean shutdown returning `130` with the watcher released, and byte-identity between a watched initial render and a plain single invocation.

The coalescing test was mutation-tested: clearing the dirty mark before the settle window instead of after made a three-write burst render twice, and the test failed as it should.

Ran the built binary against a real document in a temporary directory: the initial SVG was correct, an atomic rename-over save produced an updated SVG within a second, `Ctrl-C` released the watcher, and the process exited `130`.

### Outstanding concerns

The settle window is a fixed 40 ms, not an option. Exposing it would be a knob with no obvious right value; if a real editor or network filesystem turns out to need longer, that is evidence for a follow-up rather than a guess now.

A watch session renders on any change to the document, including a change whose output is identical. Suppressing an unchanged write would mean comparing the rendered bytes against the file on every pass; the loop is fast and the write is small, so it is not worth the read.

Only the named document is watched, as the boundary requires. A future include or asset mechanism would have to revisit this deliberately rather than inherit it.

### Post-change review

`RendererCliIo` grew from five members to eight, and the two new function members are required rather than optional, so every constructed IO must supply them. That is intentional: an optional watch primitive would let a host silently get a watch session that never fires. The one host factory, `hostRendererCliIo`, is now exported so `bin.ts` can pass a cancellation signal.

The first version of the rename test asserted that writing a sibling file produced no change event and failed immediately: a fresh directory watch on macOS replays recent activity, so events for the watched document arrived before the sibling was written. The filter was right; the baseline was wrong. The test now settles before measuring, and says so.

### Mini recap

Leave `--watch` running in one pane and edit in another. A broken document tells you why on standard error and leaves the previous render in place, so whatever is displaying that file never goes blank while you type.
