---
id: ADR-INFOSCHEMATICS-022
title: Generate example exports from authored YAML
date: 2026-09-15
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-008, ADR-INFOSCHEMATICS-013, ADR-INFOSCHEMATICS-020]
---

# ADR-INFOSCHEMATICS-022: Generate example exports from authored YAML

## Context

Each package under `examples/` exists to be read, copied, and adapted. Until now its canonical definition was a TypeScript module calling `defineInfoschematicModel`, which made the example legible to someone already inside this monorepo and opaque to everyone else: a reader who wanted the document had to mentally compile it, and a copier inherited a build step before seeing a diagram.

Moving the canonical definition into `infoschematic.yaml` fixes that, but browser consumers still need a typed export. Site imports `blankInfoschematic` and `homepageInfoschematic` directly, and a bundler cannot read a YAML file without a loader that hosts should not be required to configure. So each package needs both a document and a module, and the question is which one is authored.

Two authored copies of one diagram drift. Nothing in a type system relates a YAML file to a hand-written module that happens to describe the same Cards, and the failure is silent: the rendered homepage and the document a reader was told to copy diverge, each internally valid. The repository has already paid this cost elsewhere, which is why `bun run self:verify:schema` and `bun run self:verify:visual-tokens` exist.

## Decision

The YAML document is the single authored source in every example package. The typed export is generated from it by `bun run self:examples:generate`, committed beside the package source, and verified by `bun run self:verify:examples` inside `bun run self:check`.

The generated module embeds the exact bytes of the document it was generated from and calls `parseInfoschematic` on them at import time. It does not restate the model as an object literal. A consumer therefore imports the result of parsing the same document a reader copies, and a generated module that somehow survived a change to its YAML would still fail its own parse rather than serve a stale model. Package metadata under `infoschematics.examples` names the document, the export, and the stable identifier, so generation, discovery, and rendering all read one declaration.

Generated source is committed rather than produced during install. An example package must render for someone who copied the directory and ran `bun install`, and that person has no generator.

Two alternatives were declined. A bundler loader that imports YAML directly would remove generation, but it moves the cost onto every host that consumes an example and contradicts the package contract's promise that a copied directory works unchanged. Deriving the YAML from the TypeScript instead — generating the document from the module — keeps the drift out but leaves the authored artefact in the least readable form, which is the problem this work exists to remove.

## Consequences

Editing an example is editing its YAML, then running the generator; a `self:check` failure names the stale module. Reviewers read a diff of the document and a mechanical diff of its embedding, which is noisier per change than a TypeScript diff but carries no independent meaning to review.

The typed export keeps its existing name and shape, so Site, Playground, and the tests that consume it are unaffected. `scripts/render-example.ts` builds its catalogue from package metadata rather than from imports, so adding an example touches only that package.

Programmatic authoring stays fully supported for consumers: `defineInfoschematicModel` is unchanged, and [the programmatic examples guide](../guides/maintaining-programmatic-examples.md) still describes it. The decision governs what this repository's example packages author, not what a consumer may.
