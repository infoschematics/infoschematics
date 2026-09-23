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
- **Examples** contain independently authored Infoschematic definitions. Each one is a copyable starting point: it authors its Infoschematic as YAML, ships a generated typed export, and carries its own `check` and `render` commands that keep working after the directory is copied elsewhere.
  - [Blank Infoschematic](examples/is-blank/) — `@infoschematics/is-blank`, the minimum executable definition.
  - [Infoschematics examples](examples/is-infoschematics/) — `@infoschematics/is-infoschematics`, a concise homepage overview and substantial self-description.
  - [A system, explained](examples/is-system/) — `@infoschematics/is-system`, a four-stage narrative from observed signals to a shared view.

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

[Bun](https://bun.sh) manages packages, applications, and examples as one workspace graph, and [Turborepo](https://turborepo.com) runs the tasks over it.

```bash
bun install
bun run self:dev
bun run self:check
```

`bun run self:check` runs tests and TypeScript checks across every workspace, verifies dependency boundaries, and builds the production website. Each stage is a task Turborepo replays when nothing it reads has changed, so a repeat run on an unchanged tree costs a fraction of a second and a run after one edit pays for that package and what is downstream of it. `bun run self:check --force` reruns everything regardless.

Every workspace owns its own suite and typecheck, so narrow the run instead of repeating the whole one:

```bash
bun run --cwd packages/view-model test -- runtime             # one file, or a name substring, in one package
bunx vitest --root packages/view-model                        # watch that package
bunx turbo run test --filter=...@infoschematics/domain-core   # a package and everything that depends on it
bun run self:scripts:test                                     # only the checks under scripts/ that span workspaces
```

Each script under `scripts/` is a self-describing command as well as a `bun run` target: run it directly (`./scripts/render-example.ts`), ask it for `--help`, and read its exit code — 0 for success, 1 for failure, 2 for misuse. Unknown options are rejected rather than ignored.

```bash
./scripts/render-example.ts --all --png
./scripts/generate-visual-tokens.ts --check
./scripts/generate-schema.ts --check
./scripts/release/pack-smoke.ts --keep-temp
```

`self:examples:render` writes an authored example, or any JSON or YAML document, to a standalone SVG under `reports/`, so a diagram can be reviewed without starting the site.

Public package release candidates compile unbundled ESM and declarations into explicit `dist/` exports, then pass packed clean-consumer verification. Bun resolves matching versions locally in the monorepo. Registry publication remains separately human-authorised; see the [package release guide](docs/guides/releasing-packages.md).

### Command surface

Every command this repository offers is a script in the root `package.json`, and a script's name says which authority owns it.

| Prefix | Owner | Meaning |
| --- | --- | --- |
| none | the package manager and Turborepo | The lifecycle idioms every workspace answers to: `build`, `clean`, `prepare`, `test`, `test:browser`. A bare name passes straight through to the task it is named after, so `bun run test` and `turbo run test` are the same run. |
| `ki:` | a Knowledge Islands capability | A command whose shape is mandated outside this repository, so its name and its behaviour are not ours to reword: `ki:deps:update`, `ki:site:build`, `ki:site:clean`, `ki:site:deploy`, `ki:site:dev`, `ki:site:preview`. |
| `self:` | this repository | Everything specific to Infoschematics, named subject first and verb last. |

The `self:` commands, by subject:

| Subject | Commands | What it covers |
| --- | --- | --- |
| the whole gate | `self:check`, `self:dev` | `self:check` is the gate to run before committing; `self:dev` builds the packages then starts the site. |
| boundaries | `self:boundaries:verify` | dependency-cruiser over every workspace source root and `scripts/`, through the TypeScript 6 install root at `tooling/boundaries`, refusing a cruise that measured too little to be evidence. |
| the deployment seam | `self:cf:build` | Cloudflare Pages' configured build command, which delegates to `build` rather than restating it. |
| examples | `self:examples:generate`, `self:examples:render`, `self:examples:verify` | The generated example registry, and rendering one authored document to a standalone SVG under `reports/`. |
| lockfile | `self:lockfile:verify` | The frozen install that proves `bun.lock` still agrees with every manifest, the way continuous integration and the release workflow resolve dependencies. |
| packages | `self:packages:build`, `self:packages:check-versions`, `self:packages:clean`, `self:packages:pack-smoke` | The publishable packages under `packages/`: their build, their version agreement, and packed clean-consumer verification. |
| releases | `self:release:verify` | Builds the packages, then runs the packed-consumer smoke test over them. |
| the schema | `self:schema:generate`, `self:schema:verify` | The published JSON Schema generated from the domain contract. |
| `scripts/` | `self:scripts:test`, `self:scripts:typecheck` | The cross-workspace checks that live under `scripts/`, and their own typecheck. |
| visual tokens | `self:tokens:generate`, `self:tokens:verify` | The generated visual token module shared by the renderers. |
| types | `self:typecheck` | Every workspace typecheck plus the one for `scripts/`. |
| unused code | `self:unused:verify` | knip over the workspaces, against `knip.json`, read by `scripts/unused.ts`: it sanctions the two shared exclusions `GEN-1` requires every tool to carry, and fails on any other configuration hint — and on the absence of those two, so an exclusion cannot lapse in silence. |

Two rules keep the surface honest, and `scripts/command-surface.test.ts` enforces them.

A generated artefact's `generate` command is always paired with a `verify` command that runs the same script in check mode, so the gate can prove the committed artefact matches its generator without a second implementation of the generator's rules. And a `self:` name reads subject first, then verb — `self:tokens:verify`, never `self:verify:visual-tokens` — so the commands for one subject sort together and a new verb cannot start a rival naming scheme. The reasoning is recorded in [GDR-INFOSCHEMATICS-005](docs/decisions/GDR-INFOSCHEMATICS-005-name-commands-by-owner-then-subject-then-verb.md).

A new command belongs in the root manifest when it spans workspaces, and in the workspace's own manifest when it does not — a package's suite, typecheck, or build stays with the package, so Turborepo can cache it there. A root script that wraps a module under `scripts/` names that module directly, because the test above rejects a command module no root script, commit hook, or this section reaches.

One command is deliberately not a root script. `scripts/ibc-visual-compatibility.ts` captures and compares visual compatibility evidence against an external IBC fixture package, so it cannot run from a checkout of this repository alone:

```bash
bun scripts/ibc-visual-compatibility.ts capture --fixture <IBC package> --manifest <file> --output <directory>
bun scripts/ibc-visual-compatibility.ts compare --fixture <IBC package> --manifest <file> --output <directory>
```

The fixture directory must be a workspace that already has `sharp` installed — the script resolves Sharp by walking upward from the fixture, never from here, so this repository holds no dependency on it. A root script would advertise a command that fails for every contributor without that fixture, so the procedure is documented rather than wrapped.

## Licence

Infoschematics is available under the [MIT License](LICENSE).
