# Domain Core specification

Domain Core turns an authored definition into a complete Infoschematic. It normalises a TypeScript literal that the compiler has already proved, and it validates an authored document — strict-subset TypeScript, JSON, or YAML — that nothing has proved. It calculates no geometry, renders no view, and holds no editing session.

## Normalisation

### CORE-001 — Normalisation is total over well-typed input

`defineInfoschematic` MUST accept a partial authored definition and return a complete `InfoschematicConfig`, supplying the default view box, the default appearance, and an empty collection for every absent authored collection. It MUST reject a duplicate Domain identifier and a Card naming a Domain that was never declared.

Because it is total over well-typed input, it MUST NOT be treated as a validator for input the compiler has not checked: handed a structurally wrong object it will normalise it into a config that renders an empty or subtly incorrect Infoschematic.

_Implementation surface: `packages/domain-core/src/define.ts`. Verification: `packages/domain-core/src/index.test.ts`._

## Authored documents

### CORE-002 — TypeScript, JSON, and YAML are the supported formats

An Infoschematic MAY be authored as a TypeScript module, a JSON document, or a YAML document. The three MUST produce the same normalised `InfoschematicConfig` and therefore the same rendered output. No other document format is supported; a pathname whose extension is not `.ts`, `.json`, `.yaml`, or `.yml` MUST be rejected rather than guessed at.

A TypeScript document is read as data in a strict literal subset and MUST never be executed. The subset admits comments, `import type` lines, and exactly one exported definition — `export const <name> = <object literal>` or `export default <object literal>` — whose values are strings, plain decimal numbers, booleans, arrays, and nested object literals with identifier or string keys, trailing commas included. Everything else — identifiers as values, call expressions, template literals, spreads, computed keys, `satisfies` — MUST be rejected with a path-addressed diagnostic. A definition module in this subset therefore loads identically whether imported by the compiler or parsed as a document.

_Implementation surface: `packages/domain-core/src/parse.ts` and `packages/domain-core/src/typescript-document.ts`. Verification: `scripts/format-parity.test.ts` renders the same definition authored three ways and asserts byte-identical SVG, including the `.ts` form parsed as a document; `packages/domain-core/src/typescript-document.test.ts` covers the subset's accept and reject grammar._

### CORE-003 — The schema mirrors the contract and cannot drift from it

Document validation MUST use a schema that mirrors `InfoschematicConfigInput` and MUST be held to it by a bidirectional compile-time parity assertion, so that a field present in one and absent from the other fails the type-check. Type ownership MUST remain in `@infoschematics/domain-model`, which MUST stay free of runtime dependencies.

_Implementation surface: `infoschematicConfigSchema` and `SchemaMirrorsContract` in `packages/domain-core/src/schema.ts`. Decision: [ADR-INFOSCHEMATICS-013](../decisions/ADR-INFOSCHEMATICS-013-validation-mirrors-the-contract.md)._

### CORE-004 — An unknown key is a fault, not something to ignore

Validation MUST reject a key the contract does not declare rather than dropping it, because a misspelt key would otherwise render a silently incorrect Infoschematic. A document MAY carry a `$schema` key to point an editor at its schema; that editor metadata MUST be removed before validation rather than admitted to the contract.

_Implementation surface: the strict objects in `packages/domain-core/src/schema.ts`. Verification: `packages/domain-core/src/schema.test.ts`._

### CORE-005 — Rejection is a result, not an exception

`parseInfoschematic` MUST return a discriminated result rather than throwing. A failure MUST carry one or more issues, each naming the dotted path of the offending value — empty for the document itself — a message, and the document pathname when the caller supplied one. Unparseable syntax, contract violations, and the referential checks in CORE-001 MUST all be reported in that same shape, so a caller has one thing to print.

_Implementation surface: `packages/domain-core/src/parse.ts`. Verification: `packages/domain-core/src/parse.test.ts`._

### CORE-006 — The published JSON Schema comes from the validating schema

The JSON Schema offered to editors MUST be projected from the same schema the loader validates with, so the two cannot disagree. Its serialised form is committed at `packages/domain-core/schema/infoschematic.schema.json` and MUST be regenerated whenever the schema changes. It is a repository file rather than a published package export: the release contract in [ADR-INFOSCHEMATICS-010](../decisions/ADR-INFOSCHEMATICS-010-coordinated-package-release-contract.md) admits only compiled ESM and declarations.

_Implementation surface: `infoschematicJsonSchema` in `packages/domain-core/src/schema.ts` and `scripts/generate-schema.ts`. Verification: `bun run self:verify:schema`, which fails when the committed file is stale._

## Gaps

- Validation covers shape, enumerations, and port identity. The referential and geographic rules listed as gaps in the [Domain Model specification](domain-model.md) remain unvalidated for documents as well as for TypeScript, apart from the Domain checks in CORE-001.
- Strict objects mean a document authored against a newer contract is rejected rather than partially understood. No document-versioning or migration scheme is specified.
- The loader is a library boundary. Publishing it as an installable command is separate work.
