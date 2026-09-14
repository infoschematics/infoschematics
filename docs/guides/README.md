# Guides

These guides explain how to operate and maintain the Infoschematics repository. Product decisions explain why in [`docs/decisions/`](../decisions/README.md), Specifications define the accepted contract in [`docs/specs/`](../specs/index.md), and roadmap records track delivery in [`docs/roadmap/`](../roadmap/).

The public consumer journey is Site-owned under `apps/site/content/` by [ADR-INFOSCHEMATICS-014](../decisions/ADR-INFOSCHEMATICS-014-site-owned-user-guide.md). Keep reusable maintainer and operator procedures here rather than copying that journey.

## Operating guides

- [Cloudflare hosting](cloudflare.md) — configure public hosting, custom domains, redirects, and Workers Builds.
- [Integrate a host renderer](integrating-renderers.md) — register versioned Fabric, Overlay, and Callout implementations with validated properties and accessible fallbacks.
- [Maintaining programmatic examples](maintaining-programmatic-examples.md) — share repeated TypeScript geometry while emitting complete canonical Regions.
- [Render from the command line](rendering-from-the-command-line.md) — turn canonical YAML or JSON into deterministic SVG in files and pipelines.
- [Release npm packages](releasing-packages.md) — prepare, publish, verify, and recover the coordinated public package release.
