# Authoring — AUTHOR

Canonical document formats, identity, normalisation, validation, and serialisable authoring boundaries. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### AUTHOR-001 — Authored things have stable identity

Every authored artefact and flow MUST carry an identifier and a display code. Identifiers used by relationships MUST name an authored thing that exists. Identity MUST be stable across ordering, filtering and rendering.

_Conformance:_ conforming

_Verify:_ Read the shapes in `packages/domain-model/src/artefact.ts`, `packages/domain-model/src/flow.ts`, and `packages/domain-model/src/point.ts`: each declares its identifier and its display code as its own fields rather than deriving either. Then validate a document whose Flow names an endpoint no artefact declares and confirm it is refused rather than rendered, and reorder and filter a document and confirm every identifier is the one it started with.

_Evidence:_ `packages/domain-model/src/artefact.ts`, `packages/domain-model/src/flow.ts` and `packages/domain-model/src/point.ts`.

### AUTHOR-002 — Codes are authored, not inferred from position

A code MUST be part of the authored model rather than derived from array position or the number of preceding entries. Removing an entry MUST NOT renumber the remaining entries. A host MAY apply its own code-family conventions, but those conventions MUST NOT be imposed by the generic Domain Model.

_Conformance:_ conforming

_Verify:_ Read the `code` fields in `packages/domain-model/src/artefact.ts`, `packages/domain-model/src/flow.ts`, `packages/domain-model/src/point.ts`, `packages/domain-model/src/scene.ts`, and `packages/domain-model/src/story.ts`: each is authored, and none is an ordinal over its array. Then remove a middle entry from an authored document and diff the remaining codes — none may change. Falsified by a code computed from a position, or by a code-family convention baked into Domain Model rather than left to the host.

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

A structured authoring edit MUST preserve comments, scalar style, aliases, mapping order, and unmodified concrete YAML outside the ID-addressed values it changes.

_Conformance:_ conforming

_Verify:_ `packages/domain-core/src/document-edit.test.ts` covers comments, quoted and block scalars, aliases, mapping order, stable collection anchors, and exact inverse restoration.

_Evidence:_ `InfoschematicDocument` in `packages/domain-core/src/document.ts` retains source-token YAML privately; `applyInfoschematicDocumentEdit` in `packages/domain-core/src/document-edit.ts` edits a cloned document and emits its retained concrete syntax.

## Quality properties

### AUTHOR-007 — Authored definitions are data

