# Render static output

_Vocabulary: [Infoschematic](/docs/reference/vocabulary/#infoschematic), [Scene](/docs/reference/vocabulary/#scene), [Scope](/docs/reference/vocabulary/#scope), [Graphic](/docs/reference/vocabulary/#graphic)._

The Static Renderer turns a definition into one complete, standalone SVG string — deterministic, framework-neutral, and safe to run anywhere: a build step, a server, a CLI, or the browser. It depends on neither React nor the DOM.

```ts
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { myInfoschematic } from '@example/my-infoschematic'

const svg = renderInfoschematicSvg(myInfoschematic)
```

The same configuration and options produce byte-for-byte identical output, so a rendered diagram can live in version control, diff meaningfully, and regenerate in CI. All text is XML-escaped, and the SVG root carries an accessible role, title, and description summarising visible Card detail, so hidden metadata remains available at the image boundary.

## Options

Everything interactive state would decide is an explicit option instead:

```ts
const svg = renderInfoschematicSvg(myInfoschematic, {
  scene: { kind: 'standalone', sceneId: 'checkout' },
  visibility: { scopes: ['core'], unfocused: 'dim', graphics: 'scene' },
  cardDetails: { identity: false, stereotype: true, description: false },
  annotations: true,
  signals: ['flow-payment']
})
```

- **`scene`** selects a Standalone, Thematic, or Story Scene and applies its focus deterministically.
- **`visibility`** selects visible Scopes (all when omitted), chooses whether unfocused content is dimmed, hidden, or shown, and controls which Graphics render.
- **`cardDetails`** overrides identity, stereotype, and description visibility without touching the authored definition — never compactness, which is authored because it changes a Card's composition.
- **`annotations`** draws each visible Flow's code chip at the shared placement Canvas uses; a Flow can pin its chip with an authored `label: { along: 0.5 }`.
- **`signals`** names Flows to emphasise with a deterministic, non-animated still treatment; unknown identifiers are ignored, and the renderer never infers signals from Scene focus or authored data.

Output shares the Canvas's visual language — the same tokens, appearance resolution, Region geometry, Card layout, and luminance-resolved text ink — so a static export and the interactive Canvas read as the same diagram.

## From SVG to anything else

SVG is the renderer's native output; other formats are one rasteriser away. This repository renders documents straight to SVG with `bun run self:examples:render infoschematic.yaml`, and any standard tool converts the result to PNG or PDF for contexts that need pixels.

## Where next

The [authoring guide](/docs/authoring/) covers writing the definition being rendered, including host-side `cardDetails` on the interactive Canvas. For interactive output instead, start with the [React integration guide](/docs/react-integration/).
