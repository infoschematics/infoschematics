---
id: ADR-INFOSCHEMATICS-024
title: Rasterise with a native resvg binding
date: 2026-09-15
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-018, ADR-INFOSCHEMATICS-010]
---

# ADR-INFOSCHEMATICS-024: Rasterise with a native resvg binding

## Context

`ADR-INFOSCHEMATICS-018` made the renderer command a thin Node adapter, and `CLI-005` in [the command-line rendering specification](../specs/command-line-rendering.md) held it to two workspace dependencies and no third-party runtime at all. PNG output is the first capability that cannot be built from the canonical libraries: something has to resolve an SVG document into pixels.

Three engines were realistic. A headless browser is the most faithful, and the repository already runs Playwright for browser tests, but it is a several-hundred-megabyte install imposed on every consumer of a command whose main job is writing SVG to a pipe. `@resvg/resvg-wasm` needs no native build at all, but WebAssembly cannot reach the host font stack: text renders only from fonts the caller supplies as buffers, so the default invocation would silently drop every label. `@resvg/resvg-js` is the same renderer as a native binding, shipping prebuilt binaries for twelve platforms at roughly 3.4 MB installed, and it can read system fonts.

The dependency question is separable from the engine question. The engine could sit behind an optional dependency so that `npm install` stays dependency-free for SVG-only users, at the cost of a lazy import, a runtime capability check, a second diagnostic path, and a packaging story that is only exercised when someone installs the optional half.

## Decision

Rasterise through `@resvg/resvg-js`, pinned exactly, as a direct dependency of `packages/cli`.

Text is the one part of conversion that depends on the machine, and the contract says so: without `--font`, the host font stack is used and output is correct but host-specific; with `--font`, only the named files are consulted, which is what makes output identical across machines. Geometry, colour, and scale never depend on the host. An unreadable `--font` file fails with the input status rather than falling back, because resvg ignores a font file it cannot open and a silent fallback would produce exactly the output the option exists to prevent.

`CLI-005` is amended rather than contradicted: the package's third-party runtime dependencies are limited to this one engine by name, and `renderer-command-names-its-third-party-dependencies` in `.dependency-cruiser.ts` enforces that allowlist mechanically. Adding a second one is a specification change, not an install.

There is no `--background` option. The static renderer already paints an opaque backdrop across the whole viewBox, so a colour behind that rectangle could never be seen; offering the option would be offering a no-op. Transparent raster output would first require the renderer to make its backdrop optional, which is a rendering decision rather than a command one.

## Consequences

A consumer who installs the command gets one native dependency they did not ask for, and on a platform without a prebuilt binary the install fails rather than degrading to SVG-only. That is the honest trade for an install that is small, an option surface with no capability checks in it, and one diagnostic path instead of two. `scripts/release/pack-smoke.ts` renders a PNG from a clean installed consumer and compares it byte for byte with the workspace render, so the packaged dependency is proven from outside the monorepo on every release check rather than assumed.

Pinning the engine exactly makes a resvg upgrade a deliberate act with a visible byte-level diff, which is what determinism across releases requires. Further output formats are separate decisions: this record selects one engine for PNG, not a general conversion strategy.
