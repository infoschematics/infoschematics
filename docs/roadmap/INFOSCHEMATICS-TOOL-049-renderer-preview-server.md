---
id: INFOSCHEMATICS-TOOL-049
area: TOOL
title: Renderer preview server
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-15T05:10:00Z
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

- [ ] Add `--serve` with an explicit, separate flag from watching, so serving is always a deliberate choice.
- [ ] Bind loopback only by default, and require an explicit opt-in flag for any other interface with a clear diagnostic about exposure.
- [ ] Select a default port, fail with a clear diagnostic when it is occupied rather than silently choosing another, and allow an explicit port.
- [ ] Serve exactly the rendered document; do not expose the source path, the working directory, or any sibling file.
- [ ] Reuse the watch primitive from [Renderer watch mode](INFOSCHEMATICS-TOOL-048-renderer-watch-mode.md) to re-render on change, and push a browser refresh through a minimal standard-library mechanism.
- [ ] Serve an explicit error page for invalid source while retaining the last valid render, matching the watch failure contract.
- [ ] Send no-cache headers so a refreshed browser always shows the current render.
- [ ] Shut down cleanly on interrupt, releasing the socket and the watcher.

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
