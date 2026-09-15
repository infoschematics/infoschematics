---
id: INFOSCHEMATICS-TOOL-047
area: TOOL
title: Raster renderer output
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-15T07:20:00Z
---

# Raster renderer output

## Goal

Let command-line users render a canonical Infoschematic directly to a deterministic raster image when an SVG is not suitable for the consuming workflow.

## Context

The renderer command deliberately emits SVG only. Raster conversion remains possible through external tools, but the supported command does not own viewport scale, output density, background, font, or conversion reproducibility.

## Boundary

This item does not replace SVG as the canonical static output, bundle an arbitrary browser, or promise pixel identity across unpinned platform font stacks.

## Current state

`packages/cli` is a thin Node 22 ESM adapter. `runRendererCli` in `packages/cli/src/index.ts` parses one `render` subcommand with a hand-rolled argument loop, resolves input through Domain Core, renders through `renderInfoschematicSvg`, and writes SVG to standard output or `--output`. Exit codes are fixed by `rendererCliExit`: usage 2, input 3, validation 4, output 5.

`CLI-005` in [the command-line rendering specification](../specs/command-line-rendering.md) constrains this package to Domain Core and the static SVG renderer as its only workspace dependencies, and `scripts/release/pack-smoke.ts` proves that boundary from a clean consumer. Raster output is the first capability that needs a third-party conversion engine, so the dependency and packaging consequences are the substance of this work, not the pixel conversion itself.

## Steps

- [x] Choose one conversion engine and record the decision, weighing a pure-WASM renderer against a native binary for install reliability, reproducibility, and clean-consumer packaging.
- [x] Decide whether the engine may enter `packages/cli` directly or must sit behind an optional dependency, and amend `CLI-005` and `.dependency-cruiser.ts` to match the chosen boundary rather than leaving the accepted requirement contradicted.
- [x] Add `--format png` with explicit `--scale`, `--background`, and density options, defaulting to SVG so existing invocations are unchanged. _(No `--background`: see review.)_
- [x] Define the font contract: either embed or explicitly pin the fonts the renderer relies on, or document that text fidelity depends on the host font stack and is outside the determinism guarantee.
- [x] Give raster failures their own diagnostic path reusing the existing exit-code vocabulary, and keep standard output binary-clean so piping works.
- [x] Assert byte-identical raster output across repeated runs on one platform, and state explicitly which guarantees hold across platforms.
- [x] Extend `scripts/release/pack-smoke.ts` so a clean consumer installs the package and produces a raster file.

## Files touched

- `packages/cli/src/index.ts` and `packages/cli/package.json`
- `packages/cli/src/index.test.ts`
- `.dependency-cruiser.ts` and `scripts/release/packages.ts` where the boundary changes
- `scripts/release/pack-smoke.ts`
- `docs/specs/command-line-rendering.md`
- `docs/guides/rendering-from-the-command-line.md`
- `docs/decisions/` for the conversion-engine decision

## Verify

Run the CLI package suite, `bun run self:packages:build`, `bun run self:packages:pack-smoke`, and `bun run self:check`. Render the same document to PNG twice and compare bytes; render to a file and to standard output and compare; confirm SVG output is unchanged when no format option is given; and confirm a clean installed consumer produces the same raster as the workspace.

## Dependencies / blocks

No build-order dependency. This item and [Renderer watch mode](INFOSCHEMATICS-TOOL-048-renderer-watch-mode.md) both extend the command's option surface; whichever lands first should establish a shared option-parsing shape rather than each growing the ad-hoc loop in `parseArguments`.

## Documentation impact

### Decision Records

Record the conversion-engine choice, the dependency-boundary consequence for `CLI-005`, and the platform determinism guarantee.

### Specifications

Add raster input, output, determinism, and failure requirements, and amend `CLI-005` where the dependency boundary changes.

### Guides

Document format selection, scale, background, font expectations, and the reproducibility boundary.

### Roadmap

Further bitmap or document formats are separate records; this item delivers one format and the supporting contract.

## Discussion

### Determinism

Shaping must choose an explicit conversion engine and define viewport, scale, background, font, metadata, and platform guarantees before raster output can become a supported contract.

### Formats

PNG is the likely first format. Additional bitmap or document formats should be selected separately rather than inferred from whichever converter is adopted.

## Review

### Delivered

`infoschematics render --format png` writes a deterministic PNG to standard output or a file, with `--scale` for pixel density and repeatable `--font` for text that is identical across machines. SVG remains the default and every existing invocation is unchanged. The conversion engine is a named, pinned, allowlisted dependency rather than an ambient one, and a clean installed consumer is proven to produce the same bytes as the workspace.

