# Infoschematics

Infoschematics is a visual instrument for making complex systems comprehensible. An Infoschematic combines structural artefacts with Scenes, Themes, and Stories, then supports Present, Design, and Direct production modes.

This Bun monorepo owns the reusable domain and view packages, authored examples, consumer guidance, and public website.

## Repository layout

Ownership determines the top-level workspace root:

- **Packages** contain independently consumable libraries:
  - [Domain Model](packages/domain-model/) — `@infoschematics/domain-model`, dependency-free serialisable product types.
  - [Domain Core](packages/domain-core/) — `@infoschematics/domain-core`, framework-neutral domain behaviour and configuration normalisation.
  - [View Model](packages/view-model/) — `@infoschematics/view-model`, framework-neutral geometry, routing, placement, and editing primitives.
  - [Studio View](packages/view-studio/) — `@infoschematics/view-studio`, the current combined Canvas, Present, and Studio implementation.
- **Applications** contain deployable composition roots:
  - [Site](apps/site/) — the designed homepage, public documentation, examples, and Cloudflare deployment boundary.
- **Examples** contain independently authored Infoschematic definitions:
  - [Blank Infoschematic](examples/is-blank/) — `@infoschematics/is-blank`, the minimum executable definition.
  - [Infoschematics examples](examples/is-infoschematics/) — `@infoschematics/is-infoschematics`, a concise homepage overview and substantial self-description.

## Use Studio View

Each host owns one complete configuration and passes it into the view:

```tsx
import { defineInfoschematic } from '@infoschematics/domain-core'
import { App } from '@infoschematics/view-studio'
import '@infoschematics/view-studio/styles.css'

const config = defineInfoschematic({ title: 'My Infoschematic' })

export function InfoschematicPage() {
  return <App config={config} />
}
```

A title-only definition renders a blank canvas safely. An Infoschematic can equally be authored as a JSON or YAML document and loaded with `parseInfoschematic`, which validates it against the same contract and reports faults by path. See [the authoring guide](apps/site/content/authoring.md) and [the React integration guide](apps/site/content/react-integration.md) for the complete ownership boundary.

## Package direction

Interactive views are additive. `@infoschematics/view-canvas` owns the reusable Infoschematic component, `@infoschematics/view-present` wraps Canvas with Audience presentation, and `@infoschematics/view-studio` wraps Present with Producer-facing Design and Direct capabilities.

`@infoschematics/render-svg` sits beside the interactive views and renders a deterministic `@infoschematics/view-model` snapshot without React. Authored Infoschematic examples use the `is-*` prefix: `examples/is-blank` demonstrates the minimum contract, while `examples/is-infoschematics` provides a concise homepage overview and a substantial self-description for editable and static output.

## Understand the project

- [Documentation](docs/) explains where decisions, specifications, designs, guides, and reference material belong.
- [Decision records](docs/decisions/) preserve why the product and repository have its current shape.
- [Vocabulary](docs/reference/vocabulary.md) defines canonical product and production language.
- [Architecture](docs/design/architecture.md) defines package responsibilities and dependency direction.
- [Package release guide](docs/guides/releasing-packages.md) defines the coordinated version, dry-run, protected publication, and recovery procedure.
- [Roadmap](ROADMAP.md) points to active and future work.
- The public website runs at [infoschematics.info](https://infoschematics.info/).

## Develop

[Bun](https://bun.sh) manages packages, applications, and examples as one workspace graph.

```bash
bun install
bun run self:dev
bun run self:check
```

`bun run self:check` runs tests and TypeScript checks across every workspace, verifies dependency boundaries, and builds the production website.

Each script under `scripts/` is a self-describing command as well as a `bun run` target: run it directly (`./scripts/render-example.ts`), ask it for `--help`, and read its exit code — 0 for success, 1 for failure, 2 for misuse. Unknown options are rejected rather than ignored.

```bash
./scripts/render-example.ts --all --png
./scripts/generate-visual-tokens.ts --check
./scripts/generate-schema.ts --check
./scripts/release/pack-smoke.ts --keep-temp
```

`self:examples:render` writes an authored example, or any JSON or YAML document, to a standalone SVG under `reports/`, so a diagram can be reviewed without starting the site.

Public package release candidates compile unbundled ESM and declarations into explicit `dist/` exports, then pass packed clean-consumer verification. Bun resolves matching versions locally in the monorepo. Registry publication remains separately human-authorised; see the [package release guide](docs/guides/releasing-packages.md).

## Licence

Infoschematics is available under the [MIT License](LICENSE).
