# @infoschematics/is-showcase

One authored Infoschematic that exercises every capability the document contract offers, laid out as a labelled band per concern rather than as a realistic system. It exists so that trying a capability out means opening a published example, not hand-editing a real diagram, and so that a capability added to the contract has somewhere obvious to be shown.

`scripts/example-capability-coverage.test.ts` derives the capability list from the contract and asserts this document exercises it, so a new authored capability fails that check until this document shows it.

## Files

| File | Purpose |
| --- | --- |
| [`infoschematic.yaml`](infoschematic.yaml) | The authored Infoschematic. This is the file to edit. |
| `src/infoschematic.ts` | Generated typed export for bundlers and React hosts. Do not edit. |
| `src/index.ts` | The package entry point, re-exporting `showcaseExample`. |
| `package.json` | Package metadata, including the `infoschematics.examples` declaration. |

## Use it

```sh
bun install
bun run check   # validate the document and render it to nothing
bun run render  # write infoschematic.svg beside the document
```

Both commands use [`@infoschematics/cli`](https://www.npmjs.com/package/@infoschematics/cli) and read `infoschematic.yaml` directly, so they work the same inside this repository as in a copy of this directory anywhere else. The document is also the `showcase` preset in the site Playground, which is where its Story, its Dynamics and its Design-only notation can be driven.

## What each band shows

| Band | Capability |
| --- | --- |
| Structure | A standard Card with a Collection, a stereotype, a description and ports, authored both as a scalar count and as a per-side object |
| Adaptation | An Adapter Card (`adapts:`) and a Wrapper Card (`wraps:`), each clasping the Card it holds |
| Substrate | A Fabric with a `kind`, `properties` and its own appearance |
| Edges | Points as source and sink, one carrying its own appearance and an `icon` |
| Throughout | Four Regions covering each frame style, both label mounts and four label placements; Flow Families with a default line and a per-Flow override; a bidirectional Flow; a routed Flow with waypoints and `labelAt`; a Graphic overlay; two overlapping Scopes; a Story whose Scenes carry visibility, focus and Callouts; three Diagram Dynamics, two of them cued by Scenes (`once` and on a `repeat`); and a Specification group |

## Authoring constraints this document observes

Every two-port Flow is axis-aligned. A two-point route derived from ports that are not aligned is refused by the geometry, which `INFOSCHEMATICS-TOOL-084` tracks, so a diagonal pair here would take a host down rather than draw.

Cards are authored `compact: false`, carrying their full detail. They were `compact: true` while the static renderer drew an Adapter Card as an ordinary rectangle over the Card it holds, which painted out that Card's own label; both renderers now trace the one notched clasp nothing passes under, so the document shows the notation rather than working around the absence of it.

The Fabrics and the Graphic name `kind`s from the product's standard catalogue — `message-bus`, `object-store` and `annotation` — so the product draws them itself, identically in the interactive Diagram and in `infoschematics render`, with no host code. A host with its own house style overrides any of them by registering a renderer under the same key; a `kind` the catalogue does not offer and no host registers still draws the generic treatment, which is the contract working as designed rather than a fault in a document.

The Graphic is drawn wherever this Diagram is drawn — in Design, in Present, and by `infoschematics render` — because an authored Overlay is diagram-scoped, and a Scene naming a Graphic adds to that set rather than replacing it ([`ADR-INFOSCHEMATICS-033`](../../docs/decisions/ADR-INFOSCHEMATICS-033-an-authored-overlay-is-drawn-wherever-the-diagram-is.md)). Until that landed it appeared in Design alone, so the standard `annotation` treatment had a drawing and no route to travel.

## Edit it

Edit `infoschematic.yaml` and run `bun run check`. Validation reports faults by document path, so a Card placed in a Collection that does not exist names the line that caused it. Inside the repository the typed export is regenerated from the YAML by `bun run self:examples:generate`, and `bun run self:check` fails if the committed export has fallen behind.

[The authoring guide](../../apps/site/content/authoring.md) covers the document contract, and [the YAML editing guide](../../docs/guides/editing-authored-yaml.md) covers preserving comments and ordering through programmatic edits.

## Use it from a host

```tsx
import { showcaseExample } from '@infoschematics/is-showcase'
import { Studio } from '@infoschematics/view-studio'
import '@infoschematics/view-studio/styles.css'

export const Page = () => <Studio config={showcaseExample} />
```

A host that would rather load the document at runtime can read the YAML and call `parseInfoschematic` from `@infoschematics/domain-core` instead; both paths produce the same canonical model. [The React integration guide](../../apps/site/content/react-integration.md) explains the ownership boundary between an authored Infoschematic and the host that mounts it.
