# @infoschematics/is-blank

The smallest complete Infoschematic: an identifier, a title, a Diagram with bounds and an appearance, and nothing else. Copy this directory when you want a starting point that renders immediately and lets you add your own content one artefact at a time.

## Files

| File | Purpose |
| --- | --- |
| [`infoschematic.yaml`](infoschematic.yaml) | The authored Infoschematic. This is the file to edit. |
| `src/infoschematic.ts` | Generated typed export for bundlers and React hosts. Do not edit. |
| `src/index.ts` | The package entry point, re-exporting `blankInfoschematic`. |
| `package.json` | Package metadata, including the `infoschematics.examples` declaration. |

## Use it

```sh
bun install
bun run check    # validate the document and render it to nothing
bun run render   # write infoschematic.svg beside the document
```

Both commands use [`@infoschematics/cli`](https://www.npmjs.com/package/@infoschematics/cli) and read `infoschematic.yaml` directly, so they work the same inside this repository and in a copy of this directory anywhere else.

## Edit it

Edit `infoschematic.yaml` and run `bun run check`. Validation reports faults by document path, so a mistyped port or a Flow pointing at a missing Card names the line that caused it. [The authoring guide](../../apps/site/content/authoring.md) covers the document contract, and [the YAML editing guide](../../docs/guides/editing-authored-yaml.md) covers preserving comments and ordering through programmatic edits.

Inside this repository the typed export is regenerated from the YAML by `bun run self:examples:generate`, and `bun run self:check` fails if the committed export has fallen behind. In a copy of this directory you can delete `src/` entirely and keep the document, or keep the module and regenerate it yourself — it simply parses the embedded document at import time.

## Use it from a host

```tsx
import { blankInfoschematic } from '@infoschematics/is-blank'
import { Studio } from '@infoschematics/view-studio'
import '@infoschematics/view-studio/styles.css'

export const Page = () => <Studio config={blankInfoschematic} />
```

A host that would rather load the document at runtime can read the YAML and call `parseInfoschematic` from `@infoschematics/domain-core` instead; both paths produce the same canonical model. [The React integration guide](../../apps/site/content/react-integration.md) explains the ownership boundary between an authored Infoschematic and the host that mounts it.