An Infoschematic definition MUST be expressible as serialisable data. It MUST NOT contain React components, runtime stores, browser state or derived registries. Renderer extension points MUST be stable string keys with serialisable properties.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/domain-model` and `bun run self:boundaries:verify`, then round-trip a complete authored definition through `JSON.stringify` and back and diff it against the original — anything lost was not data. Falsified by a field typed as a React component, a store, a browser object, or a registry, or by a renderer extension point keyed on anything but a stable string with serialisable properties.

_Evidence:_ `packages/domain-model/src/modules.test.ts` checks the public module surface; dependency direction is checked by `bun run self:boundaries:verify`.

### AUTHOR-008 — Authored data and calculations have separate owners

The Domain Model MUST declare data shapes without importing View Model or view packages. Calculations that turn authored data into routes, ports, placements or rendering state belong outside Domain Model.

_Conformance:_ conforming

_Verify:_ Run `bun run self:boundaries:verify`, which decides this through the `domain-model-has-no-workspace-dependencies` and `domain-and-derivation-stay-framework-neutral` rules in `.dependency-cruiser.ts`, and which refuses a cruise that measured nothing, so a green result is one that looked. Then read Domain Model for calculation: a function that turns authored data into routes, ports, placements, or rendering state is a breach even where no import crosses.

_Evidence:_ `bun run self:boundaries:verify` enforces the Domain Model dependency boundary through the `domain-model-has-no-workspace-dependencies` rule.

### AUTHOR-009 — Renderer references remain serialisable

An authored Fabric, Overlay, or Callout MAY select a host visual implementation with a stable renderer key and positive integer schema version. Its properties MUST remain serialisable scalar data. Authored configuration MUST NOT contain React components, JSX, callbacks, validators, runtime stores, or derived registries.

A scalar renderer key MAY be accepted as compatibility input and MUST normalise to schema version `1`; canonical serialisation MUST emit the structured key-and-version reference.

Renderer availability MUST NOT determine an artefact's identity, relationships, placement, or Audience content. A host or output that does not implement a compatible renderer MUST retain the product fallback.

_Conformance:_ conforming

_Verify:_ `packages/domain-core/src/authoring.test.ts` compares scalar and structured input, invalid versions, canonical serialisation, and stable re-emission.

_Evidence:_ `RendererReference` in `packages/domain-model/src/renderer.ts`, the canonical schema in `packages/domain-core/src/schema.ts`, and the renderer-reference cases in `packages/domain-core/src/authoring.test.ts`.

### AUTHOR-010 — Normalisation is total over well-typed input

`defineInfoschematic` MUST accept a partial authored definition and return a complete `InfoschematicConfig`, supplying the default view box, the default appearance, and an empty collection for every absent authored collection. It MUST reject a duplicate Domain identifier and a Card naming a Domain that was never declared.

Because it is total over well-typed input, it MUST NOT be treated as a validator for input the compiler has not checked: handed a structurally wrong object it will normalise it into a config that renders an empty or subtly incorrect Infoschematic.

_Conformance:_ conforming

_Verify:_ `packages/domain-core/src/index.test.ts`.

_Evidence:_ `packages/domain-core/src/define.ts`.

### AUTHOR-011 — The schema mirrors the contract and cannot drift from it

Document validation MUST use a schema that mirrors `InfoschematicConfigInput` and MUST be held to it by a bidirectional compile-time parity assertion, so that a field present in one and absent from the other fails the type-check. Type ownership MUST remain in `@infoschematics/domain-model`, which MUST stay free of runtime dependencies.

_Conformance:_ conforming

_Verify:_ Run `bun run self:schema:verify` and `bun run self:typecheck`, then break the mirror on purpose in both directions: add a field to `InfoschematicConfigInput` and not to the schema, then to the schema and not to the contract. `SchemaMirrorsContract` must fail the type-check each time — a mirror that only holds one way is the drift this requirement exists to catch. Confirm `packages/domain-model/package.json` still declares no runtime dependency.

_Evidence:_ `infoschematicSchema` and `SchemaMirrorsContract` in `packages/domain-core/src/schema.ts`. Decision: [ADR-INFOSCHEMATICS-013](../decisions/ADR-INFOSCHEMATICS-013-validation-mirrors-the-contract.md).

### AUTHOR-012 — The published JSON Schema comes from the validating schema

The JSON Schema offered to editors MUST be projected from the same schema the loader validates with, so the two cannot disagree. Its serialised form is committed at `packages/domain-core/schema/infoschematic.schema.json` and MUST be regenerated whenever the schema changes. It is a repository file rather than a published package export: the release contract in [ADR-INFOSCHEMATICS-010](../decisions/ADR-INFOSCHEMATICS-010-coordinated-package-release-contract.md) admits only compiled ESM and declarations.

_Conformance:_ conforming

_Verify:_ `bun run self:schema:verify`, which fails when the committed file is stale.

_Evidence:_ `infoschematicJsonSchema` in `packages/domain-core/src/schema.ts` and `scripts/generate-schema.ts`.

### AUTHOR-013 — Document edits are transactional and reversible

Domain Core MUST validate a complete versioned edit batch before publishing its document, source, or model, return the original document unchanged on failure, and return an inverse capable of restoring the prior semantic value and exact affected source on success.

_Conformance:_ conforming

_Verify:_ `packages/domain-core/src/document-edit.test.ts` covers invalid paths, invalid references, whole-batch rollback, undo, redo, and dishonest syntax-snapshot rejection.

_Evidence:_ `applyInfoschematicDocumentEdit` in `packages/domain-core/src/document-edit.ts` clones before mutation, reparses through the canonical loader, and verifies inverse concrete syntax against the computed semantic result.

### AUTHOR-014 — Document edits use stable addresses

A durable document edit MUST address collection members by stable IDs and order them with stable before-or-after ID anchors rather than numeric indices.

_Conformance:_ conforming

_Verify:_ `packages/domain-core/src/document-edit.test.ts` covers field and ID segments, add and move anchors, missing targets, and numeric-path rejection.

_Evidence:_ `InfoschematicDocumentPathSegment` and `InfoschematicDocumentAnchor` in `packages/domain-core/src/document-edit.ts` are the only public path and collection-order vocabulary.

### AUTHOR-015 — Studio presentation edits preserve authored source

In document mode, Studio MUST project expanded and collapsed Sequence and Scene edits through stable-ID document operations without replacing the complete presentation tree.

The projection may add, remove, or reorder Sequence and Scene members. Unchanged presentation fields and concrete syntax remain owned by the retained document.

_Conformance:_ conforming

_Verify:_ `packages/view-studio/src/app/editor/document-operations.test.ts` covers granular Sequence and Scene projection, comment retention, stable insertion, and idempotent reapplication; `App.browser.test.tsx` covers a canonical YAML Scene edit through Direct mode.

_Evidence:_ `sequencesWithEditorDrafts` in `packages/view-studio/src/app/editor/sequence-editing.ts` retains unexposed canonical fields, while `sequenceOperations` in `document-operations.ts` emits field and stable-ID member operations.

### AUTHOR-016 — Source replacement validates the whole document

Studio MUST validate a source-panel replacement as a complete canonical Infoschematic before it can become the current retained document; an invalid draft MUST remain inspectable with addressed diagnostics while the last valid model remains active.

_Conformance:_ conforming

_Verify:_ `packages/view-studio/src/app/App.browser.test.tsx` submits invalid and valid YAML through the Source tab and observes the rendered model and accessible error state.

_Evidence:_ `useDocumentTimeline` in `packages/view-studio/src/app/editor/document-history.ts` parses replacements through Domain Core and invokes the host only for a validated document.

### AUTHOR-017 — Every authored capability is shown by a published example

Every capability the document contract offers MUST be exercised by an authored [Infoschematic](../reference/vocabulary.md#infoschematic) published from this repository. A capability added to the contract MUST NOT be reachable only by hand-editing a document: the contract's surface and the examples that demonstrate it MUST be kept in step mechanically, because the alternative is a notation nobody can see without first inventing a document that carries it.

Measured before this requirement existed, no authored document anywhere in the repository carried a [Fabric](../reference/vocabulary.md#fabric), an [Adapter Card](../reference/vocabulary.md#adapter-card), a Wrapper Card, an [Overlay](../reference/vocabulary.md#overlay), a bidirectional [Flow](../reference/vocabulary.md#flow), a Specification group or an `icon`, so trying any of them out meant editing a real diagram to find out what it drew.

_Conformance:_ conforming

_Verify:_ derive the capability list from the contract rather than a list kept beside the check — every property the authored schema declares, at its own path, and every value its choices admit — then assert the published showcase exercises each. Prove the check is not vacuous in both halves: remove `adapts:` from the showcase and the property half MUST fail; change its one dotted Region frame to dashed and the value half MUST fail. A derivation that resolved nothing would satisfy every assertion after it, so the floors on what it discovered MUST be asserted first.

_Evidence:_ `scripts/example-capability-coverage.test.ts` walks the JSON Schema projected from `infoschematicSchema` in `packages/domain-core/src/schema.ts` and measures `examples/is-showcase/infoschematic.yaml` against it, in both its authored YAML and its canonical model; `examples/is-showcase/src/index.test.ts` covers what that document is for.

## Gaps

- `AUTHOR-005`'s composition with `ROUTE-001` is stated as `COMPOSE-003` in [Composition](composition.md): a document this area accepts can still hold geometry the renderer refuses, and today that refusal arrives as a thrown error rather than an issue.
