---
id: INFOSCHEMATICS-TOOL-132
area: TOOL
title: Autocomplete while authoring
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T20:05:00Z
updated_at: 2026-09-22T20:05:00Z
---

# Autocomplete while authoring

## Goal

An author editing an Infoschematic is offered the properties and values that are legal where their cursor is, and told what each one means, without leaving the editor to read a guide.

## Context

YAML has no schema mechanism of its own, but every mainstream editor resolves one through `yaml-language-server`, either from a `# yaml-language-server: $schema=…` comment at the top of a file or from a glob mapping in editor settings. This repository already generates the schema that would drive it — `packages/domain-core/schema/infoschematic.schema.json`, written by `scripts/generate-schema.ts` — and already uses the modeline in three places: `scripts/fixtures/format-parity.yaml`, the playground seed at `apps/site/src/playground/seeds/media-pipeline.yaml`, and the authoring guide's example at `apps/site/content/authoring.md:215`.

So the mechanism is present and proven, and is simply not pointed at the places an author works. None of the five documents under `examples/` carries the modeline, and there is no `.vscode/settings.json`, so a new document gets nothing until someone remembers to paste a relative path.

The larger gap is what the schema offers once it is resolved. It has 330 typed nodes, 15 enums and **zero `description` fields**, with a single `title` on the root. Property-name completion works, enum-value completion works for those 15, and `additionalProperties: false` in 61 places turns a misspelling into a reported error rather than silence — that part is genuinely good. But every suggestion arrives as a bare word. An author offered `major-plus-minor` beside `dots` learns nothing about either, which is the moment the guide was supposed to become unnecessary.

The schema also declares `$id: https://infoschematics.info/schema/infoschematic.schema.json`, and nothing serves that URL. Relative paths work inside this repository and break everywhere else, so an author embedding an Infoschematic in their own project — which `PDR-INFOSCHEMATICS-004` positions as the normal case — cannot resolve the schema at all.

## Boundary

Editor assistance for authored documents: descriptions carried from the domain model into the generated schema, the modeline or settings mapping wherever authoring happens, and a resolvable published location for the schema itself. Serving a static JSON file from the existing site is not a package-registry publication and does not engage that question.

It does not add validation rules, change the contract, or build the machine-readable diagnostics surface, which `INFOSCHEMATICS-TOOL-108` owns. This is about what an editor can already do with the schema that exists.

## Discussion

Raised on 2026-09-22 by the owner, wanting enum values to autocomplete while authoring. The answer turned out to be that the mechanism is already here and under-supplied rather than absent, which is the more useful finding: the work is filling the schema in and pointing editors at it, not adopting a new tool.

Worth sequencing after `INFOSCHEMATICS-TOOL-129` and `INFOSCHEMATICS-TOOL-131`, which change the enums an author would be completing — `surface` becomes `style`, a mode arrives, and the Card block may move under `INFOSCHEMATICS-TOOL-130`. Writing descriptions for values that are about to be renamed would be work done twice. Nothing stops the modeline and settings mapping landing sooner if the guide value is wanted immediately.
