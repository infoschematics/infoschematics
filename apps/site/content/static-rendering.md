# Render static output

The Static Renderer turns a definition into one complete, standalone SVG string — deterministic, framework-neutral, and safe to run anywhere: a build step, a server, a CLI, or the browser. It depends on neither React nor the DOM.

```ts
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { myInfoschematic } from '@example/my-infoschematic'

const svg = renderInfoschematicSvg(myInfoschematic)
```

The same configuration and options produce byte-for-byte identical output, so a rendered diagram can live in version control, diff meaningfully, and regenerate in CI. All text is XML-escaped, the renderer emits no scripts or inline event attributes, and the SVG root carries an accessible role, title, and description summarising visible [Card](/docs/reference/vocabulary/#standard-card) detail, so hidden metadata remains available at the image boundary.

## Choose a delivery mode

Use an image when the host only needs a still result. A data URL, generated file, or ordinary image URL keeps the SVG inert and does not expose its descendants to the page:

```ts
const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
image.src = source
```

Insert the SVG into the same document only when the host needs to inspect rendered artefacts. Pass a different `resourceIdPrefix` for each inline result so markers and grid patterns remain local even when two diagrams contain the same authored identifiers:

```ts
const svg = renderInfoschematicSvg(myInfoschematic, {
  resourceIdPrefix: 'checkout-overview'
})

// This HTML sink accepts only the value returned by renderInfoschematicSvg.
host.innerHTML = svg
const mountedSvg = host.querySelector(':scope > svg')

function resolveArtefact(target: EventTarget | null) {
  if (!(target instanceof Element)) return null
  const group = target.closest('[data-artefact-id][data-artefact-kind]')
  if (!group || !mountedSvg || !host.contains(group) || group.closest('svg') !== mountedSvg) {
    return null
  }
  return {
    id: group.getAttribute('data-artefact-id'),
    kind: group.getAttribute('data-artefact-kind')
  }
}

const inspect = (event: Event) => {
  const artefact = resolveArtefact(event.target)
  if (artefact) showDetails(artefact)
}

host.addEventListener('pointerover', inspect)
host.addEventListener('click', inspect)

const teardown = () => {
  host.removeEventListener('pointerover', inspect)
  host.removeEventListener('click', inspect)
  host.replaceChildren()
}
```

Call `teardown` before replacing a render or removing its host. Scope every query and listener to that host; never use a document-wide native SVG ID or assume a child class, element, or tree position. The supported hook is the nearest outer group carrying both `data-artefact-id` and `data-artefact-kind`.

Pointer inspection is not an accessibility action by itself. Keep the SVG's image semantics, do not assign generic button roles or `tabIndex` to every group, and provide a visible, named button or link outside the SVG for every click outcome. That control should invoke the same host-owned action and expose the same details or status.

## Options

Everything interactive state would decide is an explicit option instead:

```ts
const svg = renderInfoschematicSvg(myInfoschematic, {
  scene: { kind: 'standalone', sceneId: 'checkout' },
  visibility: { scopes: ['core'], unfocused: 'dim', graphics: 'scene' },
  cardDetails: { identity: false, stereotype: true, description: false },
  annotations: { components: true, flows: true },
  signals: ['flow-payment'],
  dynamics: [{ dynamicId: 'payment-taken', occurrenceKey: 'export-1' }],
  resourceIdPrefix: 'checkout-export'
})
```

- **`scene`** selects a Standalone, Thematic, or Story [Scene](/docs/reference/vocabulary/#scene) and applies its focus deterministically.
- **`visibility`** selects visible [Scopes](/docs/reference/vocabulary/#scope) (all when omitted), chooses whether unfocused content is dimmed, hidden, or shown, and controls which [Graphics](/docs/reference/vocabulary/#graphic) render.
- **`cardDetails`** overrides identity, stereotype, and description visibility without touching the authored definition — never compactness, which is authored because it changes a Card's composition.
- **`annotations`** draws the code chips a live view's tag control draws, at the shared placement Canvas uses. `true` tags every kind that control covers — Cards, Adapter Cards, [Fabrics](/docs/reference/vocabulary/#fabric), and [Flows](/docs/reference/vocabulary/#flow) — and `{ components: true }` or `{ flows: true }` asks for one half, which is what a still placed beside a live view usually wants. A Flow can pin its chip with an authored `label: { along: 0.5 }`. A code the document pinned with `identity: true` is drawn either way, and never twice.
- **`signals`** names Flows to emphasise in a deterministic, non-animated still output; unknown identifiers are ignored, and the renderer never infers signals from Scene focus or authored data.
- **`dynamics`** names occurrences of authored [Diagram Dynamics](/docs/reference/vocabulary/#diagram-dynamic) to draw in the same still language: a `signal-flow` Dynamic emphasises the Flows it names, and an `emphasise-elements` Dynamic outlines the elements it names. An occurrence of a Dynamic the document does not declare is ignored, output never varies with the occurrence key, and the accessible description states each occurred Dynamic's label. Omit the option and the output is byte-identical to the quiet document.
- **`resourceIdPrefix`** namespaces renderer-owned marker and pattern IDs. Its default preserves standalone output; use a unique letter-or-underscore-prefixed value for every SVG inserted into the same document.

Output shares the Canvas's visual language — the same tokens, appearance resolution, Region geometry, Card layout, and luminance-resolved text ink — so a static export and the interactive Canvas read as the same diagram.

## From SVG to anything else

SVG is the renderer's native output; other formats are one rasteriser away. This repository renders documents straight to SVG with `bun run self:examples:render infoschematic.yaml`, and any standard tool converts the result to PNG or PDF for contexts that need pixels.

## Where next

The [authoring guide](/docs/authoring/) covers writing the definition being rendered, including host-side `cardDetails` on the interactive Canvas. For interactive output instead, start with the [React integration guide](/docs/react-integration/).
