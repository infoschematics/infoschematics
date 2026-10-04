# Source map

**Refresh:** canonical · on-change

Read these at authoring time. Paths are relative to the root of an Infoschematics checkout; the published alternative applies when there is no checkout. This file says where a catalogue lives and never what it contains, because a copy here would drift from the contract that owns it.

## Contents

- [What to read](#what-to-read)
- [The checker](#the-checker)
- [Rendering to look](#rendering-to-look)

## What to read

| Need | In a checkout | Without one |
| --- | --- | --- |
| Every property, its allowed values, and what each is for | `packages/domain-core/schema/infoschematic.schema.json` | the schema at `https://infoschematics.info/schema/infoschematic.schema.json` |
| What a concept means — Card, Fabric, Point, Region, Flow, Port, Scope, Family | `docs/reference/vocabulary.md` | `https://infoschematics.info/docs/reference/vocabulary/` |
| Which representation pattern fits, and its reading order | `apps/site/content/representations.md` | `https://infoschematics.info/docs/representations/` |
| Key order, shorthand notation, ports and `link` syntax | `apps/site/content/authoring.md`, section "Canonical YAML convention" | the same section at `https://infoschematics.info/docs/authoring/` |
| Standard Fabric and Graphic renderer keys | `standardFabricKeys` and `standardGraphicKeys` in `packages/view-model/src/standard-artwork.ts` | the schema's descriptions for `renderer`; otherwise leave `renderer` out |
| What each drawing rule measures and how it clears | `docs/specs/diagnostics.md` | the `reads` and `repairs` the checker prints |
| Worked documents to imitate | `examples/*/infoschematic.yaml` and `apps/site/src/playground/seeds/*.yaml` | the Playground's presets |

Open the schema as data and read the part that applies: list the keys a Card may carry, then the values an enumerated field accepts, rather than reading the whole file into context.

A document names the schema in its first line, so an editor completes and validates it:

```yaml
# yaml-language-server: $schema=https://infoschematics.info/schema/infoschematic.schema.json
```

## The checker

`infoschematics check <file>` validates the document — exit `4` with a path and message when it is malformed or carries a key the contract refuses — and then reviews the drawing it describes. Exit `0` means the drawing reads, exit `1` means at least one finding is an error, and `--json` writes `{ document, findings, unreadable }` for a tool to read. `infoschematics --help` is authoritative for the options and statuses of the version in use.

Resolve the command once, in this order, and use the first that answers `--help`:

1. `infoschematics` on the path, or the project's own `npx infoschematics` once `@infoschematics/cli` is installed.
2. In a checkout, `bun packages/cli/src/bin.ts`, which runs the command from source with no build.
3. In a checkout that has been built, `node packages/cli/dist/bin.js`.

Confirm it on a known-good document — `examples/is-system/infoschematic.yaml` in a checkout — before trusting a verdict about the candidate. If none answers, write the candidate, say the checker was unavailable, and hand over without claiming the document validates.

## Rendering to look

`infoschematics render <file> --format png --output <path>.png` writes an image to inspect; add `--scale 2` when text is too small to read. Write it somewhere disposable — `tmp/` in a checkout is ignored — rather than beside the document, unless the person asked for the image.
