# Repository guidance

Infoschematics contains the domain contract, framework-neutral view calculations, interactive views, authored Infoschematics, public guidance, and website. Keep changes inside the ownership root that owns them: reusable libraries under `packages/`, deployable applications under `apps/`, and independently authored Infoschematic examples under `examples/`. Preserve the dependency direction documented in [the architecture guide](docs/design/architecture.md).

Use canonical terms from [the vocabulary reference](docs/reference/vocabulary.md) and preserve durable reasoning in [the decision-record index](docs/decisions/README.md). Do not introduce `topology`, `programme`, `demonstration`, `spotlight`, `vendor`, or `stage` as new public product concepts. Existing internal occurrences are migration work owned by `INFOSCHEMATICS-TOOL-002`.

Authored Infoschematic definitions are serialisable data. They may contain stable renderer keys, but never React components, runtime stores, browser state, callbacks, or derived registries. Hosts own mounting, page metadata, routing, static assets, and deployment.

The public website is an outlet for this repository, not the owner of reusable product behaviour. Preserve the designed homepage, keep authored Infoschematics independent, and place reusable capability in Domain Model, Domain Core, View Model, or the appropriate renderer or View package before consuming it from Site.

Canonical consumer documentation remains under `docs/`; Site renders selected Markdown rather than maintaining copies.

Run `bun run check` before committing. It verifies tests, every TypeScript workspace, dependency boundaries, and the production website build.
