---
id: INFOSCHEMATICS-TOOL-021
area: TOOL
title: Publish the renderer as a command
theme: tool
horizon: future
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-020]
baseline_ref: null
---

## Goal

Let someone outside this repository render an Infoschematic definition to SVG from the command line, without cloning the monorepo or writing a host application.

## Context

`scripts/render-example.ts` already renders an authored definition to a standalone SVG with no browser or dev server. It is repository-internal by design: it renders from a fixed registry of imported example packages, so its only possible inputs are the three examples this repository happens to own.

A published command would need to accept a definition the caller wrote. That input has to be a document rather than a module, which is why this item waits on [INFOSCHEMATICS-TOOL-020](INFOSCHEMATICS-TOOL-020-authored-definitions-in-json-and-yaml.md): a `bin` shipped before the loader exists would either accept nothing useful or hard-code an unvalidated `JSON.parse` at its edge, and the input contract would then be difficult to change once published.

## Boundary

This item does not add a `bin` to an existing package speculatively. It does not commit to which package publishes the command, and it does not extend the command beyond static rendering into an interactive or watching tool.

## Shaping

The intended pass will:

- Decide which package owns the command. `@infoschematics/render-svg` is the natural home, but adding a `bin` gives that library a command-line surface, argument parsing, and filesystem access it does not have today; a separate thin `@infoschematics/cli` keeps the library pure at the cost of another published package.
- Fix the input contract on top of the TOOL-020 loader, including how a TypeScript definition is resolved when the caller has not compiled it.
- Decide the output surface: SVG to a file or standard output, and whether rasterisation stays an external `rsvg-convert` dependency or is dropped from the published command.
- Reconcile the published command's argument handling with the repository's own `scripts/cli.ts` contract, deciding whether that contract is shared or deliberately duplicated at the package boundary.
- Extend `scripts/release/pack-smoke.ts` to execute the published `bin` from the clean consumer, so the command is verified the way the library exports already are.

Known dependency: [INFOSCHEMATICS-TOOL-020](INFOSCHEMATICS-TOOL-020-authored-definitions-in-json-and-yaml.md) must land first, because the loader defines what the command can be asked to render.

## Discussion

### Why the repository script is not simply published

`scripts/render-example.ts` is a development affordance whose registry of examples is its entire input model. Publishing it would export that registry as a public interface, and the useful command is the one that renders the caller's definition — a different program that happens to share a rendering call.
