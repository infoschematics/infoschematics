# Author an example package

Every directory under `examples/` is a copyable starting point: someone can take it out of this repository, install it, render it, and edit it without learning any repository convention first. This guide describes the contract that makes that true and the steps for adding or changing one.

## The contract

An example package holds six things.

1. **A canonical YAML document**, at the package root, named for what it contains. This is the only authored copy of the Infoschematic.
2. **Package metadata** under an `infoschematics.examples` key, declaring each document's stable `id`, `title`, `source` pathname, and the `export` name generated from it.
3. **A generated typed export** at `src/<document>.ts`, produced by `bun run self:examples:generate` and re-exported from `src/index.ts`. It embeds the document's exact bytes and parses them at import time, so it cannot describe a model the YAML does not. [ADR-INFOSCHEMATICS-022](../decisions/ADR-INFOSCHEMATICS-022-generate-example-exports-from-authored-yaml.md) records why the export is generated rather than authored.
4. **`check` and `render` commands** in `package.json`, invoking `@infoschematics/cli` against the YAML by relative pathname so they behave identically inside the workspace and in a copy.
5. **A README** covering purpose, files, install, render, edit, and host integration, linking directly to the canonical YAML.
6. **Tests** asserting the exported model's shape and its serialisability, so a document that parses but means something else still fails.

Example packages stay `private: true`; they are copied, not installed. [ADR-INFOSCHEMATICS-023](../decisions/ADR-INFOSCHEMATICS-023-keep-example-packages-copyable-rather-than-published.md) records that choice and the verification that keeps it honest.

## Add an example

Copy the closest existing package, then:

1. Author the document as `infoschematic.yaml` and validate it with `bun run --cwd examples/<name> check`.
2. Declare it in the package manifest:

   ```json
   "infoschematics": {
     "examples": [
       { "export": "myInfoschematic", "id": "my-example", "source": "infoschematic.yaml", "title": "My example" }
     ]
   }
   ```

3. Run `bun run self:examples:generate` to write `src/infoschematic.ts`, and re-export it from `src/index.ts`.
4. Give the package what every workspace has: a `tsconfig.json` extending the root one, a `vitest.config.ts` that re-exports `workspaceTests(import.meta.url)`, and `test` and `typecheck` scripts in its manifest. Turborepo's cache unit is a task in a package, so a workspace without those scripts is one `turbo run` skips silently and greenly; `scripts/workspace-sources.test.ts` fails and names it. The `vitest.config.ts` is what points the suite at its siblings' source rather than their last build, so a package without one passes against stale output.
5. Add the package's `src` to `self:boundaries:verify` in the root `package.json`, which still enumerates the directories it cruises.
6. Run `bun run self:check`.

Nothing else needs to learn about the new example. `scripts/render-example.ts` builds its catalogue from the declared metadata, so `bun run self:examples:render --all` picks the document up on its own.

## Change an example

Edit the YAML, then run `bun run self:examples:generate`. `bun run self:examples:verify` — part of `bun run self:check` — fails and names any generated module that no longer matches its document, so a forgotten regeneration cannot reach a commit.

Never edit a generated module. Its header says so, and the next generation would discard the change silently.

## Verify copyability

`bun run self:packages:pack-smoke` packs the public packages, copies each example directory into a clean temporary project outside the monorepo, installs it against those tarballs, and runs the package's own documented `check` and `render` commands there. It then compares the SVG that copy produced against the SVG this repository renders from the same document, and imports the copied typed export to confirm it still parses to the same model.

That comparison is the whole point: an example that only renders inside the workspace is not a copyable example, and without the clean-copy case nothing would notice the difference.
