# Guides

Guides explain **how**. Each one is written for a single audience, and its filename says which: `host-` guides are for developers building an application on the published packages, `repository-` guides are for people working on Infoschematics itself. A guide that would serve both is really two guides.

Neither group is the reader of the public consumer journey, which is Site-owned content under `apps/site/content/` by [ADR-INFOSCHEMATICS-014](../decisions/ADR-INFOSCHEMATICS-014-site-owned-user-guide.md). That journey teaches the product; these guides carry the procedures it does not stop for. Where a guide and the journey cover the same ground, the journey wins for teaching and the guide keeps only what it adds.

Product decisions explain why in [`docs/decisions/`](../decisions/README.md), Specifications define the accepted contract in [`docs/specs/`](../specs/index.md), and roadmap records track delivery in [`docs/roadmap/`](../roadmap/).

## Building on Infoschematics

For host application developers consuming the published packages.

- [Edit authored YAML](host-editing-authored-yaml.md) — apply stable-ID edits without losing comments, scalar styles, ordering, or host source authority.
- [Integrate a host renderer](host-integrating-renderers.md) — register versioned Fabric, Overlay, and Callout implementations with validated properties and accessible fallbacks.
- [Render from the command line](host-rendering-from-the-command-line.md) — turn canonical YAML or JSON into deterministic SVG in files and pipelines.
- [Author a model programmatically](host-programmatic-models.md) — share repeated TypeScript geometry while emitting complete canonical Regions.

## Working on this repository

For maintainers and the release owner.

- [Author an example package](repository-authoring-example-packages.md) — keep every `examples/` directory a copyable starting point with one authored document and a generated export.
- [Release npm packages](repository-releasing-packages.md) — prepare, publish, verify, and recover a coordinated public package release.
- [Cloudflare hosting](repository-cloudflare-hosting.md) — configure public hosting, custom domains, redirects, and Workers Builds.
