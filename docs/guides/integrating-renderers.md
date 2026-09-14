# Integrate a host renderer

This guide is for host application developers adding a visual implementation for an authored [Fabric](../reference/vocabulary.md#fabric), Overlay, or [Callout](../reference/vocabulary.md#callout). The host owns executable React components and validators; the Infoschematic document selects only their serialisable contract, as required by [renderer extensions](../specs/renderer-extensions.md).

## Author the reference

Use one stable key and a positive integer version. The version identifies the schema of `properties`, not the component release:

```yaml
kind:
  key: satellite
  version: 2
properties:
  orbit: geo
```

A scalar such as `kind: satellite` remains accepted compatibility input and always means version `1`. Re-serialising canonical data emits the structured form.

## Register the matching definition

Build one immutable registry and pass it to `Canvas`, `Present`, or `Studio`. Multiple versions may share a key; every definition supplies its own validator and component.

```tsx
import { Canvas, defineInfoschematicRenderers } from '@infoschematics/view-canvas'

const renderers = defineInfoschematicRenderers({
  fabrics: [
    {
      key: 'satellite',
      schemaVersion: 2,
      validateProperties: (properties) =>
        properties?.orbit === 'geo'
          ? { valid: true, properties: { orbit: properties.orbit } }
          : { valid: false, reason: 'orbit must be geo' },
      component: SatelliteFabric
    }
  ],
  onDiagnostic: (diagnostic) => reportRendererDiagnostic(diagnostic)
})

export const Architecture = () => <Canvas config={model} renderers={renderers} />
```

Keep the registry outside authored configuration. Do not mutate it after mounting; construct a replacement registry when the host configuration changes.

## Verify fallback behaviour

Exercise the document with its requested definition present, then remove that definition or change its version. The matching implementation should render only for the exact key-and-version pair. An unknown key, an unregistered requested version, or invalid properties should produce `onDiagnostic` output while the standard labelled geometry or Callout remains usable.

Static SVG does not execute React renderers. It emits deterministic labelled Overlay fallback output with `data-renderer` and `data-renderer-version`, allowing a host or test to identify the requested contract.
