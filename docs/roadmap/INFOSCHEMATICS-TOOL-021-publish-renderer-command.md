---
id: INFOSCHEMATICS-TOOL-021
area: TOOL
title: Publish renderer command
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Let someone outside the repository render an authored YAML or JSON Infoschematic to SVG from the command line without cloning the monorepo or writing a host application.

## Context

`scripts/render-example.ts` already renders a repository-owned example as standalone SVG without a browser or development server. It is intentionally tied to the local example registry. The canonical loader now accepts inert YAML 1.2 and JSON data and produces the model consumed by the static renderer, so a published command can have a narrow document-based contract.

The command belongs in a thin `@infoschematics/cli` package. That keeps filesystem and argument handling out of `@infoschematics/render-svg`, while allowing later commands to share one executable without making them part of this delivery.

## Boundary

This item does not publish any package, change trusted-publishing configuration, execute TypeScript source modules, rasterise output, watch files, start a server, or provide interactive rendering. Package publication remains subject to explicit release authority.

## Current state

The repository script can render only definitions imported through its fixed example registry. `@infoschematics/domain-core` provides validated YAML/JSON parsing, and `@infoschematics/render-svg` provides deterministic static SVG rendering. Release pack-smoke verifies public library exports from clean tarballs but does not exercise a package binary.

## Steps

- [ ] Add a publishable `@infoschematics/cli` workspace with a Node 22 ESM binary named `infoschematics` and one `render` subcommand.
- [ ] Implement `infoschematics render <input>` for `.yaml`, `.yml`, and `.json`, accept `-` for standard input, write SVG to standard output by default, and support `--output <path>` for an explicit file.
- [ ] Parse exclusively through Domain Core, render through `@infoschematics/render-svg`, send diagnostics to standard error, and use stable non-zero exit codes for usage, input, validation, and write failures.
- [ ] Reject TypeScript modules and raster output with clear guidance to use the programmatic library or an external SVG conversion tool.
- [ ] Reuse the repository CLI argument idiom where it is package-safe, without exporting internal script registries or coupling the published command to repository examples.
- [ ] Extend package metadata, dependency-boundary checks, version checks, and release pack-smoke so a clean consumer installs the tarball and executes the packed binary against YAML and JSON fixtures.
- [ ] Add concise CLI reference and getting-started examples, including pipes, file output, diagnostics, and the publication boundary.

## Files touched

- `packages/cli/`
- package workspace and dependency-boundary configuration
- `scripts/release/pack-smoke.ts` and focused release fixtures
- CLI and getting-started documentation
- affected roadmap or release guidance

## Verify

Run the CLI package build and focused `bunx vitest run` suites, then `bun run self:release:verify` and `bun run self:check`. From the clean pack-smoke consumer, render equivalent YAML and JSON inputs through the packed binary, confirm byte-identical SVG on standard output and `--output`, confirm diagnostics never contaminate SVG output, and assert non-zero exits for malformed, invalid, missing, and unsupported inputs.

## Dependencies / blocks

The canonical document loader and static SVG renderer are delivered. No package publication or external registry access is needed to implement and verify the command. Actual publication remains separate work under explicit release authority.

## Documentation impact

### Decision Records

Add a concise decision record for the thin CLI package, document-only input boundary, stream behaviour, and exclusion of TypeScript execution.

### Specifications

Add CLI requirements for supported formats, standard streams, diagnostics, exit behaviour, and deterministic rendering.

### Guides

Add installation and command examples to Getting Started and link the full CLI reference.

### Roadmap

Keep registry publication in the separately reshaped hardening/release work; this item stops with a verified publishable package.

## Discussion

### Package ownership

A separate CLI package preserves `@infoschematics/render-svg` as a framework-neutral library and prevents Node filesystem concerns from entering its dependency surface. The generic `infoschematics` executable owns a subcommand shape, but this item exposes only `render`.

### Input and output contract

YAML and JSON are the portable authored formats and both pass through the same canonical validation. Standard input and output make the command composable; `--output` is a convenience, not a second rendering path. TypeScript remains a programmatic authoring option after callers compile and execute their own code, not an input the CLI evaluates.

### Publication boundary

Pack-smoke proves the command is publishable and usable from a clean consumer. It does not grant authority to publish packages or alter registry configuration.
