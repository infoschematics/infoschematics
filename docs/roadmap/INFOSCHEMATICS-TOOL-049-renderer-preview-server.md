---
id: INFOSCHEMATICS-TOOL-049
area: TOOL
title: Renderer preview server
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-15T07:45:00Z
---

# Renderer preview server

## Goal

Let local command-line users preview a rendered Infoschematic through a small, explicitly started development server.

## Context

The renderer command emits a file and owns no server lifecycle. A local preview currently requires another host even when the user only needs to inspect output during authoring.

## Boundary

This item does not provide production hosting, remote access by default, collaborative editing, Studio, or a general static-site server.

## Current state

The command owns no network surface. `runRendererCli` writes a file or a stream and returns, and `CLI-003` requires diagnostics on standard error with a documented non-zero status for every failure class. A preview server introduces the first long-lived listening socket in a published package, so its defaults are a security contract rather than a convenience.

`CLI-005` limits the package to Domain Core and the static SVG renderer. Node's built-in HTTP server keeps that boundary intact; any framework dependency would not, so the implementation should stay on the standard library.

## Steps

- [x] Add `--serve` with an explicit, separate flag from watching, so serving is always a deliberate choice.
- [x] Bind loopback only by default, and require an explicit opt-in flag for any other interface with a clear diagnostic about exposure.
- [x] Select a default port, fail with a clear diagnostic when it is occupied rather than silently choosing another, and allow an explicit port.
- [x] Serve exactly the rendered document; do not expose the source path, the working directory, or any sibling file.
- [x] Reuse the watch primitive from [Renderer watch mode](INFOSCHEMATICS-TOOL-048-renderer-watch-mode.md) to re-render on change, and push a browser refresh through a minimal standard-library mechanism.
- [x] Serve an explicit error page for invalid source while retaining the last valid render, matching the watch failure contract.
- [x] Send no-cache headers so a refreshed browser always shows the current render.
- [x] Shut down cleanly on interrupt, releasing the socket and the watcher.

## Files touched

- `packages/cli/src/index.ts` and `packages/cli/src/bin.ts`
- `packages/cli/src/index.test.ts`
- `docs/specs/command-line-rendering.md`
- `docs/guides/rendering-from-the-command-line.md`
- `docs/decisions/` for the network-exposure defaults

## Verify

Run the CLI package suite and `bun run self:check`. Start the server against an ephemeral port, fetch the rendered document and compare it with the equivalent file render, confirm the listener is bound to loopback only unless explicitly opted in, confirm no path outside the rendered document is reachable, confirm an occupied port fails with a diagnostic and non-zero status, confirm invalid source serves the error page while the last valid render is retained, and confirm the socket is released on shutdown.

## Dependencies / blocks

This item should follow [Renderer watch mode](INFOSCHEMATICS-TOOL-048-renderer-watch-mode.md) so both features share one watch primitive. It is not a hard block: the server can ship with a self-contained watcher if sequencing changes, at the cost of consolidating later.

## Documentation impact

### Decision Records

Record the network-exposure defaults, the standard-library-only constraint, and the decision not to serve arbitrary paths.

### Specifications

Add requirements for serve activation, binding defaults, port behaviour, served surface, refresh, caching, error pages, and shutdown.

### Guides

Document local preview, the loopback default, how to expose deliberately, and the difference between preview and hosting.

### Roadmap

Production hosting, remote access, and collaborative editing remain out of scope and are not deferred follow-ups of this item.

## Discussion

### Relationship to watching

The server may reuse a separately delivered watch capability, but it remains a distinct outcome with network binding, lifecycle, error-page, and browser-refresh responsibilities.

### Safety

Shaping must define loopback-only defaults, port selection, shutdown, source-path exposure, caching, and invalid-document behaviour before implementation.

## Review

### Delivered

