---
id: INFOSCHEMATICS-TOOL-047
area: TOOL
title: Raster renderer output
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-15T05:10:00Z
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

- [ ] Choose one conversion engine and record the decision, weighing a pure-WASM renderer against a native binary for install reliability, reproducibility, and clean-consumer packaging.
- [ ] Decide whether the engine may enter `packages/cli` directly or must sit behind an optional dependency, and amend `CLI-005` and `.dependency-cruiser.ts` to match the chosen boundary rather than leaving the accepted requirement contradicted.
- [ ] Add `--format png` with explicit `--scale`, `--background`, and density options, defaulting to SVG so existing invocations are unchanged.
- [ ] Define the font contract: either embed or explicitly pin the fonts the renderer relies on, or document that text fidelity depends on the host font stack and is outside the determinism guarantee.
- [ ] Give raster failures their own diagnostic path reusing the existing exit-code vocabulary, and keep standard output binary-clean so piping works.
- [ ] Assert byte-identical raster output across repeated runs on one platform, and state explicitly which guarantees hold across platforms.
- [ ] Extend `scripts/release/pack-smoke.ts` so a clean consumer installs the package and produces a raster file.

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
