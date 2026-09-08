---
id: ADR-INFOSCHEMATICS-013
title: Validation mirrors the contract rather than owning it
date: 2026-09-08
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-005, ADR-INFOSCHEMATICS-008]
---

# ADR-INFOSCHEMATICS-013: Validation mirrors the contract rather than owning it

## Context

An Infoschematic definition is serialisable data, so it can be authored as JSON or YAML as readily as TypeScript. TypeScript authoring carries its own guarantee: the compiler proves the shape before `defineInfoschematic` ever sees the value. A parsed document carries no such proof, and `defineInfoschematic` is total over well-typed input — handed a structurally wrong object it normalises without complaint and renders an empty or subtly incorrect diagram. Validation, not parsing, is the whole cost of supporting authored documents.

Two obvious sources for that validation were available. Generating a JSON Schema from `InfoschematicConfig` keeps the hand-written types authoritative, but needs two further tools — a TypeScript-to-JSON-Schema generator and a JSON Schema validator — to produce a diagnostic that names the offending path. Adopting a schema-first library and letting its inferred type replace `InfoschematicConfig` needs neither, but puts a runtime dependency inside `@infoschematics/domain-model` and moves type ownership out of the package the architecture guide names as the contract's owner.

## Decision

Neither source is adopted whole. `@infoschematics/domain-model` keeps owning the types and stays dependency-free. A Zod schema lives in `@infoschematics/domain-core` beside `defineInfoschematic` and mirrors those types rather than replacing them.

The mirror MUST be held to the contract by a bidirectional compile-time parity assertion. A field added to `InfoschematicConfigInput` and not to the schema MUST fail the type-check, and so MUST the reverse. The comparison is exact type identity over structurally flattened types, not mutual assignability, because two types that merely accept each other's values still differ when one drops an optional field — and a silently dropped optional field is precisely the drift the assertion exists to catch.

Every object in the schema is strict. A hand-edited document's most common defect is a misspelt key, and a permissive schema would drop it and render a subtly wrong diagram rather than report the typo. A document MAY carry `$schema` to point an editor at its schema; the loader removes that editor metadata before validating rather than admitting it to the contract.

The published JSON Schema MUST be projected from the same Zod schema through `z.toJSONSchema()`, so an editor and the loader agree by construction and no second generator exists to fall out of step. Its serialised form is committed so an editor can consume it without a build.

The parse boundary is one function, `parseInfoschematic(text, options)`, which selects a parser by explicit format or by pathname extension, validates, and on success passes the value through `defineInfoschematic` so a document and a TypeScript literal arrive at the same normalised config. It MUST return a discriminated result rather than throwing: the caller at a file boundary wants to print a diagnostic, not catch an exception. Unparseable syntax, contract violations, and the normaliser's own referential checks MUST all be reported in that one shape.

The boundary also admits TypeScript itself as a document format. `parseTypescriptDocument` reads a strict literal subset — comments, `import type` lines, exactly one exported object literal — as plain data and never executes anything; the parsed value flows through the same schema and `defineInfoschematic` pipeline as JSON and YAML. The grammar is part of this validation boundary rather than a compiler: anything the subset cannot express as a literal, including a `defineInfoschematic(...)` call, MUST be rejected with the same path-addressed diagnostic shape.

`yaml` is chosen over `js-yaml` because its default `parse` constructs only plain data. It has no schema that instantiates arbitrary types, so there is no unsafe-load footgun to remember at an untrusted boundary.

## Consequences

TypeScript authoring keeps its compile-time guarantee and stays first-class; the existing examples do not migrate. The contract package remains installable with no runtime dependency, and the dependency direction in the architecture guide is unchanged.

The mirror is real duplication: adding a field to the contract means adding it to the schema. That cost is paid deliberately in exchange for the parity assertion making the duplication impossible to forget, and it buys path-specific diagnostics and an editor schema from one source.

Strict objects mean a document authored against a newer version of the contract is rejected rather than partially understood by older tooling. For a repository-local authoring format that is the safer failure, but it is a compatibility constraint on any future document-versioning scheme.

TOML remains out of scope. Its table syntax expresses deeply nested heterogeneous arrays — which is exactly what a Regions, Cards, and Flows document is — far more awkwardly than YAML, so it would carry a dependency and a supported-format promise for a worse authoring experience than the two formats already chosen.