`infoschematics render architecture.yaml --serve` renders the document, prints `http://127.0.0.1:4680/`, and refreshes an open browser on every save. A document that stops validating shows its diagnostic above the render that still works. Nothing but the page, the render, and the refresh stream is reachable, and nothing wider than loopback is bound unless asked for.

### Summary changes

`packages/cli/src/serve.ts` is new and holds the whole network surface: three routes over `node:http`, the current render in memory, Server-Sent Events for refresh, `no-store` on everything, and 404 for every other pathname. There is no code that turns a request into a file, so there is no traversal to get wrong. The diagnostic is HTML-escaped before it reaches the page.

`packages/cli/src/index.ts` splits the old `renderOnce` into `renderDocument`, which converts and reports an outcome, and `renderOnce`, which delivers it. The watch loop from [Renderer watch mode](INFOSCHEMATICS-TOOL-048-renderer-watch-mode.md) generalised into `watchUntilCancelled(parsed, io, render)`, so watching a file and refreshing a page share one coalescing loop rather than each having their own — the shared primitive this item's dependency note asked for. `RendererCliIo` gains `serve`, so a preview session is injectable like everything else.

`options.ts` gains `--serve` / `-s`, `--host`, and `--port`, with `--host` and `--port` rejected without `--serve` and standard input rejected as a serve input. `rendererCliExit` gains `network: 6` for a socket that cannot be bound. [ADR-INFOSCHEMATICS-025](../decisions/ADR-INFOSCHEMATICS-025-keep-the-preview-server-local-and-in-memory.md) records the exposure defaults, the in-memory surface, and the standard-library constraint; `CLI-010` and `CLI-011` state the requirements; [the command-line rendering guide](../guides/rendering-from-the-command-line.md) gains a preview section that distinguishes preview from hosting.

### Verification

`bun run self:check` passed: 87 test files, 673 tests. The preview suite starts real sessions on an ephemeral port and asserts: the served render is byte-identical to what `--output` would have written; `/`, `/render`, and `/events` work and four other pathnames return 404; `cache-control: no-store` on the page and the render; a retained render plus an escaped diagnostic when the document breaks, and recovery when it is fixed; a pushed refresh arriving on the event stream after a change; an occupied port returning status `6` with the port in the diagnostic; no listener on a non-loopback interface; and a refused connection after shutdown.

Ran the built binary against a real document and looked at the result in Chromium: the preview page shows the diagram correctly, a mid-edit break shows the wrapped diagnostic above the retained render, and fixing the document under an open page reloaded it and removed the banner without any interaction.

### Outstanding concerns

The first version of the error page let a long diagnostic scroll horizontally, which in a screenshot meant the end of the message was simply not visible. It wraps now. This is the kind of thing a passing suite says nothing about.

The preview page is deliberately plain: a dark surface, the render, and the diagnostic. It is not a Studio and should not grow into one. If a preview ever needs interaction, that is Studio's job and a different record.

A raster preview serves PNG bytes at `/render`, so the browser shows an image at its natural pixel size rather than fitting the window. Acceptable for a preview of a raster you asked for; SVG is the default and scales.

`--host 0.0.0.0` prints a warning but does not require a second confirmation. The flag is the decision point, and a command that argues with an explicit flag is a command people work around.

### Post-change review

Generalising the watch loop was not in the step list, but implementing a second loop would have contradicted this item's own dependency note. The watch behaviour is unchanged and its tests still pass untouched, which is the evidence that the extraction was faithful.

`renderDocument` returning an outcome rather than writing diagnostics directly is what let the page show the same text standard error shows. Serving a different error message from the one the terminal prints would have been a small, permanent source of confusion.

The loopback assertion skips itself when the machine has no non-internal IPv4 interface, because on such a machine there is nothing to prove rather than something to fail.

### Mini recap

`--serve` is a preview for the person at the keyboard: loopback, in memory, three routes, no filesystem. It shares the watch loop, so the refresh contract and the retained-output contract are the same code, not two implementations that might drift.
