# Repository guidance

Infoschematics contains the product contract, framework-neutral calculations, React application, examples, public guidance and website. Keep changes inside the workspace that owns them and preserve the dependency direction documented in [the architecture guide](docs/design/architecture.md).

Use the canonical terms in [the vocabulary specification](docs/specs/vocabulary.md). Do not introduce `topology`, `programme`, `demonstration`, `spotlight`, `vendor` or `stage` as new public product concepts. Existing internal occurrences are migration work owned by `INFOSCHEMATICS-TOOL-002`.

Authored Infoschematic definitions are serialisable data. They may contain stable renderer keys, but never React components, runtime stores, browser state or derived registries. Hosts own mounting, `document.title`, routing and deployment.

The public website is an outlet for this repository, not an owner of product behaviour. Preserve the designed homepage, keep examples independently authored, and place reusable capability in Core, Model or the React package before consuming it from the site.

Run `bun run check` before committing. It verifies tests, every TypeScript workspace, dependency boundaries and the production website build.
