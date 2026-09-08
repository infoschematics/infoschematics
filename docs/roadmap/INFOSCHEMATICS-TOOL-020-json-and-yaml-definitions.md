---
id: INFOSCHEMATICS-TOOL-020
area: TOOL
title: JSON and YAML definitions
theme: tool
horizon: next
status: ready
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

This item does not publish the renderer as an installable command — that is [INFOSCHEMATICS-TOOL-021](INFOSCHEMATICS-TOOL-021-publish-renderer-command.md), which depends on the loader landing first. It does not change `InfoschematicConfig`, add runtime behaviour to authored definitions, or migrate the existing examples away from TypeScript; TypeScript authoring stays first-class and keeps its compile-time guarantee.

## Current state

The domain contract already round-trips through JSON without changing rendered output, but the repository has no supported boundary for parsing, validating, and diagnosing an untrusted authored document.

## Steps

- [ ] Add the Zod schema for `InfoschematicConfigInput` to Domain Core, with a bidirectional type-parity assertion against the hand-written contract.
- [ ] Implement `parseInfoschematic` over JSON and YAML with path-specific diagnostics.
- [ ] Extend the example renderer loader to accept a pathname in any supported format.
- [ ] Emit the JSON Schema through a repository-owned script and commit its output.
- [ ] Add format-parity and malformed-document tests, and record the schema-source decision.

## Files touched

- `packages/domain-core/src/schema.ts` and `packages/domain-core/src/parse.ts`, new, with their tests
- `packages/domain-core/package.json` for the `zod` and `yaml` dependencies and the schema export
- `scripts/render-example.ts` for file-based loading, and a new schema-emitting script
- `packages/domain-model/` is **not** touched: the schema-source decision keeps type ownership where it is

## Verify

Prove that equivalent TypeScript, JSON, and YAML definitions render byte-identical SVG. Reject malformed documents with a path-specific diagnostic, and run the affected package tests and type-checks.

## Dependencies / blocks

The schema-source decision is the first step and gates the remaining implementation because it determines whether domain types remain hand-written.

## Documentation impact

### Decision Records

Record the schema-source choice if it establishes a durable ownership or architecture boundary.

### Specifications

Specify the supported document formats, validation boundary, and diagnostic guarantees.

### Guides

Document file authoring and editor schema integration alongside the published entry point.

### Roadmap

Keep INFOSCHEMATICS-TOOL-021 blocked until the validated loader contract lands.

## Discussion

### Schema-source decision

**Zod is adopted schema-first inside Domain Core; Domain Model keeps owning the types and stays dependency-free.**

The item left this open between generating a JSON Schema from `InfoschematicConfig` and adopting a schema-first library whose inferred type replaces the hand-written one. The second reading is rejected on an architectural ground the repository already holds: `@infoschematics/domain-model` is the dependency-free contract, and a schema-first library whose inferred type _replaced_ `InfoschematicConfig` would put a runtime dependency inside that contract and move type ownership out of the package the architecture guide names as its owner. The first reading — generating a schema from the types — needs a second toolchain (a TypeScript-to-JSON-Schema generator plus a JSON Schema validator) to produce diagnostics that Zod gives directly.

What is adopted is neither exactly: the Zod schema lives in Domain Core beside `defineInfoschematic`, mirrors the hand-written types rather than replacing them, and is held to them by a **bidirectional compile-time parity assertion** so the mirror cannot drift silently — a field added to `InfoschematicConfigInput` and not to the schema fails the type-check, and so does the reverse. `zod@4` also emits JSON Schema directly through `z.toJSONSchema()`, so the published editor schema comes from the same single source without a second generator.

`zod` and `yaml` both already resolve in the workspace, and both become explicit Domain Core dependencies. `yaml` (eemeli) is chosen over `js-yaml` because its default `parse` constructs only plain data — it has no schema that instantiates arbitrary types, so there is no unsafe-load footgun to remember at an untrusted boundary.

The parse boundary is one exported function rather than three: `parseInfoschematic(text, { format })`, where an omitted format is inferred from a supplied pathname. It returns a discriminated result rather than throwing, because the caller at a file boundary usually wants to print a diagnostic rather than catch an exception.

### Implementation notes

The intended pass will:

- Add `packages/domain-core/src/schema.ts` holding `infoschematicConfigSchema`, a Zod mirror of `InfoschematicConfigInput`, and the parity assertion that binds the two. Export it from the package root so a host can validate without reaching into a subpath.
- Add `packages/domain-core/src/parse.ts` holding `parseInfoschematic`, which selects the parser by format or pathname extension, parses, validates, and on success passes the value through `defineInfoschematic` so a parsed document and a TypeScript literal arrive at the same normalised config.
- Report diagnostics as `{ ok: false, issues }`, each issue carrying the dotted path, the message, and the offending document. A YAML syntax error is reported in the same shape as a schema violation, so a caller has one thing to print.
- Extend `scripts/render-example.ts` so its operand accepts a pathname as well as a registered example name, resolving by extension and keeping every named example working unchanged. The script keeps the shared CLI contract from `scripts/cli.ts`.
- Add a repository-owned `self:schema:generate` script that writes the emitted JSON Schema, and commit its output so an editor can consume it from the repository without a build.
- Cover format parity by rendering the same definition authored three ways through `@infoschematics/render-svg` and asserting byte-identical SVG, and cover rejection with documents that are malformed in each of the distinguishable ways: unparseable syntax, a wrong scalar type at a known path, and a missing required field.
- Record the schema-source decision as a Governed Decision Record, since it fixes where validation lives and why the contract package stays dependency-free.

### Why validation cannot simply be a cast

`defineInfoschematic` is total over well-typed input, so it will happily normalise a structurally wrong object into a config that renders as an empty or subtly incorrect diagram. That is acceptable when TypeScript has already proved the shape and unacceptable at a file boundary, where the common case is a typo in a hand-edited document. Validation is the whole cost of the feature; parsing is trivial.

### Why TOML is excluded

TOML's table syntax expresses deeply nested heterogeneous arrays — which is exactly what a `regions`, `cards`, and `flows` document is — far more awkwardly than YAML, so it would carry a dependency and a supported-format promise for a worse authoring experience than the two formats already chosen.
