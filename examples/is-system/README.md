# @infoschematics/is-system

A system explained in four stages: observation gathers signals, arrangement gives them structure, illumination draws out meaning, and the result is a view a whole team can share. Copy this directory when you want a narrative diagram — a left-to-right journey with one Collection per stage — rather than a structural one.

## Files

| File | Purpose |
| --- | --- |
| [`infoschematic.yaml`](infoschematic.yaml) | The authored Infoschematic. This is the file to edit. |
| `src/infoschematic.ts` | Generated typed export for bundlers and React hosts. Do not edit. |
| `src/index.ts` | The package entry point, re-exporting `systemExample`. |
| `package.json` | Package metadata, including the `infoschematics.examples` declaration. |

## Use it

```sh
bun install
bun run check    # validate the document and render it to nothing
bun run render   # write infoschematic.svg beside the document
```

Both commands use [`@infoschematics/cli`](https://www.npmjs.com/package/@infoschematics/cli) and read `infoschematic.yaml` directly, so they work the same inside this repository and in a copy of this directory anywhere else.

## Edit it

Edit `infoschematic.yaml` and run `bun run check`. Validation reports faults by document path, so a Card placed in a Collection that does not exist names the line that caused it. Each stage is a Collection with its own colour and fill, so renaming a stage or adding a fifth one is a local change. [The authoring guide](../../apps/site/content/authoring.md) covers the document contract, and [the YAML editing guide](../../docs/guides/host-editing-authored-yaml.md) covers preserving comments and ordering through programmatic edits.

Inside this repository the typed export is regenerated from the YAML by `bun run self:examples:generate`, and `bun run self:check` fails if the committed export has fallen behind.

## Use it from a host

```tsx
import { systemExample } from '@infoschematics/is-system'
import { Studio } from '@infoschematics/view-studio'
import '@infoschematics/view-studio/styles.css'

export const Page = () => <Studio config={systemExample} />
```

A host that would rather load the document at runtime can read the YAML and call `parseInfoschematic` from `@infoschematics/domain-core` instead; both paths produce the same canonical model. [The React integration guide](../../apps/site/content/react-integration.md) explains the ownership boundary between an authored Infoschematic and the host that mounts it.

## Play its Dynamics

The document declares two named Diagram Dynamics: `signal-observed` signals the `SELECT` Flow, and `view-revised` emphasises the shared-view Card. Neither one runs by itself — the document says what a Dynamic means and what it touches, and your host says when it happened:

```tsx
import { systemExample } from '@infoschematics/is-system'
import { Canvas, type DynamicOccurrence } from '@infoschematics/view-canvas'
import '@infoschematics/view-canvas/styles.css'
import { useState } from 'react'

export const Page = () => {
  const [occurrence, setOccurrence] = useState<DynamicOccurrence>()
  return (
    <>
      <button onClick={() => setOccurrence({ dynamicId: 'view-revised', occurrenceKey: crypto.randomUUID() })} type="button">
        The view changed
      </button>
      <Canvas config={systemExample} dynamics={occurrence ? [occurrence] : []} />
    </>
  )
}
```

A new `occurrenceKey` replays the Dynamic; the same key held across renders does not. Dropping the occurrence cancels it. Under `prefers-reduced-motion` the treatment is still rather than moving, and the live region says the Dynamic's own label either way. `bun run render` produces the quiet document: static output changes only when a caller asks for an occurrence explicitly.
