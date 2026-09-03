# Integrate a React host

The React View packages render one complete host-owned `InfoschematicConfig`. A host chooses Canvas, Present, or Studio according to the controls it needs.

```tsx
import { App as InfoschematicApp } from '@infoschematics/view-studio'
import '@infoschematics/view-studio/styles.css'
import { myInfoschematic } from '@example/my-infoschematic'
import { useEffect } from 'react'

export function App() {
  useEffect(() => {
    document.title = myInfoschematic.title
  }, [])

  return <InfoschematicApp config={myInfoschematic} renderers={renderers} />
}
```

Choose the narrowest public View for the host:

- `Canvas` from `@infoschematics/view-canvas` renders the interactive Infoschematic surface without presentation or authoring controls.
- `Present` from `@infoschematics/view-present` adds Audience filtering, Scene focus, Story playback, Callouts, and details.
- `Studio` from `@infoschematics/view-studio` adds Producer capabilities; `App` remains its compatibility name.

Each package owns a stylesheet entry at `@infoschematics/<package>/styles.css`. Present includes Canvas styles, and Studio's compatibility stylesheet includes the lower View styles.

## Host renderers

Authored Fabrics, Graphics, and Callouts carry stable renderer keys and serialisable properties. React implementations, property validators, diagnostics, shared SVG definitions, and Scope icons stay in the host. Supply them through the `renderers` application prop rather than a process-global registry:

```tsx
import {
  type CalloutRendererProps,
  defineInfoschematicRenderers,
  type FabricRendererProps,
  type GraphicRendererProps,
  type RendererProperties,
} from '@infoschematics/view-canvas'

type Tone = Readonly<{ tone: string }>

const validateTone = (properties: RendererProperties | undefined) => {
  const tone = properties?.tone
  return typeof tone === 'string'
    ? ({ valid: true, properties: { tone } } as const)
    : ({ valid: false, reason: 'tone must be a string' } as const)
}

function FabricArtwork({ bounds, fabric, properties }: FabricRendererProps & { properties: Tone }) {
  return (
    <g aria-label={fabric.label} data-tone={properties.tone}>
      <rect {...bounds} />
      <text x={bounds.x + 8} y={bounds.y + 20}>{fabric.label}</text>
    </g>
  )
}

function GraphicArtwork({ graphic, properties }: GraphicRendererProps & { properties: Tone }) {
  return <g aria-label={graphic.label ?? graphic.id} data-tone={properties.tone} />
}

function CalloutArtwork({
  callout,
  children,
  properties,
}: CalloutRendererProps & { properties: Tone }) {
  return (
    <section aria-label={callout.title ?? 'Story Callout'} data-tone={properties.tone}>
      {children}
    </section>
  )
}

export const renderers = defineInfoschematicRenderers({
  fabrics: [
    {
      key: 'example.fabric.network',
      schemaVersion: 1,
      validateProperties: validateTone,
      component: FabricArtwork,
    },
  ],
  graphics: [
    {
      key: 'example.graphic.network',
      schemaVersion: 1,
      validateProperties: validateTone,
      component: GraphicArtwork,
    },
  ],
  callouts: [
    {
      key: 'example.callout.emphasis',
      schemaVersion: 1,
      validateProperties: validateTone,
      component: CalloutArtwork,
    },
  ],
  onDiagnostic: (diagnostic) => reportRendererDiagnostic(diagnostic),
})
```

A Fabric implementation receives the authored Fabric, its effective `bounds`, and validated properties. A Graphic implementation receives the resolved authored Graphic, the Infoschematic `viewBox`, and validated properties. A Callout implementation receives the authored Callout, validated properties, and the standard Audience content as `children`. Present keeps the positioned `role="status"` frame and Story actions outside the custom component, so custom presentation cannot remove navigation or announcements.

`defineInfoschematicRenderers` snapshots and freezes the supplied definition arrays. Every definition needs a stable key, schema version `1`, validator, and component. The first duplicate key wins. The `onDiagnostic` callback receives a `RendererDiagnostic` containing `code`, `kind`, `key`, `message`, and the available `schemaVersion` or `artefactId`. Its codes are `duplicate-key`, `unsupported-version`, `unknown-key`, and `invalid-properties`. Unknown or invalid Fabrics keep labelled generic bounds, Graphics receive labelled placeholders, and Callouts retain their standard title, body, and takeaways.

Component-only Fabric and Graphic maps remain a compatibility bridge, but new integrations should use definition arrays so properties are validated and failures are diagnosable. Shared SVG `definitions` and `scopeIcons` remain host-level supporting renderers.

### Evolve renderer properties

Treat renderer keys as authored compatibility identifiers. A backwards-compatible property addition can keep the same key and schema version when its validator supplies a default:

```tsx
const validateTone = (properties: RendererProperties | undefined) => ({
  valid: true as const,
  properties: {
    tone: typeof properties?.tone === 'string' ? properties.tone : 'neutral',
  },
})
```

The current authored renderer reference does not carry a separate schema version, and the registry supports definition schema version `1`. For an incompatible property change, register a new stable key such as `example.fabric.network-v2`, keep the old definition while supported Infoschematics still refer to it, migrate authored definitions deliberately, and remove the old definition only after those references are gone. Do not reinterpret old properties under the same key or put a migration callback in authored data.

The renderer object is host runtime configuration, not part of `InfoschematicConfig`: do not place React components, callbacks, validators, diagnostic handlers, or shared SVG definitions in authored data.

## Host responsibilities

The host owns:

- the React root and route where the application appears;
- `document.title` and other page metadata;
- static contracts, logos, and other URL-addressed assets;
- deployment and cache policy;
- selection of the authored Infoschematic definition.
- React implementations for any renderer or Scope icon keys used by that definition.

Studio View owns generic rendering, Producer controls, and runtime state derived from the configuration. It must not import a particular authored Infoschematic or its visual implementations.

The public website demonstrates this boundary with two examples. `/examples/blank/` mounts the minimum title-only contract, while `/examples/infoschematics/` mounts the substantial [`@infoschematics/is-infoschematics`](../../examples/is-infoschematics/) definition through Studio so its Present, Design, and Direct controls remain available. The homepage consumes the same definition through `renderInfoschematicSvg`; the authored package imports neither React View nor Site code.

## Monorepo development

Inside this repository, Bun resolves matching `0.1.0` package dependencies to local workspaces:

```bash
bun install
bun run dev
```

The website runs from `apps/site`. The root verification gate runs all tests and type checks, checks dependency boundaries, and produces the site build:

```bash
bun run check
```

External consumers install compiled package entry points and import package stylesheet subpaths explicitly; they do not compile or vendor repository source. Maintainers coordinate every public package version and protected npm publication through the [package release guide](releasing-packages.md).
