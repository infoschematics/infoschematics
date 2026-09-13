# Authoring — AUTHOR

Canonical document formats, identity, normalisation, validation, and serialisable authoring boundaries. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### AUTHOR-001 — Authored things have stable identity

Every authored artefact and flow MUST carry an identifier and a display code. Identifiers used by relationships MUST name an authored thing that exists. Identity MUST be stable across ordering, filtering and rendering.

_Conformance:_ conforming

_Verify:_ inspect `packages/domain-model/src/artefact.ts`, `packages/domain-model/src/flow.ts` and `packages/domain-model/src/point.ts`. against this requirement.

_Evidence:_ `packages/domain-model/src/artefact.ts`, `packages/domain-model/src/flow.ts` and `packages/domain-model/src/point.ts`.

### AUTHOR-002 — Codes are authored, not inferred from position

A code MUST be part of the authored model rather than derived from array position or the number of preceding entries. Removing an entry MUST NOT renumber the remaining entries. A host MAY apply its own code-family conventions, but those conventions MUST NOT be imposed by the generic Domain Model.

_Conformance:_ conforming

_Verify:_ inspect the `code` fields in `packages/domain-model/src/artefact.ts`, `packages/domain-model/src/flow.ts`, `packages/domain-model/src/point.ts`, `packages/domain-model/src/scene.ts` and `packages/domain-model/src/story.ts`. against this requirement.

_Evidence:_ the `code` fields in `packages/domain-model/src/artefact.ts`, `packages/domain-model/src/flow.ts`, `packages/domain-model/src/point.ts`, `packages/domain-model/src/scene.ts` and `packages/domain-model/src/story.ts`.

### AUTHOR-003 — YAML and JSON are the authored formats

YAML MUST be the preferred authored document format and JSON syntax MUST be accepted as the same restricted plain-data model. Both MUST produce the same normalised canonical Infoschematic and rendered output. A pathname ending in `.yaml`, `.yml`, or `.json` MUST be accepted; another extension MUST be rejected rather than guessed. Programmatic TypeScript MAY construct the same canonical model through its exported types, but the authored-document parser MUST NOT execute JavaScript or TypeScript.

_Conformance:_ conforming

_Verify:_ `packages/domain-core/src/parse.test.ts` and `scripts/format-parity.test.ts` cover YAML and JSON parity.

_Evidence:_ `packages/domain-core/src/parse.ts`.

### AUTHOR-004 — An unknown key is a fault, not something to ignore

Validation MUST reject a key the contract does not declare rather than dropping it, because a misspelt key would otherwise render a silently incorrect Infoschematic. A document MAY carry a `$schema` key to point an editor at its schema; that editor metadata MUST be removed before validation rather than admitted to the contract.

_Conformance:_ conforming

_Verify:_ `packages/domain-core/src/schema.test.ts`.

_Evidence:_ the strict objects in `packages/domain-core/src/schema.ts`.

### AUTHOR-005 — Rejection is a result, not an exception

`parseInfoschematic` MUST return a discriminated result rather than throwing. A failure MUST carry one or more issues, each naming the dotted path of the offending value — empty for the document itself — a message, and the document pathname when the caller supplied one. Unparseable syntax, contract violations, and the referential checks in CORE-001 MUST all be reported in that same shape, so a caller has one thing to print.

_Conformance:_ conforming

_Verify:_ `packages/domain-core/src/parse.test.ts`.

_Evidence:_ `packages/domain-core/src/parse.ts`.

### AUTHOR-006 — Structured edits preserve authored YAML

A structured authoring edit MUST preserve comments, scalar style, and unmodified concrete YAML outside the ID-addressed values it changes.

_Conformance:_ pending

_Verify:_ round-trip a commented YAML fixture through one structured edit and compare every unmodified concrete-syntax node.

## Quality properties

### AUTHOR-007 — Authored definitions are data

An Infoschematic definition MUST be expressible as serialisable data. It MUST NOT contain React components, runtime stores, browser state or derived registries. Renderer extension points MUST be stable string keys with serialisable properties.

