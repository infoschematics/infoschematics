---
id: INFOSCHEMATICS-TOOL-132
area: TOOL
title: Autocomplete while authoring
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 0b69e9f13d3c77e53eaf76c49f11b84fcc600726
created_at: 2026-09-22T20:05:00Z
updated_at: 2026-09-23T00:45:00Z
---

# Autocomplete while authoring

## Goal

An author editing an Infoschematic is offered the properties and values that are legal where their cursor is, and told what each one means, without leaving the editor to read a guide.

## Context

YAML has no schema mechanism of its own, but every mainstream editor resolves one through `yaml-language-server`, either from a `# yaml-language-server: $schema=…` comment at the top of a file or from a glob mapping in editor settings. This repository already generates the schema that would drive it — `packages/domain-core/schema/infoschematic.schema.json`, written by `scripts/generate-schema.ts` — and already uses the modeline in three places: `scripts/fixtures/format-parity.yaml`, the playground seed at `apps/site/src/playground/seeds/media-pipeline.yaml`, and the authoring guide's example at `apps/site/content/authoring.md:215`.

So the mechanism is present and proven, and is simply not pointed at the places an author works. None of the five documents under `examples/` carries the modeline, and there is no `.vscode/settings.json`, so a new document gets nothing until someone remembers to paste a relative path.

The larger gap is what the schema offers once it is resolved. It has 330 typed nodes, 15 enums and **zero `description` fields**, with a single `title` on the root. Property-name completion works, enum-value completion works for those 15, and `additionalProperties: false` in 61 places turns a misspelling into a reported error rather than silence — that part is genuinely good. But every suggestion arrives as a bare word. An author offered `major-plus-minor` beside `dots` learns nothing about either, which is the moment the guide was supposed to become unnecessary.

The schema also declares `$id: https://infoschematics.info/schema/infoschematic.schema.json`, and nothing serves that URL. Relative paths work inside this repository and break everywhere else, so an author embedding an Infoschematic in their own project — which `PDR-INFOSCHEMATICS-002` positions as the normal case — cannot resolve the schema at all.

## Boundary

Editor assistance for authored documents: descriptions carried from the domain model into the generated schema, the modeline or settings mapping wherever authoring happens, and a resolvable published location for the schema itself. Serving a static JSON file from the existing site is not a package-registry publication and does not engage that question.

It does not add validation rules, change the contract, or build the machine-readable diagnostics surface, which `INFOSCHEMATICS-TOOL-108` owns. This is about what an editor can already do with the schema that exists.

## Current state

`packages/domain-core/src/schema.ts` is a 592-line Zod mirror of the contract, and `infoschematicJsonSchema()` at `:572` emits the committed file through `z.toJSONSchema(infoschematicSchema, { io: 'input' })`. Zod carries a `.describe()` call into a JSON Schema `description`, and the file contains **no `.describe()` calls at all** — which is exactly why the generated schema has 330 typed nodes and zero descriptions.

`scripts/generate-schema.ts` writes the committed file and verifies it with `--check`, so a description added to the Zod source reaches an author's editor through the existing gate with no new machinery.

Three files carry the modeline today and none of them is a document an author would start from: a test fixture, a playground seed, and a guide example. The five documents under `examples/` carry none, and there is no `.vscode/settings.json`.

## Steps

- [x] Describe every enum in `packages/domain-core/src/schema.ts` — what each value means and when to reach for it — since a bare list of words is the case the owner raised. Cover the properties that carry them too, because an author reads the property's description before opening its value list.
- [x] Describe the rest of the authored contract as far as it pays: an artefact kind, a Collection, a Fabric, a Point, a Flow, a Scope, an Overlay, a Dynamic. Stop where a description would only restate the property name.
- [x] Regenerate the committed schema and let `--check` prove it current, so descriptions cannot go stale against the Zod source.
- [x] Add the modeline to the five documents under `examples/`, so the corpus an author copies from is itself assisted.
- [x] Add a `.vscode/settings.json` `yaml.schemas` mapping over an `infoschematic.yaml` glob, so a new document is covered without anyone remembering a relative path.
- [x] Serve the schema from the site at the `$id` it already declares, `https://infoschematics.info/schema/infoschematic.schema.json`, so an author working outside this repository can resolve it. This is a static asset on our own site, not a registry publication.
- [x] Point the guide at the published URL rather than a relative path, and say plainly in `apps/site/content/authoring.md` how to switch an editor on.

## Files touched

`packages/domain-core/src/schema.ts`; the regenerated `packages/domain-core/schema/infoschematic.schema.json`; the five `examples/*/infoschematic.yaml`; a new `.vscode/settings.json`; the site's static asset route and build; `apps/site/content/authoring.md`.

## Verify

`bun run self:check`, which runs the generator's `--check` and the site build.

The evidence that matters is not a passing gate, because a description that is present and useless passes every check there is. Open one of the five documents in an editor, type into `appearance`, and look at what is offered: the property list, the value list under an enum, and the hover text on each. Capture that to `reports/`. Then do the same against a document outside this repository resolving the published URL, because the relative path working proves nothing about the case the `$id` exists to serve.

## Dependencies / blocks

Nothing blocks it and it blocks nothing.

`INFOSCHEMATICS-TOOL-131` and `INFOSCHEMATICS-TOOL-129` will rename parts of what is described here — `surface` becomes `style`, a mode arrives. That is not a reason to wait: a description lives beside the field it describes in the Zod source, so a rename carries it along and the cost of arriving first is rewriting one or two sentences.