### Summary changes

`packages/cli/src/options.ts` is new: one declarative option table drives both parsing and the usage text, so the help a user reads cannot fall behind the options the command accepts. This is the shared option shape [Renderer watch mode](INFOSCHEMATICS-TOOL-048-renderer-watch-mode.md) was told to build on rather than extending the old ad-hoc loop. `packages/cli/src/raster.ts` is new and holds the conversion, exported publicly as `rasteriseInfoschematicSvg`. `packages/cli/src/index.ts` keeps its existing exit-code vocabulary and adds a binary-clean output path; `RendererCliIo` gains `readBytes` so font readability is an injectable check rather than a hidden filesystem call.

`packages/cli/package.json` depends on `@resvg/resvg-js` at an exact version. `.dependency-cruiser.ts` gains `renderer-command-names-its-third-party-dependencies`, which allowlists that one package by name: a second third-party runtime dependency now fails the boundary check rather than arriving silently.

Documentation: [ADR-INFOSCHEMATICS-024](../decisions/ADR-INFOSCHEMATICS-024-rasterise-with-a-native-resvg-binding.md) records the engine choice against the WASM and headless-browser alternatives, the direct-versus-optional dependency question, and the font contract. `CLI-005` in [the command-line rendering specification](../specs/command-line-rendering.md) is amended to name the permitted third-party dependency; `CLI-006` and `CLI-007` add the raster output and determinism requirements. [The command-line rendering guide](../guides/rendering-from-the-command-line.md) gains a PNG section and a font-pinning section.

`scripts/release/pack-smoke.ts` renders PNG twice from the packed consumer and once from the workspace binary, and requires all three to be byte-identical.

### Verification

`bun run self:check` passed. `bun run self:packages:pack-smoke` passed, including the new raster comparison — that case installs `@resvg/resvg-js` from the packed manifest, so the packaging consequence of the dependency is proven from outside the monorepo rather than assumed.

The CLI suite covers PNG signature on standard output and in a written file, byte identity across repeated runs and across equivalent YAML and JSON, `--scale` doubling both IHDR dimensions without changing the document, raster options rejected against SVG output, and an unreadable `--font` failing with the input status.

Rendered `examples/is-system/infoschematic.yaml` to PNG at `--scale 2` and looked at it: text, Card colours, arrowheads, grid, and the backdrop are all correct, and the raster is a faithful match for the SVG.

### Outstanding concerns

There is no `--background`, although the step list named one. The static renderer paints an opaque backdrop across the whole viewBox, so a colour behind that rectangle can never be seen — the option would have been a no-op that reads like a feature. The first version of this work shipped it and the test that was supposed to prove it produced byte-identical output with and without the flag, which is what surfaced the problem. Transparent raster output is possible, but it starts with making the renderer's backdrop optional, which is a rendering decision rather than a command one. Worth a decision during the walkthrough if transparency is wanted.

Likewise no separate density option: `--scale` multiplies the document's own pixel size, and a DPI option over an SVG with no physical size would be the same number wearing a different name.

resvg silently ignores a font file it cannot open, so `--font missing.ttf` would otherwise have produced host-font output from a command whose whole point was to avoid it. The CLI now reads each font file first and fails with status `3`. This is a readability check, not a validity check: a readable file that is not a font is still resvg's business.

A consumer who installs the command now installs a native binary they may not want. That trade is argued in the decision record rather than hidden; on a platform with no prebuilt binary the install fails rather than degrading to SVG-only.

### Post-change review

`CLI-005` kept its number when the specification grew. Renumbering it to sit in document order would have broken citations in `ADR-INFOSCHEMATICS-021`, [Renderer watch mode](INFOSCHEMATICS-TOOL-048-renderer-watch-mode.md), and [Renderer preview server](INFOSCHEMATICS-TOOL-049-renderer-preview-server.md); stable requirement ids are worth more than tidy ordering.

The new dependency-cruiser rule was mutation-tested: replacing the allowlisted package name with one that matches nothing produced exactly one violation, `packages/cli/src/raster.ts → @resvg/resvg-js`, so the rule is really watching rather than passing empty.

`packages/cli/src/index.test.ts` now covers `--background` as a rejected unknown option, so the absence of the option is asserted rather than merely undocumented.

### Mini recap

`infoschematics render diagram.yaml --format png --scale 2 --font ./Inter.ttf -o diagram.png` produces the same bytes on your laptop and on a build agent. Everything except text was already deterministic; `--font` is what closes the gap, and an unreadable font now says so instead of quietly rendering something else.