_Conformance:_ conforming

_Verify:_ `packages/domain-model/src/modules.test.ts` checks the public module surface; dependency direction is checked by the repository `check:deps` script.

_Evidence:_ `packages/domain-model/src/modules.test.ts` checks the public module surface; dependency direction is checked by the repository `check:deps` script.

### AUTHOR-008 — Authored data and calculations have separate owners

The Domain Model MUST declare data shapes without importing View Model or view packages. Calculations that turn authored data into routes, ports, placements or rendering state belong outside Domain Model.

_Conformance:_ conforming

_Verify:_ the repository `check:deps` script enforces the Domain Model dependency boundary.

_Evidence:_ the repository `check:deps` script enforces the Domain Model dependency boundary.

### AUTHOR-009 — Renderer references remain serialisable

An authored Fabric, Overlay, or Callout MAY select a host visual implementation by stable renderer key. Its properties MUST remain serialisable scalar data. Authored configuration MUST NOT contain React components, JSX, callbacks, validators, runtime stores, or derived registries.

Renderer availability MUST NOT determine an artefact's identity, relationships, placement, or Audience content. A host or output that does not implement a compatible renderer MUST retain the product fallback.

_Conformance:_ conforming

_Verify:_ inspect renderer references in `packages/domain-model/src/fabric.ts`, `packages/domain-model/src/graphic.ts`, and `packages/domain-model/src/scene.ts`. against this requirement.

_Evidence:_ renderer references in `packages/domain-model/src/fabric.ts`, `packages/domain-model/src/graphic.ts`, and `packages/domain-model/src/scene.ts`.

### AUTHOR-010 — Normalisation is total over well-typed input

`defineInfoschematic` MUST accept a partial authored definition and return a complete `InfoschematicConfig`, supplying the default view box, the default appearance, and an empty collection for every absent authored collection. It MUST reject a duplicate Domain identifier and a Card naming a Domain that was never declared.

Because it is total over well-typed input, it MUST NOT be treated as a validator for input the compiler has not checked: handed a structurally wrong object it will normalise it into a config that renders an empty or subtly incorrect Infoschematic.

_Conformance:_ conforming

_Verify:_ `packages/domain-core/src/index.test.ts`.

_Evidence:_ `packages/domain-core/src/define.ts`.

### AUTHOR-011 — The schema mirrors the contract and cannot drift from it

Document validation MUST use a schema that mirrors `InfoschematicConfigInput` and MUST be held to it by a bidirectional compile-time parity assertion, so that a field present in one and absent from the other fails the type-check. Type ownership MUST remain in `@infoschematics/domain-model`, which MUST stay free of runtime dependencies.

_Conformance:_ conforming

_Verify:_ inspect `infoschematicConfigSchema` and `SchemaMirrorsContract` in `packages/domain-core/src/schema.ts`. Decision: [ADR-INFOSCHEMATICS-013](../decisions/ADR-INFOSCHEMATICS-013-validation-mirrors-the-contract.md). against this requirement.

_Evidence:_ `infoschematicConfigSchema` and `SchemaMirrorsContract` in `packages/domain-core/src/schema.ts`. Decision: [ADR-INFOSCHEMATICS-013](../decisions/ADR-INFOSCHEMATICS-013-validation-mirrors-the-contract.md).

### AUTHOR-012 — The published JSON Schema comes from the validating schema

The JSON Schema offered to editors MUST be projected from the same schema the loader validates with, so the two cannot disagree. Its serialised form is committed at `packages/domain-core/schema/infoschematic.schema.json` and MUST be regenerated whenever the schema changes. It is a repository file rather than a published package export: the release contract in [ADR-INFOSCHEMATICS-010](../decisions/ADR-INFOSCHEMATICS-010-coordinated-package-release-contract.md) admits only compiled ESM and declarations.

_Conformance:_ conforming

_Verify:_ `bun run self:verify:schema`, which fails when the committed file is stale.

_Evidence:_ `infoschematicJsonSchema` in `packages/domain-core/src/schema.ts` and `scripts/generate-schema.ts`.
