# @infoschematics/is-infoschematics

Two authored Infoschematics that describe Infoschematics itself. [`overview.yaml`](overview.yaml) is the concise one on the public homepage: structure and presentation material combining into a single Infoschematic that can be rendered statically or presented live. [`infoschematic.yaml`](infoschematic.yaml) is the substantial one: the package architecture of this repository, with Regions for each ownership root and Flows for the dependency direction between them.

Copy this directory when you want a worked example larger than a starting point — Collections, Regions, ports, routed Flows, and appearance choices applied across a real diagram.

## Files

| File | Purpose |
| --- | --- |
| [`infoschematic.yaml`](infoschematic.yaml) | The authored package-architecture Infoschematic. |
| [`overview.yaml`](overview.yaml) | The authored homepage overview Infoschematic. |
| `src/infoschematic.ts`, `src/overview.ts` | Generated typed exports for bundlers and React hosts. Do not edit. |
| `src/index.ts` | The package entry point, re-exporting `infoschematicsInfoschematic` and `homepageInfoschematic`. |
| `package.json` | Package metadata, including the `infoschematics.examples` declaration of both documents. |

## Use it

```sh
bun install
bun run check    # validate both documents and render them to nothing
bun run render   # write infoschematic.svg and overview.svg beside the documents
```

Both commands use [`@infoschematics/cli`](https://www.npmjs.com/package/@infoschematics/cli) and read the YAML directly, so they work the same inside this repository and in a copy of this directory anywhere else.

## Edit it

Edit the YAML and run `bun run check`. Validation reports faults by document path, so a Flow attached to a port a Card does not have names the line that caused it. [The authoring guide](../../apps/site/content/authoring.md) covers the document contract, and [the YAML editing guide](../../docs/guides/host-editing-authored-yaml.md) covers preserving comments and ordering through programmatic edits.

Inside this repository the typed exports are regenerated from the YAML by `bun run self:examples:generate`, and `bun run self:check` fails if a committed export has fallen behind. Each generated module parses the document it embeds at import time, so it cannot serve a model the YAML does not describe.

## Use it from a host

```tsx
import { homepageInfoschematic } from '@infoschematics/is-infoschematics'
import { Studio } from '@infoschematics/view-studio'
import '@infoschematics/view-studio/styles.css'

export const Page = () => <Studio config={homepageInfoschematic} />
```

The public website mounts exactly this definition on its homepage and offers it as a Playground preset. A host that would rather load the document at runtime can read the YAML and call `parseInfoschematic` from `@infoschematics/domain-core` instead; both paths produce the same canonical model. [The React integration guide](../../apps/site/content/react-integration.md) explains the ownership boundary between an authored Infoschematic and the host that mounts it.
