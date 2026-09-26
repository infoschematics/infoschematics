# Author a model programmatically

This guide is for host application developers who author their models in TypeScript rather than YAML. A TypeScript definition may remove coordinate repetition while keeping the canonical authored model explicit, which is useful for matrix-like layouts in which several Regions share an axis.

This repository's own example packages no longer author TypeScript: each one authors YAML and generates its typed export from that document, as described in [the example package guide](repository-authoring-example-packages.md). That is a choice about this repository's examples, not a deprecation: the technique below remains fully supported.

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

This preserves independent Region editing and renderer parity because each Region retains complete bounds.
