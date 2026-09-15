# Maintaining programmatic examples

A TypeScript definition may remove coordinate repetition while keeping the canonical authored model explicit. This is useful for matrix-like layouts in which several [Regions](../reference/vocabulary.md#region) share an axis.

This repository's own example packages no longer author TypeScript: each one authors YAML and generates its typed export from that document, by [ADR-INFOSCHEMATICS-022](../decisions/ADR-INFOSCHEMATICS-022-generate-example-exports-from-authored-yaml.md) and [the example package guide](authoring-example-packages.md). The technique below remains fully supported for consumers who author their models programmatically.

Define immutable coordinate values near the authored example and spread them into each Region's complete `bounds`:

```ts
const upperRow = { y: 20, height: 610 } as const;

const regions = [
  { id: "source", label: "Source", bounds: { x: 20, width: 310, ...upperRow } },
  {
    id: "delivery",
    label: "Delivery",
    bounds: { x: 330, width: 390, ...upperRow },
  },
];
```

The shared constant is a TypeScript maintenance aid, not domain data. Pass only the resulting complete Region objects to `defineInfoschematicModel`. YAML and JSON authors repeat the coordinates, while Studio alignment operations must also materialise complete bounds.

This preserves independent Region editing and renderer parity established by [ADR-INFOSCHEMATICS-016](../decisions/ADR-INFOSCHEMATICS-016-keep-region-bounds-explicit.md).
