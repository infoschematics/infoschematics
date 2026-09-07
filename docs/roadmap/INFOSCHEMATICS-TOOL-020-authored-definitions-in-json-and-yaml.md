---
id: INFOSCHEMATICS-TOOL-020
area: TOOL
title: Authored definitions in JSON and YAML
theme: tool
horizon: next
status: draft
blocks: [INFOSCHEMATICS-TOOL-021]
blocked_by: []
baseline_ref: null
---

## Goal

Let an Infoschematic be authored as TypeScript, JSON, or YAML and validated identically in all three, so authoring an Infoschematic does not require writing or compiling a TypeScript module.

## Context

`InfoschematicConfig` is already pure serialisable data. Round-tripping `examples/is-infoschematics` through `JSON.parse(JSON.stringify(config))` and re-rendering it with `@infoschematics/render-svg` produces byte-identical SVG, the structure contains no `null` holes, and `defineInfoschematic(JSON.parse(text))` normalises a parsed object exactly as it normalises a literal. The domain contract is therefore already format-neutral; nothing in `packages/domain-model` or `packages/domain-core` requires a definition to arrive as TypeScript.

What is missing is the boundary that turns an untrusted document into an `InfoschematicConfig`. `defineInfoschematic` normalises a value it already trusts to have the right shape: TypeScript supplies that guarantee at compile time, and a parsed JSON or YAML document does not. Today an authored example is a workspace package exporting a typed literal, so the type checker is the only validator in the repository, and `scripts/render-example.ts` can only render from a fixed registry of imported modules.

## Boundary

TOML is explicitly out of scope; the supported set is TypeScript, JSON, and YAML.

This item does not publish the renderer as an installable command — that is [INFOSCHEMATICS-TOOL-021](INFOSCHEMATICS-TOOL-021-publish-the-renderer-as-a-command.md), which depends on the loader landing first. It does not change `InfoschematicConfig`, add runtime behaviour to authored definitions, or migrate the existing examples away from TypeScript; TypeScript authoring stays first-class and keeps its compile-time guarantee.

## Shaping

The intended pass will:

- Decide where validation belongs. `packages/domain-model` is dependency-free and `packages/domain-core` owns normalisation, so a parse-and-validate entry point most likely belongs beside `defineInfoschematic` in Domain Core, with any YAML dependency isolated from it.
- Establish one schema as the single source of truth rather than a hand-maintained validator that drifts from the types. Decide between generating a JSON Schema from `InfoschematicConfig` and adopting a schema-first library whose inferred type replaces the hand-written one.
- Define diagnostics worth having: an invalid document should report the offending path and the expected shape, not fail as an opaque cast.
- Decide how YAML is parsed, and confirm the parser is safe for untrusted input and small enough to sit under a published package.
- Extend the loader used by `scripts/render-example.ts` to accept a pathname in any supported format alongside the named-example registry, keeping named examples working unchanged.
- Publish the generated JSON Schema so an editor can complete and validate a `.infoschematic.json` or `.infoschematic.yaml` document directly.
- Cover each format with a test proving the same definition renders identical output through all three, and that a malformed document is rejected with a useful message.

Known dependency: the schema-source decision above gates the rest, because it determines whether the domain types stay hand-written.

## Discussion

### Why validation cannot simply be a cast

`defineInfoschematic` is total over well-typed input, so it will happily normalise a structurally wrong object into a config that renders as an empty or subtly incorrect diagram. That is acceptable when TypeScript has already proved the shape and unacceptable at a file boundary, where the common case is a typo in a hand-edited document. Validation is the whole cost of the feature; parsing is trivial.

### Why TOML is excluded

TOML's table syntax expresses deeply nested heterogeneous arrays — which is exactly what a `regions`, `cards`, and `flows` document is — far more awkwardly than YAML, so it would carry a dependency and a supported-format promise for a worse authoring experience than the two formats already chosen.
