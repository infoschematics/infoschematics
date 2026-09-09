---
id: INFOSCHEMATICS-TOOL-032
area: TOOL
title: Adopt YAML authoring
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 7b4cd95fb3073e5d26a593fb94ae2587f1c30670
---

# Adopt YAML authoring

## Goal

Give authored Infoschematics one inert, portable document model: YAML-first input that accepts JSON syntax and validates directly into the canonical TypeScript model.

## Context

The current document loader validates the established compatibility shape and presents YAML, JSON, and a custom TypeScript-literal grammar as separate formats. The canonical model is now the public authoring contract, and executable or TypeScript-shaped documents add a second language without adding useful domain capability.

The agreed boundary is YAML 1.2 parsed as data, restricted to JSON-compatible values, then validated and normalised as a `DefinedInfoschematic`. JSON documents remain valid input because JSON syntax is accepted by the YAML parser. TypeScript remains the typed library API through `Infoschematic` and `defineInfoschematicModel`, not a serialised document format.

## Boundary

This item changes the document loader, canonical runtime schema, generated JSON Schema, Playground format surface, representative fixtures, and directly coupled tests. It does not migrate Studio editing state to a lossless YAML document tree, preserve comments through edits, define patch operations, or reorganise the wider documentation corpus.

## Current state

`parseInfoschematic` dispatches between JSON, YAML, and a bespoke TypeScript literal parser, validates the established `InfoschematicConfigInput`, and returns an established config. Playground maintains three independent buffers and serialises canonical examples back through the compatibility adapter.

## Steps

- [x] Replace the established document schema with a strict canonical Infoschematic schema and JSON-value input guard.
- [x] Parse YAML and JSON paths through one YAML 1.2 data pipeline and return a normalised canonical model.
- [x] Remove the bespoke TypeScript document parser while retaining typed TypeScript object authoring.
- [x] Make Playground a YAML-first single document editor with canonical presets, including its source-to-sink starting flow.
- [x] Update parity fixtures, loader consumers, generated schema, and focused tests for the new boundary.
- [x] Run the full repository verification gate.

## Files touched

- `packages/domain-core/src/`
- `packages/domain-core/schema/infoschematic.schema.json`
- `apps/site/src/Playground.tsx`
- `apps/site/src/Playground.test.tsx`
- `apps/site/src/playground/seeds/`
- `scripts/fixtures/`
- `scripts/format-parity.test.ts`
- `scripts/render-example.ts`
- `docs/roadmap/INFOSCHEMATICS-TOOL-032-adopt-yaml-authoring.md`
- `docs/roadmap/INFOSCHEMATICS-TOOL-033-preserve-yaml-edits.md`
- `docs/roadmap/_ISSUES.md`

## Verify

Focused Domain Core, Playground, format-parity, and render-example tests must pass. The generated JSON Schema must be current. `bun run self:check` must pass.

## Dependencies / blocks

Canonical input boundaries delivered by `INFOSCHEMATICS-TOOL-031` are present. This delivery enables the later lossless YAML editing work in `INFOSCHEMATICS-TOOL-033`; no external dependency blocks implementation.

## Documentation impact

### Decision Records

No Decision Record edit is included while the documentation reorganisation thread owns that surface; its review must replace the obsolete multi-format validation decision with this agreed YAML data boundary.

### Specifications

The generated JSON Schema changes from the established compatibility shape to the canonical authoring contract. The documentation thread must align the Domain Core specification wording.

### Guides

Playground copy changes with the product surface. Wider authoring and getting-started prose remains with the active documentation thread to avoid contested edits.

### Roadmap

This item records immediate delivery and creates `INFOSCHEMATICS-TOOL-033` as the dependent editor evolution.

## Review

### Delivered

Authored documents now enter one inert YAML 1.2 pipeline, validate against the canonical Infoschematic contract, and return a normalised `DefinedInfoschematic`. JSON syntax and `.json` paths remain accepted through that same parser. TypeScript remains the typed object API, while the bespoke TypeScript document grammar and Playground tab are removed.

### Summary of changes

- `packages/domain-core/src/schema.ts` now mirrors `Infoschematic`, including recursive JSON-valued renderer properties, and generates the canonical editor schema.
- `packages/domain-core/src/parse.ts` rejects YAML diagnostics, custom tags, non-finite values, non-plain runtime objects, and cyclic aliases before canonical referential validation.
- `packages/domain-core/src/serialise.ts` emits preferred YAML and deterministic JSON interchange.
- Playground now owns one YAML buffer, serialises canonical presets directly, and starts with the code-like `SRC` to `SNK` flow.
- Format-parity fixtures prove typed objects, YAML, and JSON syntax render byte-identical SVG without treating TypeScript as a document format.

### Verification

- Focused Domain Core, Playground, format-parity, and render-loader verification passes: 4 test files, 30 tests.
- `bun run self:check` exits 0: 70 test files and 480 tests pass; every TypeScript workspace compiles; dependency boundaries pass across 373 modules and 1,166 dependencies; generated artefacts are current; the production Site builds.
- The downstream IBC-2026 YAML conversion matches its monolithic canonical model across all 39 semantic and grid-topology states, with every raster inside tolerance.

### Outstanding concerns

The active documentation thread still needs to replace obsolete multi-format wording in the Domain Core specification, validation Decision Record, and authoring guide. Lossless comment-preserving Studio edits remain deliberately deferred to `INFOSCHEMATICS-TOOL-033`.

### Post-change review

The implementation stays within the agreed document boundary. Existing TypeScript model composition remains available, JSON remains interoperable, established runtime compatibility remains untouched, and the representative IBC consumer proves canonical YAML without visual drift. No push or release occurred.

### Mini recap

Reduced authoring to one YAML-based inert-data contract, moved validation onto the canonical model, retained JSON input and export, removed the synthetic TypeScript document language, and simplified Playground accordingly. Human review is required before closure.

## Discussion

### One data language

YAML is the human-authored representation. JSON needs no parallel implementation because its syntax is valid YAML; it remains useful deterministic interchange. Both enter the same validation and normalisation path.

### Typed composition

Library consumers can continue to construct, compose, and transform `Infoschematic` objects in TypeScript before calling `defineInfoschematicModel`. Removing `.ts` documents removes only the bespoke literal grammar, not the typed API.

### Inert values

Parsed documents admit only objects with string keys, arrays, strings, finite numbers, booleans, and null. Custom tags, undefined values, non-finite numbers, functions, binary or date objects, and cyclic aliases are rejected before canonical validation.