## Documentation impact

### Decision Records

None. Emitting a schema an editor can use is already the committed behaviour; this supplies what it was always meant to carry.

### Specifications

If the published URL becomes something consumers rely on, its stability is a claim worth stating rather than leaving implicit in a static file. Decide during the work whether that belongs in a specification or only in the guide.

### Guides

`apps/site/content/authoring.md` gains the published `$schema` line and how to switch an editor on. It currently shows the modeline with a repository-relative path, which does not work for the reader it is written for.

### Roadmap

Nothing follows. `INFOSCHEMATICS-TOOL-108` remains the separate, larger machine-readable diagnostics surface; this is what an editor can already do unaided.

## Review

### Delivered

Every property the contract declares now says what it is for, the schema is served at the address its own `$id` names, and the documents an author copies from resolve it. An author typing inside `appearance` is offered `neutral` and `blueprint` with an account of each beside it, rather than two bare words.

The work also produced the finding that a static check would not have: driving the real language server showed that the nine element collections under `diagram` — `cards`, `flows`, `regions` and the rest, the keys an author reaches for first — were still bare after the enum pass looked complete. Those are described now, and a coverage check holds the whole surface at zero undescribed properties.

### Summary of changes

`packages/domain-core/src/schema.ts` carries `.describe()` throughout: every closed value set, every named artefact, the geometry, the ports, the unwrapped identity shorthand, and the document root. The regenerated `packages/domain-core/schema/infoschematic.schema.json` holds **0 undescribed properties**, up from zero descriptions of any kind.

`apps/site/vite.config.ts` gains a plugin that publishes the generated schema at `/schema/infoschematic.schema.json` in development and in the built site. It reads the generated file rather than copying it into `public/`, because a second committed copy drifts silently and `self:schema:verify` already proves the generated one matches the runtime contract. `apps/site/public/_headers` adds the content type and the cross-origin header an editor needs to fetch it.

The five authored documents under `examples/` carry the published modeline. `.vscode/settings.json` maps `infoschematic.yaml` to the working copy's generated schema instead, so a contributor is completed against the contract they are changing; `.vscode/extensions.json` recommends the extension that reads it. `apps/site/content/authoring.md` now shows the published URL, says which extension is needed, and explains which of the two mappings applies where.

`scripts/schema-publication.test.ts` is new: it holds the `$id` and the site's publication path together, requires the modeline on every authored example, and asserts that no property is left undescribed. `turbo.json` declares the two files it reads that were not already inputs.

### Verification

`bun run self:check` — 48 tasks, 48 successful.

The evidence the record asked for is in `reports/TOOL-132-authoring-autocomplete.md`, taken by driving `yaml-language-server` — the server the Visual Studio Code extension runs — over stdio and asking it for completions at a cursor, with the probes kept beside it. It covers both halves: a document in this repository, and a document at `/tmp/outside-repo` with no checkout resolving the schema over HTTP from the built site. A deliberate `surface: sepia` is reported as `Value is not accepted. Valid values: "neutral", "blueprint".`

Two checks were proven by breaking them rather than by passing: removing one `description` from the generated schema fails the coverage assertion with the offending path named, and touching `.vscode/settings.json` turns the cached `self:scripts:test` replay into a miss.

### Outstanding concerns

The published URL only becomes live on deploy. Everything up to DNS and TLS is proven against the built site over HTTP, but the modelines in the five example documents point at an address that does not answer until `main` is pushed and the site is published. That is a push decision, not a code one.

`apps/site/content/authoring.md` is stale in ways outside this boundary — it documents `domains`, `flowFamilies`, `interfaces` and `specificationGroups` against a contract that now says `families`, `scopes` and `specifications`. The sections this work touched are correct; the rest was left alone and is worth its own record.

`INFOSCHEMATICS-TOOL-129` renames `surface` to `style` and adds a mode. The descriptions written here for `surface` will need one sentence rewritten when it lands, which the record already anticipated.

### Post-change review

The interesting part is that the static sweep and the language server disagreed, and the language server was right. Counting `description` fields in the generated JSON said 126 and looked like coverage; asking the server what it would actually offer an author at a cursor showed nine of eleven keys arriving bare. The sweep was counting descriptions that existed anywhere in the tree, including ones no completion would ever surface. The coverage check now walks properties and resolves `$ref`, which is the shape the question actually has.

That is the same lesson `AGENTS.md` records about a passing suite and visual treatment, arriving through a different door: the check has to measure the thing the reader experiences, not a proxy for it.

### Mini recap

Descriptions throughout the Zod contract, published at the `$id`, modelines on the corpus, editor mapping for contributors, guide corrected, and a check that holds all of it. Proven by driving the real language server from inside and outside the repository. Left for the owner: whether to push, which is what makes the published URL answer.

## Discussion

Raised on 2026-09-22 by the owner, wanting enum values to autocomplete while authoring. The answer turned out to be that the mechanism is already here and under-supplied rather than absent, which is the more useful finding: the work is filling the schema in and pointing editors at it, not adopting a new tool.

The zero-descriptions measurement is the part worth keeping. Strictness was taken seriously — `additionalProperties: false` in 61 places, so a misspelling is an error rather than silence — and explanation was not taken at all. Those are the two halves of the same job, and only one was done.

### Adoption

Adopted into Now on 2026-09-23 at the owner's explicit direction, moved from Triage. The earlier note to sequence it behind the colour and workspace records was dropped deliberately: descriptions live beside their fields in the Zod source, so a later rename carries them rather than discarding them.
